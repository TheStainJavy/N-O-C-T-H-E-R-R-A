import type { User } from '@supabase/supabase-js'

/** Roles planificados: player | dm | owner */
export type AppRole = 'player' | 'dm' | 'owner'
export interface RegionMissionsCount {
  [regionId: string]: number;
}
// src/lib/types.ts

export interface Mission {
  id: string;
  title: string;
  summary?: string;
  description: string;
  dm_name: string;
  creator_id?: string; // <--- AÑADE ESTA LÍNEA (El signo ? es por si es nulo)
  mission_state: string;
  level_required: number;
  max_players: number;
  adventurers: string[];
  applicants: string[];
  featured_regions?: string[];
  featured_factions?: string[];
  mission_start?: string;
  mission_end?: string;
  current_arc?: string;
  current_status?: string;
  cover_image?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  adventurer_name: string;
  character_level?: number;
  role?: string;               // <--- ASEGÚRATE DE QUE ESTO ESTÉ
  character_sheet_url?: string; // <--- ASEGÚRATE DE QUE ESTO ESTÉ
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
