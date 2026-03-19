import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import itTranslation from './locales/it.json'
import enTranslation from './locales/en.json'

export const SUPPORTED_LANGUAGES = [
  { code: 'it', label: 'Italiano', shortLabel: 'IT' },
  { code: 'en', label: 'English', shortLabel: 'EN' },
] as const

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code']

const DEFAULT_LANGUAGE: AppLanguage = 'it'
const LANGUAGE_STORAGE_KEY = 'psw-analyzer-language'
const SUPPORTED_LANGUAGE_CODES = new Set<AppLanguage>(
  SUPPORTED_LANGUAGES.map(({ code }) => code),
)

function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value !== undefined && value !== null && SUPPORTED_LANGUAGE_CODES.has(value as AppLanguage)
}

function getInitialLanguage(): AppLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (isAppLanguage(storedLanguage)) return storedLanguage

  const browserLanguage = window.navigator.language.toLowerCase()
  const detectedLanguage = SUPPORTED_LANGUAGES.find(
    ({ code }) => browserLanguage === code || browserLanguage.startsWith(`${code}-`),
  )

  return detectedLanguage?.code ?? DEFAULT_LANGUAGE
}

void i18n.use(initReactI18next).init({
  resources: {
    it: { translation: itTranslation },
    en: { translation: enTranslation },
  },
  lng: getInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES.map(({ code }) => code),
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
})

i18n.on('languageChanged', (language) => {
  if (typeof window === 'undefined' || !isAppLanguage(language)) return
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
})

export function normalizeLanguage(value: string | undefined): AppLanguage {
  return isAppLanguage(value) ? value : DEFAULT_LANGUAGE
}

export default i18n
