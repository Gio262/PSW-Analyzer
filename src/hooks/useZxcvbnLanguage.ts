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

export function useZxcvbnLanguage(language: AppLanguage): void {
  useEffect(() => {
    const languageConfig = ZXCVBN_LANGUAGE_CONFIG[language]
    // graphs are managed exclusively by useKeyboardLayouts to avoid overwriting
    // the custom layout graphs when the language changes.
    zxcvbnOptions.setOptions({
      dictionary: { ...dictCommon, ...languageConfig.dictionary },
      translations: languageConfig.translations,
    })
  }, [language])
}
