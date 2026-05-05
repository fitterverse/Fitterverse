import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SESSION_COOKIE = '__fv_session'
const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET!)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const publicRoutePrefixes = [
    '/blog',
    '/terms',
    '/privacy-policy',
    '/login',
    '/signup',
    '/api/auth/session',
  ]
  const guestOnlyRoutes = ['/login', '/signup']
  const publicExactRoutes = ['/', '/robots.txt', '/sitemap.xml']
  const isPublicRoute =
    publicExactRoutes.includes(pathname) ||
    publicRoutePrefixes.some(route => pathname.startsWith(route))

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

  // Public website routes stay open to logged-out visitors.
  if (!uid && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logged-in users landing on the website homepage or auth pages
  // should continue directly into the product.
  if (uid && (pathname === '/' || guestOnlyRoutes.some(route => pathname.startsWith(route)))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Onboarding check is handled in the dashboard server component,
  // not here — avoids an extra Supabase HTTP call on every request.
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
