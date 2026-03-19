import { useMemo, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import './App.css'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { PasswordInputCard } from './components/PasswordInputCard'
import { EntropyCard } from './components/EntropyCard'
import { CrackTimeCard } from './components/CrackTimeCard'
import { FeedbackCard } from './components/FeedbackCard'
import { HibpCard } from './components/HibpCard'
import {
  ATTACK_SCENARIOS,
  DEFAULT_HARDWARE_PROFILE_ID,
  LOCALE_BY_LANGUAGE,
  SCORE_STYLES,
} from './constants/security'
import { useFeedbackItems } from './hooks/useFeedbackItems'
import { useHardwareProfiles } from './hooks/useHardwareProfiles'
import { useHibpCheck } from './hooks/useHibpCheck'
import { usePasswordAnalysis } from './hooks/usePasswordAnalysis'
import { useZxcvbnLanguage } from './hooks/useZxcvbnLanguage'
import { normalizeLanguage, type AppLanguage } from './i18n'
import type { HardwareProfile } from './types/security'

function getDefaultRates(profiles: HardwareProfile[], profileId = DEFAULT_HARDWARE_PROFILE_ID): Record<string, number> {
  const profile = profiles.find((item) => item.id === profileId)

  if (profile) {
    return { ...profile.rates }
  }

  return ATTACK_SCENARIOS.reduce<Record<string, number>>((acc, scenario) => {
    acc[scenario.id] = scenario.rate
    return acc
  }, {})
}

function App() {
  const { i18n, t } = useTranslation()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [contextWordsInput, setContextWordsInput] = useState('')
  const { profiles: hardwareProfiles, source: hardwareSource, error: hardwareError } = useHardwareProfiles()
  const [selectedHardwareProfile, setSelectedHardwareProfile] = useState(DEFAULT_HARDWARE_PROFILE_ID)
  const [rateOverrides, setRateOverrides] = useState<Record<string, number>>({})

  const currentLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)
  const locale = LOCALE_BY_LANGUAGE[currentLanguage]

  const contextWords = useMemo(
    () => contextWordsInput.split(',').map((word) => word.trim()).filter(Boolean),
    [contextWordsInput],
  )

  const resolvedHardwareProfile = useMemo(() => {
    const exists = hardwareProfiles.some((profile) => profile.id === selectedHardwareProfile)
    return exists ? selectedHardwareProfile : (hardwareProfiles[0]?.id ?? DEFAULT_HARDWARE_PROFILE_ID)
  }, [hardwareProfiles, selectedHardwareProfile])

  const scenarioRates = useMemo(() => {
    const baseRates = getDefaultRates(hardwareProfiles, resolvedHardwareProfile)
    return { ...baseRates, ...rateOverrides }
  }, [hardwareProfiles, resolvedHardwareProfile, rateOverrides])

  useZxcvbnLanguage(currentLanguage)

  const {
    analysisData,
    score,
    guesses,
    entropyTheoretical,
    entropyEffective,
    entropyConservative,
  } = usePasswordAnalysis({ password, userInputs: contextWords })

  const {
    hibpBtnDisabled,
    hibpResultClass,
    hibpMessage,
    consentAccepted,
    setHibpConsent,
    resetByPassword,
    runCheck,
  } = useHibpCheck({ password, locale, t })

  const feedbackItems = useFeedbackItems({
    analysisData,
    password,
    entropyTheoretical,
    entropyEffective,
    t,
  })

  const hasAnalysis = Boolean(analysisData)
  const scoreStyle = SCORE_STYLES[score]

  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) {
    const nextValue = e.target.value
    setPassword(nextValue)
    resetByPassword(nextValue)
  }

  function handleLanguageChange(language: AppLanguage) {
    if (language === currentLanguage) return
    void i18n.changeLanguage(language)
  }

  function handleToggleVisibility() {
    setShowPassword((prev) => !prev)
  }

  function handleScenarioRateChange(scenarioId: string, rate: number) {
    setRateOverrides((prev) => ({
      ...prev,
      [scenarioId]: Number.isFinite(rate) && rate > 0 ? Math.round(rate) : 1,
    }))
  }

  function handleHardwareProfileChange(profileId: string) {
    setSelectedHardwareProfile(profileId)
    setRateOverrides({})
  }

  return (
    <div className="container">
      <header>
        <div className="header-top">
          <div className="header-copy">
            <h1>// PSW Analyzer</h1>
            <p>{t('header.subtitle')}</p>
          </div>
          <LanguageSwitcher
            currentLanguage={currentLanguage}
            label={t('language.label')}
            switcherAriaLabel={t('language.switcherAriaLabel')}
            onChange={handleLanguageChange}
          />
        </div>
      </header>

      <div className="notice">
        <strong>{t('notice.title')}</strong>{' '}
        {t('notice.beforeBrowser')}{' '}
        <strong>{t('notice.browser')}</strong>{' '}
        {t('notice.beforeHash')}{' '}
        <strong>{t('notice.hash')}</strong>{' '}
        {t('notice.afterHash')}
      </div>

      <PasswordInputCard
        title={t('input.title')}
        placeholder={t('input.placeholder')}
        ariaLabel={t('input.ariaLabel')}
        showLabel={t('input.show')}
        hideLabel={t('input.hide')}
        scoreLabel={t('input.scoreLabel')}
        password={password}
        showPassword={showPassword}
        scoreText={hasAnalysis ? `${score}/4 - ${t(scoreStyle.labelKey)}` : '-'}
        scoreColor={hasAnalysis ? scoreStyle.color : undefined}
        strengthStyle={
          hasAnalysis
            ? { width: scoreStyle.barWidth, background: scoreStyle.color }
            : { width: '0%', background: 'transparent' }
        }
        onPasswordChange={handlePasswordChange}
        onToggleVisibility={handleToggleVisibility}
      />

      <div className="card">
        <div className="card-title"><span>//</span> {t('analysisContext.title')}</div>
        <div className="mini-note" style={{ marginBottom: '0.45rem' }}>{t('analysisContext.description')}</div>
        <input
          type="text"
          placeholder={t('analysisContext.placeholder')}
          value={contextWordsInput}
          onChange={(event) => setContextWordsInput(event.target.value)}
          aria-label={t('analysisContext.ariaLabel')}
        />
      </div>

      <EntropyCard
        t={t}
        passwordLength={password.length}
        charsetInfo={analysisData?.charsetInfo ?? null}
        entropyTheoretical={entropyTheoretical}
        entropyEffective={entropyEffective}
        entropyConservative={entropyConservative}
        guesses={guesses}
      />

      <CrackTimeCard
        hasData={hasAnalysis}
        language={currentLanguage}
        guesses={guesses}
        rates={scenarioRates}
        profiles={hardwareProfiles}
        selectedHardwareProfile={resolvedHardwareProfile}
        source={hardwareSource}
        error={hardwareError}
        t={t}
        onHardwareProfileChange={handleHardwareProfileChange}
        onRateChange={handleScenarioRateChange}
      />

      <FeedbackCard
        title={t('feedback.title')}
        hasData={hasAnalysis}
        items={feedbackItems}
      />

      <HibpCard
        title={t('hibp.title')}
        buttonLabel={t('hibp.button')}
        message={hibpMessage}
        resultClass={hibpResultClass}
        disabled={hibpBtnDisabled}
        consentAccepted={consentAccepted}
        consentLabel={t('hibp.consent')}
        noteLine1={t('hibp.noteLine1')}
        noteLine2={t('hibp.noteLine2')}
        onConsentChange={setHibpConsent}
        onCheck={() => {
          void runCheck()
        }}
      />

      <footer>
        <div>
          zxcvbn-ts &copy; Björn Friedrichs —{' '}
          <a href="https://github.com/zxcvbn-ts/zxcvbn" target="_blank" rel="noopener noreferrer">
            github.com/zxcvbn-ts/zxcvbn
          </a>
        </div>
        <div>
          HIBP &copy; Troy Hunt —{' '}
          <a href="https://haveibeenpwned.com" target="_blank" rel="noopener noreferrer">
            haveibeenpwned.com
          </a>
        </div>
        <div style={{ marginTop: '0.5rem', color: '#2a3848' }}>
          {t('footer.telemetry')}
        </div>
      </footer>
    </div>
  )
}

export default App
