/** Regiones canónicas de Noctherra (filtros y formularios futuros). */
export const NOCTHERRA_REGIONS = [
  {
    id: 'arvok',
    name: 'Arvok',
    epithet: 'Las Marcas de piedra',
  },
  {
    id: 'vaelbris',
    name: 'Vaelbris',
    epithet: 'Corazón del Comercio',
  },
  {
    id: 'deimonmark',
    name: 'DeimonMark',
    epithet: 'Tierras de Sombra',
  },
  {
    id: 'nareth',
    name: 'Archipiélago de Nareth',
    epithet: 'Mares Salvajes',
  },
  {
    id: 'mournhollow',
    name: 'MournHollow',
    epithet: 'Los pantanos de luto',
  },
  {
    id: 'sylvaran',
    name: 'Sylvaran',
    epithet: 'Los bosques eternos',
  },
  {
    id: 'asteria',
    name: 'Asteria',
    epithet: 'El reino solar',
  },
  {
    id: 'pozo_profundo',
    name: 'Pozo Profundo',
    epithet: '???',
  },
] as const

export type NoctherraRegionId =
  (typeof NOCTHERRA_REGIONS)[number]['id']

/** Etiqueta narrativa para mostrar en UI. */
export function regionLabel(id: NoctherraRegionId): string {
  const region = NOCTHERRA_REGIONS.find((r) => r.id === id)
  if (!region) return id
  return `${region.name} — ${region.epithet}`
}

/**
 * Estados actuales en BD (legacy).
 * Fase 2: available | reserved | cancelled
 */
export const MISSION_STATE_LABELS: Record<string, string> = {
  available: 'Disponible',
  reserved: 'Reservada',
  in_progress: 'En progreso',
  completed: 'Completada',
  closed: 'Cerrada',
  cancelled: 'Cancelada',
  missing: 'Desaparecida',
  forbidden: 'Prohibida',
}

/** Estados objetivo (próxima fase de reglas de misión). */
export const MISSION_STATES_PLANNED = [
  'available',
  'reserved',
  'cancelled',
] as const

export type PlannedMissionState =
  (typeof MISSION_STATES_PLANNED)[number]

export const PLANNED_MISSION_STATE_LABELS: Record<
  PlannedMissionState,
  string
> = {
  available: 'Disponible',
  reserved: 'Reservada',
  cancelled: 'Cancelada',
}
