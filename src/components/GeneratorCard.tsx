import { useState } from 'react'
import { useSecureGenerator } from '../hooks/useSecureGenerator'
import type { DicewareList } from '../services/secureGenerator/passphraseGen'

interface GeneratorCardProps {
  t: (key: string, options?: Record<string, unknown>) => string
  onUseInAnalyzer?: (password: string) => void
}

export function GeneratorCard({ t, onUseInAnalyzer }: GeneratorCardProps) {
  const [mode, setMode] = useState<'password' | 'passphrase'>('password')
  const gen = useSecureGenerator()

  // Password options
  const [length, setLength] = useState(20) // max 50 per usability
  const [lowercase, setLowercase] = useState(true)
  const [uppercase, setUppercase] = useState(true)
  const [digits, setDigits] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false)
  const [ensureAllClasses, setEnsureAllClasses] = useState(true)

  // Passphrase options
  const [wordCount, setWordCount] = useState(7)
  const [list, setList] = useState<DicewareList>('eff-long')
  const [separator, setSeparator] = useState('-')
  const [capitalize, setCapitalize] = useState(false)

  function handleGenerate() {
    if (mode === 'password') {
      gen.generatePassword({ length, lowercase, uppercase, digits, symbols, excludeAmbiguous, ensureAllClasses })
    } else {
      void gen.generatePassphrase({ wordCount, list, separator, capitalize, appendDigit: false, appendSymbol: false })
    }
  }

  // Derive generated text and pool size once so TypeScript narrowing works cleanly
  const generatedText = gen.lastResult
    ? ('password' in gen.lastResult ? gen.lastResult.password : gen.lastResult.passphrase)
    : null
  const generatedPoolSize = gen.lastResult
    ? ('password' in gen.lastResult ? gen.lastResult.poolSize : gen.lastResult.listSize)
    : null
  const generatedEntropyBits = gen.lastResult?.entropyBits ?? null

  return (
    <div className="card">
      <div className="card-title"><span>//</span> {t('generator.title')}</div>
      <div className="mini-note" style={{ marginBottom: '0.5rem' }}>
        {t('generator.description')}
      </div>

      <div className="generator-mode-switch" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.7rem' }}>
        <button
          className={`app-btn${mode === 'password' ? ' active' : ''}`}
          aria-pressed={mode === 'password'}
          onClick={() => setMode('password')}
        >
          {t('generator.modePassword')}
        </button>
        <button
          className={`app-btn${mode === 'passphrase' ? ' active' : ''}`}
          aria-pressed={mode === 'passphrase'}
          onClick={() => setMode('passphrase')}
        >
          {t('generator.modePassphrase')}
        </button>
      </div>

      {mode === 'password' && (
        <div className="generator-options" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.7rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="mini-note">{t('generator.length')}: <strong>{length}</strong></span>
            <input
              type="range" min={8} max={50} value={length}
              onChange={e => setLength(Number(e.target.value))}
              style={{ flex: 1 }}
            />
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem' }}>
            <label className="mini-note"><input type="checkbox" checked={lowercase} onChange={e => setLowercase(e.target.checked)} /> a-z</label>
            <label className="mini-note"><input type="checkbox" checked={uppercase} onChange={e => setUppercase(e.target.checked)} /> A-Z</label>
            <label className="mini-note"><input type="checkbox" checked={digits} onChange={e => setDigits(e.target.checked)} /> 0-9</label>
            <label className="mini-note"><input type="checkbox" checked={symbols} onChange={e => setSymbols(e.target.checked)} /> !@#$…</label>
            <label className="mini-note"><input type="checkbox" checked={excludeAmbiguous} onChange={e => setExcludeAmbiguous(e.target.checked)} /> {t('generator.excludeAmbiguous')}</label>
            <label className="mini-note"><input type="checkbox" checked={ensureAllClasses} onChange={e => setEnsureAllClasses(e.target.checked)} /> {t('generator.ensureAllClasses')}</label>
          </div>
        </div>
      )}

      {mode === 'passphrase' && (
        <div className="generator-options" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.7rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="mini-note">{t('generator.wordCount')}: <strong>{wordCount}</strong></span>
            <input
              type="range" min={3} max={15} value={wordCount}
              onChange={e => setWordCount(Number(e.target.value))}
              style={{ flex: 1 }}
            />
          </label>
          <label className="mini-note" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {t('generator.wordlist')}:
            <select
              className="app-input app-input--select"
              value={list}
              onChange={e => setList(e.target.value as DicewareList)}
            >
              <option value="eff-long">EFF long (7776, 12.9 bit/word)</option>
              <option value="eff-short1">EFF short1 (1296, 10.3 bit/word)</option>
              <option value="reinhold-en">Reinhold classic (7776, 12.9 bit/word)</option>
            </select>
          </label>
          <label className="mini-note" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {t('generator.separator')}:
            <input
              className="app-input"
              type="text" value={separator} maxLength={3}
              onChange={e => setSeparator(e.target.value)}
              style={{ width: '3rem' }}
            />
          </label>
          <label className="mini-note">
            <input type="checkbox" checked={capitalize} onChange={e => setCapitalize(e.target.checked)} />
            {' '}{t('generator.capitalize')}
          </label>
        </div>
      )}

      <button className="app-btn" onClick={handleGenerate} disabled={gen.loading}>
        {gen.loading ? '…' : t('generator.generate')}
      </button>

      {gen.error && (
        <div className="mini-note" style={{ color: '#ff4d6d', marginTop: '0.5rem' }}>
          {gen.error}
        </div>
      )}

      {generatedText !== null && (
        <div className="generator-output" style={{ marginTop: '0.7rem' }}>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '0.9rem',
              padding: '0.5rem 0.7rem',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '4px',
              wordBreak: 'break-all',
              marginBottom: '0.4rem',
            }}
          >
            {generatedText}
          </div>
          <div className="mini-note">
            {t('generator.entropy')}: <strong>{generatedEntropyBits!.toFixed(1)} bit</strong>
            {' '}· {t('generator.poolLabel')}: {generatedPoolSize}
          </div>
          {onUseInAnalyzer && (
            <button
              className="app-btn"
              style={{ marginTop: '0.4rem', fontSize: '0.8rem' }}
              onClick={() => onUseInAnalyzer(generatedText)}
            >
              {t('generator.useInAnalyzer')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
