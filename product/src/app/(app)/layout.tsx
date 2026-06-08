import { redirect } from 'next/navigation'
import { getSession } from '@/server/session'
import { createClient } from '@/server/supabase/server'
import { NotificationPermissionBanner } from '@/features/notifications/components/permission-banner'
import { AppShell } from '@/features/navigation/components/app-shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  // Check onboarding here (fast — same server, no extra network hop)
  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', session.uid)
    .single()

  if (profile && !profile.onboarding_completed) {
    redirect('/onboarding')
  }

  return (
    <AppShell>
      <div className="fv-app-light min-h-screen bg-[#f4f6fb]">
        <main className="mx-auto max-w-md px-4 pb-8 pt-6">
          {children}
        </main>
        <NotificationPermissionBanner />
      </div>
    </AppShell>
  )
}
