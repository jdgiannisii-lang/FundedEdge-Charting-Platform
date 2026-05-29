import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'
import { normaliseAuthError } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Invalid confirmation link.')}`, origin),
    )
  }

  try {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })

    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(normaliseAuthError(error))}`, origin),
      )
    }

    // Recovery type = password reset flow — send to the reset form
    const redirectTo = type === 'recovery' ? '/reset-password' : '/app'
    return NextResponse.redirect(new URL(redirectTo, origin))
  } catch (e) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(normaliseAuthError(e))}`, origin),
    )
  }
}
