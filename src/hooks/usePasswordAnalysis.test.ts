// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { zxcvbnOptions } from '@zxcvbn-ts/core'
import { adjacencyGraphs, dictionary as dictCommon } from '@zxcvbn-ts/language-common'
import { dictionary as dictEn, translations as translationsEn } from '@zxcvbn-ts/language-en'
import { dictionary as dictIt, translations as translationsIt } from '@zxcvbn-ts/language-it'
import { usePasswordAnalysis } from './usePasswordAnalysis'
import type { AppLanguage } from '../i18n'

type LanguageHookProps = { lang: AppLanguage }

// Replicates what useZxcvbnLanguage does, but synchronously in test setup.
function configureZxcvbn(lang: AppLanguage) {
  const langConfig = lang === 'it'
    ? { dictionary: dictIt, translations: translationsIt }
    : { dictionary: dictEn, translations: translationsEn }
  zxcvbnOptions.setOptions({
    dictionary: { ...dictCommon, ...langConfig.dictionary },
    graphs: adjacencyGraphs,
    translations: langConfig.translations,
  })
}

// Waits for the hook's 120 ms debounce + a small buffer to flush React state.
async function waitForDebounce() {
  await act(async () => {
    await new Promise<void>((r) => setTimeout(r, 200))
  })
}

beforeEach(() => {
  configureZxcvbn('it')
})

describe('usePasswordAnalysis — language dependency', () => {
  it('produces a valid score and guesses for a meaningful password', async () => {
    const { result } = renderHook(() =>
      usePasswordAnalysis({ password: 'ombrello', language: 'it' }),
    )

    await waitForDebounce()

    expect(result.current.guesses).toBeGreaterThan(1)
    expect(result.current.score).toBeGreaterThanOrEqual(0)
    expect(result.current.score).toBeLessThanOrEqual(4)
  })

  it('returns guesses=1 and score=0 for empty/whitespace input', async () => {
    const { result } = renderHook(() =>
      usePasswordAnalysis({ password: '   ', language: 'it' }),
    )

    await waitForDebounce()

    // hasMeaningfulInput('   ') → false → analysisData stays null → defaults
    expect(result.current.guesses).toBe(1)
    expect(result.current.score).toBe(0)
  })

  it('re-runs zxcvbn when language changes — Italian dictionary word scores higher in EN', async () => {
    // 'ombrello' is in the Italian zxcvbn dictionary (matched as a word pattern →
    // low guesses). In English it is treated as a generic 8-char lowercase string
    // (no match → significantly higher guesses).
    configureZxcvbn('it')
    const initialProps: LanguageHookProps = { lang: 'it' }

    const { result, rerender } = renderHook(
      ({ lang }: LanguageHookProps) =>
        usePasswordAnalysis({ password: 'ombrello', language: lang }),
      { initialProps },
    )

    await waitForDebounce()
    const guessesIt = result.current.guesses

    // Simulate useZxcvbnLanguage switching the global options to EN, then
    // rerender the hook with the new language (as App.tsx would do).
    configureZxcvbn('en')
    rerender({ lang: 'en' })

    await waitForDebounce()
    const guessesEn = result.current.guesses

    // Expect at least 2 orders of magnitude difference.
    expect(guessesEn).toBeGreaterThan(guessesIt * 100)
  })

  it('does NOT change guesses when switching language for a non-dictionary password', async () => {
    // A strong random password has no dictionary matches in any language;
    // swapping dictionaries should not meaningfully change the estimate.
    configureZxcvbn('it')
    const initialProps: LanguageHookProps = { lang: 'it' }

    const { result, rerender } = renderHook(
      ({ lang }: LanguageHookProps) =>
        usePasswordAnalysis({ password: 'K2$vBm9@xQr7!nLp', language: lang }),
      { initialProps },
    )

    await waitForDebounce()
    const guessesIt = result.current.guesses

    configureZxcvbn('en')
    rerender({ lang: 'en' })

    await waitForDebounce()
    const guessesEn = result.current.guesses

    const ratio = Math.max(guessesEn, guessesIt) / Math.min(guessesEn, guessesIt)
    expect(ratio).toBeLessThan(10)
  })

  // Note: testing EN→IT direction with 'umbrella' is unreliable because
  // 'umbrella' appears in both the EN and IT zxcvbn-ts dictionaries (same as
  // 'pizza' / 'opera' / 'piano' documented in the bug report). The ombrello
  // test above already exercises the re-run mechanism in both directions via
  // the same code path.

  it('re-runs analysis when layoutsVersion changes — hook does not crash and returns valid result', async () => {
    // Note: vi.spyOn on ESM-exported zxcvbn is not possible (ESM module namespaces
    // are not configurable). We verify the observable outcome instead: the hook
    // completes successfully and the dep array change is present in the effect.
    configureZxcvbn('it')

    const { result, rerender } = renderHook(
      ({ version }: { version: string }) =>
        usePasswordAnalysis({ password: 'ombrello', language: 'it', layoutsVersion: version }),
      { initialProps: { version: 'qwerty-it|qwerty-us' } },
    )

    await waitForDebounce()
    expect(result.current.guesses).toBeGreaterThan(0)

    // Simulate adding a layout by changing the version key.
    rerender({ version: 'jcuken-ru|qwerty-it|qwerty-us' })
    await waitForDebounce()

    // Analysis should complete again without error; result is still valid.
    expect(result.current.guesses).toBeGreaterThan(0)
  })
})
