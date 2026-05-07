import { createClient } from '@/server/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '8'), 20)

  if (!q) return NextResponse.json([])

  const supabase = createClient()
  const { data } = await supabase
    .from('food_items')
    .select('id, name, food_group, energy_kcal, protein_g, fat_g, carbs_g, fiber_g')
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(limit)

  return NextResponse.json(data ?? [])
}
