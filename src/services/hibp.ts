export type HibpErrorCode =
  | 'CRYPTO_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'UNKNOWN'

export class HibpClientError extends Error {
  code: HibpErrorCode

  constructor(code: HibpErrorCode, message: string) {
    super(message)
    this.name = 'HibpClientError'
    this.code = code
  }
}

async function sha1hex(str: string): Promise<string> {
  if (!window.crypto?.subtle) {
    throw new HibpClientError('CRYPTO_UNAVAILABLE', 'Web Crypto API unavailable')
  }

  const buf = new TextEncoder().encode(str)
  const hash = await crypto.subtle.digest('SHA-1', buf)

  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

function mapHttpError(status: number): HibpClientError {
  if (status === 429) {
    return new HibpClientError('RATE_LIMITED', 'Rate limited')
  }

  if (status >= 500) {
    return new HibpClientError('SERVICE_UNAVAILABLE', 'HIBP service unavailable')
  }

  return new HibpClientError('UNKNOWN', `HIBP HTTP ${status}`)
}

export async function checkHIBP(password: string): Promise<{ found: boolean; count: number }> {
  const hash = await sha1hex(password)
  const prefix = hash.slice(0, 5)
  const suffix = hash.slice(5)

  let res: Response

  try {
    res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    })
  } catch {
    throw new HibpClientError('NETWORK_ERROR', 'Network unavailable')
  }

  if (!res.ok) {
    throw mapHttpError(res.status)
  }

  const text = await res.text()

  for (const line of text.split('\n')) {
    const [resultSuffix, count] = line.trim().split(':')
    if (resultSuffix && resultSuffix.toUpperCase() === suffix) {
      return { found: true, count: parseInt(count, 10) || 0 }
    }
  }

  return { found: false, count: 0 }
}
