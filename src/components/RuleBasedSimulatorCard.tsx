import type { SimulationResult } from '../hooks/useRuleBasedSimulator'
import { AVAILABLE_RULESETS } from '../constants/ruleSets'
import { fmtGuesses } from '../utils/passwordAnalysis'

interface RuleBasedSimulatorCardProps {
  result: SimulationResult
  rulesetId: string
  onRulesetChange: (id: string) => void
  t: (key: string, options?: Record<string, unknown>) => string
}

export function RuleBasedSimulatorCard({
  result,
  rulesetId,
  onRulesetChange,
  t,
}: RuleBasedSimulatorCardProps) {
  return (
    <div className="card">
      <div className="card-title">
        <span>//</span> {t('ruleSim.title')}
      </div>
      <div className="mini-note" style={{ marginBottom: '0.5rem' }}>
        {t('ruleSim.description')}
      </div>

      <label className="mini-note" style={{ display: 'block', marginBottom: '0.6rem' }}>
        {t('ruleSim.rulesetLabel')}:
        <select
          className="app-input app-input--select"
          value={rulesetId}
          onChange={e => onRulesetChange(e.target.value)}
          style={{ marginLeft: '0.4rem' }}
        >
          {AVAILABLE_RULESETS.map(rs => (
            <option key={rs.id} value={rs.id}>{rs.label}</option>
          ))}
        </select>
      </label>

      <div className="rule-sim-output">
        {result.status === 'idle' && (
          <div className="placeholder-text">{t('ruleSim.idle')}</div>
        )}
        {result.status === 'running' && (
          <div className="mini-note">{t('ruleSim.running')}</div>
        )}
        {result.status === 'not_found' && (
          <div className="rule-sim-result rule-sim-result--safe">
            ✓ {t('ruleSim.notFound')}
          </div>
        )}
        {result.status === 'found' && result.match && (
          <div className="rule-sim-result rule-sim-result--danger">
            <div><strong>{t('ruleSim.found')}</strong></div>
            <div style={{ marginTop: '0.4rem', fontFamily: 'var(--mono)', fontSize: '0.82em' }}>
              <span>{t('ruleSim.baseWord')}: </span>
              <strong>{result.match.baseWord}</strong>
              <br />
              <span>{t('ruleSim.ruleApplied')}: </span>
              <code className="rule-sim-rule">{result.match.rule}</code>
              <br />
              <span>{t('ruleSim.attemptIndex')}: </span>
              {fmtGuesses(result.match.attemptIndex)}
            </div>
            <div className="mini-note" style={{ marginTop: '0.5rem' }}>
              {t('ruleSim.explanation')}
            </div>
          </div>
        )}
        {result.status === 'error' && (
          <div className="rule-sim-result rule-sim-result--error">
            {t('ruleSim.error')}
          </div>
        )}
      </div>
    </div>
  )
}
