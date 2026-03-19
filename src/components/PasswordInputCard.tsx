import type { ChangeEvent } from 'react'

interface PasswordInputCardProps {
  title: string
  placeholder: string
  ariaLabel: string
  showLabel: string
  hideLabel: string
  scoreLabel: string
  password: string
  showPassword: boolean
  scoreText: string
  scoreColor?: string
  strengthStyle: { width: string; background: string }
  onPasswordChange: (e: ChangeEvent<HTMLInputElement>) => void
  onToggleVisibility: () => void
}

export function PasswordInputCard({
  title,
  placeholder,
  ariaLabel,
  showLabel,
  hideLabel,
  scoreLabel,
  password,
  showPassword,
  scoreText,
  scoreColor,
  strengthStyle,
  onPasswordChange,
  onToggleVisibility,
}: PasswordInputCardProps) {
  return (
    <div className="card">
      <div className="card-title"><span>//</span> {title}</div>
      <div className="input-wrap">
        <input
          type={showPassword ? 'text' : 'password'}
          id="pwInput"
          placeholder={placeholder}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label={ariaLabel}
          value={password}
          onChange={onPasswordChange}
        />
        <button
          id="toggleVis"
          type="button"
          title={showPassword ? hideLabel : showLabel}
          aria-label={showPassword ? hideLabel : showLabel}
          aria-pressed={showPassword}
          onClick={onToggleVisibility}
        >
          👁
        </button>
      </div>
      <div className="strength-bar-bg" aria-hidden="true">
        <div className="strength-bar-fill" style={strengthStyle} />
      </div>
      <div className="score-row">
        <span className="score-label">{scoreLabel}</span>
        <span className="score-value" aria-live="polite" style={scoreColor ? { color: scoreColor } : {}}>
          {scoreText}
        </span>
      </div>
    </div>
  )
}
