import type { User } from '@supabase/supabase-js'

/** Roles planificados: player | dm | owner */
export type AppRole = 'player' | 'dm' | 'owner'

export type Profile = {
  id?: string
  user_id: string
  adventurer_name: string
  character_level?: number | null
  role?: AppRole | null
  created_at?: string
}

export type Mission = {
  id: string
  title: string
  summary: string | null
  description: string
  current_arc: string | null
  current_status: string | null
  featured_regions: string[] | null
  featured_factions: string[] | null
  cover_image: string | null
  level_required: number | null
  mission_state: string
  max_players: number | null
  created_at?: string
  adventurers: string[] | null
  applicants?: string[] | null
  mission_start: string | null
  mission_end: string | null
  dm_name: string | null
}

export type Chronicle = {
  id: string
  mission_title: string
  mission_summary: string | null
  mission_description: string
  /** Legacy field. Mantener para compatibilidad. */
  result: string
  /** Código fijo: completada | fallida | cancelada. */
  result_code?: string | null
  /** Texto narrativo libre del DM. */
  result_lore?: string | null
  current_arc: string | null
  current_status: string | null
  featured_regions: string[] | null
  featured_factions: string[] | null
  cover_image: string | null
  level_required: number | null
  max_players: number | null
  created_at?: string
  adventurers: string[] | null
  mission_start: string | null
  mission_end: string | null
  dm_name: string | null
}

export type { User }
