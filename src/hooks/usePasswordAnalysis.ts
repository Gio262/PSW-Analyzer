import { useEffect, useMemo, useState } from 'react'
import { zxcvbn } from '@zxcvbn-ts/core'
import type { AnalysisData } from '../types/security'
import { analyzeCharset, hasMeaningfulInput } from '../utils/passwordAnalysis'
import type { AppLanguage } from '../i18n'

interface UsePasswordAnalysisOptions {
  password: string
  userInputs?: string[]
  language: AppLanguage
  /** Cache key: forces re-run when active keyboard layouts change */
  layoutsVersion?: string
}

export function usePasswordAnalysis({ password, userInputs = [], language, layoutsVersion }: UsePasswordAnalysisOptions) {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!hasMeaningfulInput(password)) {
        setAnalysisData(null)
        return
      }

      setAnalysisData({
        result: zxcvbn(password, userInputs),
        charsetInfo: analyzeCharset(password),
      })
    }, 120)

    return () => window.clearTimeout(timeoutId)
  }, [password, userInputs, language, layoutsVersion])
  // `language` and `layoutsVersion` are cache keys: when either changes,
  // zxcvbnOptions has already been updated by the preceding hooks
  // (useZxcvbnLanguage + useKeyboardLayouts run before this one in App.tsx),
  // so zxcvbn() re-runs with the correct dictionary and graphs.

  return useMemo(() => {
    const score = Math.max(0, Math.min(analysisData?.result.score ?? 0, 4))
    const guesses = analysisData ? Math.max(1, analysisData.result.guesses) : 1
    const entropyTheoretical = analysisData?.charsetInfo.entropy ?? 0
    const entropyEffective = Math.log2(guesses)
    const entropyConservative = Math.min(entropyTheoretical, entropyEffective)

    return {
      analysisData,
      score,
      guesses,
      entropyTheoretical,
      entropyEffective,
      entropyConservative,
    }
  }, [analysisData])
}
