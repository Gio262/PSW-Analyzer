import { useEffect, useMemo, useState } from 'react'
import { zxcvbn } from '@zxcvbn-ts/core'
import type { AnalysisData } from '../types/security'
import { analyzeCharset, hasMeaningfulInput } from '../utils/passwordAnalysis'

interface UsePasswordAnalysisOptions {
  password: string
  userInputs?: string[]
}

export function usePasswordAnalysis({ password, userInputs = [] }: UsePasswordAnalysisOptions) {
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
  }, [password, userInputs])

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
