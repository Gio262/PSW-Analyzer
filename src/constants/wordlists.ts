/**
 * Top passwords and common words used as password bases (Italian + English).
 * Ordered by real-world frequency so findRuleMatch returns the lowest
 * attemptIndex (earliest position an attacker would reach).
 *
 * Source: aggregated from RockYou, HaveIBeenPwned and SecLists datasets.
 *
 * Size note: this embedded list (~200 words) is intentionally small to keep
 * the JS bundle lean. A production deployment would fetch a larger JSON wordlist
 * (top 10k+) lazily from a CDN and cache it in IndexedDB.
 */
export const TOP_PASSWORDS_COMBINED: readonly string[] = [
  // ── Most common passwords worldwide ────────────────────────────────────────
  'password', '123456', '12345678', '123456789', '1234567890',
  '12345', '1234567', '1234', '111111', '000000', '123', '1111',
  'abc123', 'qwerty', 'monkey', 'letmein', 'dragon', 'master',
  'login', 'passw0rd', 'password1', 'superman', 'batman',
  'access', 'shadow', 'welcome', 'sunshine', 'princess', 'iloveyou',
  'football', 'baseball', 'basketball', 'trustno1', 'starwars',
  'mypass', 'pass', 'hello', 'love', 'secret', 'admin', 'root',
  'user', 'test', 'guest', 'default', 'changeme', 'computer',
  'internet', 'chocolate', 'cheese', 'orange', 'banana', 'apple',
  'hunter', 'magic', 'ninja', 'pirate', 'ranger',

  // ── Common Italian passwords / words ───────────────────────────────────────
  'ciao', 'amore', 'juventus', 'milan', 'napoli', 'roma', 'inter',
  'pizza', 'sole', 'mare', 'italia', 'calcio', 'forza', 'bello',
  'bella', 'prova', 'casa', 'amico', 'amici', 'buono', 'buona',
  'anima', 'vita', 'cuore', 'cielo', 'terra', 'acqua', 'fuoco',
  'vento', 'notte', 'giorno', 'fiume', 'monte', 'lago', 'bosco',
  'stelle', 'luna', 'sogno', 'guerra', 'pace', 'libero', 'forte',
  'scuola', 'lavoro', 'sport', 'musica', 'arte', 'libro', 'film',

  // ── Italian common first names ─────────────────────────────────────────────
  'mario', 'luigi', 'giovanni', 'andrea', 'marco', 'luca', 'matteo',
  'antonio', 'giuseppe', 'franco', 'giulia', 'sara', 'anna', 'maria',
  'elena', 'laura', 'chiara', 'alessia', 'martina', 'sofia', 'lucia',
  'rosa', 'paola', 'carla', 'silvio', 'roberto', 'claudio', 'davide',

  // ── Italian cities ─────────────────────────────────────────────────────────
  'milano', 'torino', 'venezia', 'firenze', 'bologna', 'palermo',
  'catania', 'bari', 'verona', 'padova', 'trieste', 'genova',

  // ── English common first names ─────────────────────────────────────────────
  'michael', 'jessica', 'jennifer', 'ashley', 'amanda', 'daniel',
  'matthew', 'andrew', 'joseph', 'david', 'james', 'robert', 'thomas',
  'charlie', 'taylor', 'jordan', 'brandon', 'tyler',
  'emma', 'olivia', 'sophia', 'mia', 'emily', 'grace', 'hannah',

  // ── Common English words used in passwords ─────────────────────────────────
  'spring', 'summer', 'winter', 'autumn', 'flower', 'angel',
  'happy', 'lucky', 'king', 'queen', 'tiger', 'eagle', 'wolf',
  'lion', 'bear', 'stone', 'rock', 'fire', 'water', 'earth',
  'silver', 'gold', 'thunder', 'storm', 'light', 'dark', 'black',
  'white', 'blue', 'red', 'green', 'star', 'moon', 'sky', 'ocean',
  'river', 'mountain', 'forest', 'garden', 'house', 'home',
  'family', 'friend', 'music', 'guitar', 'piano', 'power', 'dream',
  'hope', 'faith', 'brave', 'free', 'wild', 'sweet', 'strong',

  // ── Brands / tech ─────────────────────────────────────────────────────────
  'google', 'facebook', 'twitter', 'windows', 'linux',
  'android', 'samsung', 'iphone', 'oracle', 'cisco', 'amazon',
  'ferrari', 'vespa', 'fiat',
] as const
