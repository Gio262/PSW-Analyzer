export class CsprngError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CsprngError'
  }
}

/**
 * Verifies the environment has a valid CSPRNG (Web Crypto API, SP 800-90A compliant).
 * Call once at app startup.
 */
export function assertCsprngAvailable(): void {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
    throw new CsprngError(
      'Web Crypto API not available. Environment is not safe for password generation.',
    )
  }
  const test = new Uint8Array(32)
  crypto.getRandomValues(test)
  if (test.every(b => b === 0)) {
    throw new CsprngError('CSPRNG returned all-zero output: environment may be compromised.')
  }
}

/**
 * Fills a buffer with cryptographically random bytes.
 * Handles the 64 KiB per-call limit of getRandomValues by chunking.
 */
export function randomBytes(length: number): Uint8Array {
  if (length <= 0 || !Number.isInteger(length)) {
    throw new CsprngError(`Invalid length: ${length}`)
  }
  if (length > 65536) {
    const out = new Uint8Array(length)
    let offset = 0
    while (offset < length) {
      const chunkLen = Math.min(65536, length - offset)
      const chunk = new Uint8Array(chunkLen)
      crypto.getRandomValues(chunk)
      out.set(chunk, offset)
      offset += chunkLen
    }
    return out
  }
  const buf = new Uint8Array(length)
  crypto.getRandomValues(buf)
  return buf
}

/** Returns a cryptographically random Uint32 in [0, 2^32). */
export function randomUint32(): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0]
}
