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

  // Not logged in and trying to access protected route
  if (!uid && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Already logged in and hitting auth pages
  if (uid && isPublicRoute && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Check onboarding only for authenticated, non-public, non-onboarding routes
  if (uid && !isPublicRoute && pathname !== '/onboarding') {
    // We do a lightweight check via a Supabase REST call
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const res = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${uid}&select=onboarding_completed`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        cache: 'no-store',
      }
    )

    if (res.ok) {
      const data = await res.json()
      if (data[0] && data[0].onboarding_completed === false) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
