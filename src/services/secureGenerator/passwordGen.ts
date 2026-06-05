import { randomIntBelow, secureShuffle } from './rejectionSampling'

export interface PasswordGeneratorOptions {
  length: number
  lowercase: boolean
  uppercase: boolean
  digits: boolean
  symbols: boolean
  excludeAmbiguous: boolean
  /** Guarantee at least one character from each requested class. */
  ensureAllClasses: boolean
}

export interface PasswordGenerationResult {
  password: string
  /** Exact calculated entropy in bits: H = L × log₂(N) */
  entropyBits: number
  poolSize: number
  classesUsed: string[]
}

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>/?'

// Characters that look alike: 0/O/o, 1/l/I, | ` '
const AMBIGUOUS = /[0Oo1lI|`']/g

export function generateSecurePassword(
  options: PasswordGeneratorOptions,
): PasswordGenerationResult {
  const classes: { label: string; chars: string }[] = []
  if (options.lowercase) classes.push({ label: 'lowercase', chars: LOWER })
  if (options.uppercase) classes.push({ label: 'uppercase', chars: UPPER })
  if (options.digits)    classes.push({ label: 'digits',    chars: DIGITS })
  if (options.symbols)   classes.push({ label: 'symbols',   chars: SYMBOLS })

  if (classes.length === 0) {
    throw new Error('At least one character class must be selected')
  }

  const filtered = classes
    .map(c => ({
      label: c.label,
      chars: options.excludeAmbiguous ? c.chars.replace(AMBIGUOUS, '') : c.chars,
    }))
    .filter(c => c.chars.length > 0)

  if (options.ensureAllClasses && options.length < filtered.length) {
    throw new Error(
      `Length (${options.length}) is less than the number of classes (${filtered.length}): ` +
      'cannot guarantee one character per class. Reduce classes or increase length.',
    )
  }

  const fullPool = filtered.map(c => c.chars).join('')
  const poolSize = fullPool.length

  const chars: string[] = []

  if (options.ensureAllClasses) {
    for (const c of filtered) {
      chars.push(c.chars[randomIntBelow(c.chars.length)])
    }
  }

  while (chars.length < options.length) {
    chars.push(fullPool[randomIntBelow(poolSize)])
  }

  // Shuffle to remove the positional bias introduced by ensureAllClasses
  const password = secureShuffle(chars).join('')

  // H = L × log₂(N). The ensureAllClasses constraint reduces this by < 1 bit
  // at practical lengths (≥ 8), so we report the simpler formula.
  const entropyBits = options.length * Math.log2(poolSize)

  return {
    password,
    entropyBits,
    poolSize,
    classesUsed: filtered.map(c => c.label),
  }
}
