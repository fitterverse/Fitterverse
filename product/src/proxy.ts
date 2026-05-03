import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SESSION_COOKIE = '__fv_session'
const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET!)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const publicRoutes = ['/login', '/signup', '/api/auth/session']
  const isPublicRoute = publicRoutes.some(r => pathname.startsWith(r))

  const token = request.cookies.get(SESSION_COOKIE)?.value

  let uid: string | null = null
  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET)
      uid = payload.uid as string
    } catch {
      uid = null
    }
  }

  // Not logged in → send to login
  if (!uid && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Already logged in → skip auth pages
  if (uid && isPublicRoute && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Onboarding check is handled in the dashboard server component,
  // not here — avoids an extra Supabase HTTP call on every request.
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
