import { useMemo, useRef, useState } from 'react'
import type { HibpStatus } from '../types/security'
import { checkHIBP, HibpClientError } from '../services/hibp'
import { hasMeaningfulInput } from '../utils/passwordAnalysis'

interface UseHibpCheckOptions {
  password: string
  locale: string
  t: (key: string, options?: Record<string, unknown>) => string
}

function mapHibpErrorToTranslationKey(error: unknown): string {
  if (!(error instanceof HibpClientError)) {
    return 'hibp.errors.unknown'
  }

  switch (error.code) {
    case 'CRYPTO_UNAVAILABLE':
      return 'hibp.errors.cryptoUnavailable'
    case 'NETWORK_ERROR':
      return 'hibp.errors.network'
    case 'SERVICE_UNAVAILABLE':
      return 'hibp.errors.serviceUnavailable'
    case 'RATE_LIMITED':
      return 'hibp.errors.rateLimited'
    default:
      return 'hibp.errors.unknown'
  }
}

export function useHibpCheck({ password, locale, t }: UseHibpCheckOptions) {
  const [hibpStatus, setHibpStatus] = useState<HibpStatus>('idle')
  const [hibpCount, setHibpCount] = useState(0)
  const [hibpError, setHibpError] = useState('')
  const [consentAccepted, setConsentAccepted] = useState(false)

  const inputVersionRef = useRef(0)

  function resetByPassword(nextPassword: string): void {
    inputVersionRef.current += 1
    setHibpStatus(hasMeaningfulInput(nextPassword) ? 'reset' : 'idle')
    setHibpCount(0)
    setHibpError('')
  }

  function setHibpConsent(nextValue: boolean): void {
    setConsentAccepted(nextValue)
  }

  async function runCheck(): Promise<void> {
    if (!hasMeaningfulInput(password) || !consentAccepted) return

    const requestVersion = inputVersionRef.current
    setHibpStatus('checking')
    setHibpCount(0)
    setHibpError('')

    try {
      const hibpResult = await checkHIBP(password)
      if (requestVersion !== inputVersionRef.current) return

      if (hibpResult.found) {
        setHibpStatus('found')
        setHibpCount(hibpResult.count)
      } else {
        setHibpStatus('safe')
      }
    } catch (err) {
      if (requestVersion !== inputVersionRef.current) return
      setHibpStatus('error')
      setHibpError(mapHibpErrorToTranslationKey(err))
    }
  }

  const hibpBtnDisabled = !hasMeaningfulInput(password) || hibpStatus === 'checking' || !consentAccepted
  const hibpResultClass =
    hibpStatus === 'found' ? 'hibp-result danger'
      : hibpStatus === 'safe' ? 'hibp-result safe'
        : hibpStatus === 'error' ? 'hibp-result error'
          : 'hibp-result loading'

  const hibpMessage = useMemo(() => {
    if (hibpStatus === 'found') {
      return t('hibp.found', { occurrences: hibpCount.toLocaleString(locale) })
    }

    if (hibpStatus === 'error') {
      return t(hibpError || 'hibp.errors.unknown')
    }

    return t(`hibp.${hibpStatus}`)
  }, [hibpStatus, hibpCount, locale, hibpError, t])

  return {
    hibpStatus,
    hibpBtnDisabled,
    hibpResultClass,
    hibpMessage,
    consentAccepted,
    setHibpConsent,
    resetByPassword,
    runCheck,
  }
}
