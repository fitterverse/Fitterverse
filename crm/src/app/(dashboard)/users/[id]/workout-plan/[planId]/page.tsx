import { getUserDetail } from '@/features/users/server/queries'
import { getWorkoutPlanWithDays } from '@/features/plans/server/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { WorkoutPlanBuilder } from '@/features/plans/components/workout-plan-builder'

export const dynamic = 'force-dynamic'

export default async function EditWorkoutPlanPage({
  params,
}: {
  params: Promise<{ id: string; planId: string }>
}) {
  const { id, planId } = await params
  const [{ profile }, planData] = await Promise.all([
    getUserDetail(id),
    getWorkoutPlanWithDays(planId),
  ])

  if (!profile || !planData) notFound()

  return (
    <div className="p-8">
      <Link
        href={`/users/${id}`}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to {profile.full_name ?? 'user'}
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Edit Workout Plan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Editing for <span className="font-medium text-gray-700">{profile.full_name ?? profile.email}</span>
          {' '}· Past days are locked
        </p>
      </div>

      <WorkoutPlanBuilder
        userId={id}
        userName={profile.full_name ?? profile.email}
        planId={planId}
        initialTitle={planData.plan.title}
        initialWeekStart={planData.plan.week_start}
        initialDays={planData.days}
      />
    </div>
  )
}
