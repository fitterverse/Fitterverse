import { getUserDetail } from '@/features/users/server/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MealPlanBuilder } from '@/features/plans/components/meal-plan-builder'

export const dynamic = 'force-dynamic'

export default async function NewMealPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { profile } = await getUserDetail(id)
  if (!profile) notFound()

  return (
    <div className="p-8">
      <Link
        href={`/users/${id}`}
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to {profile.full_name ?? 'user'}
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">New Meal Plan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Building for <span className="font-medium text-gray-700">{profile.full_name ?? profile.email}</span>
        </p>
      </div>

      <MealPlanBuilder
        userId={id}
        userName={profile.full_name ?? profile.email}
      />
    </div>
  )
}
