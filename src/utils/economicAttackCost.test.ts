import { describe, it, expect } from 'vitest'
import { estimateAttackCost, formatCost, costClass, type CostEstimate } from './economicAttackCost'

// ── estimateAttackCost ────────────────────────────────────────────────────────

describe('estimateAttackCost — applicable:false cases', () => {
  it('returns n/a when costPerHour is undefined', () => {
    const e = estimateAttackCost(1e9, 1e9, undefined)
    expect(e.applicable).toBe(false)
    expect(e.amount).toBe(0)
  })

  it('returns n/a when costPerHour is 0', () => {
    expect(estimateAttackCost(1e9, 1e9, 0).applicable).toBe(false)
  })

  it('returns n/a when costPerHour is negative', () => {
    expect(estimateAttackCost(1e9, 1e9, -1).applicable).toBe(false)
  })

  it('returns n/a when costPerHour is NaN', () => {
    expect(estimateAttackCost(1e9, 1e9, NaN).applicable).toBe(false)
  })

  it('returns n/a when costPerHour is Infinity', () => {
    expect(estimateAttackCost(1e9, 1e9, Infinity).applicable).toBe(false)
  })

  it('returns n/a when rate is 0', () => {
    expect(estimateAttackCost(1e9, 0, 1.0).applicable).toBe(false)
  })

  it('returns n/a when rate is negative', () => {
    expect(estimateAttackCost(1e9, -1, 1.0).applicable).toBe(false)
  })

  it('returns n/a when rate is Infinity', () => {
    expect(estimateAttackCost(1e9, Infinity, 1.0).applicable).toBe(false)
  })

  it('returns n/a when rate is NaN', () => {
    expect(estimateAttackCost(1e9, NaN, 1.0).applicable).toBe(false)
  })

  it('propagates currency even when not applicable', () => {
    const e = estimateAttackCost(1e9, 1e9, undefined, 'EUR')
    expect(e.currency).toBe('EUR')
  })
})

describe('estimateAttackCost — correct calculation', () => {
  it('known case: 1e9 guesses @ 1Gh/s (1 s) × $3.6/h = $0.001', () => {
    // hours = 1e9 / 1e9 / 3600 = 1/3600; cost = 1/3600 * 3.6 = 0.001
    const e = estimateAttackCost(1e9, 1e9, 3.6, 'USD')
    expect(e.applicable).toBe(true)
    expect(e.amount).toBeCloseTo(0.001, 6)
    expect(e.currency).toBe('USD')
  })

  it('password123 (guesses≈10) @ 4e10/s × $0.50/h ≈ practically zero', () => {
    // hours = 10/(4e10)/3600 ≈ 6.94e-14; cost ≈ 3.47e-14
    const e = estimateAttackCost(10, 4e10, 0.50)
    expect(e.applicable).toBe(true)
    expect(e.amount).toBeLessThan(1e-10)
  })

  it('strong password (5e28 guesses) @ 2e11/s × $3/h → astronomically large', () => {
    const e = estimateAttackCost(5e28, 2e11, 3.0)
    expect(e.applicable).toBe(true)
    // hours ≈ 5e28/(2e11)/3600 ≈ 6.94e13; cost ≈ 2.08e14
    expect(e.amount).toBeGreaterThan(1e13)
  })

  it('uses USD by default', () => {
    const e = estimateAttackCost(1e9, 1e9, 1.0)
    expect(e.currency).toBe('USD')
  })

  it('uses EUR when specified', () => {
    const e = estimateAttackCost(1e9, 1e9, 1.0, 'EUR')
    expect(e.currency).toBe('EUR')
  })

  it('cost scales linearly with guesses', () => {
    const e1 = estimateAttackCost(1e6, 1e9, 1.0)
    const e2 = estimateAttackCost(2e6, 1e9, 1.0)
    expect(e2.amount).toBeCloseTo(e1.amount * 2, 10)
  })

  it('cost scales inversely with rate', () => {
    const e1 = estimateAttackCost(1e9, 1e9, 1.0)
    const e2 = estimateAttackCost(1e9, 2e9, 1.0)
    expect(e2.amount).toBeCloseTo(e1.amount / 2, 10)
  })

  it('cost scales linearly with costPerHour', () => {
    const e1 = estimateAttackCost(1e9, 1e9, 1.0)
    const e2 = estimateAttackCost(1e9, 1e9, 2.0)
    expect(e2.amount).toBeCloseTo(e1.amount * 2, 10)
  })
})

// ── formatCost ────────────────────────────────────────────────────────────────

const na: CostEstimate = { amount: 0, currency: 'USD', applicable: false }
const usd = (amt: number): CostEstimate => ({ amount: amt, currency: 'USD', applicable: true })
const eur = (amt: number): CostEstimate => ({ amount: amt, currency: 'EUR', applicable: true })

describe('formatCost — not applicable / invalid inputs', () => {
  it('applicable:false → "n/a"', () => {
    expect(formatCost(na)).toBe('n/a')
  })

  it('NaN amount → "n/a"', () => {
    expect(formatCost({ amount: NaN, currency: 'USD', applicable: true })).toBe('n/a')
  })

  it('negative amount → "n/a"', () => {
    expect(formatCost({ amount: -1, currency: 'USD', applicable: true })).toBe('n/a')
  })

  it('Infinity → "not economically feasible"', () => {
    expect(formatCost({ amount: Infinity, currency: 'USD', applicable: true })).toBe('not economically feasible')
  })
})

describe('formatCost — boundary values', () => {
  it('0 → "< $0.01"', () => {
    expect(formatCost(usd(0))).toBe('< $0.01')
  })

  it('0.005 → "< $0.01"', () => {
    expect(formatCost(usd(0.005))).toBe('< $0.01')
  })

  it('exactly 0.01 → "$0.01"', () => {
    // 0.01 is NOT < 0.01, hits the < 1 branch: toFixed(2)
    expect(formatCost(usd(0.01))).toBe('$0.01')
  })

  it('0.42 → "$0.42"', () => {
    expect(formatCost(usd(0.42))).toBe('$0.42')
  })

  it('0.99 → "$0.99"', () => {
    expect(formatCost(usd(0.99))).toBe('$0.99')
  })

  it('1.0 → "$1.00" (< 10, toFixed(2))', () => {
    expect(formatCost(usd(1.0))).toBe('$1.00')
  })

  it('5.5 → "$5.50"', () => {
    expect(formatCost(usd(5.5))).toBe('$5.50')
  })

  it('9.99 → "$9.99"', () => {
    expect(formatCost(usd(9.99))).toBe('$9.99')
  })

  it('exactly 10 → "$10" (>= 10, toFixed(0))', () => {
    expect(formatCost(usd(10))).toBe('$10')
  })

  it('87.5 → "$88"', () => {
    expect(formatCost(usd(87.5))).toBe('$88')
  })

  it('999 → "$999"', () => {
    expect(formatCost(usd(999))).toBe('$999')
  })

  it('exactly 1000 → "$1.0K"', () => {
    expect(formatCost(usd(1000))).toBe('$1.0K')
  })

  it('12_345 → "$12.3K"', () => {
    expect(formatCost(usd(12_345))).toBe('$12.3K')
  })

  it('1e6 → "$1.0M"', () => {
    expect(formatCost(usd(1e6))).toBe('$1.0M')
  })

  it('45.7e6 → "$45.7M"', () => {
    expect(formatCost(usd(45.7e6))).toBe('$45.7M')
  })

  it('1e9 → "$1.0B"', () => {
    expect(formatCost(usd(1e9))).toBe('$1.0B')
  })

  it('3.1e9 → "$3.1B"', () => {
    expect(formatCost(usd(3.1e9))).toBe('$3.1B')
  })

  it('1e12 → "$1.0T+"', () => {
    expect(formatCost(usd(1e12))).toBe('$1.0T+')
  })

  it('2e14 → "$200.0T+"', () => {
    expect(formatCost(usd(2e14))).toBe('$200.0T+')
  })

  it('1e18 (threshold) → "not economically feasible"', () => {
    expect(formatCost(usd(1e18))).toBe('not economically feasible')
  })

  it('1e20 → "not economically feasible"', () => {
    expect(formatCost(usd(1e20))).toBe('not economically feasible')
  })
})

describe('formatCost — currency symbol', () => {
  it('USD uses $ symbol', () => {
    expect(formatCost(usd(5))).toMatch(/^\$/)
  })

  it('EUR uses € symbol', () => {
    expect(formatCost(eur(5))).toMatch(/^€/)
  })

  it('EUR < 0.01 threshold', () => {
    expect(formatCost(eur(0.001))).toBe('< €0.01')
  })
})

// ── costClass ─────────────────────────────────────────────────────────────────

describe('costClass', () => {
  it('not applicable → ""', () => {
    expect(costClass(na)).toBe('')
  })

  it('$0 → "danger"', () => {
    expect(costClass(usd(0))).toBe('danger')
  })

  it('$9.99 → "danger"', () => {
    expect(costClass(usd(9.99))).toBe('danger')
  })

  it('$10 (threshold) → "warning"', () => {
    expect(costClass(usd(10))).toBe('warning')
  })

  it('$500 → "warning"', () => {
    expect(costClass(usd(500))).toBe('warning')
  })

  it('$9_999 → "warning"', () => {
    expect(costClass(usd(9_999))).toBe('warning')
  })

  it('$10_000 (threshold) → "caution"', () => {
    expect(costClass(usd(10_000))).toBe('caution')
  })

  it('$50_000 → "caution"', () => {
    expect(costClass(usd(50_000))).toBe('caution')
  })

  it('$9_999_999 → "caution"', () => {
    expect(costClass(usd(9_999_999))).toBe('caution')
  })

  it('$10_000_000 (threshold) → "safe"', () => {
    expect(costClass(usd(10_000_000))).toBe('safe')
  })

  it('$1e18 → "safe"', () => {
    // formatCost labels this "not economically feasible"; costClass has no upper bound and still returns 'safe'
    expect(costClass(usd(1e18))).toBe('safe')
  })

  // Boundary exactness
  it('danger/warning boundary: $10 - epsilon → danger', () => {
    expect(costClass(usd(9.999))).toBe('danger')
  })

  it('warning/caution boundary: $10_000 - epsilon → warning', () => {
    expect(costClass(usd(9_999.99))).toBe('warning')
  })

  it('caution/safe boundary: $10_000_000 - epsilon → caution', () => {
    expect(costClass(usd(9_999_999.99))).toBe('caution')
  })
})

// ── integration: estimateAttackCost → formatCost / costClass ─────────────────

describe('estimateAttackCost → formatCost / costClass integration', () => {
  it('online_throttled (no costPerHour) → n/a, no class', () => {
    const e = estimateAttackCost(1e6, 100, undefined)
    expect(formatCost(e)).toBe('n/a')
    expect(costClass(e)).toBe('')
  })

  it('fast password (1e6 guesses @ 4e10/s × $0.50) → "< $0.01", danger', () => {
    // hours = 1e6/(4e10)/3600 ≈ 6.9e-12; cost ≈ 3.5e-12
    const e = estimateAttackCost(1e6, 4e10, 0.50)
    expect(formatCost(e)).toBe('< $0.01')
    expect(costClass(e)).toBe('danger')
  })

  it('medium password (~1e8 guesses @ 1e10/s × $0.50) → "< $0.01", danger', () => {
    const e = estimateAttackCost(1e8, 1e10, 0.50)
    expect(formatCost(e)).toBe('< $0.01')
    expect(costClass(e)).toBe('danger')
  })

  it('strong 16-char password (5e28 guesses @ 2e11/s × $3) → T+, safe', () => {
    // hours ≈ 5e28/(2e11)/3600 ≈ 6.94e13; cost ≈ $2.08e14
    // 1e12 ≤ 2.08e14 < 1e18 → "$208.3T+"; costClass: 2e14 >> 1e7 → safe
    const e = estimateAttackCost(5e28, 2e11, 3.0)
    expect(formatCost(e)).toMatch(/T\+$/)
    expect(costClass(e)).toBe('safe')
  })

  it('motivated-attacker password (~$500 estimate) → warning class', () => {
    // cost = (1.44e17 / 4e10 / 3600) × 0.50 = 1000h × 0.50 = $500 → warning
    const e = estimateAttackCost(1.44e17, 4e10, 0.50)
    expect(costClass(e)).toBe('warning')
    expect(formatCost(e)).toMatch(/^\$/)
  })

  it('state-level attack ($500K estimate) → caution class', () => {
    // cost = (guesses/rate/3600) × $/h; want ~$500K
    // hours = 500000 / 3.0 ≈ 166667h; guesses = 166667 * 3600 * 1e9 = ~6e17
    const e = estimateAttackCost(6e17, 1e9, 3.0)
    expect(costClass(e)).toBe('caution')
  })
})
