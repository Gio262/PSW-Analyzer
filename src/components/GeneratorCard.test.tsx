// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { GeneratorCard } from './GeneratorCard'

afterEach(cleanup)

// Minimal t() stub — returns the key so tests can assert on it
const t = (key: string) => key

// ── password length slider ─────────────────────────────────────────────────
// Using data-testid to disambiguate from the passphrase wordCount slider.

describe('GeneratorCard — password length slider', () => {
  it('slider has max=50', () => {
    const { getByTestId } = render(<GeneratorCard t={t} />)
    const slider = getByTestId('password-length-slider') as HTMLInputElement
    expect(slider.getAttribute('max')).toBe('50')
  })

  it('slider has min=8', () => {
    const { getByTestId } = render(<GeneratorCard t={t} />)
    const slider = getByTestId('password-length-slider') as HTMLInputElement
    expect(slider.getAttribute('min')).toBe('8')
  })

  it('initial length is 20 (within [8, 50])', () => {
    const { getByTestId } = render(<GeneratorCard t={t} />)
    const slider = getByTestId('password-length-slider') as HTMLInputElement
    const val = Number(slider.value)
    expect(val).toBeGreaterThanOrEqual(8)
    expect(val).toBeLessThanOrEqual(50)
  })
})

// ── mode toggle buttons ────────────────────────────────────────────────────

describe('GeneratorCard — mode toggle buttons', () => {
  it('Password button has aria-pressed=true initially', () => {
    render(<GeneratorCard t={t} />)
    const passwordBtn = screen.getByRole('button', { name: 'generator.modePassword' }) as HTMLButtonElement
    expect(passwordBtn.getAttribute('aria-pressed')).toBe('true')
  })

  it('Passphrase button has aria-pressed=false initially', () => {
    render(<GeneratorCard t={t} />)
    const passphraseBtn = screen.getByRole('button', { name: 'generator.modePassphrase' }) as HTMLButtonElement
    expect(passphraseBtn.getAttribute('aria-pressed')).toBe('false')
  })

  it('Password button has .active class initially', () => {
    render(<GeneratorCard t={t} />)
    const passwordBtn = screen.getByRole('button', { name: 'generator.modePassword' })
    expect(passwordBtn.className).toContain('active')
  })

  it('Passphrase button does NOT have .active class initially', () => {
    render(<GeneratorCard t={t} />)
    const passphraseBtn = screen.getByRole('button', { name: 'generator.modePassphrase' })
    expect(passphraseBtn.className).not.toContain('active')
  })

  it('clicking Passphrase toggles aria-pressed correctly', () => {
    render(<GeneratorCard t={t} />)
    const passwordBtn = screen.getByRole('button', { name: 'generator.modePassword' })
    const passphraseBtn = screen.getByRole('button', { name: 'generator.modePassphrase' })

    fireEvent.click(passphraseBtn)

    expect(passphraseBtn.getAttribute('aria-pressed')).toBe('true')
    expect(passwordBtn.getAttribute('aria-pressed')).toBe('false')
  })

  it('clicking Passphrase moves .active class to Passphrase button', () => {
    render(<GeneratorCard t={t} />)
    const passwordBtn = screen.getByRole('button', { name: 'generator.modePassword' })
    const passphraseBtn = screen.getByRole('button', { name: 'generator.modePassphrase' })

    fireEvent.click(passphraseBtn)

    expect(passphraseBtn.className).toContain('active')
    expect(passwordBtn.className).not.toContain('active')
  })

  it('clicking Password twice leaves Password active', () => {
    render(<GeneratorCard t={t} />)
    const passwordBtn = screen.getByRole('button', { name: 'generator.modePassword' })

    fireEvent.click(passwordBtn)
    fireEvent.click(passwordBtn)

    expect(passwordBtn.getAttribute('aria-pressed')).toBe('true')
  })
})

// ── mode description text ──────────────────────────────────────────────────

describe('GeneratorCard — mode description text', () => {
  it('shows password mode description in password mode', () => {
    render(<GeneratorCard t={t} />)
    expect(screen.getByText('generator.modePasswordDesc')).toBeTruthy()
  })

  it('shows passphrase mode description after switching to passphrase', () => {
    render(<GeneratorCard t={t} />)
    const passphraseBtn = screen.getByRole('button', { name: 'generator.modePassphrase' })
    fireEvent.click(passphraseBtn)
    expect(screen.getByText('generator.modePassphraseDesc')).toBeTruthy()
  })

  it('password description disappears when passphrase mode is active', () => {
    render(<GeneratorCard t={t} />)
    const passphraseBtn = screen.getByRole('button', { name: 'generator.modePassphrase' })
    fireEvent.click(passphraseBtn)
    expect(screen.queryByText('generator.modePasswordDesc')).toBeNull()
  })
})

// ── wordlist selector ──────────────────────────────────────────────────────

describe('GeneratorCard — wordlist selector in passphrase mode', () => {
  function switchToPassphrase() {
    render(<GeneratorCard t={t} />)
    fireEvent.click(screen.getByRole('button', { name: 'generator.modePassphrase' }))
  }

  it('wordlist description shown for default EFF long selection', () => {
    switchToPassphrase()
    expect(screen.getByText('generator.wordlistDesc.effLong')).toBeTruthy()
  })

  it('wordlist select has 3 options', () => {
    switchToPassphrase()
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.options).toHaveLength(3)
  })

  it('selecting EFF short1 changes the wordlist description', () => {
    switchToPassphrase()
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'eff-short1' } })
    expect(screen.getByText('generator.wordlistDesc.effShort1')).toBeTruthy()
    expect(screen.queryByText('generator.wordlistDesc.effLong')).toBeNull()
  })

  it('selecting Reinhold changes the wordlist description', () => {
    switchToPassphrase()
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'reinhold-en' } })
    expect(screen.getByText('generator.wordlistDesc.reinhold')).toBeTruthy()
  })
})

// ── generate button ────────────────────────────────────────────────────────

describe('GeneratorCard — generate button', () => {
  it('generate button is present and has .app-btn class', () => {
    render(<GeneratorCard t={t} />)
    const btn = screen.getByRole('button', { name: 'generator.generate' })
    expect(btn.className).toContain('app-btn')
  })

  it('generate button is not disabled initially', () => {
    render(<GeneratorCard t={t} />)
    const btn = screen.getByRole('button', { name: 'generator.generate' }) as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })

  it('onUseInAnalyzer prop is accepted without errors', () => {
    const onUse = vi.fn()
    render(<GeneratorCard t={t} onUseInAnalyzer={onUse} />)
    expect(screen.getByRole('button', { name: 'generator.generate' })).toBeTruthy()
    expect(onUse).not.toHaveBeenCalled()
  })
})
