import { describe, it, expect } from 'vitest'
import { projectCrackTime, generateProjectionSeries, yearsUntilCrackableIn } from './mooreProjection'

// ── projectCrackTime ──────────────────────────────────────────────────────────

describe('projectCrackTime — rate growth formula', () => {
  it('at t=0 the rate equals baseRate', () => {
    const p = projectCrackTime({ guesses: 1e12, baseRate: 1e10, yearsFromNow: 0 })
    expect(p.projectedRate).toBe(1e10)
  })

  it('at t=N (default 2 yrs) the rate doubles', () => {
    const p = projectCrackTime({ guesses: 1e12, baseRate: 1e10, yearsFromNow: 2 })
    expect(p.projectedRate).toBeCloseTo(2e10)
  })

  it('at t=2N (4 yrs) the rate quadruples', () => {
    const p = projectCrackTime({ guesses: 1, baseRate: 1, yearsFromNow: 4 })
    expect(p.projectedRate).toBeCloseTo(4)
  })

  it('at t=6.644 yrs the rate is ≈10× baseRate (2^(6.644/2) ≈ 10)', () => {
    // 2^(6.644/2) = 2^3.322 ≈ 10.0
    const p = projectCrackTime({ guesses: 1, baseRate: 1, yearsFromNow: 6.644 })
    expect(p.projectedRate).toBeCloseTo(10, 0)
  })

  it('at t=10 yrs the rate is 32× baseRate (2^5 = 32)', () => {
    const p = projectCrackTime({ guesses: 1e12, baseRate: 1e10, yearsFromNow: 10 })
    expect(p.projectedRate).toBeCloseTo(32e10)
  })

  it('at t=20 yrs the rate is 1024× baseRate (2^10 = 1024)', () => {
    const p = projectCrackTime({ guesses: 1e12, baseRate: 1e10, yearsFromNow: 20 })
    expect(p.projectedRate).toBeCloseTo(1024e10)
  })

  it('custom doublingPeriodYears=1 doubles rate each year', () => {
    const p = projectCrackTime({ guesses: 1, baseRate: 1, yearsFromNow: 1, doublingPeriodYears: 1 })
    expect(p.projectedRate).toBeCloseTo(2)
  })
})

describe('projectCrackTime — crack time calculation', () => {
  it('at t=0: crackSeconds = guesses / baseRate', () => {
    const p = projectCrackTime({ guesses: 1e12, baseRate: 1e10, yearsFromNow: 0 })
    expect(p.crackSeconds).toBeCloseTo(100)
  })

  it('at t=2: crackSeconds halves (rate doubled)', () => {
    const p = projectCrackTime({ guesses: 1e12, baseRate: 1e10, yearsFromNow: 2 })
    expect(p.crackSeconds).toBeCloseTo(50)
  })

  it('at t=10: crackSeconds ≈ 3.125 s (from spec example)', () => {
    // rate = 32e10, time = 1e12/32e10 = 3.125
    const p = projectCrackTime({ guesses: 1e12, baseRate: 1e10, yearsFromNow: 10 })
    expect(p.crackSeconds).toBeCloseTo(3.125)
  })

  it('at t=20: crackSeconds ≈ 0.098 s (from spec example)', () => {
    // rate = 1024e10, time = 1e12/1024e10 ≈ 0.09766
    const p = projectCrackTime({ guesses: 1e12, baseRate: 1e10, yearsFromNow: 20 })
    expect(p.crackSeconds).toBeCloseTo(0.0977, 3)
  })

  it('yearsFromNow is preserved in output', () => {
    const p = projectCrackTime({ guesses: 1, baseRate: 1, yearsFromNow: 7 })
    expect(p.yearsFromNow).toBe(7)
  })
})

describe('projectCrackTime — projected cost', () => {
  it('projectedCost is undefined when costPerHour not provided', () => {
    const p = projectCrackTime({ guesses: 1e9, baseRate: 1e9, yearsFromNow: 0 })
    expect(p.projectedCost).toBeUndefined()
  })

  it('projectedCost is undefined when costPerHour is 0', () => {
    const p = projectCrackTime({ guesses: 1e9, baseRate: 1e9, costPerHour: 0, yearsFromNow: 0 })
    expect(p.projectedCost).toBeUndefined()
  })

  it('projectedCost at t=0: (guesses/rate/3600) × costPerHour', () => {
    // crackSeconds = 3600 → hours = 1 → cost = 1 × 2.0 = $2
    const p = projectCrackTime({ guesses: 3600, baseRate: 1, costPerHour: 2.0, yearsFromNow: 0 })
    expect(p.projectedCost).toBeCloseTo(2.0)
  })

  it('projectedCost halves as rate doubles (t=2)', () => {
    const p0 = projectCrackTime({ guesses: 1e9, baseRate: 1e9, costPerHour: 1.0, yearsFromNow: 0 })
    const p2 = projectCrackTime({ guesses: 1e9, baseRate: 1e9, costPerHour: 1.0, yearsFromNow: 2 })
    expect(p2.projectedCost!).toBeCloseTo(p0.projectedCost! / 2)
  })
})

// ── generateProjectionSeries ──────────────────────────────────────────────────

describe('generateProjectionSeries', () => {
  it('returns 6 points with the default year horizons', () => {
    const series = generateProjectionSeries(1e12, 1e10)
    expect(series).toHaveLength(6)
    expect(series.map(p => p.yearsFromNow)).toEqual([0, 2, 5, 10, 15, 20])
  })

  it('respects custom years array', () => {
    const series = generateProjectionSeries(1e12, 1e10, undefined, [0, 1, 2])
    expect(series).toHaveLength(3)
    expect(series[1].yearsFromNow).toBe(1)
  })

  it('t=0 point has projectedRate = baseRate', () => {
    const series = generateProjectionSeries(1e12, 1e10)
    expect(series[0].projectedRate).toBe(1e10)
  })

  it('projectedCost is undefined for all points when costPerHour omitted', () => {
    const series = generateProjectionSeries(1e12, 1e10)
    for (const p of series) {
      expect(p.projectedCost).toBeUndefined()
    }
  })

  it('projectedCost is defined for all points when costPerHour provided', () => {
    const series = generateProjectionSeries(1e12, 1e10, 1.0)
    for (const p of series) {
      expect(p.projectedCost).toBeDefined()
    }
  })

  it('crack times are monotonically decreasing over time', () => {
    const series = generateProjectionSeries(1e12, 1e10)
    for (let i = 1; i < series.length; i++) {
      expect(series[i].crackSeconds).toBeLessThan(series[i - 1].crackSeconds)
    }
  })

  it('rates are monotonically increasing over time', () => {
    const series = generateProjectionSeries(1e12, 1e10)
    for (let i = 1; i < series.length; i++) {
      expect(series[i].projectedRate).toBeGreaterThan(series[i - 1].projectedRate)
    }
  })
})

// ── yearsUntilCrackableIn ─────────────────────────────────────────────────────

describe('yearsUntilCrackableIn — already crackable', () => {
  it('returns 0 when ratio ≤ 1 (already crackable within targetSeconds)', () => {
    // guesses=10, rate=100, target=1 → ratio=0.1 ≤ 1 → 0
    expect(yearsUntilCrackableIn(10, 100, 1)).toBe(0)
  })

  it('returns 0 when exactly at threshold (ratio = 1)', () => {
    // guesses=100, rate=100, target=1 → ratio=1 ≤ 1 → 0
    expect(yearsUntilCrackableIn(100, 100, 1)).toBe(0)
  })

  it('returns 0 for 0 guesses', () => {
    expect(yearsUntilCrackableIn(0, 1e10, 60)).toBe(0)
  })
})

describe('yearsUntilCrackableIn — known numerical case', () => {
  it('spec example: 1e12 guesses @ 1e10/s → crackable in 60s in ≈1.47 yrs', () => {
    // N × log₂(1e12 / (1e10 × 60)) = 2 × log₂(1.667) = 2 × 0.737 = 1.474
    const y = yearsUntilCrackableIn(1e12, 1e10, 60)
    expect(y).toBeCloseTo(1.47, 1)
  })

  it('crackable in 1 hour: 1e12 guesses @ 1e10/s', () => {
    // ratio = 1e12/(1e10 × 3600) = 1e12/3.6e13 ≈ 0.0278 → already crackable → 0
    const y = yearsUntilCrackableIn(1e12, 1e10, 3600)
    expect(y).toBe(0) // already takes 100s (< 3600s)
  })

  it('1e20 guesses @ 1e10/s → crackable in 1h after ≈42.8 yrs', () => {
    // ratio = 1e20/(1e10 × 3600) = 1e20/3.6e13 ≈ 2.78e6
    // years = 2 × log2(2.78e6) = 2 × 21.407 ≈ 42.8
    const y = yearsUntilCrackableIn(1e20, 1e10, 3600)
    expect(y).toBeCloseTo(42.8, 0)
  })

  it('inverse is consistent with forward projection', () => {
    const guesses = 1e14
    const baseRate = 1e10
    const target = 60

    const years = yearsUntilCrackableIn(guesses, baseRate, target)!
    const p = projectCrackTime({ guesses, baseRate, yearsFromNow: years })
    // At `years` from now, crackSeconds should equal targetSeconds
    expect(p.crackSeconds).toBeCloseTo(target, 1)
  })
})

describe('yearsUntilCrackableIn — edge cases', () => {
  it('returns null for Infinity guesses (rate can never catch up)', () => {
    // log2(Inf) = Inf, !isFinite → null
    expect(yearsUntilCrackableIn(Infinity, 1e10, 60)).toBeNull()
  })

  it('returns null when baseRate=0 (ratio=Inf/NaN → not finite)', () => {
    // ratio = guesses/(0 × target) = Infinity; log2(Infinity) = Infinity → null
    expect(yearsUntilCrackableIn(1e12, 0, 60)).toBeNull()
  })

  it('custom doublingPeriodYears=1 gives half the years vs default 2', () => {
    const y2 = yearsUntilCrackableIn(1e14, 1e10, 60, 2)!
    const y1 = yearsUntilCrackableIn(1e14, 1e10, 60, 1)!
    expect(y1).toBeCloseTo(y2 / 2, 3)
  })

  it('longer target means fewer years needed (easier threshold)', () => {
    const y60 = yearsUntilCrackableIn(1e14, 1e10, 60)!
    const y3600 = yearsUntilCrackableIn(1e14, 1e10, 3600)!
    // Crackable in 1h is easier threshold → fewer years needed
    expect(y3600).toBeLessThan(y60)
  })
})
