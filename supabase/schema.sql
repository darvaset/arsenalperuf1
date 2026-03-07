-- ═══════════════════════════════════════════════════════════
-- F1 Arsenal Fantasy · Schema Supabase
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ═══════════════════════════════════════════════════════════

-- 1. Tabla de jugadores (extiende auth.users)
CREATE TABLE IF NOT EXISTS public.players (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT,
  username     TEXT,              -- Nickname elegido por el jugador
  display_name TEXT,              -- Kept for backwards compat
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Añadir username si la tabla ya existía sin esa columna
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS username TEXT;

-- Auto-crear jugador cuando se registra via magic link
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.players (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Tabla de carreras
CREATE TABLE IF NOT EXISTS public.races (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,              -- 'Gran Premio de España 2026'
  circuit     TEXT NOT NULL,              -- 'Circuit de Barcelona-Catalunya'
  country     TEXT,                       -- 'Spain' (de Jolpica API)
  locality    TEXT,                       -- 'Barcelona' (de Jolpica API)
  race_date   TIMESTAMPTZ NOT NULL,       -- Fecha y hora de salida (UTC)
  round       INTEGER NOT NULL UNIQUE,    -- Número de ronda (único para upsert)
  results     TEXT[],                     -- Array de driver IDs en orden P1..P10 (null hasta que termine)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- 3. Tabla de predicciones
CREATE TABLE IF NOT EXISTS public.predictions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id      UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  player_id    UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  picks        TEXT[] NOT NULL,           -- Array de driver IDs en orden P1..P10
  submitted_at TIMESTAMPTZ NOT NULL,
  UNIQUE(race_id, player_id)
);


-- 4. Tabla de scores calculados (se puebla al subir resultados)
CREATE TABLE IF NOT EXISTS public.scores (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id      UUID NOT NULL REFERENCES public.races(id) ON DELETE CASCADE,
  player_id    UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0,
  detail       JSONB,                     -- Breakdown completo por posición
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(race_id, player_id)
);


-- ═══════════════════════════════════════════════════════════
-- Row Level Security (RLS)
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.players     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.races       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores      ENABLE ROW LEVEL SECURITY;

-- Players: todos pueden ver, solo tú puedes editar el tuyo
CREATE POLICY "players_select" ON public.players FOR SELECT TO authenticated USING (true);
CREATE POLICY "players_update" ON public.players FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Races: todos los autenticados pueden ver
CREATE POLICY "races_select" ON public.races FOR SELECT TO authenticated USING (true);

-- Predictions: todos pueden ver, cada uno solo puede insertar/editar la suya
CREATE POLICY "predictions_select" ON public.predictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "predictions_insert" ON public.predictions FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);
CREATE POLICY "predictions_update" ON public.predictions FOR UPDATE TO authenticated USING (auth.uid() = player_id);

-- Scores: todos los autenticados pueden ver
CREATE POLICY "scores_select" ON public.scores FOR SELECT TO authenticated USING (true);


-- ═══════════════════════════════════════════════════════════
-- Datos de ejemplo para probar (ajustar fechas)
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- Seed del calendario desde Jolpica (correr script Node)
-- ═══════════════════════════════════════════════════════════
-- En lugar de insertar manualmente, usar el script:
--   node scripts/seed-races.js
-- Esto popula todas las 24 carreras de 2026 automáticamente.
