import type { ZxcvbnResult } from '@zxcvbn-ts/core'

export type CharsetGroupId = 'lower' | 'upper' | 'digits' | 'space' | 'symbols' | 'unicode'
export type AttackScenarioId = 'online_throttled' | 'slow_hash' | 'fast_hash'

export interface CharsetGroup {
  id: CharsetGroupId
  size: number
  re?: RegExp
}

export interface CharsetInfo {
  charsetSize: number
  active: CharsetGroup[]
  entropy: number
  allGroups: CharsetGroup[]
  hasOtherUnicode: boolean
}

export interface AnalysisData {
  result: ZxcvbnResult
  charsetInfo: CharsetInfo
}

export interface HardwareProfile {
  id: string
  labelKey: string
  descriptionKey: string
  rates: Record<AttackScenarioId, number>
}

export type HibpStatus = 'idle' | 'reset' | 'checking' | 'safe' | 'found' | 'error'
