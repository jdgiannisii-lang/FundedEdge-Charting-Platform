import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { normaliseAuthError } from '@/lib/auth/helpers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  // Only allow relative paths to prevent open redirects
  const rawNext = searchParams.get('next') ?? '/app'
  const next = rawNext.startsWith('/') ? rawNext : '/app'

  if (!code) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent('Missing authentication code.')}`, origin),
    )
  }

  try {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(normaliseAuthError(error))}`, origin),
      )
    }

    return NextResponse.redirect(new URL(next, origin))
  } catch (e) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(normaliseAuthError(e))}`, origin),
    )
  }
}
