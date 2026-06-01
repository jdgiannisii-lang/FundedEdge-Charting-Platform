import type { RulesConfig } from '../types'

// Stubs — implemented in S8

export function getPreset(_slug: string): RulesConfig {
  throw new Error('Not implemented: getPreset() — see S8')
}

export function listPresets(): Array<{
  slug: string
  name: string
  firm: string
  accountSize: number
}> {
  throw new Error('Not implemented: listPresets() — see S8')
}
