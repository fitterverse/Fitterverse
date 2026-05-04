import { redirect } from 'next/navigation'
import { getSession } from '@/server/session'
import { createClient } from '@/server/supabase/server'
import { BottomNav } from '@/features/navigation/components/bottom-nav'

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
    <div className="min-h-screen bg-background">
      <main className="max-w-md mx-auto px-4 pt-6 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
