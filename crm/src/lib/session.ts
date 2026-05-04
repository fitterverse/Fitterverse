import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SESSION_COOKIE = '__crm_session'
const SECRET = new TextEncoder().encode(process.env.CRM_SESSION_SECRET!)
const EXPIRES_IN = 60 * 60 * 24 * 14 // 14 days

export type CrmRole = 'admin' | 'master_coach' | 'nutritionist' | 'trainer' | 'sales'

export interface CrmSession {
  id: string
  email: string
  full_name: string
  role: CrmRole
}

export async function createSession(payload: CrmSession) {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
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

export async function getSession(): Promise<CrmSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as CrmSession
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
