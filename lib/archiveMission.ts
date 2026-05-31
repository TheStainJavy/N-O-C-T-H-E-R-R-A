import { supabase } from '@/lib/supabaseClient'
import type { Mission } from '@/lib/types'

export type ArchiveResult = 'completada' | 'fallida' | 'cancelada'

export async function archiveMission(
  mission: Mission,
  result: ArchiveResult,
  resultLore: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error: chronicleError } = await supabase.from('chronicles').insert({
    mission_start: mission.mission_start,
    mission_end: mission.mission_end,
    dm_name: mission.dm_name,
    mission_title: mission.title,
    mission_summary: mission.summary,
    mission_description: mission.description,
    // Guardamos ambos por compatibilidad con tu frontend/BD.
    result,
    result_code: result,
    result_lore: resultLore,
    current_arc: mission.current_arc,
    current_status: mission.current_status,
    featured_regions: mission.featured_regions,
    featured_factions: mission.featured_factions,
    cover_image: mission.cover_image,
    level_required: mission.level_required,
    max_players: mission.max_players,
    adventurers: mission.adventurers,
  })

  if (chronicleError) {
    console.error(chronicleError)
    return { ok: false, message: 'No se pudo mover a crónicas.' }
  }

  const { error: deleteError } = await supabase
    .from('missions')
    .delete()
    .eq('id', mission.id)

  if (deleteError) {
    console.error(deleteError)
    return {
      ok: false,
      message: 'La misión pasó a crónicas, pero no se borró del tablón.',
    }
  }

  return { ok: true }
}
