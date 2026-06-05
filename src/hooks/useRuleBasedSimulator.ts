import { useEffect, useMemo, useState } from 'react'
import { findRuleMatch, type RuleMatch } from '../services/hashcatRuleEngine'
import { TOP_PASSWORDS_COMBINED } from '../constants/wordlists'
import { AVAILABLE_RULESETS, type RuleSet } from '../constants/ruleSets'

interface UseRuleBasedSimulatorOptions {
  password: string
  rulesetId: string
}

export interface SimulationResult {
  status: 'idle' | 'running' | 'found' | 'not_found' | 'error'
  match: RuleMatch | null
  ruleset: RuleSet | null
}

const DEBOUNCE_MS = 300

export function useRuleBasedSimulator({
  password,
  rulesetId,
}: UseRuleBasedSimulatorOptions): SimulationResult {
  const [result, setResult] = useState<SimulationResult>({
    status: 'idle',
    match: null,
    ruleset: null,
  })

  const ruleset = useMemo(
    () => AVAILABLE_RULESETS.find(r => r.id === rulesetId) ?? AVAILABLE_RULESETS[0],
    [rulesetId],
  )

  useEffect(() => {
    if (!password.trim()) {
      setResult({ status: 'idle', match: null, ruleset: null })
      return
    }

    setResult({ status: 'running', match: null, ruleset: null })

    const timeoutId = window.setTimeout(() => {
      try {
        const match = findRuleMatch(password, TOP_PASSWORDS_COMBINED, ruleset.rules)
        setResult({
          status: match ? 'found' : 'not_found',
          match,
          ruleset,
        })
      } catch {
        setResult({ status: 'error', match: null, ruleset })
      }
    }, DEBOUNCE_MS)

    return () => window.clearTimeout(timeoutId)
  }, [password, ruleset])

  return result
}
