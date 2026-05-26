import { WebSocket } from 'ws'

// Node 20 lacks native WebSocket; @supabase/realtime-js@≥2.106 throws at
// createClient() construction without it. Polyfill before any test module loads.
// biome-ignore lint/suspicious/noExplicitAny: globalThis extension
;(globalThis as any).WebSocket = WebSocket
