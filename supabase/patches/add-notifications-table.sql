-- Migration: agregar tabla notifications
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT, -- Ejemplo: "/race/1" o "/standings"
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias notificaciones
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT TO authenticated
    USING (auth.uid() = player_id);

-- Política: Los usuarios pueden marcar sus notificaciones como leídas (UPDATE)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE TO authenticated
    USING (auth.uid() = player_id);

-- Política: El service_role (cron/admin) puede insertar para todos
-- (No se necesita policy explícita para service_role ya que bypassa RLS)
