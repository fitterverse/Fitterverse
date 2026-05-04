'use server'

import { requireSession } from '@/features/auth/server/session'
import { createClient } from '@/server/supabase/server'

export async function getProfile() {
  const { uid } = await requireSession()
  const supabase = createClient()
  const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
  return data
}
