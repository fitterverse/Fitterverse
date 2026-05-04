// Server-side session helpers using jose (no firebase-admin needed)
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SESSION_COOKIE = '__fv_session'
const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET!)
const EXPIRES_IN = 60 * 60 * 24 * 14 // 14 days

export async function createSession(uid: string, email: string) {
  const token = await new SignJWT({ uid, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('14d')
    .sign(SECRET)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: EXPIRES_IN,
    path: '/',
  })
}

export async function getSession(): Promise<{ uid: string; email: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET)
    return { uid: payload.uid as string, email: payload.email as string }
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

export async function verifySessionToken(token: string): Promise<{ uid: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return { uid: payload.uid as string, email: payload.email as string }
  } catch {
    return null
  }
}
