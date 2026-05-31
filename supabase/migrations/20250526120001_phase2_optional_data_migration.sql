-- =============================================================================
-- Noctherra — Fase 2 OPCIONAL: migrar datos legacy de mission_state
-- Ejecutar SOLO después de revisar qué misiones tienes en producción.
-- =============================================================================

-- Mapeo sugerido hacia los 3 estados principales del tablón:
--   available  → Disponible (abierta)
--   reserved   → Reservada (DM asigna cupos)
--   cancelled  → Cancelada

-- Ejemplos (descomenta y ajusta según tu criterio):

-- UPDATE public.missions
-- SET mission_state = 'available'
-- WHERE mission_state IN ('in_progress', 'completed');

-- UPDATE public.missions
-- SET mission_state = 'cancelled'
-- WHERE mission_state IN ('closed', 'forbidden');

-- missing → decidir caso a caso o cancelled:
-- UPDATE public.missions
-- SET mission_state = 'cancelled'
-- WHERE mission_state = 'missing';
