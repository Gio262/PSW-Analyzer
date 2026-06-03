import { useEffect, useMemo, useState } from 'react'
import { zxcvbn } from '@zxcvbn-ts/core'
import type { AnalysisData } from '../types/security'
import { analyzeCharset, hasMeaningfulInput } from '../utils/passwordAnalysis'
import type { AppLanguage } from '../i18n'

interface UsePasswordAnalysisOptions {
  password: string
  userInputs?: string[]
  language: AppLanguage
}

export function usePasswordAnalysis({ password, userInputs = [], language }: UsePasswordAnalysisOptions) {
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
  }, [password, userInputs, language])
  // `language` is a cache key: when it changes, zxcvbnOptions has already been
  // updated by useZxcvbnLanguage (which runs first), so zxcvbn() re-runs with
  // the new dictionary.

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
