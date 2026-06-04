import type { KeyboardLayoutDefinition } from '../constants/keyboardLayouts'

interface KeyboardLayoutsCardProps {
  availableLayouts: KeyboardLayoutDefinition[]
  selectedIds: string[]
  onToggle: (id: string) => void
  t: (key: string, options?: Record<string, unknown>) => string
}

export function KeyboardLayoutsCard({
  availableLayouts,
  selectedIds,
  onToggle,
  t,
}: KeyboardLayoutsCardProps) {
  return (
    <div className="card">
      <div className="card-title">
        <span>//</span> {t('keyboardLayouts.title')}
      </div>
      <div className="mini-note" style={{ marginBottom: '0.6rem' }}>
        {t('keyboardLayouts.description')}
      </div>
      <div className="keyboard-layout-list">
        {availableLayouts.map(layout => {
          const checked = selectedIds.includes(layout.id)
          return (
            <label
              key={layout.id}
              className="keyboard-layout-option"
              style={{ display: 'block', marginBottom: '0.35rem', cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(layout.id)}
                aria-label={layout.label}
                style={{ marginRight: '0.5rem' }}
              />
              <span style={{ fontWeight: checked ? 600 : 400 }}>
                {layout.label}
              </span>
              <span
                className="mini-note"
                style={{ marginLeft: '0.4rem' }}
              >
                — {layout.description}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
