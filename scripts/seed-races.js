#!/usr/bin/env node
/**
 * seed-races.js
 * 
 * Popula la tabla `races` en Supabase con el calendario F1 2026
 * obtenido desde la API de Jolpica (sucesor de Ergast).
 * 
 * Uso:
 *   node scripts/seed-races.js
 * 
 * Requiere:
 *   - SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local
 *   - npm install @supabase/supabase-js dotenv (solo para el script)
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1'
const SEASON = 2026

// ── Supabase con service role key (bypass RLS para el seed) ──────────────────
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // ⚠️  Nunca exponer en el frontend
)

// ── Fetch del calendario ─────────────────────────────────────────────────────
async function fetchSchedule() {
  console.log(`📡 Fetching F1 ${SEASON} schedule from Jolpica...`)
  const res = await fetch(`${JOLPICA_BASE}/${SEASON}.json?limit=30`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return data.MRData.RaceTable.Races
}

// ── Convertir carrera a row de Supabase ──────────────────────────────────────
function mapRace(race) {
  const { round, raceName, date, time, Circuit } = race
  const raceDate = time
    ? new Date(`${date}T${time}`)
    : new Date(`${date}T14:00:00Z`)

  return {
    round:     parseInt(round),
    name:      raceName,
    circuit:   Circuit.circuitName,
    country:   Circuit.Location.country,
    locality:  Circuit.Location.locality,
    race_date: raceDate.toISOString(),
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  try {
    const races = await fetchSchedule()
    console.log(`✅ Got ${races.length} races from Jolpica\n`)

    const rows = races.map(mapRace)

    // Upsert por round (permite re-correr el script sin duplicar)
    const { data, error } = await supabase
      .from('races')
      .upsert(rows, { onConflict: 'round' })
      .select()

    if (error) {
      console.error('❌ Supabase error:', error.message)
      process.exit(1)
    }

    console.log(`✅ Inserted/updated ${data.length} races:\n`)
    data.forEach(r => {
      const deadline = new Date(r.race_date)
      deadline.setHours(deadline.getHours() - 1)
      console.log(
        `  Round ${String(r.round).padStart(2, '0')} — ${r.name}`.padEnd(55),
        `📅 ${new Date(r.race_date).toUTCString()}`,
        `\n${''.padStart(57)}🔒 Deadline: ${deadline.toUTCString()}`
      )
    })

    console.log('\n🏁 Seed completado.')
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

main()
