import { ATTACK_SCENARIOS } from '../constants/security'
import type { AppLanguage } from '../i18n'
import type { HardwareProfile } from '../types/security'
import { fmtGuesses, formatTime, timeClass } from '../utils/passwordAnalysis'

interface CrackTimeCardProps {
  hasData: boolean
  language: AppLanguage
  guesses: number
  rates: Record<string, number>
  profiles: HardwareProfile[]
  selectedHardwareProfile: string
  source: 'local' | 'remote'
  error: string | null
  t: (key: string, options?: Record<string, unknown>) => string
  onHardwareProfileChange: (profileId: string) => void
  onRateChange: (scenarioId: string, rate: number) => void
}

function resolveText(value: string, t: CrackTimeCardProps['t']): string {
  return value.includes('.') ? t(value) : value
}

export function CrackTimeCard({
  hasData,
  language,
  guesses,
  rates,
  profiles,
  selectedHardwareProfile,
  source,
  error,
  t,
  onHardwareProfileChange,
  onRateChange,
}: CrackTimeCardProps) {
  const selectedProfile = profiles.find((profile) => profile.id === selectedHardwareProfile) ?? profiles[0]

  return (
    <div className="card">
      <div className="card-title"><span>//</span> {t('crack.title')}</div>
      {hasData ? (
        <div>
          <div className="mini-note" style={{ marginBottom: '0.4rem' }}>
            {t('crack.hardware.note')}
          </div>
          <div className="mini-note" style={{ marginBottom: '0.4rem' }}>
            {source === 'remote' ? t('crack.hardware.sourceRemote') : t('crack.hardware.sourceLocal')}
          </div>
          {error && (
            <div className="mini-note" style={{ marginBottom: '0.4rem', color: 'var(--warning)' }}>
              {t(error)}
            </div>
          )}
          <label className="rate" style={{ display: 'block', marginBottom: '0.75rem' }}>
            <div style={{ marginBottom: '0.35rem' }}>{t('crack.hardware.label')}:</div>
            <div className="select-wrap">
              <select
                className="app-input app-input--select"
                value={selectedHardwareProfile}
                onChange={(event) => onHardwareProfileChange(event.target.value)}
                aria-label={t('crack.hardware.ariaLabel')}
              >
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {resolveText(profile.labelKey, t)}
                  </option>
                ))}
              </select>
              <span className="select-caret" aria-hidden="true">▾</span>
            </div>
            <div className="mini-note">{resolveText(selectedProfile?.descriptionKey ?? '', t)}</div>
          </label>

          <div className="mini-note" style={{ marginBottom: '0.75rem' }}>
            {t('crack.rateHint')}
          </div>
          <table className="crack-table">
            <thead>
              <tr>
                <th>{t('crack.scenarioLabel')}</th>
                <th style={{ textAlign: 'right' }}>{t('crack.estimatedTimeLabel')}</th>
              </tr>
            </thead>
            <tbody>
              {ATTACK_SCENARIOS.map((scenario) => {
                const rate = Math.max(1, rates[scenario.id] ?? scenario.rate)
                const avgSecs = guesses / 2 / rate
                const maxSecs = guesses / rate
                const tc = timeClass(avgSecs)

                return (
                  <tr key={scenario.id}>
                    <td>
                      <div className="scenario">{t(`scenarios.${scenario.id}.label`)}</div>
                      <div className="rate">{t(`scenarios.${scenario.id}.desc`)}</div>
                      <div className="rate" style={{ marginTop: '0.2rem' }}>
                        {t('crack.rateLabel')}:{' '}
                        <input
                          className="app-input app-input--compact"
                          type="number"
                          min={1}
                          step={100}
                          value={rate}
                          onChange={(event) => onRateChange(scenario.id, Number(event.target.value))}
                          aria-label={t('crack.rateInputAria', { scenario: t(`scenarios.${scenario.id}.label`) })}
                        />{' '}
                        / sec
                      </div>
                    </td>
                    <td className={`crack-time${tc ? ` ${tc}` : ''}`}>
                      <div>{t('crack.average')}: {formatTime(avgSecs, language)}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                        {t('crack.max')}: {formatTime(maxSecs, language)}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '0.7rem',
              color: 'var(--text-dim)',
              marginTop: '0.8rem',
              lineHeight: '1.6',
            }}
          >
            {t('crack.note', { guesses: fmtGuesses(guesses) })}
          </div>
        </div>
      ) : (
        <div className="placeholder-text">-</div>
      )}
    </div>
  )
}
