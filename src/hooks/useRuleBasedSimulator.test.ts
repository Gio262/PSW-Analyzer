// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRuleBasedSimulator } from './useRuleBasedSimulator'
import { AVAILABLE_RULESETS } from '../constants/ruleSets'

// 2× the 300ms debounce to give ample margin even on loaded CI runners.
async function waitForDebounce() {
  await act(async () => {
    await new Promise<void>(r => setTimeout(r, 600))
  })
}

beforeEach(() => {
  // No localStorage state to reset, but ensure a clean DOM
})

// ── Initial state ─────────────────────────────────────────────────────────────

describe('useRuleBasedSimulator — initial state', () => {
  it('starts in idle status', () => {
    const { result } = renderHook(() =>
      useRuleBasedSimulator({ password: '', rulesetId: 'best64' }),
    )
    expect(result.current.status).toBe('idle')
  })

  it('starts with null match and null ruleset', () => {
    const { result } = renderHook(() =>
      useRuleBasedSimulator({ password: '', rulesetId: 'best64' }),
    )
    expect(result.current.match).toBeNull()
    expect(result.current.ruleset).toBeNull()
  })
})

// ── Empty / whitespace password ───────────────────────────────────────────────

describe('useRuleBasedSimulator — empty password', () => {
  it('empty string → idle', () => {
    const { result } = renderHook(() =>
      useRuleBasedSimulator({ password: '', rulesetId: 'best64' }),
    )
    expect(result.current.status).toBe('idle')
  })

  it('whitespace-only → idle', async () => {
    const { result } = renderHook(() =>
      useRuleBasedSimulator({ password: '   ', rulesetId: 'best64' }),
    )
    // Even after debounce, whitespace-only stays idle
    await waitForDebounce()
    expect(result.current.status).toBe('idle')
  })

  it('going from non-empty to empty → back to idle', async () => {
    const { result, rerender } = renderHook(
      ({ pw }: { pw: string }) => useRuleBasedSimulator({ password: pw, rulesetId: 'best64' }),
      { initialProps: { pw: 'ciao' } },
    )
    await waitForDebounce()
    expect(result.current.status).toBe('found')

    rerender({ pw: '' })
    expect(result.current.status).toBe('idle')
  })
})

// ── Known match ───────────────────────────────────────────────────────────────

describe('useRuleBasedSimulator — found status', () => {
  it('common word → found after debounce', async () => {
    const { result } = renderHook(() =>
      useRuleBasedSimulator({ password: 'ciao', rulesetId: 'best64' }),
    )
    await waitForDebounce()
    expect(result.current.status).toBe('found')
  })

  it('found result has non-null match', async () => {
    const { result } = renderHook(() =>
      useRuleBasedSimulator({ password: 'ciao', rulesetId: 'best64' }),
    )
    await waitForDebounce()
    expect(result.current.match).not.toBeNull()
    expect(result.current.match!.baseWord).toBe('ciao')
  })

  it('found result has non-null ruleset', async () => {
    const { result } = renderHook(() =>
      useRuleBasedSimulator({ password: 'ciao', rulesetId: 'best64' }),
    )
    await waitForDebounce()
    expect(result.current.ruleset).not.toBeNull()
    expect(result.current.ruleset!.id).toBe('best64')
  })

  it('returns positive attemptIndex', async () => {
    const { result } = renderHook(() =>
      useRuleBasedSimulator({ password: 'ciao', rulesetId: 'best64' }),
    )
    await waitForDebounce()
    expect(result.current.match!.attemptIndex).toBeGreaterThan(0)
  })

  it('capitalized common word → found (via capitalize rule)', async () => {
    const { result } = renderHook(() =>
      useRuleBasedSimulator({ password: 'Password', rulesetId: 'best64' }),
    )
    await waitForDebounce()
    expect(result.current.status).toBe('found')
    expect(result.current.match!.baseWord).toBe('password')
  })
})

// ── Not found ─────────────────────────────────────────────────────────────────

describe('useRuleBasedSimulator — not_found status', () => {
  it('random high-entropy password → not_found', async () => {
    const { result } = renderHook(() =>
      useRuleBasedSimulator({ password: 'Xk9$mP2@qL7!vB4', rulesetId: 'best64' }),
    )
    await waitForDebounce()
    expect(result.current.status).toBe('not_found')
  })

  it('not_found result has null match', async () => {
    const { result } = renderHook(() =>
      useRuleBasedSimulator({ password: 'Xk9$mP2@qL7!vB4', rulesetId: 'best64' }),
    )
    await waitForDebounce()
    expect(result.current.match).toBeNull()
  })

  it('not_found has non-null ruleset (the search was run with this ruleset)', async () => {
    const { result } = renderHook(() =>
      useRuleBasedSimulator({ password: 'Xk9$mP2@qL7!vB4', rulesetId: 'best64' }),
    )
    await waitForDebounce()
    expect(result.current.ruleset).not.toBeNull()
  })
})

// ── Running state transitions ─────────────────────────────────────────────────

describe('useRuleBasedSimulator — running state', () => {
  it('non-empty password triggers running state before debounce', async () => {
    const { result } = renderHook(() =>
      useRuleBasedSimulator({ password: 'ciao', rulesetId: 'best64' }),
    )
    // Before debounce fires: should be running
    // (React effect runs synchronously in renderHook, setResult called immediately)
    expect(result.current.status).toBe('running')
  })

  it('running state has null match (clean slate)', () => {
    const { result } = renderHook(() =>
      useRuleBasedSimulator({ password: 'ciao', rulesetId: 'best64' }),
    )
    expect(result.current.status).toBe('running')
    expect(result.current.match).toBeNull()
  })
})

// ── Password change re-runs simulation ────────────────────────────────────────

describe('useRuleBasedSimulator — rerender on password change', () => {
  it('changing password re-triggers the simulation', async () => {
    const { result, rerender } = renderHook(
      ({ pw }: { pw: string }) => useRuleBasedSimulator({ password: pw, rulesetId: 'best64' }),
      { initialProps: { pw: 'ciao' } },
    )
    await waitForDebounce()
    expect(result.current.status).toBe('found')
    expect(result.current.match).not.toBeNull()
    rerender({ pw: 'Xk9$mP2@qL7!vB4' })
    await waitForDebounce()
    expect(result.current.status).toBe('not_found')
    // Previous match is gone
    expect(result.current.match).toBeNull()
  })
})

// ── Ruleset fallback ──────────────────────────────────────────────────────────

describe('useRuleBasedSimulator — ruleset resolution', () => {
  it('valid rulesetId resolves to matching ruleset', async () => {
    const { result } = renderHook(() =>
      useRuleBasedSimulator({ password: 'ciao', rulesetId: 'best64' }),
    )
    await waitForDebounce()
    expect(result.current.ruleset?.id).toBe('best64')
  })

  it('unknown rulesetId falls back to first available ruleset', async () => {
    const { result } = renderHook(() =>
      useRuleBasedSimulator({ password: 'ciao', rulesetId: 'nonexistent-ruleset' }),
    )
    await waitForDebounce()
    // fallback: AVAILABLE_RULESETS[0]
    expect(result.current.ruleset?.id).toBe(AVAILABLE_RULESETS[0].id)
  })
})
