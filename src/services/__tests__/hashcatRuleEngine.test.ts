import { describe, it, expect } from 'vitest'
import { applyHashcatRule, findRuleMatch } from '../hashcatRuleEngine'
import { BEST64_RULES } from '../../constants/ruleSets'
import { TOP_PASSWORDS_COMBINED } from '../../constants/wordlists'

// ── applyHashcatRule — individual operators ───────────────────────────────────

describe('applyHashcatRule — identity (:)', () => {
  it('returns the word unchanged', () => {
    expect(applyHashcatRule('ciao', ':').output).toBe('ciao')
  })

  it('works on empty word', () => {
    expect(applyHashcatRule('', ':').output).toBe('')
  })

  it('result is valid', () => {
    expect(applyHashcatRule('hello', ':').valid).toBe(true)
  })
})

describe('applyHashcatRule — lowercase (l / lN)', () => {
  it('l: lowercases all chars', () => {
    expect(applyHashcatRule('CIAO', 'l').output).toBe('ciao')
  })

  it('l: idempotent on already-lowercase', () => {
    expect(applyHashcatRule('ciao', 'l').output).toBe('ciao')
  })

  it('lN: lowercases char at position N only', () => {
    expect(applyHashcatRule('CIAO', 'l0').output).toBe('cIAO')
    expect(applyHashcatRule('CIAO', 'l2').output).toBe('CIaO')
  })

  it('lN: out-of-bounds position → word unchanged', () => {
    expect(applyHashcatRule('hi', 'l5').output).toBe('hi')
  })

  it('lA: lowercase at extended position A (=10)', () => {
    // 'A' encodes position 10 in Hashcat position chars
    const word = 'abcdefghijKlmnop'
    expect(applyHashcatRule(word, 'lA').output).toBe('abcdefghijklmnop')
  })
})

describe('applyHashcatRule — uppercase (u / uN)', () => {
  it('u: uppercases all chars', () => {
    expect(applyHashcatRule('ciao', 'u').output).toBe('CIAO')
  })

  it('uN: uppercases char at position N only', () => {
    expect(applyHashcatRule('ciao', 'u0').output).toBe('Ciao')
    expect(applyHashcatRule('ciao', 'u1').output).toBe('cIao')
  })

  it('uN: out-of-bounds position → word unchanged', () => {
    expect(applyHashcatRule('hi', 'u9').output).toBe('hi')
  })
})

describe('applyHashcatRule — capitalize (c)', () => {
  it('uppercases first char, lowercases rest', () => {
    expect(applyHashcatRule('ciao', 'c').output).toBe('Ciao')
    expect(applyHashcatRule('CIAO', 'c').output).toBe('Ciao')
    expect(applyHashcatRule('hELLO', 'c').output).toBe('Hello')
  })

  it('empty word → empty', () => {
    expect(applyHashcatRule('', 'c').output).toBe('')
  })

  it('single char → capitalized', () => {
    expect(applyHashcatRule('a', 'c').output).toBe('A')
  })
})

describe('applyHashcatRule — inverse capitalize (C)', () => {
  it('lowercases first char, uppercases rest', () => {
    expect(applyHashcatRule('CIAO', 'C').output).toBe('cIAO')
    expect(applyHashcatRule('ciao', 'C').output).toBe('cIAO')
    expect(applyHashcatRule('Hello', 'C').output).toBe('hELLO')
  })
})

describe('applyHashcatRule — toggle case (t / TN)', () => {
  it('t: toggles every char', () => {
    expect(applyHashcatRule('CiAo', 't').output).toBe('cIaO')
    expect(applyHashcatRule('hello', 't').output).toBe('HELLO')
    expect(applyHashcatRule('HELLO', 't').output).toBe('hello')
  })

  it('TN: toggles char at position N only', () => {
    expect(applyHashcatRule('hello', 'T0').output).toBe('Hello')
    expect(applyHashcatRule('hello', 'T4').output).toBe('hellO')
    expect(applyHashcatRule('Hello', 'T0').output).toBe('hello')
  })

  it('TN: out-of-bounds → word unchanged', () => {
    expect(applyHashcatRule('hi', 'T9').output).toBe('hi')
  })
})

describe('applyHashcatRule — reverse (r)', () => {
  it('reverses the word', () => {
    expect(applyHashcatRule('hello', 'r').output).toBe('olleh')
    expect(applyHashcatRule('ab', 'r').output).toBe('ba')
  })

  it('single char → same', () => {
    expect(applyHashcatRule('a', 'r').output).toBe('a')
  })

  it('empty → empty', () => {
    expect(applyHashcatRule('', 'r').output).toBe('')
  })

  it('palindrome unchanged', () => {
    expect(applyHashcatRule('abba', 'r').output).toBe('abba')
  })
})

describe('applyHashcatRule — duplicate (d)', () => {
  it('duplicates the word', () => {
    expect(applyHashcatRule('ab', 'd').output).toBe('abab')
    expect(applyHashcatRule('hello', 'd').output).toBe('hellohello')
  })

  it('empty → empty', () => {
    expect(applyHashcatRule('', 'd').output).toBe('')
  })
})

describe('applyHashcatRule — reflect (f)', () => {
  it('appends reversed word (palindrome style)', () => {
    expect(applyHashcatRule('ab', 'f').output).toBe('abba')
    expect(applyHashcatRule('abc', 'f').output).toBe('abccba')
    expect(applyHashcatRule('hello', 'f').output).toBe('helloolleh')
  })

  it('does not mutate original chars before reversing', () => {
    // Verify that f appends the correct reversed version (snapshot test)
    const result = applyHashcatRule('word', 'f').output
    expect(result).toBe('worddrow')
  })
})

describe('applyHashcatRule — append ($X)', () => {
  it('appends a digit', () => {
    expect(applyHashcatRule('hello', '$1').output).toBe('hello1')
    expect(applyHashcatRule('hello', '$0').output).toBe('hello0')
  })

  it('appends a symbol', () => {
    expect(applyHashcatRule('hello', '$!').output).toBe('hello!')
    expect(applyHashcatRule('hello', '$.' ).output).toBe('hello.')
  })

  it('appends to empty word', () => {
    expect(applyHashcatRule('', '$1').output).toBe('1')
  })

  it('bare $ with no char is silently skipped', () => {
    expect(applyHashcatRule('hello', '$').output).toBe('hello')
  })
})

describe('applyHashcatRule — prepend (^X)', () => {
  it('prepends a digit', () => {
    expect(applyHashcatRule('hello', '^1').output).toBe('1hello')
  })

  it('prepends a symbol', () => {
    expect(applyHashcatRule('hello', '^!').output).toBe('!hello')
  })

  it('prepends to empty word', () => {
    expect(applyHashcatRule('', '^x').output).toBe('x')
  })

  it('bare ^ with no char is silently skipped', () => {
    expect(applyHashcatRule('hello', '^').output).toBe('hello')
  })
})

describe('applyHashcatRule — delete first ([)', () => {
  it('removes first char', () => {
    expect(applyHashcatRule('hello', '[').output).toBe('ello')
  })

  it('single char → empty', () => {
    expect(applyHashcatRule('a', '[').output).toBe('')
  })

  it('empty → still empty (no crash)', () => {
    expect(applyHashcatRule('', '[').output).toBe('')
  })
})

describe('applyHashcatRule — delete last (])', () => {
  it('removes last char', () => {
    expect(applyHashcatRule('hello', ']').output).toBe('hell')
  })

  it('single char → empty', () => {
    expect(applyHashcatRule('a', ']').output).toBe('')
  })

  it('empty → still empty (no crash)', () => {
    expect(applyHashcatRule('', ']').output).toBe('')
  })
})

describe('applyHashcatRule — substitute (sXY)', () => {
  it('sa@: replaces all a with @', () => {
    expect(applyHashcatRule('password', 'sa@').output).toBe('p@ssword')
    expect(applyHashcatRule('banana', 'sa@').output).toBe('b@n@n@')
  })

  it('se3: replaces all e with 3', () => {
    expect(applyHashcatRule('hello', 'se3').output).toBe('h3llo')
  })

  it('no match → word unchanged (no a in "hello")', () => {
    expect(applyHashcatRule('hello', 'sa@').output).toBe('hello')
  })

  it('replaces every occurrence', () => {
    expect(applyHashcatRule('aaa', 'sa@').output).toBe('@@@')
  })
})

describe('applyHashcatRule — delete at position (DN)', () => {
  it('D0: deletes first char', () => {
    expect(applyHashcatRule('hello', 'D0').output).toBe('ello')
  })

  it('D1: deletes second char', () => {
    expect(applyHashcatRule('hello', 'D1').output).toBe('hllo')
  })

  it('D4: deletes last char', () => {
    expect(applyHashcatRule('hello', 'D4').output).toBe('hell')
  })

  it('out-of-bounds → word unchanged', () => {
    expect(applyHashcatRule('hello', 'D5').output).toBe('hello')
    expect(applyHashcatRule('hello', 'D9').output).toBe('hello')
  })
})

describe('applyHashcatRule — overwrite (oNX)', () => {
  it('overwrites char at position N', () => {
    expect(applyHashcatRule('hello', 'o0H').output).toBe('Hello')
    expect(applyHashcatRule('hello', 'o4!').output).toBe('hell!')
  })

  it('middle position', () => {
    expect(applyHashcatRule('hello', 'o2X').output).toBe('heXlo')
  })

  it('out-of-bounds → word unchanged', () => {
    expect(applyHashcatRule('hello', 'o5!').output).toBe('hello')
  })
})

describe('applyHashcatRule — insert (iNX)', () => {
  it('inserts at position 0 (prepend)', () => {
    expect(applyHashcatRule('hello', 'i0X').output).toBe('Xhello')
  })

  it('inserts at end (append)', () => {
    expect(applyHashcatRule('hello', 'i5!').output).toBe('hello!')
  })

  it('inserts in middle', () => {
    expect(applyHashcatRule('hello', 'i2_').output).toBe('he_llo')
  })

  it('out-of-bounds (> length) → no change', () => {
    expect(applyHashcatRule('hi', 'i9X').output).toBe('hi')
  })
})

describe('applyHashcatRule — swap (*NM)', () => {
  it('swaps chars at positions N and M', () => {
    expect(applyHashcatRule('abcd', '*02').output).toBe('cbad')
    expect(applyHashcatRule('hello', '*04').output).toBe('oellh')
  })

  it('swapping same position → no change', () => {
    expect(applyHashcatRule('hello', '*00').output).toBe('hello')
  })

  it('out-of-bounds → word unchanged', () => {
    expect(applyHashcatRule('hello', '*09').output).toBe('hello')
  })
})

describe('applyHashcatRule — unsupported operators (no-op)', () => {
  it('{ (rotate left) silently no-ops', () => {
    expect(applyHashcatRule('hello', '{').output).toBe('hello')
    expect(applyHashcatRule('hello', '{').valid).toBe(true)
  })

  it('} (rotate right) silently no-ops', () => {
    expect(applyHashcatRule('hello', '}').output).toBe('hello')
  })

  it('unknown single-char operator silently no-ops', () => {
    expect(applyHashcatRule('hello', 'X').output).toBe('hello')
  })
})

// ── applyHashcatRule — compound rules ────────────────────────────────────────

describe('applyHashcatRule — compound rules', () => {
  it('c $1: capitalize then append 1', () => {
    expect(applyHashcatRule('ciao', 'c $1').output).toBe('Ciao1')
  })

  it('c $1 $!: capitalize + append 1 + append !', () => {
    expect(applyHashcatRule('ciao', 'c $1 $!').output).toBe('Ciao1!')
  })

  it('c $2 $0 $2 $4: capitalize + append 2024', () => {
    expect(applyHashcatRule('test', 'c $2 $0 $2 $4').output).toBe('Test2024')
  })

  it('sa@ so0: leet substitution a→@ and o→0', () => {
    expect(applyHashcatRule('password', 'sa@ so0').output).toBe('p@ssw0rd')
  })

  it('c sa@: capitalize then substitute a→@', () => {
    // 'ciao' → 'Ciao' → 'Ci@o'
    expect(applyHashcatRule('ciao', 'c sa@').output).toBe('Ci@o')
  })

  it('c sa@ se3 si1 so0: full leet on capitalized word', () => {
    expect(applyHashcatRule('password', 'c sa@ se3 si1 so0').output).toBe('P@ssw0rd')
  })

  it('t r: toggle case then reverse', () => {
    expect(applyHashcatRule('Hello', 't r').output).toBe('OLLEh')
  })

  it('l $1 $2 $3: lowercase + append 123', () => {
    expect(applyHashcatRule('PASS', 'l $1 $2 $3').output).toBe('pass123')
  })

  it('r c: reverse then capitalize', () => {
    // 'hello' → reverse 'olleh' → capitalize 'Olleh'
    expect(applyHashcatRule('hello', 'r c').output).toBe('Olleh')
  })

  it('d l: duplicate then lowercase all', () => {
    expect(applyHashcatRule('AB', 'd l').output).toBe('abab')
  })

  it('D0 equivalent to [: both delete first char', () => {
    const resultBracket = applyHashcatRule('hello', '[').output
    const resultD0 = applyHashcatRule('hello', 'D0').output
    expect(resultD0).toBe(resultBracket)
  })
})

describe('applyHashcatRule — edge cases', () => {
  it('empty rule string → word unchanged', () => {
    expect(applyHashcatRule('hello', '').output).toBe('hello')
  })

  it('rule with leading/trailing whitespace is trimmed', () => {
    expect(applyHashcatRule('hello', '  c  ').output).toBe('Hello')
  })

  it('multiple spaces between tokens handled', () => {
    expect(applyHashcatRule('ciao', 'c   $1').output).toBe('Ciao1')
  })
})

// ── findRuleMatch ─────────────────────────────────────────────────────────────

describe('findRuleMatch — basic matching', () => {
  const wordlist = ['ciao', 'amore', 'password']
  const ruleset = [':', 'c', 'c $1', 'c $1 $!']

  it('finds exact match via no-op rule', () => {
    const m = findRuleMatch('ciao', wordlist, ruleset)
    expect(m).not.toBeNull()
    expect(m!.baseWord).toBe('ciao')
    expect(m!.rule).toBe(':')
  })

  it('finds capitalized variant', () => {
    const m = findRuleMatch('Ciao', wordlist, ruleset)
    expect(m!.baseWord).toBe('ciao')
    expect(m!.rule).toBe('c')
  })

  it('finds compound rule variant', () => {
    const m = findRuleMatch('Ciao1!', wordlist, ruleset)
    expect(m!.baseWord).toBe('ciao')
    expect(m!.rule).toBe('c $1 $!')
  })

  it('finds password variants', () => {
    const m = findRuleMatch('Password', wordlist, ruleset)
    expect(m!.baseWord).toBe('password')
    expect(m!.rule).toBe('c')
  })

  it('returns null when no match', () => {
    expect(findRuleMatch('XyZqRtVwUi', wordlist, ruleset)).toBeNull()
  })

  it('case-sensitive: "ciao" ≠ "Ciao" without capitalize rule', () => {
    // wordlist=['ciao'], ruleset=[':'] — only exact match
    expect(findRuleMatch('Ciao', ['ciao'], [':'])).toBeNull()
  })
})

describe('findRuleMatch — attemptIndex calculation', () => {
  const wordlist = ['ciao', 'amore', 'password']
  const ruleset = [':', 'c', 'c $1', 'c $1 $!']

  it('first word first rule → attemptIndex=1', () => {
    expect(findRuleMatch('ciao', wordlist, ruleset)!.attemptIndex).toBe(1)
  })

  it('first word second rule → attemptIndex=2', () => {
    expect(findRuleMatch('Ciao', wordlist, ruleset)!.attemptIndex).toBe(2)
  })

  it('first word last rule → attemptIndex=4', () => {
    expect(findRuleMatch('Ciao1!', wordlist, ruleset)!.attemptIndex).toBe(4)
  })

  it('third word second rule → attemptIndex = 2*4+1+1 = 10', () => {
    // wIdx=2, rIdx=1, |ruleset|=4 → 2*4 + 1 + 1 = 10
    expect(findRuleMatch('Password', wordlist, ruleset)!.attemptIndex).toBe(10)
  })

  it('baseWordIndex and ruleIndex match the formula', () => {
    const m = findRuleMatch('Ciao1!', wordlist, ruleset)!
    expect(m.baseWordIndex).toBe(0)
    expect(m.ruleIndex).toBe(3)
    expect(m.attemptIndex).toBe(m.baseWordIndex * ruleset.length + m.ruleIndex + 1)
  })
})

describe('findRuleMatch — edge cases', () => {
  it('empty wordlist → null', () => {
    expect(findRuleMatch('ciao', [], [':', 'c'])).toBeNull()
  })

  it('empty ruleset → null', () => {
    expect(findRuleMatch('ciao', ['ciao'], [])).toBeNull()
  })

  it('empty password only matches if wordlist contains empty string', () => {
    expect(findRuleMatch('', ['ciao'], [':'])).toBeNull()
    expect(findRuleMatch('', [''], [':'])).not.toBeNull()
  })

  it('returns the FIRST match (lowest attemptIndex)', () => {
    // 'ab' matches ':' (no-op) as baseWord='ab', and also would be found via 'd' on 'a'
    // but ':' comes first
    const wordlist = ['ab', 'a']
    const ruleset = [':', 'd', 'c']
    const m = findRuleMatch('ab', wordlist, ruleset)!
    expect(m.baseWord).toBe('ab') // first wordlist entry
    expect(m.rule).toBe(':') // first rule
    expect(m.attemptIndex).toBe(1)
  })
})

// ── Integration with BEST64_RULES + TOP_PASSWORDS_COMBINED ───────────────────

describe('findRuleMatch — integration with real ruleset and wordlist', () => {
  it('finds "ciao" via no-op rule (: is the first rule)', () => {
    const m = findRuleMatch('ciao', TOP_PASSWORDS_COMBINED, BEST64_RULES)
    expect(m).not.toBeNull()
    expect(m!.baseWord).toBe('ciao')
    expect(m!.rule).toBe(':')
  })

  it('finds "Ciao" via capitalize rule', () => {
    const m = findRuleMatch('Ciao', TOP_PASSWORDS_COMBINED, BEST64_RULES)
    expect(m!.baseWord).toBe('ciao')
    expect(m!.rule).toBe('c')
  })

  it('finds "ciao1" via $1 rule (appends 1 — comes before l $1 in best64)', () => {
    // BEST64_RULES has '$1' at index 12, 'l $1' at index 21 — first-match-wins
    const m = findRuleMatch('ciao1', TOP_PASSWORDS_COMBINED, BEST64_RULES)
    expect(m!.baseWord).toBe('ciao')
    expect(m!.rule).toBe('$1')
  })

  it('finds "password" via no-op rule', () => {
    const m = findRuleMatch('password', TOP_PASSWORDS_COMBINED, BEST64_RULES)
    expect(m!.baseWord).toBe('password')
    expect(m!.rule).toBe(':')
  })

  it('finds "PASSWORD" via uppercase rule', () => {
    const m = findRuleMatch('PASSWORD', TOP_PASSWORDS_COMBINED, BEST64_RULES)
    expect(m!.baseWord).toBe('password')
    expect(m!.rule).toBe('u')
  })

  it('finds "P@ssw0rd" via leet rule', () => {
    const m = findRuleMatch('P@ssw0rd', TOP_PASSWORDS_COMBINED, BEST64_RULES)
    expect(m!.baseWord).toBe('password')
    expect(m!.rule).toBe('c sa@ so0')
  })

  it('finds "Ciao2024" via capitalize + append year rule', () => {
    const m = findRuleMatch('Ciao2024', TOP_PASSWORDS_COMBINED, BEST64_RULES)
    expect(m!.baseWord).toBe('ciao')
    expect(m!.rule).toBe('c $2 $0 $2 $4')
  })

  it('does not find a truly random password', () => {
    expect(findRuleMatch('Xk9$mP2@qL7!vB4', TOP_PASSWORDS_COMBINED, BEST64_RULES)).toBeNull()
  })

  it('does not find a strong invented passphrase', () => {
    expect(findRuleMatch('CorrectHorseBatteryStaple', TOP_PASSWORDS_COMBINED, BEST64_RULES)).toBeNull()
  })

  it('attemptIndex is positive for every match found', () => {
    const matches = ['password', 'PASSWORD', 'Password', 'CIAO', 'ciao123']
      .map(pw => findRuleMatch(pw, TOP_PASSWORDS_COMBINED, BEST64_RULES))
      .filter(m => m !== null)
    for (const m of matches) {
      expect(m!.attemptIndex).toBeGreaterThan(0)
    }
  })
})
