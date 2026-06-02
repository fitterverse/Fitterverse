import { redirect } from 'next/navigation'
import { CalendarRange, FolderInput, Megaphone, NotebookPen } from 'lucide-react'
import { getSession } from '@/server/session'
import { SocialPlanner } from '@/features/social/components/social-planner'
import { getSocialPosts } from '@/features/social/server/queries'
import {
  canAccessSocial,
  SOCIAL_ACCESS_ROLES,
  SOCIAL_PLATFORM_OPTIONS,
  SOCIAL_POST_STATUSES,
  SOCIAL_WINDOW_OPTIONS,
} from '@/features/social/social-shared'

export const dynamic = 'force-dynamic'

interface SearchParams {
  status?: string
  platform?: string
  window?: string
}

export default async function SocialPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await getSession()
  if (!session || !canAccessSocial(session.role)) redirect('/dashboard')

  const {
    status = 'all',
    platform = 'all',
    window = 'all',
  } = await searchParams

  const result = await getSocialPosts({ status, platform, window })
  const postCounts = {
    total: result.posts.length,
    ready: result.posts.filter(post => post.status === 'ready').length,
    posted: result.posts.filter(post => post.status === 'posted').length,
    withAssets: result.posts.filter(post => Boolean(post.asset_path)).length,
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="fv-label mb-2 text-gray-400">Marketing Ops</p>
          <h1 className="text-2xl font-bold text-gray-900">Social Planner</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-500">
            Plan daily Instagram and Facebook content here, keep media files on your desktop,
            and use the CRM to track captions, dates, and manual posting status.
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Shared with all CRM team roles: {SOCIAL_ACCESS_ROLES.map(role => role.replace('_', ' ')).join(', ')}.
          </p>
        </div>

        <form className="flex flex-wrap gap-3 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <FilterField label="Status">
            <select
              name="status"
              defaultValue={status}
              className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >
              <option value="all">All statuses</option>
              {SOCIAL_POST_STATUSES.map(option => (
                <option key={option} value={option}>
                  {option[0]!.toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Platform">
            <select
              name="platform"
              defaultValue={platform}
              className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >
              <option value="all">All platforms</option>
              {SOCIAL_PLATFORM_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label="Planned date">
            <select
              name="window"
              defaultValue={window}
              className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >
              {SOCIAL_WINDOW_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>

          <button
            type="submit"
            className="self-end rounded-2xl bg-[#0B0F0D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#151b18]"
          >
            Apply filters
          </button>
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Megaphone size={18} className="text-sky-600" />} label="Visible Posts" value={postCounts.total} tone="bg-sky-50" />
        <StatCard icon={<NotebookPen size={18} className="text-violet-600" />} label="Ready To Publish" value={postCounts.ready} tone="bg-violet-50" />
        <StatCard icon={<CalendarRange size={18} className="text-green-600" />} label="Already Posted" value={postCounts.posted} tone="bg-green-50" />
        <StatCard icon={<FolderInput size={18} className="text-amber-600" />} label="With Asset Path" value={postCounts.withAssets} tone="bg-amber-50" />
      </div>

      <SocialPlanner
        posts={result.posts}
        tableReady={result.tableReady}
        errorMessage={result.errorMessage}
      />
    </div>
  )
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
        {label}
      </span>
      {children}
    </label>
  )
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: string
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${tone}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  )
}
