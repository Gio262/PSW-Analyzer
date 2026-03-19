import { SUPPORTED_LANGUAGES, type AppLanguage } from '../i18n'

interface LanguageSwitcherProps {
  currentLanguage: AppLanguage
  label: string
  switcherAriaLabel: string
  onChange: (language: AppLanguage) => void
}

export function LanguageSwitcher({
  currentLanguage,
  label,
  switcherAriaLabel,
  onChange,
}: LanguageSwitcherProps) {
  return (
    <div className="language-switcher" role="group" aria-label={switcherAriaLabel}>
      <div className="language-switcher-label">{label}</div>
      <div className="language-switcher-track">
        {SUPPORTED_LANGUAGES.map((language) => (
          <button
            key={language.code}
            type="button"
            className={`language-option${language.code === currentLanguage ? ' active' : ''}`}
            aria-pressed={language.code === currentLanguage}
            onClick={() => onChange(language.code)}
          >
            <span className="language-option-code">{language.shortLabel}</span>
            <span className="language-option-name">{language.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
