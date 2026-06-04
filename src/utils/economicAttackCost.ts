const SECONDS_PER_HOUR = 3600

export interface CostEstimate {
  amount: number
  currency: 'USD' | 'EUR'
  /** false for scenarios where a cost per hour is not defined (e.g. online_throttled) */
  applicable: boolean
}

/**
 * Estimates the economic cost of an attack:
 *   cost = (guesses / rate / 3600) × costPerHour
 *        = duration_hours × $/hour
 *
 * Assumes on-demand cloud pricing (attacker pays only for the duration of the attack).
 */
export function estimateAttackCost(
  guesses: number,
  rate: number,
  costPerHour: number | undefined,
  currency: 'USD' | 'EUR' = 'USD',
): CostEstimate {
  if (costPerHour === undefined || !Number.isFinite(costPerHour) || costPerHour <= 0) {
    return { amount: 0, currency, applicable: false }
  }
  if (!Number.isFinite(rate) || rate <= 0) {
    return { amount: 0, currency, applicable: false }
  }

  const hours = guesses / rate / SECONDS_PER_HOUR
  const amount = hours * costPerHour

  return { amount, currency, applicable: true }
}

/**
 * Formats a cost estimate for display:
 *   n/a / NaN / negative  → "n/a"  (Infinity → "not economically feasible" via last branch)
 *   < $0.01               → "< $0.01"
 *   $0.01 – $0.99         → "$0.42"
 *   $1 – $9.99            → "$1.20"  (2 decimals)
 *   $10 – $999            → "$88"    (0 decimals)
 *   $1K – $999K           → "$12.3K"
 *   $1M – $999M           → "$45.7M"
 *   $1B – $999B           → "$3.1B"
 *   $1T – $1e17           → "$2.0T+"
 *   >= $1e18              → "not economically feasible"
 */
export function formatCost(estimate: CostEstimate): string {
  if (!estimate.applicable) return 'n/a'

  const sym = estimate.currency === 'EUR' ? '€' : '$'
  const amt = estimate.amount

  if (Number.isNaN(amt) || amt < 0) return 'n/a'
  if (amt < 0.01) return `< ${sym}0.01`
  if (amt < 1) return `${sym}${amt.toFixed(2)}`
  if (amt < 1000) return `${sym}${amt.toFixed(amt < 10 ? 2 : 0)}`
  if (amt < 1e6) return `${sym}${(amt / 1e3).toFixed(1)}K`
  if (amt < 1e9) return `${sym}${(amt / 1e6).toFixed(1)}M`
  if (amt < 1e12) return `${sym}${(amt / 1e9).toFixed(1)}B`
  if (amt < 1e18) return `${sym}${(amt / 1e12).toFixed(1)}T+`
  return 'not economically feasible'
}

/**
 * Returns a CSS class for the cost amount:
 *   danger  → < $10     (affordable to anyone)
 *   warning → < $10K    (motivated attacker)
 *   caution → < $10M    (nation-state / organised)
 *   safe    → >= $10M   (economically infeasible)
 *   ''      → not applicable
 */
export function costClass(estimate: CostEstimate): string {
  if (!estimate.applicable) return ''
  const amt = estimate.amount
  if (amt < 10) return 'danger'
  if (amt < 10_000) return 'warning'
  if (amt < 10_000_000) return 'caution'
  return 'safe'
}
