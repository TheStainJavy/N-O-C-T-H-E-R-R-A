import { supabase } from '@/lib/supabaseClient'
import type { Chronicle, Mission } from '@/lib/types'

export async function fetchMissions(): Promise<Mission[]> {
  const { data, error } = await supabase
    .from('missions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return []
  }

  return (data ?? []) as Mission[]
}

export async function fetchChronicles(): Promise<Chronicle[]> {
  const { data, error } = await supabase
    .from('chronicles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return []
  }

  return (data ?? []) as Chronicle[]
}
