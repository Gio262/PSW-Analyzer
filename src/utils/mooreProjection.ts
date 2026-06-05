const DOUBLING_PERIOD_YEARS = 2 // Moore's law: hashrate doubles every ~2 years for GPU cracking

export interface ProjectionPoint {
  yearsFromNow: number
  /** Effective hash rate after Moore scaling */
  projectedRate: number
  /** Crack time in seconds at this future point */
  crackSeconds: number
  /** Economic cost at this point (USD/EUR); undefined when costPerHour not provided */
  projectedCost?: number
}

/**
 * Projects crack time and cost at a given number of years from now,
 * assuming exponential hardware growth: rate(t) = baseRate × 2^(t / N).
 */
export function projectCrackTime(options: {
  guesses: number
  baseRate: number
  costPerHour?: number
  yearsFromNow: number
  doublingPeriodYears?: number
}): ProjectionPoint {
  const {
    guesses,
    baseRate,
    costPerHour,
    yearsFromNow,
    doublingPeriodYears = DOUBLING_PERIOD_YEARS,
  } = options

  const projectedRate = baseRate * Math.pow(2, yearsFromNow / doublingPeriodYears)
  const crackSeconds = guesses / projectedRate

  let projectedCost: number | undefined
  if (costPerHour !== undefined && costPerHour > 0) {
    projectedCost = (crackSeconds / 3600) * costPerHour
  }

  return { yearsFromNow, projectedRate, crackSeconds, projectedCost }
}

/**
 * Generates a series of ProjectionPoints for charting.
 * Default horizons: 0, 2, 5, 10, 15, 20 years.
 */
export function generateProjectionSeries(
  guesses: number,
  baseRate: number,
  costPerHour?: number,
  years: number[] = [0, 2, 5, 10, 15, 20],
): ProjectionPoint[] {
  return years.map(y => projectCrackTime({ guesses, baseRate, costPerHour, yearsFromNow: y }))
}

/**
 * Returns how many years from now the password will be crackable within
 * `targetSeconds`, given Moore-scaling hardware.
 *
 * Formula (inverse of rate growth):
 *   t = N × log₂(guesses / (baseRate × targetSeconds))
 *
 * Returns 0 if already crackable within targetSeconds today.
 * Returns null if the result is not finite (password is asymptotically secure).
 */
export function yearsUntilCrackableIn(
  guesses: number,
  baseRate: number,
  targetSeconds: number,
  doublingPeriodYears: number = DOUBLING_PERIOD_YEARS,
): number | null {
  const ratio = guesses / (baseRate * targetSeconds)
  if (ratio <= 1) return 0
  const years = doublingPeriodYears * Math.log2(ratio)
  if (!Number.isFinite(years)) return null
  return years
}
