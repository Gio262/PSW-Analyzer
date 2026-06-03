import { describe, it, expect } from 'vitest'
import { assertCsprngAvailable, randomBytes, randomUint32 } from '../csprng'
import { randomIntBelow, secureShuffle } from '../rejectionSampling'
import { generateSecurePassword } from '../passwordGen'
import { generateSecurePassphrase } from '../passphraseGen'
import { mixEntropy } from '../entropyMixing'

// ---------------------------------------------------------------------------
// CSPRNG
// ---------------------------------------------------------------------------

describe('csprng', () => {
  it('assertCsprngAvailable does not throw in Node.js 18+', () => {
    expect(() => assertCsprngAvailable()).not.toThrow()
  })

  it('randomBytes returns the requested length', () => {
    for (const len of [1, 16, 32, 128, 512]) {
      expect(randomBytes(len).length).toBe(len)
    }
  })

  it('randomBytes handles chunks larger than 65536 bytes', () => {
    const buf = randomBytes(70_000)
    expect(buf.length).toBe(70_000)
    // Not all zeros
    expect(buf.some(b => b !== 0)).toBe(true)
  })

  it('randomBytes throws on non-positive length', () => {
    expect(() => randomBytes(0)).toThrow()
    expect(() => randomBytes(-1)).toThrow()
  })

  it('randomUint32 returns a value in [0, 2^32)', () => {
    for (let i = 0; i < 1000; i++) {
      const v = randomUint32()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(0x1_0000_0000)
    }
  })

  it('randomUint32 output is not always the same (basic sanity)', () => {
    const values = new Set(Array.from({ length: 100 }, () => randomUint32()))
    expect(values.size).toBeGreaterThan(50)
  })
})

// ---------------------------------------------------------------------------
// Rejection Sampling
// ---------------------------------------------------------------------------

describe('rejectionSampling', () => {
  it('randomIntBelow always returns values in [0, n)', () => {
    for (const n of [2, 10, 36, 62, 95, 256]) {
      for (let i = 0; i < 200; i++) {
        const v = randomIntBelow(n)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThan(n)
      }
    }
  })

  it('randomIntBelow(1) always returns 0', () => {
    for (let i = 0; i < 50; i++) {
      expect(randomIntBelow(1)).toBe(0)
    }
  })

  it('randomIntBelow throws on n <= 0', () => {
    expect(() => randomIntBelow(0)).toThrow()
    expect(() => randomIntBelow(-5)).toThrow()
  })

  it('randomIntBelow throws on non-integer n', () => {
    expect(() => randomIntBelow(1.5)).toThrow()
  })

  it('chi-squared uniformity for n=10 over 100 000 samples', () => {
    const N = 10
    const SAMPLES = 100_000
    const counts = new Array<number>(N).fill(0)
    for (let i = 0; i < SAMPLES; i++) counts[randomIntBelow(N)]++

    const expected = SAMPLES / N
    let chi2 = 0
    for (const c of counts) chi2 += (c - expected) ** 2 / expected

    // df=9, p=0.01 → critical value 21.67. A biased RNG would exceed this.
    expect(chi2).toBeLessThan(21.67)
  })

  it('chi-squared uniformity for n=26 (lowercase pool) over 100 000 samples', () => {
    const N = 26
    const SAMPLES = 100_000
    const counts = new Array<number>(N).fill(0)
    for (let i = 0; i < SAMPLES; i++) counts[randomIntBelow(N)]++

    const expected = SAMPLES / N
    let chi2 = 0
    for (const c of counts) chi2 += (c - expected) ** 2 / expected

    // df=25, p=0.01 → critical value 44.31
    expect(chi2).toBeLessThan(44.31)
  })

  it('secureShuffle preserves all elements', () => {
    const arr = Array.from({ length: 52 }, (_, i) => i)
    const shuffled = secureShuffle(arr)
    expect(shuffled.sort((a, b) => a - b)).toEqual(arr)
  })

  it('secureShuffle returns a new array (not in-place)', () => {
    const arr = [1, 2, 3, 4, 5]
    const shuffled = secureShuffle(arr)
    expect(shuffled).not.toBe(arr)
  })

  it('secureShuffle produces varied orderings (not identity)', () => {
    const arr = Array.from({ length: 10 }, (_, i) => i)
    const results = new Set(
      Array.from({ length: 20 }, () => secureShuffle([...arr]).join(',')),
    )
    // With 10! = 3.6M possible orderings, 20 samples should give > 10 distinct results
    expect(results.size).toBeGreaterThan(10)
  })
})

// ---------------------------------------------------------------------------
// Password Generator
// ---------------------------------------------------------------------------

describe('generateSecurePassword', () => {
  it('produces the exact requested length', () => {
    for (const len of [8, 12, 16, 24, 32, 64, 128]) {
      const { password } = generateSecurePassword({
        length: len, lowercase: true, uppercase: true, digits: true, symbols: true,
        excludeAmbiguous: false, ensureAllClasses: false,
      })
      expect(password.length).toBe(len)
    }
  })

  it('lowercase-only: output contains only a-z', () => {
    const { password } = generateSecurePassword({
      length: 50, lowercase: true, uppercase: false, digits: false, symbols: false,
      excludeAmbiguous: false, ensureAllClasses: false,
    })
    expect(password).toMatch(/^[a-z]+$/)
  })

  it('uppercase-only: output contains only A-Z', () => {
    const { password } = generateSecurePassword({
      length: 50, lowercase: false, uppercase: true, digits: false, symbols: false,
      excludeAmbiguous: false, ensureAllClasses: false,
    })
    expect(password).toMatch(/^[A-Z]+$/)
  })

  it('digits-only: output contains only 0-9', () => {
    const { password } = generateSecurePassword({
      length: 50, lowercase: false, uppercase: false, digits: true, symbols: false,
      excludeAmbiguous: false, ensureAllClasses: false,
    })
    expect(password).toMatch(/^[0-9]+$/)
  })

  it('ensureAllClasses guarantees all four classes appear in 200 runs', () => {
    for (let i = 0; i < 200; i++) {
      const { password } = generateSecurePassword({
        length: 8, lowercase: true, uppercase: true, digits: true, symbols: true,
        excludeAmbiguous: false, ensureAllClasses: true,
      })
      expect(password).toMatch(/[a-z]/)
      expect(password).toMatch(/[A-Z]/)
      expect(password).toMatch(/[0-9]/)
      expect(password).toMatch(/[!@#$%^&*()\-_=+[\]{};:,.<>/?]/)
    }
  })

  it('excludeAmbiguous produces no ambiguous characters', () => {
    for (let i = 0; i < 100; i++) {
      const { password } = generateSecurePassword({
        length: 50, lowercase: true, uppercase: true, digits: true, symbols: true,
        excludeAmbiguous: true, ensureAllClasses: false,
      })
      expect(password).not.toMatch(/[0Oo1lI|`']/)
    }
  })

  it('excludeAmbiguous reduces pool size', () => {
    const full = generateSecurePassword({
      length: 16, lowercase: true, uppercase: true, digits: true, symbols: true,
      excludeAmbiguous: false, ensureAllClasses: false,
    })
    const filtered = generateSecurePassword({
      length: 16, lowercase: true, uppercase: true, digits: true, symbols: true,
      excludeAmbiguous: true, ensureAllClasses: false,
    })
    expect(filtered.poolSize).toBeLessThan(full.poolSize)
  })

  it('entropy = length × log2(poolSize)', () => {
    const r = generateSecurePassword({
      length: 20, lowercase: true, uppercase: true, digits: true, symbols: true,
      excludeAmbiguous: false, ensureAllClasses: false,
    })
    expect(r.entropyBits).toBeCloseTo(20 * Math.log2(r.poolSize), 6)
  })

  it('entropy scales correctly with length', () => {
    const r16 = generateSecurePassword({
      length: 16, lowercase: true, uppercase: false, digits: false, symbols: false,
      excludeAmbiguous: false, ensureAllClasses: false,
    })
    const r32 = generateSecurePassword({
      length: 32, lowercase: true, uppercase: false, digits: false, symbols: false,
      excludeAmbiguous: false, ensureAllClasses: false,
    })
    expect(r32.entropyBits).toBeCloseTo(r16.entropyBits * 2, 6)
  })

  it('throws when no class selected', () => {
    expect(() => generateSecurePassword({
      length: 8, lowercase: false, uppercase: false, digits: false, symbols: false,
      excludeAmbiguous: false, ensureAllClasses: false,
    })).toThrow()
  })

  it('throws when ensureAllClasses and length < class count', () => {
    expect(() => generateSecurePassword({
      length: 3, lowercase: true, uppercase: true, digits: true, symbols: true,
      excludeAmbiguous: false, ensureAllClasses: true,
    })).toThrow()
  })

  it('classesUsed reflects selected classes', () => {
    const r = generateSecurePassword({
      length: 16, lowercase: true, uppercase: true, digits: false, symbols: false,
      excludeAmbiguous: false, ensureAllClasses: false,
    })
    expect(r.classesUsed).toContain('lowercase')
    expect(r.classesUsed).toContain('uppercase')
    expect(r.classesUsed).not.toContain('digits')
    expect(r.classesUsed).not.toContain('symbols')
  })

  it('pool size for all four classes without ambiguous filter is consistent', () => {
    // lower(26) + upper(26) + digits(10) + symbols(26) = 88
    const r = generateSecurePassword({
      length: 1, lowercase: true, uppercase: true, digits: true, symbols: true,
      excludeAmbiguous: false, ensureAllClasses: false,
    })
    expect(r.poolSize).toBe(88)
  })

  it('ensureAllClasses at minimum length (length == class count = 4)', () => {
    for (let i = 0; i < 100; i++) {
      const { password } = generateSecurePassword({
        length: 4, lowercase: true, uppercase: true, digits: true, symbols: true,
        excludeAmbiguous: false, ensureAllClasses: true,
      })
      expect(password.length).toBe(4)
      expect(password).toMatch(/[a-z]/)
      expect(password).toMatch(/[A-Z]/)
      expect(password).toMatch(/[0-9]/)
      expect(password).toMatch(/[!@#$%^&*()\-_=+[\]{};:,.<>/?]/)
    }
  })

  it('statistical: passwords are not identical across 100 runs', () => {
    const passwords = new Set(
      Array.from({ length: 100 }, () =>
        generateSecurePassword({
          length: 20, lowercase: true, uppercase: true, digits: true, symbols: true,
          excludeAmbiguous: false, ensureAllClasses: false,
        }).password,
      ),
    )
    // With 88^20 ≈ 10^38 possible passwords, 100 identical results is impossible
    expect(passwords.size).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// Passphrase Generator
// ---------------------------------------------------------------------------

describe('generateSecurePassphrase', () => {
  it('produces the correct word count', async () => {
    const r = await generateSecurePassphrase({
      wordCount: 5, list: 'eff-long', separator: '-',
      capitalize: false, appendDigit: false, appendSymbol: false,
    })
    expect(r.wordsUsed.length).toBe(5)
    expect(r.passphrase.split('-').length).toBe(5)
  })

  it('applies the separator correctly', async () => {
    const r = await generateSecurePassphrase({
      wordCount: 4, list: 'eff-long', separator: '_',
      capitalize: false, appendDigit: false, appendSymbol: false,
    })
    expect(r.passphrase).toMatch(/^[a-z]+(_[a-z]+){3}$/)
  })

  it('capitalize works', async () => {
    const r = await generateSecurePassphrase({
      wordCount: 5, list: 'eff-long', separator: '-',
      capitalize: true, appendDigit: false, appendSymbol: false,
    })
    for (const word of r.wordsUsed) {
      expect(word[0]).toMatch(/[A-Z]/)
    }
  })

  it('appendDigit adds a digit at the end', async () => {
    for (let i = 0; i < 30; i++) {
      const r = await generateSecurePassphrase({
        wordCount: 3, list: 'eff-long', separator: '-',
        capitalize: false, appendDigit: true, appendSymbol: false,
      })
      expect(r.passphrase).toMatch(/[0-9]$/)
    }
  })

  it('appendSymbol adds a symbol at the end', async () => {
    for (let i = 0; i < 30; i++) {
      const r = await generateSecurePassphrase({
        wordCount: 3, list: 'eff-long', separator: '-',
        capitalize: false, appendDigit: false, appendSymbol: true,
      })
      expect(r.passphrase).toMatch(/[!@#$%^&*]$/)
    }
  })

  it('EFF long: entropy = wordCount × log2(7776)', async () => {
    const r = await generateSecurePassphrase({
      wordCount: 6, list: 'eff-long', separator: '-',
      capitalize: false, appendDigit: false, appendSymbol: false,
    })
    expect(r.listSize).toBe(7776)
    expect(r.entropyBits).toBeCloseTo(6 * Math.log2(7776), 6)
  })

  it('EFF short1: listSize = 1296, entropy = wordCount × log2(1296)', async () => {
    const r = await generateSecurePassphrase({
      wordCount: 8, list: 'eff-short1', separator: '-',
      capitalize: false, appendDigit: false, appendSymbol: false,
    })
    expect(r.listSize).toBe(1296)
    expect(r.entropyBits).toBeCloseTo(8 * Math.log2(1296), 6)
  })

  it('appendDigit adds log2(10) bits of entropy', async () => {
    const base = await generateSecurePassphrase({
      wordCount: 5, list: 'eff-long', separator: '-',
      capitalize: false, appendDigit: false, appendSymbol: false,
    })
    const withDigit = await generateSecurePassphrase({
      wordCount: 5, list: 'eff-long', separator: '-',
      capitalize: false, appendDigit: true, appendSymbol: false,
    })
    expect(withDigit.entropyBits).toBeCloseTo(base.entropyBits + Math.log2(10), 6)
  })

  it('appendSymbol adds log2(8) bits of entropy', async () => {
    const base = await generateSecurePassphrase({
      wordCount: 5, list: 'eff-long', separator: '-',
      capitalize: false, appendDigit: false, appendSymbol: false,
    })
    const withSymbol = await generateSecurePassphrase({
      wordCount: 5, list: 'eff-long', separator: '-',
      capitalize: false, appendDigit: false, appendSymbol: true,
    })
    expect(withSymbol.entropyBits).toBeCloseTo(base.entropyBits + Math.log2(8), 6)
  })

  it('appendDigit and appendSymbol both active: entropy is additive', async () => {
    const base = await generateSecurePassphrase({
      wordCount: 5, list: 'eff-long', separator: '-',
      capitalize: false, appendDigit: false, appendSymbol: false,
    })
    const both = await generateSecurePassphrase({
      wordCount: 5, list: 'eff-long', separator: '-',
      capitalize: false, appendDigit: true, appendSymbol: true,
    })
    expect(both.entropyBits).toBeCloseTo(base.entropyBits + Math.log2(10) + Math.log2(8), 6)
  })

  it('throws on wordCount < 1', async () => {
    await expect(
      generateSecurePassphrase({
        wordCount: 0, list: 'eff-long', separator: '-',
        capitalize: false, appendDigit: false, appendSymbol: false,
      }),
    ).rejects.toThrow()
  })

  it('generates 100 distinct passphrases (randomness sanity)', async () => {
    const results = new Set(
      await Promise.all(
        Array.from({ length: 100 }, () =>
          generateSecurePassphrase({
            wordCount: 5, list: 'eff-long', separator: '-',
            capitalize: false, appendDigit: false, appendSymbol: false,
          }).then(r => r.passphrase),
        ),
      ),
    )
    expect(results.size).toBeGreaterThan(90)
  })
})

// ---------------------------------------------------------------------------
// Entropy Mixing (HKDF)
// ---------------------------------------------------------------------------

describe('mixEntropy', () => {
  it('returns 32 bytes', async () => {
    const result = await mixEntropy([randomBytes(32)])
    expect(result.length).toBe(32)
  })

  it('different inputs produce different outputs', async () => {
    const a = await mixEntropy([randomBytes(32)])
    const b = await mixEntropy([randomBytes(32)])
    expect(a).not.toEqual(b)
  })

  it('same input produces same output (deterministic)', async () => {
    const src = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
    const a = await mixEntropy([src])
    const b = await mixEntropy([src])
    expect(a).toEqual(b)
  })

  it('throws with empty sources array', async () => {
    await expect(mixEntropy([])).rejects.toThrow()
  })

  it('two-source mix differs from single-source mix', async () => {
    const s1 = randomBytes(16)
    const s2 = randomBytes(16)
    const single = await mixEntropy([s1])
    const combined = await mixEntropy([s1, s2])
    // Combined uses HKDF over concatenated inputs — result will differ
    expect(single).not.toEqual(combined)
  })

  it('custom info string changes the output', async () => {
    const src = randomBytes(32)
    const a = await mixEntropy([src], undefined, 'context-a')
    const b = await mixEntropy([src], undefined, 'context-b')
    expect(a).not.toEqual(b)
  })
})
