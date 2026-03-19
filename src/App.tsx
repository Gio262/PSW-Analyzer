import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core'
import type { ZxcvbnResult } from '@zxcvbn-ts/core'
import { adjacencyGraphs, dictionary as dictCommon } from '@zxcvbn-ts/language-common'
import { dictionary as dictEn, translations as translationsEn } from '@zxcvbn-ts/language-en'
import { dictionary as dictIt, translations as translationsIt } from '@zxcvbn-ts/language-it'
import './App.css'
import { SUPPORTED_LANGUAGES, type AppLanguage, normalizeLanguage } from './i18n'

// ============================================================
// Constants
// ============================================================

const ATTACK_SCENARIOS = [
  {
    id: 'online_throttled',
    rate: 100,
  },
  {
    id: 'slow_hash',
    rate: 10_000,
  },
  {
    id: 'fast_hash',
    rate: 10_000_000_000,
  },
] as const

const SCORE_STYLES = [
  { labelKey: 'scores.0', color: '#ff4d6d', barWidth: '8%' },
  { labelKey: 'scores.1', color: '#ff7a3d', barWidth: '25%' },
  { labelKey: 'scores.2', color: '#ffb400', barWidth: '50%' },
  { labelKey: 'scores.3', color: '#7eff6e', barWidth: '75%' },
  { labelKey: 'scores.4', color: '#39ff7a', barWidth: '100%' },
] as const

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

const LOCALE_BY_LANGUAGE: Record<AppLanguage, string> = {
  it: 'it-IT',
  en: 'en-US',
}

// ============================================================
// Types
// ============================================================

type CharsetGroupId = 'lower' | 'upper' | 'digits' | 'space' | 'symbols'

interface CharsetGroup {
  id: CharsetGroupId
  size: number
  re: RegExp
}

interface CharsetInfo {
  charsetSize: number
  active: CharsetGroup[]
  entropy: number
  allGroups: CharsetGroup[]
  hasOtherUnicode: boolean
}

type HibpStatus = 'idle' | 'reset' | 'checking' | 'safe' | 'found' | 'error'

// ============================================================
// Utilities
// ============================================================

function formatTime(seconds: number, language: AppLanguage): string {
  if (!isFinite(seconds) || seconds > 1e30) {
    return language === 'it' ? "> età dell'universo" : '> age of the universe'
  }
  if (seconds < 1) return language === 'it' ? '< 1 secondo' : '< 1 second'
  if (seconds < 60) return `${Math.round(seconds)} sec`
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`
  if (seconds < 86400) {
    return language === 'it'
      ? `${Math.round(seconds / 3600)} ore`
      : `${Math.round(seconds / 3600)} hrs`
  }
  if (seconds < 31536000) {
    return language === 'it'
      ? `${Math.round(seconds / 86400)} giorni`
      : `${Math.round(seconds / 86400)} days`
  }
  const years = seconds / 31536000
  const yearLabel = language === 'it' ? 'anni' : 'years'
  if (years < 1e3) return `${Math.round(years)} ${yearLabel}`
  if (years < 1e6) return `${(years / 1e3).toFixed(1)}K ${yearLabel}`
  if (years < 1e9) return `${(years / 1e6).toFixed(1)}M ${yearLabel}`
  if (years < 1e12) return `${(years / 1e9).toFixed(1)}B ${yearLabel}`
  if (years < 1e15) return `${(years / 1e12).toFixed(1)}T ${yearLabel}`
  return language === 'it' ? '> 10^15 anni' : '> 10^15 years'
}

function timeClass(seconds: number): string {
  if (seconds < 3600) return 'danger'
  if (seconds > 3_153_600_000) return 'safe'
  return ''
}

function fmtGuesses(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9)  return `${(n / 1e9).toFixed(1)}G`
  if (n >= 1e6)  return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3)  return `${(n / 1e3).toFixed(1)}K`
  return `${Math.round(n)}`
}

function hasMeaningfulInput(str: string): boolean {
  return str.trim().length > 0
}

function hasNonAsciiCharacters(str: string): boolean {
  for (const char of str) {
    if ((char.codePointAt(0) ?? 0) > 0x7f) return true
  }
  return false
}

function analyzeCharset(pw: string): CharsetInfo {
  const groups: CharsetGroup[] = [
    { id: 'lower', size: 26, re: /[a-z]/ },
    { id: 'upper', size: 26, re: /[A-Z]/ },
    { id: 'digits', size: 10, re: /[0-9]/ },
    { id: 'space', size: 1, re: /\s/ },
    {
      id: 'symbols',
      size: 33,
      re: /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/ },
  ]
  let charsetSize = 0
  const active: CharsetGroup[] = []
  for (const g of groups) {
    if (g.re.test(pw)) { charsetSize += g.size; active.push(g) }
  }
  const hasOtherUnicode = hasNonAsciiCharacters(pw)
  const entropy = pw.length > 0 && charsetSize > 0
    ? pw.length * Math.log2(charsetSize)
    : 0
  return { charsetSize, active, entropy, allGroups: groups, hasOtherUnicode }
}

async function sha1hex(str: string): Promise<string> {
  if (!window.crypto?.subtle) throw new Error('Web Crypto API unavailable')
  const buf = new TextEncoder().encode(str)
  const hash = await crypto.subtle.digest('SHA-1', buf)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

async function checkHIBP(password: string): Promise<{ found: boolean; count: number }> {
  const hash = await sha1hex(password)
  const prefix = hash.slice(0, 5)
  const suffix = hash.slice(5)
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { 'Add-Padding': 'true' },
  })
  if (!res.ok) throw new Error(`HIBP HTTP ${res.status}`)
  const text = await res.text()
  for (const line of text.split('\n')) {
    const [s, count] = line.trim().split(':')
    if (s && s.toUpperCase() === suffix) {
      return { found: true, count: parseInt(count, 10) || 0 }
    }
  }
  return { found: false, count: 0 }
}

// ============================================================
// Component
// ============================================================

function App() {
  const { i18n, t } = useTranslation()
  const currentLanguage = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)
  const locale = LOCALE_BY_LANGUAGE[currentLanguage]

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [analysisData, setAnalysisData] = useState<{
    result: ZxcvbnResult
    charsetInfo: CharsetInfo
  } | null>(null)
  const [hibpStatus, setHibpStatus] = useState<HibpStatus>('idle')
  const [hibpCount, setHibpCount] = useState(0)
  const [hibpError, setHibpError] = useState('')

  const inputVersionRef = useRef(0)

  useEffect(() => {
    const languageConfig = ZXCVBN_LANGUAGE_CONFIG[currentLanguage]
    zxcvbnOptions.setOptions({
      dictionary: { ...dictCommon, ...languageConfig.dictionary },
      graphs: adjacencyGraphs,
      translations: languageConfig.translations,
    })
  }, [currentLanguage])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!hasMeaningfulInput(password)) {
        setAnalysisData(null)
        return
      }

      setAnalysisData({
        result: zxcvbn(password),
        charsetInfo: analyzeCharset(password),
      })
    }, 120)

    return () => window.clearTimeout(timeoutId)
  }, [currentLanguage, password])

  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setPassword(value)
    inputVersionRef.current += 1
    setHibpStatus(hasMeaningfulInput(value) ? 'reset' : 'idle')
    setHibpCount(0)
    setHibpError('')
  }

  function handleToggleVisibility() {
    setShowPassword(prev => !prev)
  }

  function handleLanguageChange(language: AppLanguage) {
    if (language === currentLanguage) return
    void i18n.changeLanguage(language)
  }

  async function handleHIBPCheck() {
    if (!password || !hasMeaningfulInput(password)) return
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
      setHibpError((err as Error).message)
    }
  }

  const hasInput = hasMeaningfulInput(password)
  const score = Math.max(0, Math.min(analysisData?.result.score ?? 0, 4))
  const scoreStyle = SCORE_STYLES[score]
  const guesses = analysisData ? Math.max(1, analysisData.result.guesses) : 1
  const entropyTheoretical = analysisData?.charsetInfo.entropy ?? 0
  const entropyEffective = Math.log2(guesses)

  const hibpBtnDisabled = !hasInput || hibpStatus === 'checking'
  const hibpResultClass =
    hibpStatus === 'found'  ? 'hibp-result danger'  :
    hibpStatus === 'safe'   ? 'hibp-result safe'    :
    hibpStatus === 'error'  ? 'hibp-result error'   :
                              'hibp-result loading'
  const hibpMessage =
    hibpStatus === 'found'
      ? t('hibp.found', { occurrences: hibpCount.toLocaleString(locale) })
      : hibpStatus === 'error'
        ? t('hibp.error', { message: hibpError })
        : t(`hibp.${hibpStatus}`)

  const feedbackItems: { text: string; isOk: boolean }[] = []
  if (analysisData) {
    const fb = analysisData.result.feedback
    if (fb.warning) feedbackItems.push({ text: fb.warning, isOk: false })
    for (const s of fb.suggestions) feedbackItems.push({ text: s, isOk: false })
    if (feedbackItems.length === 0) {
      feedbackItems.push({
        text: t('feedback.none'),
        isOk: true,
      })
    }
    const delta = entropyTheoretical - entropyEffective
    if (delta > 5) {
      feedbackItems.push({
        text: t('feedback.predictablePatterns', { delta: delta.toFixed(0) }),
        isOk: false,
      })
    }
    if (/^\s|\s$/.test(password)) {
      feedbackItems.push({
        text: t('feedback.leadingTrailingSpaces'),
        isOk: false,
      })
    }
  }

  return (
    <div className="container">
      <header>
        <div className="header-top">
          <div className="header-copy">
            <h1>// PSW Analyzer</h1>
            <p>{t('header.subtitle')}</p>
          </div>
          <div className="language-switcher" role="group" aria-label={t('language.switcherAriaLabel')}>
            <div className="language-switcher-label">{t('language.label')}</div>
            <div className="language-switcher-track">
              {SUPPORTED_LANGUAGES.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  className={`language-option${language.code === currentLanguage ? ' active' : ''}`}
                  aria-pressed={language.code === currentLanguage}
                  onClick={() => handleLanguageChange(language.code)}
                >
                  <span className="language-option-code">{language.shortLabel}</span>
                  <span className="language-option-name">{language.label}</span>
                </button>
              ))}
            </div>
          </div>
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

      {/* INPUT */}
      <div className="card">
        <div className="card-title"><span>//</span> {t('input.title')}</div>
        <div className="input-wrap">
          <input
            type={showPassword ? 'text' : 'password'}
            id="pwInput"
            placeholder={t('input.placeholder')}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label={t('input.ariaLabel')}
            value={password}
            onChange={handlePasswordChange}
          />
          <button
            id="toggleVis"
            type="button"
            title={showPassword ? t('input.hide') : t('input.show')}
            aria-label={showPassword ? t('input.hide') : t('input.show')}
            aria-pressed={showPassword}
            onClick={handleToggleVisibility}
          >
            👁
          </button>
        </div>
        <div className="strength-bar-bg" aria-hidden="true">
          <div
            className="strength-bar-fill"
            style={
              analysisData
                ? { width: scoreStyle.barWidth, background: scoreStyle.color }
                : { width: '0%', background: 'transparent' }
            }
          />
        </div>
        <div className="score-row">
          <span className="score-label">{t('input.scoreLabel')}</span>
          <span
            className="score-value"
            aria-live="polite"
            style={analysisData ? { color: scoreStyle.color } : {}}
          >
            {analysisData ? `${score}/4 - ${t(scoreStyle.labelKey)}` : '-'}
          </span>
        </div>
      </div>

      {/* ENTROPY */}
      <div className="card">
        <div className="card-title"><span>//</span> {t('entropy.title')}</div>
        {analysisData ? (
          <div>
            <div className="metrics-grid">
              <div className="metric-box">
                <div className="metric-label">{t('entropy.theoreticalLabel')}</div>
                <div className="metric-value">{entropyTheoretical.toFixed(1)} bit</div>
                <div className="metric-sub">
                  {t('entropy.theoreticalSub', {
                    length: password.length,
                    charsetSize: analysisData.charsetInfo.charsetSize || 0,
                  })}
                </div>
              </div>
              <div className="metric-box">
                <div className="metric-label">{t('entropy.effectiveLabel')}</div>
                <div className="metric-value">{entropyEffective.toFixed(1)} bit</div>
                <div className="metric-sub">
                  {t('entropy.effectiveSub', {
                    guesses: fmtGuesses(guesses),
                  })}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '0.8rem' }}>
              <div className="metric-label" style={{ marginBottom: '0.4rem' }}>
                {t('entropy.groupsLabel')}
              </div>
              <div className="charset-row">
                {analysisData.charsetInfo.allGroups.map(g => (
                  <span
                    key={g.id}
                    className={`charset-tag${analysisData.charsetInfo.active.includes(g) ? ' active' : ''}`}
                  >
                    {t(`entropy.groups.${g.id}`)}
                  </span>
                ))}
              </div>
            </div>
            {analysisData.charsetInfo.hasOtherUnicode && (
              <div className="mini-note">
                {t('entropy.unicodeNote')}
              </div>
            )}
            <div style={{ marginTop: '0.8rem', fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: '1.6' }}>
              {t('entropy.generalNote')}
            </div>
          </div>
        ) : (
          <div className="placeholder-text">{t('entropy.placeholder')}</div>
        )}
      </div>

      {/* CRACK TIMES */}
      <div className="card">
        <div className="card-title"><span>//</span> {t('crack.title')}</div>
        {analysisData ? (
          <div>
            <table className="crack-table">
              <thead>
                <tr>
                  <th>{t('crack.scenarioLabel')}</th>
                  <th style={{ textAlign: 'right' }}>{t('crack.estimatedTimeLabel')}</th>
                </tr>
              </thead>
              <tbody>
                {ATTACK_SCENARIOS.map(s => {
                  const avgSecs = guesses / 2 / s.rate
                  const maxSecs = guesses / s.rate
                  const tc = timeClass(avgSecs)
                  return (
                    <tr key={s.id}>
                      <td>
                        <div className="scenario">{t(`scenarios.${s.id}.label`)}</div>
                        <div className="rate">{t(`scenarios.${s.id}.desc`)} - {t(`scenarios.${s.id}.unit`)}</div>
                      </td>
                      <td className={`crack-time${tc ? ` ${tc}` : ''}`}>
                        <div>{t('crack.average')}: {formatTime(avgSecs, currentLanguage)}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                          {t('crack.max')}: {formatTime(maxSecs, currentLanguage)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.8rem', lineHeight: '1.6' }}>
              {t('crack.note', { guesses: fmtGuesses(guesses) })}
            </div>
          </div>
        ) : (
          <div className="placeholder-text">-</div>
        )}
      </div>

      {/* FEEDBACK */}
      <div className="card">
        <div className="card-title"><span>//</span> {t('feedback.title')}</div>
        {analysisData ? (
          <ul className="feedback-list">
            {feedbackItems.map((item, i) => (
              <li key={i} className={item.isOk ? 'ok' : ''}>{item.text}</li>
            ))}
          </ul>
        ) : (
          <div className="placeholder-text">-</div>
        )}
      </div>

      {/* HIBP */}
      <div className="card">
        <div className="card-title"><span>//</span> {t('hibp.title')}</div>
        <div className="hibp-row">
          <button
            className="btn-hibp"
            type="button"
            disabled={hibpBtnDisabled}
            onClick={handleHIBPCheck}
          >
            {t('hibp.button')}
          </button>
          <span className={hibpResultClass} aria-live="polite">
            {hibpMessage}
          </span>
        </div>
        <div className="hibp-note">
          <div>{t('hibp.noteLine1')}</div>
          <div>{t('hibp.noteLine2')}</div>
        </div>
      </div>

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
