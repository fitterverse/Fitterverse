import { BottomNav } from '@/components/diet/bottom-nav'

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-md mx-auto px-4 pt-6 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
