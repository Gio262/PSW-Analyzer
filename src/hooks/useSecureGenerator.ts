import { useState, useCallback } from 'react'
import {
  generateSecurePassword,
  type PasswordGeneratorOptions,
  type PasswordGenerationResult,
} from '../services/secureGenerator/passwordGen'
import {
  generateSecurePassphrase,
  type PassphraseOptions,
  type PassphraseResult,
} from '../services/secureGenerator/passphraseGen'

type Mode = 'password' | 'passphrase'

interface GeneratorState {
  mode: Mode
  loading: boolean
  lastResult: PasswordGenerationResult | PassphraseResult | null
  error: string | null
}

export function useSecureGenerator() {
  const [state, setState] = useState<GeneratorState>({
    mode: 'password',
    loading: false,
    lastResult: null,
    error: null,
  })

  const generatePassword = useCallback((opts: PasswordGeneratorOptions) => {
    setState(s => ({ ...s, mode: 'password', loading: true, error: null }))
    try {
      const result = generateSecurePassword(opts)
      setState(s => ({ ...s, loading: false, lastResult: result }))
    } catch (e) {
      setState(s => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : 'unknown error',
      }))
    }
  }, [])

  const generatePassphrase = useCallback(async (opts: PassphraseOptions) => {
    setState(s => ({ ...s, mode: 'passphrase', loading: true, error: null }))
    try {
      const result = await generateSecurePassphrase(opts)
      setState(s => ({ ...s, loading: false, lastResult: result }))
    } catch (e) {
      setState(s => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : 'unknown error',
      }))
    }
  }, [])

  return { ...state, generatePassword, generatePassphrase }
}
