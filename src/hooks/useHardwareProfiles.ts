import { useEffect, useMemo, useState } from 'react'
import { LOCAL_HARDWARE_PROFILES } from '../constants/security'
import { fetchHardwareProfiles } from '../services/hardwareProfiles'
import type { HardwareProfile } from '../types/security'

type SourceType = 'local' | 'remote'

export function useHardwareProfiles() {
  const [profiles, setProfiles] = useState<HardwareProfile[]>(LOCAL_HARDWARE_PROFILES)
  const [source, setSource] = useState<SourceType>('local')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_HARDWARE_PROFILES_API as string | undefined
    if (!apiUrl) return

    let cancelled = false

    void (async () => {
      try {
        const remoteProfiles = await fetchHardwareProfiles(apiUrl)
        if (cancelled) return
        setProfiles(remoteProfiles)
        setSource('remote')
        setError(null)
      } catch {
        if (cancelled) return
        setProfiles(LOCAL_HARDWARE_PROFILES)
        setSource('local')
        setError('crack.hardware.remoteError')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return useMemo(() => ({ profiles, source, error }), [profiles, source, error])
}
