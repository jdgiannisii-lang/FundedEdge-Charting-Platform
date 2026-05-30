import * as Sentry from '@sentry/nextjs'
import { createSafeActionClient } from 'next-safe-action'
import { createServerClient } from '@/lib/supabase/server'

export const action = createSafeActionClient({
  handleServerError(e) {
    // Don't send routine auth failures to Sentry — these are expected control flow
    // (expired session, signed-out tab, bot probes). Everything else is unexpected.
    const isExpectedAuthError = e instanceof Error && e.message === 'Unauthorized'
    if (!isExpectedAuthError) Sentry.captureException(e)
    if (process.env.NODE_ENV !== 'production') console.error(e)
    return e instanceof Error ? e.message : 'Unexpected error'
  },
})

export const authedAction = action.use(async ({ next }) => {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return next({ ctx: { user, supabase } })
})
