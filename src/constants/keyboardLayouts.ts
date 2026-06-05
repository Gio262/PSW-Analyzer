export interface KeyboardLayoutDefinition {
  id: string
  label: string
  description: string
  /** Rows of keys, top to bottom */
  rows: string[][]
  /** Horizontal offset (in key units) for each row — models the physical stagger */
  rowOffsets: number[]
}

export const KEYBOARD_LAYOUTS: KeyboardLayoutDefinition[] = [
  // ── QWERTY Italia ──────────────────────────────────────────────────────────
  {
    id: 'qwerty-it',
    label: 'QWERTY (Italia)',
    description: 'Layout italiano standard (Windows/Linux/Mac)',
    rows: [
      ['\\|', '1!', '2"', '3£', '4$', '5%', '6&', '7/', '8(', '9)', '0=', "'?", 'ì^'],
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'è é', '+*'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ò ç', 'à °', 'ù §'],
      ['<>', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',;', '.:', '-_'],
    ],
    rowOffsets: [0, 0.5, 0.75, 0.25],
  },

  // ── QWERTY US (reference) ──────────────────────────────────────────────────
  {
    id: 'qwerty-us',
    label: 'QWERTY (US)',
    description: 'American layout — also used as the physical keyboard in China',
    rows: [
      ['`~', '1!', '2@', '3#', '4$', '5%', '6^', '7&', '8*', '9(', '0)', '-_', '=+'],
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[{', ']}', '\\|'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';:', "'\""],
      ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',<', '.>', '/?'],
    ],
    rowOffsets: [0, 0.5, 0.75, 1.25],
  },

  // ── JCUKEN Russia ─────────────────────────────────────────────────────────
  {
    id: 'jcuken-ru',
    label: 'ЙЦУКЕН (Russia)',
    description: 'Standard Russian Windows layout',
    rows: [
      ['ё Ё', '1!', '2"', '3№', '4;', '5%', '6:', '7?', '8*', '9(', '0)', '-_', '=+'],
      ['й Й', 'ц Ц', 'у У', 'к К', 'е Е', 'н Н', 'г Г', 'ш Ш', 'щ Щ', 'з З', 'х Х', 'ъ Ъ'],
      ['ф Ф', 'ы Ы', 'в В', 'а А', 'п П', 'р Р', 'о О', 'л Л', 'д Д', 'ж Ж', 'э Э'],
      ['я Я', 'ч Ч', 'с С', 'м М', 'и И', 'т Т', 'ь Ь', 'б Б', 'ю Ю', '.,'],
    ],
    rowOffsets: [0, 0.5, 0.75, 1.25],
  },

  // ── Persiano / Farsi – ISIRI 9147 ─────────────────────────────────────────
  {
    id: 'farsi-isiri',
    label: 'فارسی – ISIRI 9147 (Iran)',
    description: 'Iranian national standard ISIRI 9147',
    rows: [
      ['÷×', '١!', '٢٬', '٣٫', '٤﷼', '٥٪', '٦×', '٧،', '٨*', '٩)', '٠(', '-ـ', '=+'],
      ['ض ْ', 'ص ٌ', 'ث ٍ', 'ق ً', 'ف ُ', 'غ ِ', 'ع َ', 'ه ّ', 'خ ]', 'ح [', 'ج }', 'چ {'],
      ['ش ؤ', 'س ئ', 'ي ي', 'ب إ', 'ل أ', 'ا آ', 'ت ة', 'ن »', 'م «', 'ک :', 'گ ؛'],
      ['ظ ك', 'ط ٓ', 'ز ژ', 'ر ٰ', 'ذ ‌', 'د ‍', 'پ ء', 'و و', '.؟', '/؟'],
    ],
    rowOffsets: [0, 0.5, 0.75, 1.25],
  },

  // ── Persiano / Farsi – Windows ────────────────────────────────────────────
  {
    id: 'farsi-windows',
    label: 'فارسی – Windows (Iran)',
    description: 'Windows Farsi default layout (Windows 10/11)',
    rows: [
      ['`~', '1!', '2@', '3#', '4$', '5٪', '6^', '7&', '8*', '9)', '0(', '-_', '=+'],
      ['ض ْ', 'ص ٌ', 'ث ٍ', 'ق ً', 'ف ُ', 'غ ِ', 'ع َ', 'ه ّ', 'خ ]', 'ح [', 'ج }', 'چ {'],
      ['ش ؤ', 'س ئ', 'ي ی', 'ب إ', 'ل أ', 'ا آ', 'ت ة', 'ن »', 'م «', 'ک:', 'گ ؛'],
      ['ظ ك', 'ط ٓ', 'ز ژ', 'ر ٰ', 'ذ ‌', 'د ‍', 'پ ء', 'و و', '.؟', '/؟'],
    ],
    rowOffsets: [0, 0.5, 0.75, 1.25],
  },

  // ── Coreano Dubeolsik ─────────────────────────────────────────────────────
  {
    id: 'dubeolsik-kr',
    label: '두벌식 Dubeolsik (Corea)',
    description: '2-set Korean layout, standard in South and North Korea',
    rows: [
      ['`~', '1!', '2@', '3#', '4$', '5%', '6^', '7&', '8*', '9(', '0)', '-_', '=+'],
      ['ㅂㅃ', 'ㅈㅉ', 'ㄷㄸ', 'ㄱㄲ', 'ㅅㅆ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐㅒ', 'ㅔㅖ', '[{', ']}', '\\|'],
      ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ', ';:', "'\""],
      ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ', ',<', '.>', '/?'],
    ],
    rowOffsets: [0, 0.5, 0.75, 1.25],
  },

  // ── AZERTY (Francia/Belgio) ───────────────────────────────────────────────
  {
    id: 'azerty-fr',
    label: 'AZERTY (Francia)',
    description: 'Standard French layout',
    rows: [
      ['²³', '&1', 'é2', '"3', "'4", '(5', '-6', 'è7', '_8', 'ç9', 'à0', ')°', '=+'],
      ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '^¨', '$£'],
      ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'ù%', '*µ'],
      ['<>', 'w', 'x', 'c', 'v', 'b', 'n', ',?', ';.', ':/', '!§'],
    ],
    rowOffsets: [0, 0.5, 0.75, 0.25],
  },

  // ── QWERTZ (Germania/Svizzera) ────────────────────────────────────────────
  {
    id: 'qwertz-de',
    label: 'QWERTZ (Germania)',
    description: 'Standard German layout',
    rows: [
      ['^°', '1!', '2"', '3§', '4$', '5%', '6&', '7/', '8(', '9)', '0=', 'ß?', '´`'],
      ['q', 'w', 'e', 'r', 't', 'z', 'u', 'i', 'o', 'p', 'üÜ', '+*'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'öÖ', 'äÄ', "#'"],
      ['<>', 'y', 'x', 'c', 'v', 'b', 'n', 'm', ',;', '.:', '-_'],
    ],
    rowOffsets: [0, 0.5, 0.75, 0.25],
  },

  // ── Dvorak ────────────────────────────────────────────────────────────────
  {
    id: 'dvorak',
    label: 'Dvorak',
    description: 'Ergonomic alternative layout',
    rows: [
      ['`~', '1!', '2@', '3#', '4$', '5%', '6^', '7&', '8*', '9(', '0)', '[{', ']}'],
      ["'\"", ',<', '.>', 'p', 'y', 'f', 'g', 'c', 'r', 'l', '/?', '=+', '\\|'],
      ['a', 'o', 'e', 'u', 'i', 'd', 'h', 't', 'n', 's', '-_'],
      [';:', 'q', 'j', 'k', 'x', 'b', 'm', 'w', 'v', 'z'],
    ],
    rowOffsets: [0, 0.5, 0.75, 1.25],
  },
]

/** Default layouts active on startup (matches app's default locale: Italian + US baseline) */
export const DEFAULT_SELECTED_LAYOUTS = ['qwerty-it', 'qwerty-us']
