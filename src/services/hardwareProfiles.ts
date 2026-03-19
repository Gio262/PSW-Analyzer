import type { AttackScenarioId, HardwareProfile } from '../types/security'

const API_TIMEOUT_MS = 5000

type RawHardwareProfile = {
  id: string
  label?: string
  description?: string
  rates: Partial<Record<AttackScenarioId, number>>
}

function isValidRate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function sanitizeProfiles(rawProfiles: RawHardwareProfile[]): HardwareProfile[] {
  return rawProfiles
    .filter((item) => item && typeof item.id === 'string' && item.id.trim().length > 0)
    .map((item) => {
      const rates = {
        online_throttled: isValidRate(item.rates?.online_throttled) ? item.rates.online_throttled : 100,
        slow_hash: isValidRate(item.rates?.slow_hash) ? item.rates.slow_hash : 10_000,
        fast_hash: isValidRate(item.rates?.fast_hash) ? item.rates.fast_hash : 10_000_000_000,
      }

      return {
        id: item.id,
        labelKey: item.label ?? item.id,
        descriptionKey: item.description ?? item.id,
        rates,
      }
    })
}

export async function fetchHardwareProfiles(apiUrl: string): Promise<HardwareProfile[]> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS)

  try {
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`hardware_profiles_http_${response.status}`)
    }

    const payload = await response.json() as unknown
    if (!Array.isArray(payload)) {
      throw new Error('hardware_profiles_invalid_payload')
    }

    const profiles = sanitizeProfiles(payload as RawHardwareProfile[])

    if (profiles.length === 0) {
      throw new Error('hardware_profiles_empty')
    }

    return profiles
  } finally {
    window.clearTimeout(timeoutId)
  }
}
