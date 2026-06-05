// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKeyboardLayouts } from './useKeyboardLayouts'
import { DEFAULT_SELECTED_LAYOUTS, KEYBOARD_LAYOUTS } from '../constants/keyboardLayouts'

// ── localStorage isolation ────────────────────────────────────────────────────
beforeEach(() => {
  window.localStorage.clear()
  vi.restoreAllMocks()
})

// ── Initial state ─────────────────────────────────────────────────────────────

describe('useKeyboardLayouts — initial state', () => {
  it('selectedIds defaults to DEFAULT_SELECTED_LAYOUTS when localStorage is empty', () => {
    const { result } = renderHook(() => useKeyboardLayouts())
    expect(result.current.selectedIds).toEqual(DEFAULT_SELECTED_LAYOUTS)
  })

  it('availableLayouts exposes all defined layouts', () => {
    const { result } = renderHook(() => useKeyboardLayouts())
    expect(result.current.availableLayouts).toHaveLength(KEYBOARD_LAYOUTS.length)
    expect(result.current.availableLayouts.map(l => l.id)).toContain('qwerty-it')
    expect(result.current.availableLayouts.map(l => l.id)).toContain('jcuken-ru')
  })

  it('layoutsVersion is derived from sorted selectedIds', () => {
    const { result } = renderHook(() => useKeyboardLayouts())
    const sorted = [...DEFAULT_SELECTED_LAYOUTS].sort().join('|')
    expect(result.current.layoutsVersion).toBe(sorted)
  })
})

// ── toggleLayout ──────────────────────────────────────────────────────────────

describe('useKeyboardLayouts — toggleLayout', () => {
  it('toggles a layout off when it is currently selected', () => {
    const { result } = renderHook(() => useKeyboardLayouts())
    const idToRemove = DEFAULT_SELECTED_LAYOUTS[0]

    act(() => {
      result.current.toggleLayout(idToRemove)
    })

    expect(result.current.selectedIds).not.toContain(idToRemove)
  })

  it('toggles a layout on when it is not currently selected', () => {
    const { result } = renderHook(() => useKeyboardLayouts())
    const idToAdd = 'jcuken-ru'

    // Remove it first if it's already in defaults
    if (result.current.selectedIds.includes(idToAdd)) {
      act(() => { result.current.toggleLayout(idToAdd) })
    }

    expect(result.current.selectedIds).not.toContain(idToAdd)

    act(() => {
      result.current.toggleLayout(idToAdd)
    })

    expect(result.current.selectedIds).toContain(idToAdd)
  })

  it('toggling the same layout twice returns to original state', () => {
    // Guard: azerty-fr must not be in defaults for this test to be meaningful
    expect(DEFAULT_SELECTED_LAYOUTS).not.toContain('azerty-fr')

    const { result } = renderHook(() => useKeyboardLayouts())
    const initial = [...result.current.selectedIds]

    act(() => { result.current.toggleLayout('azerty-fr') })
    act(() => { result.current.toggleLayout('azerty-fr') })

    expect(result.current.selectedIds).toEqual(initial)
  })

  it('toggling an unknown layout ID adds it to selectedIds (no validation — hook is permissive)', () => {
    // The hook does not validate IDs against KEYBOARD_LAYOUTS when toggling.
    // Only localStorage restoration validates. This documents the current behavior.
    const { result } = renderHook(() => useKeyboardLayouts())

    act(() => { result.current.toggleLayout('non-existent-layout') })

    expect(result.current.selectedIds).toContain('non-existent-layout')
  })

  it('can select all available layouts', () => {
    const { result } = renderHook(() => useKeyboardLayouts())

    act(() => {
      for (const l of KEYBOARD_LAYOUTS) {
        if (!result.current.selectedIds.includes(l.id)) {
          result.current.toggleLayout(l.id)
        }
      }
    })

    expect(result.current.selectedIds).toHaveLength(KEYBOARD_LAYOUTS.length)
  })

  it('can deselect all layouts', () => {
    const { result } = renderHook(() => useKeyboardLayouts())

    act(() => {
      for (const id of [...result.current.selectedIds]) {
        result.current.toggleLayout(id)
      }
    })

    expect(result.current.selectedIds).toHaveLength(0)
  })
})

// ── layoutsVersion ────────────────────────────────────────────────────────────

describe('useKeyboardLayouts — layoutsVersion', () => {
  it('changes when a layout is added', () => {
    const { result } = renderHook(() => useKeyboardLayouts())
    const before = result.current.layoutsVersion

    act(() => { result.current.toggleLayout('dvorak') })

    expect(result.current.layoutsVersion).not.toBe(before)
  })

  it('changes when a layout is removed', () => {
    const { result } = renderHook(() => useKeyboardLayouts())
    const before = result.current.layoutsVersion

    act(() => { result.current.toggleLayout(DEFAULT_SELECTED_LAYOUTS[0]) })

    expect(result.current.layoutsVersion).not.toBe(before)
  })

  it('is order-independent: same set in different insertion order → same version', () => {
    const { result: r1 } = renderHook(() => useKeyboardLayouts())
    const { result: r2 } = renderHook(() => useKeyboardLayouts())

    // r1: add dvorak, then azerty
    act(() => { r1.current.toggleLayout('dvorak') })
    act(() => { r1.current.toggleLayout('azerty-fr') })

    // r2: add azerty, then dvorak (reverse order)
    act(() => { r2.current.toggleLayout('azerty-fr') })
    act(() => { r2.current.toggleLayout('dvorak') })

    expect(r1.current.layoutsVersion).toBe(r2.current.layoutsVersion)
  })
})

// ── localStorage persistence ──────────────────────────────────────────────────

describe('useKeyboardLayouts — persistence', () => {
  it('persists selection to localStorage on toggle', () => {
    const { result } = renderHook(() => useKeyboardLayouts())

    act(() => { result.current.toggleLayout('jcuken-ru') })

    const stored = JSON.parse(window.localStorage.getItem('psw-analyzer-keyboard-layouts') ?? '[]')
    expect(stored).toContain('jcuken-ru')
  })

  it('restores persisted selection on mount', () => {
    const persisted = ['dvorak', 'azerty-fr']
    window.localStorage.setItem('psw-analyzer-keyboard-layouts', JSON.stringify(persisted))

    const { result } = renderHook(() => useKeyboardLayouts())

    expect(result.current.selectedIds).toEqual(persisted)
  })

  it('falls back to default when localStorage contains invalid JSON', () => {
    window.localStorage.setItem('psw-analyzer-keyboard-layouts', 'not json')
    const { result } = renderHook(() => useKeyboardLayouts())
    expect(result.current.selectedIds).toEqual(DEFAULT_SELECTED_LAYOUTS)
  })

  it('falls back to default when localStorage contains unknown layout IDs', () => {
    window.localStorage.setItem(
      'psw-analyzer-keyboard-layouts',
      JSON.stringify(['fake-layout-xyz']),
    )
    const { result } = renderHook(() => useKeyboardLayouts())
    expect(result.current.selectedIds).toEqual(DEFAULT_SELECTED_LAYOUTS)
  })

  it('falls back to default when localStorage contains non-array JSON', () => {
    window.localStorage.setItem('psw-analyzer-keyboard-layouts', JSON.stringify({ id: 'qwerty-us' }))
    const { result } = renderHook(() => useKeyboardLayouts())
    expect(result.current.selectedIds).toEqual(DEFAULT_SELECTED_LAYOUTS)
  })

  it('filters out unknown IDs from a partially valid stored array', () => {
    window.localStorage.setItem(
      'psw-analyzer-keyboard-layouts',
      JSON.stringify(['qwerty-us', 'fake-layout-xyz']),
    )
    const { result } = renderHook(() => useKeyboardLayouts())
    expect(result.current.selectedIds).toContain('qwerty-us')
    expect(result.current.selectedIds).not.toContain('fake-layout-xyz')
  })
})
