-- Migration: agregar columna country_flag a races
-- Ejecutar en Supabase SQL Editor:
-- https://supabase.com/dashboard/project/dtpsvlwqrlbsntpunest/sql/new
--
-- Luego correr: node scripts/seed-races.js  (actualiza banderas via FLAG_MAP)

ALTER TABLE races
  ADD COLUMN IF NOT EXISTS country_flag TEXT DEFAULT NULL;

-- Popular con banderas para las 24 carreras de 2026
UPDATE races SET country_flag = CASE country
  WHEN 'Australia'     THEN '🇦🇺'
  WHEN 'China'         THEN '🇨🇳'
  WHEN 'Japan'         THEN '🇯🇵'
  WHEN 'Bahrain'       THEN '🇧🇭'
  WHEN 'Saudi Arabia'  THEN '🇸🇦'
  WHEN 'United States' THEN '🇺🇸'
  WHEN 'USA'           THEN '🇺🇸'
  WHEN 'Italy'         THEN '🇮🇹'
  WHEN 'Monaco'        THEN '🇲🇨'
  WHEN 'Spain'         THEN '🇪🇸'
  WHEN 'Canada'        THEN '🇨🇦'
  WHEN 'Austria'       THEN '🇦🇹'
  WHEN 'United Kingdom' THEN '🇬🇧'
  WHEN 'UK'            THEN '🇬🇧'
  WHEN 'Hungary'       THEN '🇭🇺'
  WHEN 'Belgium'       THEN '🇧🇪'
  WHEN 'Netherlands'   THEN '🇳🇱'
  WHEN 'Singapore'     THEN '🇸🇬'
  WHEN 'Azerbaijan'    THEN '🇦🇿'
  WHEN 'Mexico'        THEN '🇲🇽'
  WHEN 'Brazil'        THEN '🇧🇷'
  WHEN 'Qatar'         THEN '🇶🇦'
  WHEN 'Abu Dhabi'     THEN '🇦🇪'
  WHEN 'UAE'           THEN '🇦🇪'
  ELSE '🏁'
END
WHERE country_flag IS NULL;
