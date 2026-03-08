-- Migration: agregar columna favorite_team a players
-- Ejecutar en Supabase SQL Editor:
-- https://supabase.com/dashboard/project/dtpsvlwqrlbsntpunest/sql/new

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS favorite_team TEXT DEFAULT NULL;
