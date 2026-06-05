import { useEffect, useMemo, useState } from 'react'
import { zxcvbnOptions } from '@zxcvbn-ts/core'
import { adjacencyGraphs as defaultGraphs } from '@zxcvbn-ts/language-common'
import {
  KEYBOARD_LAYOUTS,
  DEFAULT_SELECTED_LAYOUTS,
  type KeyboardLayoutDefinition,
} from '../constants/keyboardLayouts'
import {
  buildAdjacencyGraph,
  mergeAdjacencyGraphs,
} from '../services/adjacencyGraphBuilder'

const STORAGE_KEY = 'psw-analyzer-keyboard-layouts'

function loadSelection(): string[] {
  if (typeof window === 'undefined') return DEFAULT_SELECTED_LAYOUTS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SELECTED_LAYOUTS
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return DEFAULT_SELECTED_LAYOUTS
    const validIds = new Set(KEYBOARD_LAYOUTS.map(l => l.id))
    const filtered = parsed.filter(
      (id): id is string => typeof id === 'string' && validIds.has(id),
    )
    return filtered.length > 0 ? filtered : DEFAULT_SELECTED_LAYOUTS
  } catch {
    return DEFAULT_SELECTED_LAYOUTS
  }
}

function saveSelection(ids: string[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

export function useKeyboardLayouts() {
  const [selectedIds, setSelectedIds] = useState<string[]>(loadSelection)

  /**
   * Build the graphs option for zxcvbnOptions.setOptions.
   *
   * zxcvbn-ts expects: Record<string, AdjacencyGraph>
   * (a named map of graphs, not a raw AdjacencyGraph).
   *
   * We spread defaultGraphs so keypad/mac_keypad PIN detection is preserved,
   * then add a single 'customLayouts' graph that merges all selected layouts.
   * When no layouts are selected, we fall back to defaultGraphs only.
   *
   * BUG IN MD: the original spec passed the AdjacencyGraph directly as `graphs`,
   * causing a type mismatch. The correct form wraps it under a named key.
   */
  const graphsOption = useMemo(() => {
    const selectedLayouts = selectedIds
      .map(id => KEYBOARD_LAYOUTS.find(l => l.id === id))
      .filter((l): l is KeyboardLayoutDefinition => l !== undefined)
      .map(buildAdjacencyGraph)

    if (selectedLayouts.length === 0) return defaultGraphs

    return { ...defaultGraphs, customLayouts: mergeAdjacencyGraphs(selectedLayouts) }
  }, [selectedIds])

  useEffect(() => {
    zxcvbnOptions.setOptions({ graphs: graphsOption })
  }, [graphsOption])

  useEffect(() => {
    saveSelection(selectedIds)
  }, [selectedIds])

  function toggleLayout(id: string): void {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    )
  }

  /** Cache key: forces usePasswordAnalysis to re-run when layout selection changes.
   *  Sorted so that the same set of layouts in different insertion orders produces
   *  the same version string (mergeAdjacencyGraphs result is identical regardless). */
  const layoutsVersion = useMemo(() => [...selectedIds].sort().join('|'), [selectedIds])

  return {
    availableLayouts: KEYBOARD_LAYOUTS,
    selectedIds,
    toggleLayout,
    layoutsVersion,
  }
}
