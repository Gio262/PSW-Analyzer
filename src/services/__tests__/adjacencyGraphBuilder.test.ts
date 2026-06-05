import { describe, it, expect } from 'vitest'
import { buildAdjacencyGraph, mergeAdjacencyGraphs } from '../adjacencyGraphBuilder'
import { KEYBOARD_LAYOUTS } from '../../constants/keyboardLayouts'

// ── Helpers ──────────────────────────────────────────────────────────────────

function layout(id: string) {
  const l = KEYBOARD_LAYOUTS.find(x => x.id === id)
  if (!l) throw new Error(`Layout not found: ${id}`)
  return l
}

// ── buildAdjacencyGraph — structural tests ────────────────────────────────────

describe('buildAdjacencyGraph — QWERTY-IT', () => {
  const graph = buildAdjacencyGraph(layout('qwerty-it'))

  it('builds a non-empty graph', () => {
    expect(Object.keys(graph).length).toBeGreaterThan(30)
  })

  it('each entry has exactly 6 neighbor slots', () => {
    for (const neighbors of Object.values(graph)) {
      expect(neighbors).toHaveLength(6)
    }
  })

  it('"q" is present', () => {
    expect(graph['q']).toBeDefined()
  })

  it('"w" is the right (slot 3) neighbor of "q"', () => {
    // q col=0,row=1 x=0.5 ; w col=1,row=1 x=1.5 → dx=+1 → slot 3
    expect(graph['q']![3]).toContain('w')
  })

  it('"a" is the lower-right (slot 4) neighbor of "q"', () => {
    // q x=0.5,y=1 ; a x=0.75,y=2 → lower-right target x=1.0, dist=0.25 < 0.35
    expect(graph['q']![4]).toContain('a')
  })

  it('"q" is the left (slot 0) neighbor of "w"', () => {
    // w col=1,row=1 x=1.5 ; q x=0.5 → left target x=0.5 → matches
    expect(graph['w']![0]).toContain('q')
  })

  it('"w" is the upper-left (slot 1) neighbor of "s"', () => {
    // s col=1,row=2 x=1.75; upper-left (dx=-0.5,dy=-1) → target x=1.25,y=1
    // Row 1: q(x=0.5), w(x=1.5), e(x=2.5). w at 1.5, dist |1.5-1.25|=0.25 < 0.35 ✓
    expect(graph['s']![1]).toContain('w')
  })

  it('"s" is the lower-right (slot 4) neighbor of "w"', () => {
    // w x=1.5,y=1 ; lower-right target x=2.0,y=2
    // s col=1,row=2: x=1+0.75=1.75, dist |1.75-2.0|=0.25 < 0.35 ✓
    expect(graph['w']![4]).toContain('s')
  })

  it('slot 5 (lower-left) of "q" is null — no key to lower-left of q', () => {
    // q x=0.5,y=1 ; lower-left target x=0,y=2
    // Row 2 col0 = a at x=0.75, dist=0.75 > 0.35 → no match → null
    expect(graph['q']![5]).toBeNull()
  })

  it('number-row keys have no upper neighbors (slots 1 and 2 are null)', () => {
    // Row 0 has no row above it — slots 1 (upper-left) and 2 (upper-right) must be null
    // '\\|' is the col=0 key in IT number row, producing chars '\' and '|'
    const backslashEntry = graph['\\']
    expect(backslashEntry).toBeDefined()
    expect(backslashEntry![1]).toBeNull()
    expect(backslashEntry![2]).toBeNull()
  })

  it('upper-right (slot 2) of "q" contains the correct number-row key', () => {
    // q x=0.5,y=1; upper-right (dx=+0.5,dy=-1) → target x=1.0,y=0
    // Row 0 (offset=0): col1 key '1!' at x=1.0 → dist=0 ✓
    // The neighbor string is the full joined key: '1!'
    expect(graph['q']![2]).toContain('1')
  })

  it('each character of a multi-char key ("1!") is a separate graph entry', () => {
    // parseKey('1!') → ['1', '!'], both should have their own adjacency entries
    expect(graph['1']).toBeDefined()
    expect(graph['!']).toBeDefined()
    // Both entries should point to the same neighbors (same physical key)
    expect(graph['1']).toEqual(graph['!'])
  })
})

describe('buildAdjacencyGraph — JCUKEN-RU', () => {
  const graph = buildAdjacencyGraph(layout('jcuken-ru'))

  it('builds a non-empty graph with Cyrillic keys', () => {
    expect(Object.keys(graph).length).toBeGreaterThan(30)
  })

  it('й (Cyrillic й) is present', () => {
    expect(graph['й']).toBeDefined()
  })

  it('ц is the right (slot 3) neighbor of й', () => {
    // JCUKEN row 1: й(col0,x=0.5) ц(col1,x=1.5) — same structure as QWERTY
    expect(graph['й']![3]).toContain('ц')
  })

  it('ф is the lower-right (slot 4) neighbor of й', () => {
    // й x=0.5,y=1 ; ф col=0,row=2 x=0.75,y=2 → lower-right target x=1.0, dist=0.25 ✓
    expect(graph['й']![4]).toContain('ф')
  })

  it('ш has at least 2 non-null neighbors', () => {
    const neighbors = graph['ш'] ?? []
    const nonNull = neighbors.filter(n => n !== null)
    expect(nonNull.length).toBeGreaterThanOrEqual(2)
  })
})

describe('buildAdjacencyGraph — QWERTY-US', () => {
  const graph = buildAdjacencyGraph(layout('qwerty-us'))

  it('a is the lower-right (slot 4) neighbor of q (same geometry as IT)', () => {
    // QWERTY-US rowOffsets: [0, 0.5, 0.75, 1.25] — same for rows 0-2
    expect(graph['q']![4]).toContain('a')
  })

  it('z is the lower-right (slot 4) neighbor of a', () => {
    // a col=0,row=2 x=0.75; z col=0,row=3 x=0+1.25=1.25 → lower-right target x=1.25, dist=0 ✓
    expect(graph['a']![4]).toContain('z')
  })
})

describe('buildAdjacencyGraph — all layouts non-empty', () => {
  it('every layout produces a graph with > 30 character entries', () => {
    for (const l of KEYBOARD_LAYOUTS) {
      const g = buildAdjacencyGraph(l)
      expect(Object.keys(g).length).toBeGreaterThan(30)
    }
  })

  it('every graph entry has exactly 6 slots', () => {
    for (const l of KEYBOARD_LAYOUTS) {
      const g = buildAdjacencyGraph(l)
      for (const [char, neighbors] of Object.entries(g)) {
        expect(neighbors, `char ${JSON.stringify(char)} in layout ${l.id}`).toHaveLength(6)
      }
    }
  })
})

describe('buildAdjacencyGraph — Dvorak', () => {
  const graph = buildAdjacencyGraph(layout('dvorak'))

  it("apostrophe key (') is present", () => {
    // Dvorak row 1 starts with "'\"" key
    expect(graph["'"]).toBeDefined()
  })

  it("'o' is in Dvorak graph", () => {
    expect(graph['o']).toBeDefined()
  })
})

describe('buildAdjacencyGraph — rowOffsets validation', () => {
  it('throws if rowOffsets is shorter than rows', () => {
    const badLayout = {
      id: 'test', label: '', description: '',
      rows: [['a'], ['b'], ['c']],
      rowOffsets: [0, 0.5],  // only 2 but 3 rows
    }
    expect(() => buildAdjacencyGraph(badLayout)).toThrow(/rowOffsets/)
  })
})

describe('buildAdjacencyGraph — Farsi ISIRI (RTL, ZWNJ/ZWJ chars)', () => {
  const graph = buildAdjacencyGraph(layout('farsi-isiri'))

  it('builds a non-empty graph', () => {
    expect(Object.keys(graph).length).toBeGreaterThan(20)
  })

  it('ZWNJ (U+200C) must NOT appear as a standalone graph key', () => {
    // The farsi-isiri layout contains ZWNJ in some key definitions.
    // parseKey must strip it; if not stripped it would create an invisible entry.
    const zwnj = String.fromCodePoint(0x200C)
    expect(graph[zwnj]).toBeUndefined()
  })

  it('ZWJ (U+200D) must NOT appear as a standalone graph key', () => {
    const zwj = String.fromCodePoint(0x200D)
    expect(graph[zwj]).toBeUndefined()
  })

  it('ض (first key of Farsi QWERTY row) is present', () => {
    expect(graph['ض']).toBeDefined()
  })
})

describe('buildAdjacencyGraph — Farsi Windows (also contains ZWNJ/ZWJ)', () => {
  it('ZWNJ and ZWJ do not appear as graph keys in farsi-windows either', () => {
    const graph = buildAdjacencyGraph(layout('farsi-windows'))
    const zwnj = String.fromCodePoint(0x200C)
    const zwj = String.fromCodePoint(0x200D)
    expect(graph[zwnj]).toBeUndefined()
    expect(graph[zwj]).toBeUndefined()
  })
})

// ── mergeAdjacencyGraphs ──────────────────────────────────────────────────────

describe('mergeAdjacencyGraphs', () => {
  it('returns empty graph for empty input', () => {
    expect(mergeAdjacencyGraphs([])).toEqual({})
  })

  it('returns the single graph unchanged for one-element input', () => {
    const g = buildAdjacencyGraph(layout('qwerty-us'))
    const merged = mergeAdjacencyGraphs([g])
    expect(merged).toEqual(g)
  })

  it('first-occurrence wins when two graphs define the same char', () => {
    const gIt = buildAdjacencyGraph(layout('qwerty-it'))
    const gUs = buildAdjacencyGraph(layout('qwerty-us'))

    // Both graphs define 'q'. Merge IT first.
    const merged = mergeAdjacencyGraphs([gIt, gUs])
    expect(merged['q']).toEqual(gIt['q'])

    // Swap order: US first.
    const mergedUs = mergeAdjacencyGraphs([gUs, gIt])
    expect(mergedUs['q']).toEqual(gUs['q'])
  })

  it('characters unique to the SECOND layout retain their correct neighbor array', () => {
    const gIt = buildAdjacencyGraph(layout('qwerty-it'))
    const gRu = buildAdjacencyGraph(layout('jcuken-ru'))
    const merged = mergeAdjacencyGraphs([gIt, gRu])

    // 'й' exists only in gRu; its neighbor array should be exactly gRu['й']
    expect(merged['й']).toBeDefined()
    expect(merged['й']).toEqual(gRu['й'])
  })

  it('merging three layouts keeps all unique characters', () => {
    const graphs = ['qwerty-us', 'jcuken-ru', 'dubeolsik-kr'].map(id =>
      buildAdjacencyGraph(layout(id)),
    )
    const merged = mergeAdjacencyGraphs(graphs)
    expect(merged['q']).toBeDefined()   // US
    expect(merged['й']).toBeDefined()   // RU
    expect(merged['ㅂ']).toBeDefined()  // KR
  })
})

// ── Symmetry: if A→right=B then B→left=A ──────────────────────────────────────

describe('adjacency symmetry (left/right are mutual)', () => {
  it('if B is the right neighbor of A, then A is the left neighbor of B — QWERTY-IT', () => {
    const graph = buildAdjacencyGraph(layout('qwerty-it'))
    // q→right(slot3)=w and w→left(slot0)=q
    const rightOfQ = graph['q']![3]   // e.g. 'w'
    if (rightOfQ) {
      const firstChar = Array.from(rightOfQ)[0]
      if (firstChar && graph[firstChar]) {
        const leftOfRight = graph[firstChar]![0]
        // The left of w should contain 'q'
        expect(leftOfRight).toContain('q')
      }
    }
  })
})
