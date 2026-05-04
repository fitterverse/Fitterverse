import { redirect } from 'next/navigation'
import { getSession } from '@/server/session'

export default async function RootPage() {
  const session = await getSession()
  if (session) redirect('/dashboard')
  else redirect('/login')
}
