import { getSession } from '@/server/session'
import { getTeamMembers } from '@/features/team/server/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, UserCheck, UserX } from 'lucide-react'
import { format } from 'date-fns'
import { RoleToggle } from '@/features/team/components/role-toggle'

export const dynamic = 'force-dynamic'

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  master_coach: 'bg-blue-100 text-blue-700',
  nutritionist: 'bg-green-100 text-green-700',
  trainer: 'bg-orange-100 text-orange-700',
  sales: 'bg-yellow-100 text-yellow-700',
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  master_coach: 'Master Coach',
  nutritionist: 'Nutritionist',
  trainer: 'Trainer',
  sales: 'Sales',
}

export default async function TeamPage() {
  const session = await getSession()
  if (!session || session.role !== 'admin') redirect('/dashboard')

  const members = await getTeamMembers()

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-500 text-sm mt-1">{members.length} team members</p>
        </div>
        <Link
          href="/team/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add member
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Added</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {members.map(member => (
              <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-medium text-gray-900">{member.full_name}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{member.email}</p>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[member.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ROLE_LABELS[member.role] ?? member.role}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    {member.is_active
                      ? <UserCheck size={14} className="text-green-500" />
                      : <UserX size={14} className="text-gray-400" />}
                    <span className={member.is_active ? 'text-green-600 text-xs' : 'text-gray-400 text-xs'}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-500 text-xs">
                  {format(new Date(member.created_at), 'MMM d, yyyy')}
                </td>
                <td className="px-5 py-4 text-right">
                  {session.id !== member.id && (
                    <RoleToggle
                      id={member.id}
                      currentRole={member.role}
                      isActive={member.is_active}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
