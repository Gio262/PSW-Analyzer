import type { KeyboardLayoutDefinition } from '../constants/keyboardLayouts'

type Neighbor = string | null
export type AdjacencyGraph = Record<string, Neighbor[]>

interface KeyPosition {
  chars: string[]
  x: number
  y: number
}

/**
 * Parses a raw key definition string into individual characters/codepoints.
 * Convention: "base_char shift_char" (space-separated). Examples:
 *   'q'   → ['q']
 *   '1!'  → ['1', '!']
 *   'è é' → ['è', 'é']
 *   'й Й' → ['й', 'Й']
 *
 * Strips ASCII whitespace AND Unicode format characters (U+200B–U+200F, U+FEFF)
 * such as ZWNJ (U+200C) and ZWJ (U+200D) that appear in RTL keyboard definitions
 * (Farsi layouts). Without stripping, those invisible codepoints would be silently
 * registered as separate graph entries that never match any typed character.
 */
function parseKey(raw: string): string[] {
  const FORMAT_CPS = new Set([0x200B, 0x200C, 0x200D, 0x200E, 0x200F, 0xFEFF])
  return Array.from(raw).filter(ch => {
    const cp = ch.codePointAt(0) ?? 0
    // cp <= 32 covers space, tab, CR, LF; FORMAT_CPS covers Unicode format chars
    // (ZWSP, ZWNJ, ZWJ, LRM, RLM, BOM) that appear in Farsi layout definitions.
    return cp > 32 && !FORMAT_CPS.has(cp)
  })
}

/**
 * The 6 neighbor directions for a staggered (non-ortholinear) keyboard.
 * Physical stagger means diagonals are offset ±0.5 key units per row.
 *
 * Slot order: [left, upper-left, upper-right, right, lower-right, lower-left]
 * This matches the convention used by zxcvbn-ts adjacency graphs.
 */
const NEIGHBOR_OFFSETS = [
  { dx: -1, dy: 0, slot: 0 },    // left
  { dx: -0.5, dy: -1, slot: 1 }, // upper-left
  { dx: 0.5, dy: -1, slot: 2 },  // upper-right
  { dx: 1, dy: 0, slot: 3 },     // right
  { dx: 0.5, dy: 1, slot: 4 },   // lower-right
  { dx: -0.5, dy: 1, slot: 5 },  // lower-left
] as const

/**
 * Tolerance for horizontal coordinate matching (in key units).
 * Staggered rows don't align perfectly — we accept neighbors within 0.35 key
 * widths of the expected diagonal position. Derived from the fact that the
 * smallest row-to-row stagger increment used (0.25) creates a worst-case
 * horizontal miss of 0.25 units, well within this tolerance.
 */
const TOLERANCE = 0.35

/**
 * Converts a KeyboardLayoutDefinition (physical key matrix) into the adjacency
 * graph format expected by zxcvbn-ts: Record<char, (string|null)[]>.
 *
 * Each entry maps a character to its 6 directional neighbors. The neighbor
 * value is the full key string (base + shift chars joined), or null if no key
 * exists in that direction.
 */
export function buildAdjacencyGraph(layout: KeyboardLayoutDefinition): AdjacencyGraph {
  if (layout.rowOffsets.length < layout.rows.length) {
    throw new Error(
      `Layout "${layout.id}": rowOffsets.length (${layout.rowOffsets.length}) < rows.length (${layout.rows.length})`,
    )
  }

  const positions: KeyPosition[] = []
  layout.rows.forEach((row, rowIdx) => {
    const offset = layout.rowOffsets[rowIdx] ?? 0
    row.forEach((keyRaw, colIdx) => {
      positions.push({
        chars: parseKey(keyRaw),
        x: colIdx + offset,
        y: rowIdx,
      })
    })
  })

  const graph: AdjacencyGraph = {}

  for (const pos of positions) {
    for (const char of pos.chars) {
      if (graph[char] !== undefined) continue // first occurrence wins

      const neighbors: Neighbor[] = [null, null, null, null, null, null]

      for (const offset of NEIGHBOR_OFFSETS) {
        const targetX = pos.x + offset.dx
        const targetY = pos.y + offset.dy

        const neighbor = positions.find(
          p => p.y === targetY && Math.abs(p.x - targetX) < TOLERANCE,
        )
        if (neighbor) {
          // Neighbor value = all chars of that key joined (e.g. '1!' for the 1/! key)
          neighbors[offset.slot] = neighbor.chars.join('')
        }
      }

      graph[char] = neighbors
    }
  }

  return graph
}

/**
 * Merges multiple adjacency graphs into one. When the same character appears
 * in more than one graph, the first occurrence wins (priority by argument order).
 */
export function mergeAdjacencyGraphs(graphs: AdjacencyGraph[]): AdjacencyGraph {
  const merged: AdjacencyGraph = {}
  for (const g of graphs) {
    for (const [char, neighbors] of Object.entries(g)) {
      if (!(char in merged)) {
        merged[char] = neighbors
      }
    }
  }
  return merged
}
