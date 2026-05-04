import { redirect } from 'next/navigation'
import { getSession } from '@/server/session'
import { Sidebar } from '@/features/navigation/components/sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen">
      <Sidebar fullName={session.full_name} role={session.role} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
