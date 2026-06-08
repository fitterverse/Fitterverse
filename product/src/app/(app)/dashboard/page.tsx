import Link from 'next/link'
import { Flame } from 'lucide-react'
import { DrawerToggleButton } from '@/features/navigation/components/app-shell'
import { getJournalDayData } from '@/features/journal/server/queries'
import { TodayDatePicker } from '@/features/journal/components/today-date-picker'
import { SummaryCards } from '@/features/journal/components/summary-cards'
import { JournalFeed } from '@/features/journal/components/journal-feed'
import { TodayComposer } from '@/features/journal/components/today-composer'

interface DashboardPageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function DashboardPage(props: DashboardPageProps) {
  const searchParams = await props.searchParams
  const data = await getJournalDayData(searchParams?.date)

  return (
    <>
      <div className="mx-auto max-w-[26.5rem] space-y-4 pb-38">
        <TodayDatePicker
          selectedDate={data.selectedDate}
          monthLoggedDates={data.monthLoggedDates}
          stripLoggedDates={data.stripLoggedDates}
          prefix={<DrawerToggleButton className="-ml-2 text-slate-900" />}
          suffix={
            <Link
              href="/streak"
              className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-slate-900"
            >
              <Flame className="h-5 w-5" />
              <span className="text-[1.7rem] font-semibold leading-none">{data.streak.current_streak}</span>
            </Link>
          }
        />

        <SummaryCards
          summary={data.summary}
          targets={data.targets}
          remainingCalories={data.remainingCalories}
        />

        <JournalFeed
          feed={data.feed}
          targets={data.targets}
          selectedDate={data.selectedDate}
        />
      </div>

      <TodayComposer selectedDate={data.selectedDate} />
    </>
  )
}
