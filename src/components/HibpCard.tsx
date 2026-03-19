interface HibpCardProps {
  title: string
  buttonLabel: string
  message: string
  resultClass: string
  disabled: boolean
  consentAccepted: boolean
  consentLabel: string
  noteLine1: string
  noteLine2: string
  onConsentChange: (value: boolean) => void
  onCheck: () => void
}

export function HibpCard({
  title,
  buttonLabel,
  message,
  resultClass,
  disabled,
  consentAccepted,
  consentLabel,
  noteLine1,
  noteLine2,
  onConsentChange,
  onCheck,
}: HibpCardProps) {
  return (
    <div className="card">
      <div className="card-title"><span>//</span> {title}</div>
      <label className="mini-note" style={{ display: 'block', marginBottom: '0.5rem' }}>
        <input
          type="checkbox"
          checked={consentAccepted}
          onChange={(event) => onConsentChange(event.target.checked)}
          style={{ marginRight: '0.4rem' }}
        />
        {consentLabel}
      </label>
      <div className="hibp-row">
        <button className="btn-hibp" type="button" disabled={disabled} onClick={onCheck}>
          {buttonLabel}
        </button>
        <span className={resultClass} aria-live="polite">
          {message}
        </span>
      </div>
      <div className="hibp-note">
        <div>{noteLine1}</div>
        <div>{noteLine2}</div>
      </div>
    </div>
  )
}
