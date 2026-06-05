import { randomBytes } from './csprng'

function copyToArrayBufferView(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy
}

/**
 * Mixes entropy from N sources using HKDF (RFC 5869) with SHA-256.
 *
 * Security property: if even ONE input source is genuinely random,
 * the output is computationally indistinguishable from uniform random,
 * even if all other sources are attacker-controlled.
 *
 * This is defense-in-depth on top of the browser CSPRNG.
 * For normal use the CSPRNG alone is sufficient; this adds paranoid-mode
 * assurance when mixing in user-derived entropy (mouse jitter, etc.).
 */
export async function mixEntropy(
  sources: Uint8Array[],
  salt?: Uint8Array,
  info?: string,
): Promise<Uint8Array> {
  if (sources.length === 0) throw new Error('At least one source required')

  const totalLen = sources.reduce((sum, s) => sum + s.length, 0)
  const ikm = new Uint8Array(totalLen)
  let offset = 0
  for (const s of sources) {
    ikm.set(s, offset)
    offset += s.length
  }

  const effectiveSalt: Uint8Array<ArrayBuffer> = salt
    ? copyToArrayBufferView(salt)
    : new Uint8Array(32)
  const infoBytes = new TextEncoder().encode(info ?? 'psw-analyzer-entropy-mix-v1')

  // HKDF-Extract: PRK = HMAC-SHA256(salt, IKM)
  const saltKey = await crypto.subtle.importKey(
    'raw', effectiveSalt, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const prk = await crypto.subtle.sign('HMAC', saltKey, ikm)

  // HKDF-Expand T(1) = HMAC-SHA256(PRK, info || 0x01)
  const prkKey = await crypto.subtle.importKey(
    'raw', prk, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const t1Input = new Uint8Array(infoBytes.length + 1)
  t1Input.set(infoBytes, 0)
  t1Input[infoBytes.length] = 0x01
  const t1 = await crypto.subtle.sign('HMAC', prkKey, t1Input)

  return new Uint8Array(t1)
}

/**
 * Collects mouse movement timing jitter as an additional entropy source.
 * Attach handleMouseMove to the window mousemove event, then drain()
 * before calling mixEntropy().
 */
export class MouseJitterCollector {
  private samples: number[] = []
  private lastTimestamp: number | null = null

  handleMouseMove = (e: MouseEvent): void => {
    const now = performance.now()
    if (this.lastTimestamp !== null) {
      const dt = now - this.lastTimestamp
      // Sub-millisecond jitter depends on kernel scheduler + hardware interrupts
      const lsb = Math.floor((dt % 1) * 1000) & 0xff
      this.samples.push(lsb, e.clientX & 0xff, e.clientY & 0xff)
    }
    this.lastTimestamp = now
  }

  get byteCount(): number {
    return this.samples.length
  }

  drain(): Uint8Array {
    const out = new Uint8Array(this.samples)
    this.samples = []
    this.lastTimestamp = null
    return out
  }
}

// Re-export for convenience when building the CSPRNG-only path
export { randomBytes }
