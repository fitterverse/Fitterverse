import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/diet/bottom-nav'

export default async function HistoryLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', session.uid)
    .single()

  if (profile && !profile.onboarding_completed) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-md mx-auto px-4 pt-6 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
