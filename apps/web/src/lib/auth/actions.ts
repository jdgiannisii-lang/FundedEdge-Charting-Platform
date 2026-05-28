'use server'

import { redirect } from 'next/navigation'
import { action, authedAction } from '@/lib/safe-action'
import { createServerClient } from '@/lib/supabase/server'
import { normaliseAuthError } from './helpers'
import {
  forgotPasswordSchema,
  magicLinkSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from './schemas'

export const signUpAction = action
  .schema(signUpSchema)
  .action(async ({ parsedInput: { email, password } }) => {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw new Error(normaliseAuthError(error))
    return { success: true }
  })

export const signInAction = action
  .schema(signInSchema)
  .action(async ({ parsedInput: { email, password } }) => {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(normaliseAuthError(error))
    redirect('/app')
  })

export const signInWithMagicLinkAction = action
  .schema(magicLinkSchema)
  .action(async ({ parsedInput: { email } }) => {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (error) throw new Error(normaliseAuthError(error))
    return { success: true }
  })

export const signInWithGoogleAction = action.action(async () => {
  const supabase = await createServerClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  })
  if (error) throw new Error(normaliseAuthError(error))
  if (data.url) redirect(data.url)
})

export const signOutAction = authedAction.action(async ({ ctx: { supabase } }) => {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(normaliseAuthError(error))
  redirect('/login')
})

export const forgotPasswordAction = action
  .schema(forgotPasswordSchema)
  .action(async ({ parsedInput: { email } }) => {
    const supabase = await createServerClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    })
    if (error) throw new Error(normaliseAuthError(error))
    return { success: true }
  })

export const resetPasswordAction = authedAction
  .schema(resetPasswordSchema)
  .action(async ({ parsedInput: { password }, ctx: { supabase } }) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw new Error(normaliseAuthError(error))
    redirect('/app')
  })
