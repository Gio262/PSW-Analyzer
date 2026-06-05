import type { AppLanguage } from '../i18n'
import type { HardwareProfile } from '../types/security'
import { formatTime } from '../utils/passwordAnalysis'
import { generateProjectionSeries, yearsUntilCrackableIn } from '../utils/mooreProjection'
import { formatCost } from '../utils/economicAttackCost'

interface MooreProjectionCardProps {
  hasData: boolean
  language: AppLanguage
  guesses: number
  selectedProfile: HardwareProfile | undefined
  t: (key: string, options?: Record<string, unknown>) => string
}

const SCENARIO = 'fast_hash' as const

function formatRate(rate: number): string {
  if (rate >= 1e12) return `${(rate / 1e12).toFixed(1)} Th/s`
  if (rate >= 1e9) return `${(rate / 1e9).toFixed(1)} Gh/s`
  if (rate >= 1e6) return `${(rate / 1e6).toFixed(1)} Mh/s`
  if (rate >= 1e3) return `${(rate / 1e3).toFixed(1)} Kh/s`
  return `${rate.toFixed(0)} h/s`
}

export function MooreProjectionCard({
  hasData,
  language,
  guesses,
  selectedProfile,
  t,
}: MooreProjectionCardProps) {
  if (!hasData || !selectedProfile) {
    return (
      <div className="card">
        <div className="card-title">
          <span>//</span> {t('moore.title')}
        </div>
        <div className="placeholder-text">-</div>
      </div>
    )
  }

  const baseRate = selectedProfile.rates[SCENARIO]
  const costPerHour = selectedProfile.costPerHour?.[SCENARIO]
  const currency = selectedProfile.costCurrency ?? 'USD'

  const projections = generateProjectionSeries(guesses, baseRate, costPerHour)
  const yearsUntil1Hour = yearsUntilCrackableIn(guesses, baseRate, 3600)
  const yearsUntil1Minute = yearsUntilCrackableIn(guesses, baseRate, 60)

  return (
    <div className="card">
      <div className="card-title">
        <span>//</span> {t('moore.title')}
      </div>
      <div className="mini-note" style={{ marginBottom: '0.5rem' }}>
        {t('moore.description')}
      </div>

      <table className="moore-table">
        <thead>
          <tr>
            <th>{t('moore.yearLabel')}</th>
            <th style={{ textAlign: 'right' }}>{t('moore.rateLabel')}</th>
            <th style={{ textAlign: 'right' }}>{t('moore.crackTimeLabel')}</th>
            {costPerHour !== undefined && (
              <th style={{ textAlign: 'right' }}>{t('moore.costLabel')}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {projections.map(p => (
            <tr key={p.yearsFromNow}>
              <td>
                {p.yearsFromNow === 0
                  ? t('moore.now')
                  : t('moore.inYears', { n: p.yearsFromNow })}
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>
                {formatRate(p.projectedRate)}
              </td>
              <td style={{ textAlign: 'right' }}>
                {formatTime(p.crackSeconds, language)}
              </td>
              {costPerHour !== undefined && (
                <td style={{ textAlign: 'right', fontFamily: 'var(--mono)' }}>
                  {p.projectedCost !== undefined
                    ? formatCost({ amount: p.projectedCost, currency, applicable: true })
                    : '-'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mini-note" style={{ marginTop: '0.7rem', lineHeight: 1.5 }}>
        {yearsUntil1Hour !== null && yearsUntil1Hour > 0 && (
          <div>
            {t('moore.summary.crackableIn1Hour', { years: yearsUntil1Hour.toFixed(1) })}
          </div>
        )}
        {yearsUntil1Minute !== null && yearsUntil1Minute > 0 && (
          <div>
            {t('moore.summary.crackableIn1Minute', { years: yearsUntil1Minute.toFixed(1) })}
          </div>
        )}
        <div style={{ color: 'var(--text-dim)', marginTop: '0.3rem' }}>
          {t('moore.footnote')}
        </div>
      </div>
    </div>
  )
}
