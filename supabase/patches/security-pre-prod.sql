-- ═══════════════════════════════════════════════════════════
-- F1 Arsenal · Parches de seguridad para producción
-- Ejecutar en el SQL Editor de Supabase ANTES de publicar
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1. DEADLINE ENFORCEMENT EN BACKEND
--    Protege contra llamadas directas a la API de Supabase
--    que salten el frontend. El servidor verifica que la
--    predicción llega antes del deadline (1h antes de race_date)
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "predictions_insert" ON public.predictions;
DROP POLICY IF EXISTS "predictions_update" ON public.predictions;

CREATE POLICY "predictions_insert" ON public.predictions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = player_id
    AND EXISTS (
      SELECT 1 FROM public.races
      WHERE id = race_id
        AND race_date > NOW() + INTERVAL '1 hour'
    )
  );

CREATE POLICY "predictions_update" ON public.predictions
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = player_id
    AND EXISTS (
      SELECT 1 FROM public.races
      WHERE id = race_id
        AND race_date > NOW() + INTERVAL '1 hour'
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 2. PROTECCIÓN DE SCORES
--    Solo el service_role (admin) puede escribir scores.
--    Usuarios autenticados solo pueden leer.
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "scores_insert" ON public.scores;
DROP POLICY IF EXISTS "scores_update" ON public.scores;
-- No se crean policies INSERT/UPDATE para 'authenticated'
-- → solo service_role bypassa RLS y puede escribir scores

-- ─────────────────────────────────────────────────────────────
-- VERIFICAR POLÍTICAS ACTIVAS:
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public' ORDER BY tablename, policyname;
-- ─────────────────────────────────────────────────────────────
