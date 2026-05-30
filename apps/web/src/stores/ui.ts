import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  leftPanelSize: number | null
  rightPanelSize: number | null
  leftCollapsed: boolean
  rightCollapsed: boolean
  density: 'comfortable' | 'compact'
  setLeftPanelSize: (v: number) => void
  setRightPanelSize: (v: number) => void
  setLeftCollapsed: (v: boolean) => void
  setRightCollapsed: (v: boolean) => void
  setDensity: (v: 'comfortable' | 'compact') => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      leftPanelSize: null,
      rightPanelSize: null,
      leftCollapsed: false,
      rightCollapsed: false,
      density: 'comfortable',
      setLeftPanelSize: (v) => set({ leftPanelSize: v }),
      setRightPanelSize: (v) => set({ rightPanelSize: v }),
      setLeftCollapsed: (v) => set({ leftCollapsed: v }),
      setRightCollapsed: (v) => set({ rightCollapsed: v }),
      setDensity: (v) => set({ density: v }),
    }),
    {
      name: 'fundededge-ui',
      // skipHydration prevents reading localStorage on the server, avoiding
      // SSR/client mismatch. Shell components call rehydrate() in useEffect.
      skipHydration: true,
    },
  ),
)

export function useUi() {
  return useUiStore()
}
