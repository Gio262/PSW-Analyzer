// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { KeyboardLayoutsCard } from './KeyboardLayoutsCard'
import { KEYBOARD_LAYOUTS, DEFAULT_SELECTED_LAYOUTS } from '../constants/keyboardLayouts'

afterEach(cleanup)

const t = (key: string) => key

// A fresh mock per test — created in beforeEach to prevent call-count bleed.
let mockOnToggle = vi.fn()

beforeEach(() => {
  mockOnToggle = vi.fn()
})

const buildProps = () => ({
  availableLayouts: KEYBOARD_LAYOUTS,
  selectedIds: DEFAULT_SELECTED_LAYOUTS,
  onToggle: mockOnToggle,
  t,
})

// ── analysis-only note ─────────────────────────────────────────────────────

describe('KeyboardLayoutsCard — analysis-only note', () => {
  it('renders the .keyboard-analysis-note box', () => {
    const { container } = render(<KeyboardLayoutsCard {...buildProps()} />)
    const note = container.querySelector('.keyboard-analysis-note')
    expect(note).not.toBeNull()
  })

  it('shows the analysisOnlyNote i18n key text', () => {
    render(<KeyboardLayoutsCard {...buildProps()} />)
    expect(screen.getByText('keyboardLayouts.analysisOnlyNote')).toBeTruthy()
  })

  it('contains the ⓘ icon element', () => {
    const { container } = render(<KeyboardLayoutsCard {...buildProps()} />)
    const icon = container.querySelector('.keyboard-analysis-note__icon')
    expect(icon).not.toBeNull()
    expect(icon!.textContent).toContain('ⓘ')
  })
})

// ── card structure ─────────────────────────────────────────────────────────

describe('KeyboardLayoutsCard — structure', () => {
  it('renders the card title', () => {
    render(<KeyboardLayoutsCard {...buildProps()} />)
    expect(screen.getByText('keyboardLayouts.title')).toBeTruthy()
  })

  it('renders the description', () => {
    render(<KeyboardLayoutsCard {...buildProps()} />)
    expect(screen.getByText('keyboardLayouts.description')).toBeTruthy()
  })

  it('renders all available layouts as checkboxes', () => {
    render(<KeyboardLayoutsCard {...buildProps()} />)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(KEYBOARD_LAYOUTS.length)
  })

  it('qwerty-it (in DEFAULT_SELECTED_LAYOUTS) is checked', () => {
    render(<KeyboardLayoutsCard {...buildProps()} />)
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    const qwertyItIndex = KEYBOARD_LAYOUTS.findIndex(l => l.id === 'qwerty-it')
    expect(checkboxes[qwertyItIndex].checked).toBe(true)
  })

  it('jcuken-ru (not in DEFAULT_SELECTED_LAYOUTS) is unchecked', () => {
    render(<KeyboardLayoutsCard {...buildProps()} />)
    const jcukenIndex = KEYBOARD_LAYOUTS.findIndex(l => l.id === 'jcuken-ru')
    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    expect(checkboxes[jcukenIndex].checked).toBe(false)
  })

  it('layout labels are visible (qwerty-it label present)', () => {
    render(<KeyboardLayoutsCard {...buildProps()} />)
    const qwertyLayout = KEYBOARD_LAYOUTS.find(l => l.id === 'qwerty-it')!
    expect(screen.getByText(qwertyLayout.label)).toBeTruthy()
  })
})

// ── toggle interaction ─────────────────────────────────────────────────────

describe('KeyboardLayoutsCard — toggle interaction', () => {
  it('calls onToggle with the layout id when a checkbox is clicked', () => {
    render(<KeyboardLayoutsCard {...buildProps()} />)
    const firstCheckbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(firstCheckbox)
    expect(mockOnToggle).toHaveBeenCalledWith(KEYBOARD_LAYOUTS[0].id)
  })

  it('calls onToggle exactly once per click', () => {
    render(<KeyboardLayoutsCard {...buildProps()} />)
    const firstCheckbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(firstCheckbox)
    expect(mockOnToggle).toHaveBeenCalledTimes(1)
  })

  it('each layout checkbox is independently clickable', () => {
    render(<KeyboardLayoutsCard {...buildProps()} />)
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[2]) // third layout
    expect(mockOnToggle).toHaveBeenCalledWith(KEYBOARD_LAYOUTS[2].id)
  })
})
