import { createSafeActionClient } from 'next-safe-action'
import { createServerClient } from '@/lib/supabase/server'

export const action = createSafeActionClient({
  handleServerError(e) {
    if (process.env.NODE_ENV === 'development') console.error(e)
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
