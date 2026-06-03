import { describe, it, expect } from 'vitest'
import { analyzeCharset, timeClass, formatTime, fmtGuesses, hasMeaningfulInput } from './passwordAnalysis'

// estimateUnicodeAlphabet is private; tested indirectly via analyzeCharset
// by inspecting the 'unicode' group added to active when non-ASCII chars are present.
describe('estimateUnicodeAlphabet (via analyzeCharset)', () => {
  it('returns 0 for ASCII-only passwords — no unicode group added', () => {
    const { hasOtherUnicode, active } = analyzeCharset('hello123!')
    expect(hasOtherUnicode).toBe(false)
    expect(active.some(g => g.id === 'unicode')).toBe(false)
  })

  it('3 unique Greek chars, 1 bucket → max(3×4=12, 1×32=32) = 32', () => {
    // α β γ — all in the 'greek' bucket (U+0370–U+03FF)
    const { active } = analyzeCharset('αβγ')
    const unicodeGroup = active.find(g => g.id === 'unicode')
    expect(unicodeGroup?.size).toBe(32)
  })

  it('9 unique Greek chars, 1 bucket → max(9×4=36, 1×32=32) = 36 (chars×4 wins)', () => {
    // α β γ δ ε ζ η θ ι — 9 distinct chars from 1 bucket
    const { active } = analyzeCharset('αβγδεζηθι')
    const unicodeGroup = active.find(g => g.id === 'unicode')
    expect(unicodeGroup?.size).toBe(36)
  })

  it('10 unique chars from 3 buckets → max(10×4=40, 3×32=96) = 96 (buckets×32 wins)', () => {
    // αβγ (Greek) + деё (Cyrillic) + あいうえ (JP-kana)
    const { active } = analyzeCharset('αβγдеёあいうえ')
    const unicodeGroup = active.find(g => g.id === 'unicode')
    expect(unicodeGroup?.size).toBe(96)
  })

  it('repeated chars are counted only once (unique)', () => {
    // 'αα' → 1 unique char, 1 bucket: max(1×4=4, 1×32=32) = 32
    const { active } = analyzeCharset('αα')
    const unicodeGroup = active.find(g => g.id === 'unicode')
    expect(unicodeGroup?.size).toBe(32)
  })
})

describe('timeClass', () => {
  it('returns "danger" for crack time < 7200 s (2 hours)', () => {
    expect(timeClass(0)).toBe('danger')
    expect(timeClass(1)).toBe('danger')
    expect(timeClass(3600)).toBe('danger')  // 1 hour — was the old threshold
    expect(timeClass(7199)).toBe('danger')
  })

  it('returns "" (neutral) for 7200 s ≤ crack time ≤ 3_153_600_000 s', () => {
    expect(timeClass(7200)).toBe('')
    expect(timeClass(86400)).toBe('')       // 1 day
    expect(timeClass(31_536_000)).toBe('')  // 1 year
    expect(timeClass(3_153_600_000)).toBe('')
  })

  it('returns "safe" for crack time > 3_153_600_000 s (~100 years)', () => {
    expect(timeClass(3_153_600_001)).toBe('safe')
    expect(timeClass(1e15)).toBe('safe')
  })
})

describe('formatTime', () => {
  it('returns "< 1 second" for fractional seconds', () => {
    expect(formatTime(0.5, 'en')).toBe('< 1 second')
    expect(formatTime(0.5, 'it')).toBe('< 1 secondo')
  })

  it('formats seconds', () => {
    expect(formatTime(45, 'en')).toBe('45 sec')
  })

  it('formats minutes', () => {
    expect(formatTime(120, 'en')).toBe('2 min')
  })

  it('formats hours', () => {
    expect(formatTime(7200, 'en')).toBe('2 hrs')
    expect(formatTime(7200, 'it')).toBe('2 ore')
  })

  it('formats days', () => {
    expect(formatTime(86400, 'en')).toBe('1 days')
    expect(formatTime(86400, 'it')).toBe('1 giorni')
  })

  it('formats years with K/M/B/T suffixes', () => {
    expect(formatTime(31_536_000, 'en')).toBe('1 years')
    expect(formatTime(31_536_000 * 1500, 'en')).toBe('1.5K years')
    expect(formatTime(31_536_000 * 2e6, 'en')).toBe('2.0M years')
  })

  it('caps very large values at "> age of the universe"', () => {
    expect(formatTime(1e31, 'en')).toBe('> age of the universe')
    expect(formatTime(Infinity, 'it')).toBe("> età dell'universo")
  })
})

describe('fmtGuesses', () => {
  it('formats small numbers as integers', () => {
    expect(fmtGuesses(42)).toBe('42')
    expect(fmtGuesses(999)).toBe('999')
  })

  it('formats thousands with K suffix', () => {
    expect(fmtGuesses(1500)).toBe('1.5K')
  })

  it('formats millions with M suffix', () => {
    expect(fmtGuesses(2_000_000)).toBe('2.0M')
  })

  it('formats billions with G suffix', () => {
    expect(fmtGuesses(3_000_000_000)).toBe('3.0G')
  })

  it('formats trillions with T suffix', () => {
    expect(fmtGuesses(4_000_000_000_000)).toBe('4.0T')
  })
})

describe('hasMeaningfulInput', () => {
  it('returns false for empty string', () => {
    expect(hasMeaningfulInput('')).toBe(false)
  })

  it('returns false for whitespace-only input', () => {
    expect(hasMeaningfulInput('   ')).toBe(false)
    expect(hasMeaningfulInput('\t\n')).toBe(false)
  })

  it('returns true for any non-whitespace content', () => {
    expect(hasMeaningfulInput('a')).toBe(true)
    expect(hasMeaningfulInput(' a ')).toBe(true)
  })
})
