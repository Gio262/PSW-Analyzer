import type { TFunction } from 'i18next'
import type { CharsetInfo } from '../types/security'
import { fmtGuesses } from '../utils/passwordAnalysis'

interface EntropyCardProps {
  t: TFunction
  passwordLength: number
  charsetInfo: CharsetInfo | null
  entropyTheoretical: number
  entropyEffective: number
  entropyConservative: number
  guesses: number
}

export function EntropyCard({
  t,
  passwordLength,
  charsetInfo,
  entropyTheoretical,
  entropyEffective,
  entropyConservative,
  guesses,
}: EntropyCardProps) {
  return (
    <div className="card">
      <div className="card-title"><span>//</span> {t('entropy.title')}</div>
      {charsetInfo ? (
        <div>
          <div className="metrics-grid">
            <div className="metric-box">
              <div className="metric-label">{t('entropy.theoreticalLabel')}</div>
              <div className="metric-value">{entropyTheoretical.toFixed(1)} bit</div>
              <div className="metric-sub">
                {t('entropy.theoreticalSub', {
                  length: passwordLength,
                  charsetSize: charsetInfo.charsetSize || 0,
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
            <div className="metric-box">
              <div className="metric-label">{t('entropy.conservativeLabel')}</div>
              <div className="metric-value">{entropyConservative.toFixed(1)} bit</div>
              <div className="metric-sub">{t('entropy.conservativeSub')}</div>
            </div>
          </div>

          <div style={{ marginTop: '0.8rem' }}>
            <div className="metric-label" style={{ marginBottom: '0.4rem' }}>
              {t('entropy.groupsLabel')}
            </div>
            <div className="charset-row">
              {charsetInfo.allGroups.map((group) => (
                <span
                  key={group.id}
                  className={`charset-tag${charsetInfo.active.some((active) => active.id === group.id) ? ' active' : ''}`}
                >
                  {t(`entropy.groups.${group.id}`)}
                </span>
              ))}
            </div>
          </div>

          {charsetInfo.hasOtherUnicode && (
            <div className="mini-note">{t('entropy.unicodeNote')}</div>
          )}

          <div
            style={{
              marginTop: '0.8rem',
              fontFamily: 'var(--mono)',
              fontSize: '0.72rem',
              color: 'var(--text-dim)',
              lineHeight: '1.6',
            }}
          >
            {t('entropy.generalNote')}
          </div>
        </div>
      ) : (
        <div className="placeholder-text">{t('entropy.placeholder')}</div>
      )}
    </div>
  )
}
