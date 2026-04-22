import type { AppLanguage } from '../i18n'
import type { CharsetGroup, CharsetInfo } from '../types/security'

const BASE_CHARSET_GROUPS: CharsetGroup[] = [
  { id: 'lower', size: 26, re: /[a-z]/ },
  { id: 'upper', size: 26, re: /[A-Z]/ },
  { id: 'digits', size: 10, re: /[0-9]/ },
  { id: 'space', size: 1, re: /\s/ },
  {
    id: 'symbols',
    size: 33,
    re: /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/,
  },
]

/**
 * Raggruppa i caratteri non ASCII per famiglia Unicode usata nella password.
 * Il numero di bucket serve come euristica per stimare quanto ampio sia
 * l'alfabeto realmente disponibile oltre ai gruppi ASCII standard.
 */
function detectUnicodeBuckets(input: string): number {
  const buckets = new Set<string>()

  for (const char of input) {
    const point = char.codePointAt(0) ?? 0
    if (point <= 0x7f) continue

    if (point >= 0x00c0 && point <= 0x024f) buckets.add('latin-extended')
    else if (point >= 0x0370 && point <= 0x03ff) buckets.add('greek')
    else if (point >= 0x0400 && point <= 0x04ff) buckets.add('cyrillic')
    else if (point >= 0x0590 && point <= 0x06ff) buckets.add('hebrew-arabic')
    else if (point >= 0x0900 && point <= 0x109f) buckets.add('indic')
    else if (point >= 0x3040 && point <= 0x30ff) buckets.add('jp-kana')
    else if (point >= 0x4e00 && point <= 0x9fff) buckets.add('cjk')
    else if (point >= 0x1f300 && point <= 0x1faff) buckets.add('emoji')
    else buckets.add('other-unicode')
  }

  return buckets.size
}

/**
 * Conta i caratteri Unicode non ASCII distinti presenti nell'input.
 * Il conteggio evita di sovrastimare l'alfabeto quando lo stesso simbolo
 * viene ripetuto molte volte.
 */
function countUniqueNonAsciiCharacters(input: string): number {
  const uniqueChars = new Set<string>()

  for (const char of input) {
    if ((char.codePointAt(0) ?? 0) > 0x7f) {
      uniqueChars.add(char)
    }
  }

  return uniqueChars.size
}

/**
 * Stima la dimensione dell'alfabeto Unicode extra usato dalla password.
 * Combina unicita' dei caratteri e bucket Unicode per ottenere un valore
 * prudente, ma non limitato al solo numero di simboli osservati.
 */
function estimateUnicodeAlphabet(password: string): number {
  const uniqueUnicodeChars = countUniqueNonAsciiCharacters(password)
  if (uniqueUnicodeChars === 0) return 0

  const unicodeBuckets = detectUnicodeBuckets(password)

  return Math.max(
    uniqueUnicodeChars,
    uniqueUnicodeChars * 4,
    unicodeBuckets * 32,
  )
}

/**
 * Verifica se l'input contiene almeno un carattere significativo.
 * Gli spazi iniziali/finali non bastano ad attivare l'analisi password.
 */
export function hasMeaningfulInput(str: string): boolean {
  return str.trim().length > 0
}

/**
 * Converte un tempo in secondi in una stringa compatta e localizzata.
 * Gestisce valori estremamente grandi con soglie leggibili per l'utente.
 */
export function formatTime(seconds: number, language: AppLanguage): string {
  if (!isFinite(seconds) || seconds > 1e30) {
    return language === 'it' ? "> età dell'universo" : '> age of the universe'
  }
  if (seconds < 1) return language === 'it' ? '< 1 secondo' : '< 1 second'
  if (seconds < 60) return `${Math.round(seconds)} sec`
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`
  if (seconds < 86400) {
    return language === 'it'
      ? `${Math.round(seconds / 3600)} ore`
      : `${Math.round(seconds / 3600)} hrs`
  }
  if (seconds < 31536000) {
    return language === 'it'
      ? `${Math.round(seconds / 86400)} giorni`
      : `${Math.round(seconds / 86400)} days`
  }

  const years = seconds / 31536000
  const yearLabel = language === 'it' ? 'anni' : 'years'

  if (years < 1e3) return `${Math.round(years)} ${yearLabel}`
  if (years < 1e6) return `${(years / 1e3).toFixed(1)}K ${yearLabel}`
  if (years < 1e9) return `${(years / 1e6).toFixed(1)}M ${yearLabel}`
  if (years < 1e12) return `${(years / 1e9).toFixed(1)}B ${yearLabel}`
  if (years < 1e15) return `${(years / 1e12).toFixed(1)}T ${yearLabel}`

  return language === 'it' ? '> 10^15 anni' : '> 10^15 years'
}

/**
 * Restituisce la classe visuale associata a una stima di cracking.
 * Le soglie distinguono tempi immediati, intermedi e molto resistenti.
 */
export function timeClass(seconds: number): string {
  if (seconds < 3600) return 'danger'
  if (seconds > 3_153_600_000) return 'safe'
  return ''
}

/**
 * Formatta il numero stimato di tentativi in una notazione breve.
 * Mantiene leggibili valori molto grandi senza perdere l'ordine di grandezza.
 */
export function fmtGuesses(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}G`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return `${Math.round(n)}`
}

/**
 * Analizza i gruppi di caratteri presenti nella password e calcola
 * l'entropia teorica come lunghezza * log2(dimensione charset stimata).
 * Il risultato include anche i gruppi attivi per la visualizzazione UI.
 */
export function analyzeCharset(password: string): CharsetInfo {
  let charsetSize = 0
  const active: CharsetGroup[] = []

  for (const group of BASE_CHARSET_GROUPS) {
    if (group.re?.test(password)) {
      charsetSize += group.size
      active.push(group)
    }
  }

  const unicodeAlphabetSize = estimateUnicodeAlphabet(password)
  const hasOtherUnicode = unicodeAlphabetSize > 0

  if (hasOtherUnicode) {
    const unicodeGroup = {
      id: 'unicode' as const,
      size: unicodeAlphabetSize,
    }

    active.push(unicodeGroup)
    charsetSize += unicodeGroup.size
  }

  const entropy = password.length > 0 && charsetSize > 0
    ? password.length * Math.log2(charsetSize)
    : 0

  return {
    charsetSize,
    active,
    entropy,
    allGroups: [
      ...BASE_CHARSET_GROUPS,
      { id: 'unicode', size: Math.max(unicodeAlphabetSize, 1) },
    ],
    hasOtherUnicode,
  }
}
