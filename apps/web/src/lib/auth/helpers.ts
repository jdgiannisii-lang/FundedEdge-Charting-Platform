const SUPABASE_ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Incorrect email or password.',
  'Email not confirmed': 'Please verify your email before signing in.',
  'User already registered': 'An account with this email already exists.',
  'Password should be at least 6 characters': 'Password must be at least 8 characters.',
  'Email rate limit exceeded': 'Too many requests. Please wait a few minutes and try again.',
  'over_email_send_rate_limit': 'Too many requests. Please wait a few minutes and try again.',
  'Token has expired or is invalid': 'This link has expired. Please request a new one.',
  'invalid_grant': 'Session expired. Please sign in again.',
}

export function normaliseAuthError(error: unknown): string {
  if (!error) return 'An unexpected error occurred.'
  const message = error instanceof Error ? error.message : String(error)
  for (const [key, friendly] of Object.entries(SUPABASE_ERROR_MAP)) {
    if (message.includes(key)) return friendly
  }
  return message || 'An unexpected error occurred.'
}

export function getCallbackUrl(request: Request, fallback = '/app'): string {
  try {
    const url = new URL(request.url)
    const next = url.searchParams.get('next')
    if (next?.startsWith('/')) return next
  } catch {
    // ignore malformed URLs
  }
  return fallback
}
