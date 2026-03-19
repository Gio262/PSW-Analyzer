import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export const SUPPORTED_LANGUAGES = [
  { code: 'it', label: 'Italiano', shortLabel: 'IT' },
  { code: 'en', label: 'English', shortLabel: 'EN' },
] as const

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code']

const DEFAULT_LANGUAGE: AppLanguage = 'it'
const LANGUAGE_STORAGE_KEY = 'psw-analyzer-language'
const SUPPORTED_LANGUAGE_CODES = new Set<AppLanguage>(
  SUPPORTED_LANGUAGES.map(({ code }) => code),
)

function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value !== undefined && value !== null && SUPPORTED_LANGUAGE_CODES.has(value as AppLanguage)
}

function getInitialLanguage(): AppLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
  if (isAppLanguage(storedLanguage)) return storedLanguage

  const browserLanguage = window.navigator.language.toLowerCase()
  const detectedLanguage = SUPPORTED_LANGUAGES.find(
    ({ code }) => browserLanguage === code || browserLanguage.startsWith(`${code}-`),
  )

  return detectedLanguage?.code ?? DEFAULT_LANGUAGE
}

const resources = {
  it: {
    translation: {
      language: {
        label: 'Lingua',
        switcherAriaLabel: 'Seleziona la lingua del sito',
      },
      header: {
        subtitle:
          'analisi locale nel browser - nessun invio al server salvo check HIBP esplicito',
      },
      notice: {
        title: 'Sicurezza:',
        beforeBrowser: 'Questo tool gira',
        browser: 'principalmente nel tuo browser',
        beforeHash:
          "- nessuna password viene inviata a un server durante l'analisi locale. L'unica eccezione è il check HIBP attivato dal pulsante: invia solo i",
        hash: "primi 5 caratteri dell'hash SHA-1",
        afterHash: 'tramite k-anonymity, mai la password completa.',
      },
      input: {
        title: 'Input password / passphrase',
        placeholder: 'digita password o passphrase da analizzare...',
        ariaLabel: 'Password o passphrase da analizzare',
        show: 'Mostra password',
        hide: 'Nascondi password',
        scoreLabel: 'Score zxcvbn',
      },
      entropy: {
        title: 'Entropia',
        theoreticalLabel: 'Entropia teorica',
        theoreticalSub: '{{length}} char x log2({{charsetSize}}) - stima semplificata su charset',
        effectiveLabel: 'Entropia effettiva (zxcvbn)',
        effectiveSub: 'log2({{guesses}} guess) - considera pattern reali',
        groupsLabel: 'Gruppi di caratteri rilevati',
        unicodeNote:
          "ⓘ Sono presenti caratteri non ASCII: la stima teorica del charset è approssimata e potrebbe non riflettere bene l'alfabeto reale usato.",
        generalNote:
          "ⓘ L'entropia teorica assume scelta casuale uniforme dei caratteri e tende a sovrastimare password umane. L'entropia effettiva derivata da zxcvbn è in genere più utile per stimare la prevedibilità.",
        placeholder: "↑ inserisci una password per iniziare l'analisi",
        groups: {
          lower: 'a-z',
          upper: 'A-Z',
          digits: '0-9',
          space: 'spazi',
          symbols: '!@#...',
        },
      },
      crack: {
        title: 'Tempo di crack stimato',
        scenarioLabel: 'Scenario',
        estimatedTimeLabel: 'Tempo stimato',
        average: 'medio',
        max: 'max',
        note:
          'ⓘ Stima basata su {{guesses}} guess di zxcvbn. "Medio" assume successo a metà spazio di ricerca; "max" assume esplorazione completa. Gli scenari sono indicativi, non universali.',
      },
      feedback: {
        title: 'Analisi qualitativa (zxcvbn)',
        none: 'Nessuna debolezza strutturale evidente rilevata da zxcvbn',
        predictablePatterns:
          "L'entropia effettiva è circa {{delta}} bit sotto la teorica: sono presenti pattern prevedibili o parole comuni",
        leadingTrailingSpaces:
          'La password inizia o termina con spazi: controlla che sia intenzionale',
      },
      hibp: {
        title: 'Have I Been Pwned - breach check',
        button: 'Controlla breach',
        idle: 'Inserisci una password poi premi il pulsante',
        reset: 'Password modificata: esegui di nuovo il controllo breach',
        checking: 'Calcolo SHA-1 e query HIBP...',
        safe: '✓ Non trovata nel dataset HIBP',
        found: '⚠ Trovata in {{occurrences}} occorrenze - cambia questa password subito',
        error: 'Errore: {{message}} - rete non disponibile o servizio non raggiungibile',
        noteLine1:
          'ⓘ Usa k-anonymity: invia solo SHA1[0:5] a api.pwnedpasswords.com - la password non esce mai dal browser.',
        noteLine2: 'Richiede connessione internet. Se sei offline, salta questo check.',
      },
      footer: {
        telemetry: 'nessun log, nessuna telemetria applicativa',
      },
      scenarios: {
        online_throttled: {
          label: 'Online limitato',
          desc: 'Login protetto da rate-limit, CAPTCHA o lockout',
          unit: '100/sec',
        },
        slow_hash: {
          label: 'Hash lento offline',
          desc: 'bcrypt / Argon2 / scrypt - KDF intenzionalmente costoso',
          unit: '10K/sec',
        },
        fast_hash: {
          label: 'Hash veloce offline',
          desc: 'Hash rapidi o leakage mal protetti',
          unit: '10G/sec',
        },
      },
      scores: {
        0: 'Molto debole',
        1: 'Debole',
        2: 'Discreta',
        3: 'Buona',
        4: 'Ottima',
      },
    },
  },
  en: {
    translation: {
      language: {
        label: 'Language',
        switcherAriaLabel: 'Select the site language',
      },
      header: {
        subtitle:
          'local browser-side analysis - nothing is sent to a server unless you explicitly run the HIBP check',
      },
      notice: {
        title: 'Security:',
        beforeBrowser: 'This tool runs',
        browser: 'primarily in your browser',
        beforeHash:
          '- no password is sent to a server during local analysis. The only exception is the HIBP check triggered by the button: it sends only the',
        hash: 'first 5 characters of the SHA-1 hash',
        afterHash: 'through k-anonymity, never the full password.',
      },
      input: {
        title: 'Password / passphrase input',
        placeholder: 'type the password or passphrase to analyze...',
        ariaLabel: 'Password or passphrase to analyze',
        show: 'Show password',
        hide: 'Hide password',
        scoreLabel: 'zxcvbn score',
      },
      entropy: {
        title: 'Entropy',
        theoreticalLabel: 'Theoretical entropy',
        theoreticalSub: '{{length}} chars x log2({{charsetSize}}) - simplified charset estimate',
        effectiveLabel: 'Effective entropy (zxcvbn)',
        effectiveSub: 'log2({{guesses}} guesses) - accounts for real-world patterns',
        groupsLabel: 'Detected character groups',
        unicodeNote:
          'ⓘ Non-ASCII characters detected: the theoretical charset estimate is approximate and may not reflect the real alphabet being used.',
        generalNote:
          'ⓘ Theoretical entropy assumes uniformly random character choice and tends to overestimate human-made passwords. The effective entropy derived from zxcvbn is usually more useful for estimating predictability.',
        placeholder: '↑ enter a password to start the analysis',
        groups: {
          lower: 'a-z',
          upper: 'A-Z',
          digits: '0-9',
          space: 'spaces',
          symbols: '!@#...',
        },
      },
      crack: {
        title: 'Estimated crack time',
        scenarioLabel: 'Scenario',
        estimatedTimeLabel: 'Estimated time',
        average: 'avg',
        max: 'max',
        note:
          'ⓘ Estimate based on {{guesses}} zxcvbn guesses. "Avg" assumes success halfway through the search space; "max" assumes a full search. These scenarios are indicative, not universal.',
      },
      feedback: {
        title: 'Qualitative analysis (zxcvbn)',
        none: 'No obvious structural weakness detected by zxcvbn',
        predictablePatterns:
          'Effective entropy is about {{delta}} bits below the theoretical estimate: predictable patterns or common words are present',
        leadingTrailingSpaces:
          'The password starts or ends with spaces: verify that this is intentional',
      },
      hibp: {
        title: 'Have I Been Pwned - breach check',
        button: 'Check breach',
        idle: 'Enter a password and then press the button',
        reset: 'Password changed: run the breach check again',
        checking: 'Computing SHA-1 and querying HIBP...',
        safe: '✓ Not found in the HIBP dataset',
        found: '⚠ Found {{occurrences}} times - change this password now',
        error: 'Error: {{message}} - network unavailable or service unreachable',
        noteLine1:
          'ⓘ Uses k-anonymity: only SHA1[0:5] is sent to api.pwnedpasswords.com - the password never leaves the browser.',
        noteLine2: 'Requires an internet connection. If you are offline, skip this check.',
      },
      footer: {
        telemetry: 'no logs, no app telemetry',
      },
      scenarios: {
        online_throttled: {
          label: 'Rate-limited online',
          desc: 'Login protected by rate limits, CAPTCHA, or lockout',
          unit: '100/sec',
        },
        slow_hash: {
          label: 'Slow offline hash',
          desc: 'bcrypt / Argon2 / scrypt - intentionally expensive KDF',
          unit: '10K/sec',
        },
        fast_hash: {
          label: 'Fast offline hash',
          desc: 'Fast hashes or poorly protected leaks',
          unit: '10G/sec',
        },
      },
      scores: {
        0: 'Very weak',
        1: 'Weak',
        2: 'Fair',
        3: 'Good',
        4: 'Excellent',
      },
    },
  },
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES.map(({ code }) => code),
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
})

i18n.on('languageChanged', (language) => {
  if (typeof window === 'undefined' || !isAppLanguage(language)) return
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
})

export function normalizeLanguage(value: string | undefined): AppLanguage {
  return isAppLanguage(value) ? value : DEFAULT_LANGUAGE
}

export default i18n
