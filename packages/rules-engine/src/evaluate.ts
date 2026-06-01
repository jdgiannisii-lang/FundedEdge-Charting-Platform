import type { AccountState, EngineVerdict } from './types'

// Stub — implemented in S7
export function evaluate(_state: AccountState): EngineVerdict {
  throw new Error('Not implemented: evaluate() — see S7')
}
