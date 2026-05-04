import { createClient } from '@/server/supabase'

export async function getTeamMembers() {
  const supabase = createClient()
  const { data } = await supabase
    .from('crm_users')
    .select('id, email, full_name, role, is_active, created_at')
    .order('created_at', { ascending: true })

  return data ?? []
}
