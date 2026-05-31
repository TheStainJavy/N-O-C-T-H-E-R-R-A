-- =============================================================================
-- Noctherra — Fase 2: extender esquema existente (NO renombra tablas)
-- Ejecutar en Supabase SQL Editor después de revisar.
-- Requiere: tablas public.missions, chronicles, profiles, verified_admins
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Rol de cuenta (Player / DM / Owner)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('player', 'dm', 'owner');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'player';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS character_level integer NOT NULL DEFAULT 1;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_character_level_range;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_character_level_range
  CHECK (character_level >= 1 AND character_level <= 20);

COMMENT ON COLUMN public.profiles.role IS
  'player = lectura/inscripción; dm = crear/completar misiones; owner = control total (TheStainJavy)';

COMMENT ON COLUMN public.profiles.character_level IS
  'Nivel de personaje declarado por el jugador (1-20)';

-- Owner: sincronizar con verified_admins (solo si la tabla existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'verified_admins'
  ) THEN
    UPDATE public.profiles p
    SET role = 'owner'
    FROM public.verified_admins va
    WHERE va.user_id = p.user_id;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Estados de misión — añadir "reserved" al enum existente mission_state
--    (se mantienen valores legacy: closed, missing, forbidden, in_progress, completed)
-- -----------------------------------------------------------------------------
ALTER TYPE public.mission_state ADD VALUE IF NOT EXISTS 'reserved';

-- En tu esquema ya existe public.missions.applicants (ARRAY) → se usa como “Aventureros en espera”.
-- Normalizamos defaults para evitar NULLs.
UPDATE public.missions SET applicants = '{}' WHERE applicants IS NULL;
ALTER TABLE public.missions ALTER COLUMN applicants SET DEFAULT '{}';
ALTER TABLE public.missions ALTER COLUMN applicants SET NOT NULL;

UPDATE public.missions SET adventurers = '{}' WHERE adventurers IS NULL;
ALTER TABLE public.missions ALTER COLUMN adventurers SET DEFAULT '{}';
ALTER TABLE public.missions ALTER COLUMN adventurers SET NOT NULL;

COMMENT ON COLUMN public.missions.applicants IS
  'Aventureros en espera; promover a adventurers cuando haya cupo';

-- -----------------------------------------------------------------------------
-- 3. Crónicas — resultado fijo + lore libre
-- -----------------------------------------------------------------------------
ALTER TABLE public.chronicles
  ADD COLUMN IF NOT EXISTS result_code text;

ALTER TABLE public.chronicles
  ADD COLUMN IF NOT EXISTS result_lore text;

-- Copiar datos legacy desde "result" si esa columna existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'chronicles'
      AND column_name = 'result'
  ) THEN
    UPDATE public.chronicles
    SET
      result_code = COALESCE(result_code, result),
      result_lore = COALESCE(result_lore, '')
    WHERE result_code IS NULL
      AND result IS NOT NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.chronicles.result_code IS
  'Código fijo: completada | fallida | cancelada';
COMMENT ON COLUMN public.chronicles.result_lore IS
  'Texto narrativo libre del DM o del archivado';

-- -----------------------------------------------------------------------------
-- 4. Reportes de ban (DM → Owner aprueba)
--    Reutiliza enum existente mission_request_status (pending/approved/rejected)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ban_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  reporter_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  mission_id uuid REFERENCES public.missions (id) ON DELETE SET NULL,
  reason text NOT NULL,
  status public.mission_request_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  owner_note text,
  CONSTRAINT ban_reports_reason_min_length CHECK (char_length(trim(reason)) >= 10),
  CONSTRAINT ban_reports_no_self_report CHECK (reporter_user_id <> target_user_id)
);

CREATE INDEX IF NOT EXISTS ban_reports_status_idx
  ON public.ban_reports (status);

CREATE INDEX IF NOT EXISTS ban_reports_target_idx
  ON public.ban_reports (target_user_id);

COMMENT ON TABLE public.ban_reports IS
  'Reportes de conducta; solo Owner aprueba o rechaza';

-- -----------------------------------------------------------------------------
-- 5. RLS — habilitar y políticas base (ajustar si ya tienes políticas con otros nombres)
-- -----------------------------------------------------------------------------

-- Helper: ¿es owner?
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.verified_admins va
    WHERE va.user_id = auth.uid()
  );
$$;

-- Helper: ¿es dm?
CREATE OR REPLACE FUNCTION public.is_dm()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
      AND p.role = 'dm'
  );
$$;

REVOKE ALL ON FUNCTION public.is_owner() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_dm() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_dm() TO authenticated;

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_authenticated ON public.profiles;
CREATE POLICY profiles_select_authenticated
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS profiles_update_owner ON public.profiles;
CREATE POLICY profiles_update_owner
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- missions: lectura pública autenticada; escritura dm/owner
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS missions_select_all ON public.missions;
CREATE POLICY missions_select_all
  ON public.missions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS missions_select_anon ON public.missions;
CREATE POLICY missions_select_anon
  ON public.missions
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS missions_insert_dm ON public.missions;
CREATE POLICY missions_insert_dm
  ON public.missions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner() OR public.is_dm());

DROP POLICY IF EXISTS missions_update_dm ON public.missions;
CREATE POLICY missions_update_dm
  ON public.missions
  FOR UPDATE
  TO authenticated
  USING (public.is_owner() OR public.is_dm())
  WITH CHECK (public.is_owner() OR public.is_dm());

DROP POLICY IF EXISTS missions_delete_owner ON public.missions;
CREATE POLICY missions_delete_owner
  ON public.missions
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- Inscripción / abandono vía RPC (evita que players editen otros campos de la misión)
CREATE OR REPLACE FUNCTION public.join_mission(p_mission_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_max int;
  v_adventurers text[];
  v_applicants text[];
  v_state public.mission_state;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT adventurer_name INTO v_name
  FROM public.profiles
  WHERE user_id = auth.uid();

  IF v_name IS NULL OR trim(v_name) = '' THEN
    RAISE EXCEPTION 'Perfil sin nombre de aventurero';
  END IF;

  SELECT max_players, adventurers, applicants, mission_state
  INTO v_max, v_adventurers, v_applicants, v_state
  FROM public.missions
  WHERE id = p_mission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Misión no encontrada';
  END IF;

  IF v_state NOT IN ('available', 'reserved') THEN
    RAISE EXCEPTION 'Esta misión no acepta inscripciones';
  END IF;

  IF v_name = ANY (COALESCE(v_adventurers, '{}')) OR v_name = ANY (COALESCE(v_applicants, '{}')) THEN
    RETURN;
  END IF;

  IF COALESCE(array_length(v_adventurers, 1), 0) < COALESCE(v_max, 0) THEN
    UPDATE public.missions
    SET adventurers = array_append(COALESCE(adventurers, '{}'), v_name)
    WHERE id = p_mission_id;
  ELSE
    UPDATE public.missions
    SET applicants = array_append(COALESCE(applicants, '{}'), v_name)
    WHERE id = p_mission_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.leave_mission(p_mission_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_adventurers text[];
  v_applicants text[];
  v_next text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT adventurer_name INTO v_name
  FROM public.profiles
  WHERE user_id = auth.uid();

  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Perfil no encontrado';
  END IF;

  SELECT adventurers, applicants
  INTO v_adventurers, v_applicants
  FROM public.missions
  WHERE id = p_mission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Misión no encontrada';
  END IF;

  IF v_name = ANY (COALESCE(v_applicants, '{}')) THEN
    UPDATE public.missions
    SET applicants = array_remove(applicants, v_name)
    WHERE id = p_mission_id;
    RETURN;
  END IF;

  IF NOT (v_name = ANY (COALESCE(v_adventurers, '{}'))) THEN
    RETURN;
  END IF;

  v_adventurers := array_remove(v_adventurers, v_name);

  IF COALESCE(array_length(v_applicants, 1), 0) > 0 THEN
    v_next := v_applicants[1];
    IF array_length(v_applicants, 1) = 1 THEN
      v_applicants := '{}';
    ELSE
      v_applicants := v_applicants[2:array_length(v_applicants, 1)];
    END IF;
    v_adventurers := array_append(COALESCE(v_adventurers, '{}'), v_next);
  END IF;

  UPDATE public.missions
  SET
    adventurers = v_adventurers,
    applicants = COALESCE(v_applicants, '{}')
  WHERE id = p_mission_id;
END;
$$;

REVOKE ALL ON FUNCTION public.join_mission(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.leave_mission(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_mission(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_mission(uuid) TO authenticated;

-- chronicles: lectura todos; insert dm/owner; delete solo owner
ALTER TABLE public.chronicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chronicles_select_all ON public.chronicles;
CREATE POLICY chronicles_select_all
  ON public.chronicles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS chronicles_select_anon ON public.chronicles;
CREATE POLICY chronicles_select_anon
  ON public.chronicles
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS chronicles_insert_dm ON public.chronicles;
CREATE POLICY chronicles_insert_dm
  ON public.chronicles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_owner() OR public.is_dm());

DROP POLICY IF EXISTS chronicles_delete_owner ON public.chronicles;
CREATE POLICY chronicles_delete_owner
  ON public.chronicles
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

DROP POLICY IF EXISTS chronicles_update_owner ON public.chronicles;
CREATE POLICY chronicles_update_owner
  ON public.chronicles
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- ban_reports
ALTER TABLE public.ban_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ban_reports_insert_dm ON public.ban_reports;
CREATE POLICY ban_reports_insert_dm
  ON public.ban_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_user_id = auth.uid()
    AND (public.is_dm() OR public.is_owner())
  );

DROP POLICY IF EXISTS ban_reports_select_involved ON public.ban_reports;
CREATE POLICY ban_reports_select_involved
  ON public.ban_reports
  FOR SELECT
  TO authenticated
  USING (
    public.is_owner()
    OR reporter_user_id = auth.uid()
  );

DROP POLICY IF EXISTS ban_reports_update_owner ON public.ban_reports;
CREATE POLICY ban_reports_update_owner
  ON public.ban_reports
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- verified_admins: solo owner lee (la tabla de admins)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'verified_admins'
  ) THEN
    ALTER TABLE public.verified_admins ENABLE ROW LEVEL SECURITY;

    EXECUTE 'DROP POLICY IF EXISTS verified_admins_select_self ON public.verified_admins';
    EXECUTE $policy$
      CREATE POLICY verified_admins_select_self
        ON public.verified_admins
        FOR SELECT
        TO authenticated
        USING (user_id = auth.uid())
    $policy$;
  END IF;
END $$;
