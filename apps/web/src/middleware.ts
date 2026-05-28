import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(req: NextRequest) {
  const { res, user } = await updateSession(req)
  const path = req.nextUrl.pathname

  if (!user && path.startsWith('/app')) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (user && (path === '/login' || path === '/signup')) {
    const url = req.nextUrl.clone()
    url.pathname = '/app'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
