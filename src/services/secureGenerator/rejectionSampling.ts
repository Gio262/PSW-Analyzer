import { randomUint32 } from './csprng'

/**
 * Returns a uniform integer in [0, n) using rejection sampling.
 *
 * Why not `randomUint32() % n` (modulo bias)?
 * 2^32 is rarely divisible by n. The remainder values (0..r-1 where
 * r = 2^32 mod n) have a slightly higher probability. For n=100 the
 * bias is ~2×10⁻⁸ — undetectable by humans but flagged by chi-squared
 * tests on large samples. A tool presenting itself as NIST-grade cannot
 * accept this.
 *
 * Fix: compute maxAccepted = floor(2^32 / n) * n. Accept only values
 * below maxAccepted, then take modulo. Rejection probability is at most
 * 1/2 for any n, and < 0.001% for n ≤ 256 (typical pool sizes).
 */
export function randomIntBelow(n: number): number {
  if (n <= 0 || !Number.isInteger(n)) {
    throw new Error(`n must be a positive integer, got ${n}`)
  }
  if (n === 1) return 0

  const MAX_UINT32 = 0x1_0000_0000 // 2^32
  const maxAccepted = Math.floor(MAX_UINT32 / n) * n

  for (let attempt = 0; attempt < 100; attempt++) {
    const r = randomUint32()
    if (r < maxAccepted) return r % n
  }
  // 100 consecutive rejections are statistically impossible for n < 2^31.
  throw new Error('randomIntBelow: too many consecutive rejections — CSPRNG suspected broken')
}

/**
 * Cryptographically secure Fisher-Yates shuffle (in-place copy).
 * Used to eliminate positional bias when ensureAllClasses is active.
 */
export function secureShuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = randomIntBelow(i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
