import { useEffect } from 'react'
import { zxcvbnOptions } from '@zxcvbn-ts/core'
import { dictionary as dictCommon } from '@zxcvbn-ts/language-common'
import { dictionary as dictEn, translations as translationsEn } from '@zxcvbn-ts/language-en'
import { dictionary as dictIt, translations as translationsIt } from '@zxcvbn-ts/language-it'
import type { AppLanguage } from '../i18n'

const ZXCVBN_LANGUAGE_CONFIG = {
  en: {
    dictionary: dictEn,
    translations: translationsEn,
  },
  it: {
    dictionary: dictIt,
    translations: translationsIt,
  },
} satisfies Record<
  AppLanguage,
  {
    dictionary: typeof dictEn
    translations: typeof translationsEn
  }
>

/**
 * Applies the correct zxcvbn dictionary and translations whenever the app language changes.
 *
 * Dictionary composition per language:
 *   'it' → dictCommon (universal patterns) + dictIt (Italian words, names, pop culture)
 *   'en' → dictCommon (universal patterns) + dictEn (English words, names, pop culture)
 *
 * This means:
 *   - Italian words like 'ombrello', 'juventus', 'ciao' cost few guesses (low effective entropy)
 *     in 'it' mode (dictionary hit) and cost more guesses in 'en' mode (not in EN dictionary).
 *   - The UI language flag in the top-left corner directly controls which dictionary is active.
 *
 * Note: graphs (keyboard layout adjacency) are NOT set here — they are managed exclusively
 * by useKeyboardLayouts, which runs after this hook in App.tsx, to avoid overwriting custom
 * layout graphs when the language changes.
 */
export function useZxcvbnLanguage(language: AppLanguage): void {
  useEffect(() => {
    const languageConfig = ZXCVBN_LANGUAGE_CONFIG[language]
    zxcvbnOptions.setOptions({
      dictionary: { ...dictCommon, ...languageConfig.dictionary },
      translations: languageConfig.translations,
    })
  }, [language])
}
