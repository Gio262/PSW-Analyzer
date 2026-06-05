/**
 * Partial implementation of the Hashcat rule grammar.
 * Covers all operators needed for best64.rule and similar rulesets.
 *
 * Reference: https://hashcat.net/wiki/doku.php?id=rule_based_attack
 *
 * Supported: : l u c C t r d f $X ^X [ ] sXY TN uN lN DN oNX iNX *NM
 * Unsupported operators silently no-op so rules with extra operators don't crash.
 */

export interface RuleApplicationResult {
  output: string
  /** true if the rule was syntactically valid and applied */
  valid: boolean
}

// Hashcat position encoding: '0'-'9' → 0-9, 'A'-'Z' → 10-35
const POSITION_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function parsePosition(ch: string): number | null {
  const idx = POSITION_CHARS.indexOf(ch)
  return idx >= 0 ? idx : null
}

/**
 * Applies a single Hashcat rule string to a word.
 * A rule string may contain multiple space-separated operators applied left to right.
 */
export function applyHashcatRule(word: string, rule: string): RuleApplicationResult {
  let chars = Array.from(word) // codepoint-safe split
  const tokens = rule.trim().split(/\s+/)

  try {
    for (const token of tokens) {
      if (token.length === 0) continue
      const op = token[0]

      switch (op) {
        case ':': break // identity — no-op

        case 'l':
          if (token.length === 1) {
            chars = chars.map(c => c.toLowerCase())
          } else {
            // lN: lowercase char at position N
            const pos = parsePosition(token[1])
            if (pos !== null && pos < chars.length) {
              chars[pos] = chars[pos].toLowerCase()
            }
          }
          break

        case 'u':
          if (token.length === 1) {
            chars = chars.map(c => c.toUpperCase())
          } else {
            // uN: uppercase char at position N
            const pos = parsePosition(token[1])
            if (pos !== null && pos < chars.length) {
              chars[pos] = chars[pos].toUpperCase()
            }
          }
          break

        case 'c':
          // capitalize first, lowercase rest
          if (chars.length > 0) {
            chars[0] = chars[0].toUpperCase()
            for (let k = 1; k < chars.length; k++) chars[k] = chars[k].toLowerCase()
          }
          break

        case 'C':
          // lowercase first, uppercase rest
          if (chars.length > 0) {
            chars[0] = chars[0].toLowerCase()
            for (let k = 1; k < chars.length; k++) chars[k] = chars[k].toUpperCase()
          }
          break

        case 't':
          // toggle case of all chars
          chars = chars.map(c =>
            c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase(),
          )
          break

        case 'T': {
          // TN: toggle case of char at position N
          const pos = parsePosition(token[1])
          if (pos !== null && pos < chars.length) {
            const c = chars[pos]
            chars[pos] = c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase()
          }
          break
        }

        case 'r':
          chars.reverse()
          break

        case 'd':
          chars = [...chars, ...chars]
          break

        case 'f':
          chars = [...chars, ...[...chars].reverse()]
          break

        case '$':
          // $X: append character X
          if (token.length >= 2) chars.push(token.slice(1))
          break

        case '^':
          // ^X: prepend character X
          if (token.length >= 2) chars.unshift(token.slice(1))
          break

        case '[':
          // delete first char
          if (chars.length > 0) chars.shift()
          break

        case ']':
          // delete last char
          if (chars.length > 0) chars.pop()
          break

        case 's':
          // sXY: replace every occurrence of X with Y
          if (token.length >= 3) {
            const from = token[1]
            const to = token[2]
            chars = chars.map(c => (c === from ? to : c))
          }
          break

        case 'D': {
          // DN: delete char at position N (e.g. D0 = delete first char)
          const pos = parsePosition(token[1])
          if (pos !== null && pos < chars.length) {
            chars.splice(pos, 1)
          }
          break
        }

        case 'o': {
          // oNX: overwrite char at position N with char X
          if (token.length >= 3) {
            const pos = parsePosition(token[1])
            const ch = token[2]
            if (pos !== null && pos < chars.length) chars[pos] = ch
          }
          break
        }

        case 'i': {
          // iNX: insert char X at position N (N <= length allowed to append)
          if (token.length >= 3) {
            const pos = parsePosition(token[1])
            const ch = token[2]
            if (pos !== null && pos <= chars.length) {
              chars.splice(pos, 0, ch)
            }
          }
          break
        }

        case '*': {
          // *NM: swap chars at positions N and M
          if (token.length >= 3) {
            const posN = parsePosition(token[1])
            const posM = parsePosition(token[2])
            if (
              posN !== null && posM !== null &&
              posN < chars.length && posM < chars.length
            ) {
              ;[chars[posN], chars[posM]] = [chars[posM], chars[posN]]
            }
          }
          break
        }

        default:
          // unrecognised operator: silently skip (keeps best64.rule's { } working as no-op)
          break
      }
    }
    return { output: chars.join(''), valid: true }
  } catch {
    return { output: word, valid: false }
  }
}

export interface RuleMatch {
  baseWord: string
  /** index in the wordlist (0 = most frequent) */
  baseWordIndex: number
  rule: string
  /** index in the ruleset */
  ruleIndex: number
  /**
   * Estimated ordinal attempt at which an attacker enumerating
   * wordlist × ruleset in order would reach this combination.
   */
  attemptIndex: number
}

/**
 * Checks whether `password` can be derived from any (word, rule) pair.
 * Returns the first match found — equivalent to the first an attacker would
 * hit when enumerating the wordlist outer-loop, ruleset inner-loop.
 */
export function findRuleMatch(
  password: string,
  wordlist: readonly string[],
  ruleset: readonly string[],
): RuleMatch | null {
  for (let wIdx = 0; wIdx < wordlist.length; wIdx++) {
    const base = wordlist[wIdx]
    for (let rIdx = 0; rIdx < ruleset.length; rIdx++) {
      const rule = ruleset[rIdx]
      const { output, valid } = applyHashcatRule(base, rule)
      if (!valid) continue
      if (output === password) {
        return {
          baseWord: base,
          baseWordIndex: wIdx,
          rule,
          ruleIndex: rIdx,
          attemptIndex: wIdx * ruleset.length + rIdx + 1,
        }
      }
    }
  }
  return null
}
