import { useMemo } from 'react'
import type { AnalysisData } from '../types/security'

interface FeedbackItem {
  text: string
  isOk: boolean
}

interface UseFeedbackItemsOptions {
  analysisData: AnalysisData | null
  password: string
  entropyTheoretical: number
  entropyEffective: number
  t: (key: string, options?: Record<string, unknown>) => string
}

export function useFeedbackItems({
  analysisData,
  password,
  entropyTheoretical,
  entropyEffective,
  t,
}: UseFeedbackItemsOptions): FeedbackItem[] {
  return useMemo(() => {
    if (!analysisData) return []

    const feedbackItems: FeedbackItem[] = []
    const feedback = analysisData.result.feedback

    if (feedback.warning) {
      feedbackItems.push({ text: feedback.warning, isOk: false })
    }

    for (const suggestion of feedback.suggestions) {
      feedbackItems.push({ text: suggestion, isOk: false })
    }

    if (feedbackItems.length === 0) {
      feedbackItems.push({
        text: t('feedback.none'),
        isOk: true,
      })
    }

    const entropyDelta = entropyTheoretical - entropyEffective
    if (entropyDelta > 5) {
      feedbackItems.push({
        text: t('feedback.predictablePatterns', { delta: entropyDelta.toFixed(0) }),
        isOk: false,
      })
    }

    if (/^\s|\s$/.test(password)) {
      feedbackItems.push({
        text: t('feedback.leadingTrailingSpaces'),
        isOk: false,
      })
    }

    return feedbackItems
  }, [analysisData, password, entropyTheoretical, entropyEffective, t])
}
