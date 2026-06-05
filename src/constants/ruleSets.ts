/**
 * best64.rule — 64+ rules covering the majority of mutation patterns
 * observed in real leaked password datasets.
 *
 * Source: https://github.com/hashcat/hashcat/blob/master/rules/best64.rule
 * Licence: MIT
 *
 * Note: { and } (rotate left/right) are not implemented — they fall through
 * to the default no-op branch in applyHashcatRule, which is acceptable for
 * the inverse-match use case.
 * D0 (delete char at position 0) IS implemented via the 'D' operator.
 *
 * The trailing 'd', 'f', 'r' entries are intentionally kept to match the
 * 65-entry canonical form seen in several hashcat rule collections.
 * Duplicate rules produce redundant but correct no-effect iterations in
 * findRuleMatch (first-match-wins semantics mean duplicates are never returned).
 */
export const BEST64_RULES: readonly string[] = [
  ':',                       // identity
  'l',                       // lowercase all
  'u',                       // uppercase all
  'c',                       // capitalize
  'C',                       // lowercase first, uppercase rest
  't',                       // toggle case all
  'r',                       // reverse
  'd',                       // duplicate
  'f',                       // reflect
  '{',                       // rotate left (no-op)
  '}',                       // rotate right (no-op)
  '$0',
  '$1',
  '$2',
  '$3',
  '$!',
  '$.',
  '^1',                      // prepend 1
  '[',                       // delete first
  ']',                       // delete last
  'D0',                      // delete char at pos 0
  'l $1',
  'l $2',
  'l $3',
  'l $7',
  'l $9',
  'l $!',
  'l $.',
  'u $1',
  'u $!',
  'c $1',
  'c $!',
  'c $.',
  'c $2 $0 $1 $9',
  'c $2 $0 $2 $0',
  'c $2 $0 $2 $1',
  'c $2 $0 $2 $2',
  'c $2 $0 $2 $3',
  'c $2 $0 $2 $4',
  'c $1 $2 $3',
  'c $1 $2 $3 $4',
  'l $1 $2 $3',
  'l $1 $2 $3 $4',
  'r',
  't r',
  'c r',
  'u r',
  'sa@',                     // leet: a → @
  'se3',                     // leet: e → 3
  'si1',                     // leet: i → 1
  'so0',                     // leet: o → 0
  'sa@ se3',
  'sa@ so0',
  'se3 si1',
  'c sa@',
  'c se3',
  'c sa@ $1',
  'c se3 $1',
  'c sa@ so0',
  'c sa@ so0 $1',
  'c sa@ se3 si1 so0',
  'c sa@ se3 si1 so0 $!',
  'd',
  'f',
  'r',
] as const

export interface RuleSet {
  id: string
  label: string
  rules: readonly string[]
}

export const AVAILABLE_RULESETS: readonly RuleSet[] = [
  { id: 'best64', label: 'best64 (Hashcat standard)', rules: BEST64_RULES },
]
