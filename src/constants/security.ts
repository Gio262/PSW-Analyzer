import type { AppLanguage } from '../i18n'
import type { AttackScenarioId, HardwareProfile } from '../types/security'

export const ATTACK_SCENARIOS: { id: AttackScenarioId; rate: number }[] = [
  {
    id: 'online_throttled',
    rate: 100,
  },
  {
    id: 'slow_hash',
    rate: 10_000,
  },
  {
    id: 'fast_hash',
    rate: 10_000_000_000,
  },
] as const

// Cloud GPU rental prices as of 2026-01.
// Sources: vast.ai/pricing, runpod.io/pricing, aws.amazon.com/ec2/instance-types/p4
export const LOCAL_HARDWARE_PROFILES: HardwareProfile[] = [
  {
    id: 'baseline_consumer_2024',
    labelKey: 'crack.hardware.profiles.baseline.label',
    descriptionKey: 'crack.hardware.profiles.baseline.description',
    rates: {
      online_throttled: 100,
      slow_hash: 10_000,
      fast_hash: 10_000_000_000,
    },
    // Owned consumer PC: ~$0.05/h amortisation + ~$0.10/h electricity
    costPerHour: {
      slow_hash: 0.15,
      fast_hash: 0.15,
    },
    costCurrency: 'USD',
  },
  {
    id: 'workstation_gpu',
    labelKey: 'crack.hardware.profiles.workstation.label',
    descriptionKey: 'crack.hardware.profiles.workstation.description',
    rates: {
      online_throttled: 100,
      slow_hash: 50_000,
      fast_hash: 40_000_000_000,
    },
    // RTX 4090 on vast.ai / RunPod: ~$0.40–0.60/h
    costPerHour: {
      slow_hash: 0.50,
      fast_hash: 0.50,
    },
    costCurrency: 'USD',
  },
  {
    id: 'datacenter_cluster',
    labelKey: 'crack.hardware.profiles.datacenter.label',
    descriptionKey: 'crack.hardware.profiles.datacenter.description',
    rates: {
      online_throttled: 100,
      slow_hash: 250_000,
      fast_hash: 200_000_000_000,
    },
    // 5× RTX 4090 cluster or 1× A100 on cloud: ~$2.50–4.00/h
    costPerHour: {
      slow_hash: 3.00,
      fast_hash: 3.00,
    },
    costCurrency: 'USD',
  },
] as const

export const DEFAULT_HARDWARE_PROFILE_ID = LOCAL_HARDWARE_PROFILES[0].id

export const SCORE_STYLES = [
  { labelKey: 'scores.0', color: '#ff4d6d', barWidth: '8%' },
  { labelKey: 'scores.1', color: '#ff7a3d', barWidth: '25%' },
  { labelKey: 'scores.2', color: '#ffb400', barWidth: '50%' },
  { labelKey: 'scores.3', color: '#7eff6e', barWidth: '75%' },
  { labelKey: 'scores.4', color: '#39ff7a', barWidth: '100%' },
] as const

export const LOCALE_BY_LANGUAGE: Record<AppLanguage, string> = {
  it: 'it-IT',
  en: 'en-US',
}
