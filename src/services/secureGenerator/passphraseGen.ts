import { randomIntBelow } from './rejectionSampling'

export type DicewareList = 'eff-long' | 'eff-short1' | 'reinhold-en'

export interface PassphraseOptions {
  wordCount: number
  list: DicewareList
  separator: string
  capitalize: boolean
  appendDigit: boolean
  appendSymbol: boolean
}

export interface PassphraseResult {
  passphrase: string
  /** Exact entropy in bits: wordCount × log₂(listSize) + optional digit/symbol bits */
  entropyBits: number
  listSize: number
  wordsUsed: string[]
}

export async function loadWordlist(list: DicewareList): Promise<readonly string[]> {
  switch (list) {
    case 'eff-long': {
      const mod = await import('../../constants/diceware/eff-long')
      return mod.EFF_LONG_WORDLIST
    }
    case 'eff-short1': {
      const mod = await import('../../constants/diceware/eff-short1')
      return mod.EFF_SHORT1_WORDLIST
    }
    case 'reinhold-en': {
      const mod = await import('../../constants/diceware/reinhold-en')
      return mod.REINHOLD_WORDLIST
    }
    default: {
      const _exhaustive: never = list
      throw new Error(`Unknown wordlist: ${String(_exhaustive)}`)
    }
  }
}

export async function generateSecurePassphrase(
  options: PassphraseOptions,
): Promise<PassphraseResult> {
  if (options.wordCount < 1) throw new Error('wordCount must be >= 1')

  const words = await loadWordlist(options.list)
  const listSize = words.length

  const selected: string[] = []
  for (let i = 0; i < options.wordCount; i++) {
    const word = words[randomIntBelow(listSize)]
    selected.push(options.capitalize ? capitalizeFirst(word) : word)
  }

  let passphrase = selected.join(options.separator)

  if (options.appendDigit) {
    passphrase += '0123456789'[randomIntBelow(10)]
  }
  if (options.appendSymbol) {
    const syms = '!@#$%^&*'
    passphrase += syms[randomIntBelow(syms.length)]
  }

  let entropyBits = options.wordCount * Math.log2(listSize)
  if (options.appendDigit)  entropyBits += Math.log2(10)
  if (options.appendSymbol) entropyBits += Math.log2(8)

  return { passphrase, entropyBits, listSize, wordsUsed: selected }
}

function capitalizeFirst(w: string): string {
  return w.length === 0 ? w : w[0].toUpperCase() + w.slice(1)
}
