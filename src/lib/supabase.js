import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── Puntos reales de F1 por posición ───────────────────────────────────────
export const F1_POINTS = {
  1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
  6: 8,  7: 6,  8: 4,  9: 2,  10: 1,
}

// ─── Pilotos 2026 (fuente: formula1.com) ────────────────────────────────────
// ─── Date/Time formatting ─────────────────────────────────────────────────
// Muestra fecha y hora en zona local del usuario, formato: "08 mar · 3:00 PM"
export function formatRaceDateTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const date = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  return `${date} · ${time}`
}

// Solo fecha: "08 mar 2026"
export function formatRaceDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Solo hora AM/PM: "3:00 PM"
export function formatRaceTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export const DRIVERS_2026 = [
  // Alpine
  { id: 'GAS', name: 'Gasly',       team: 'Alpine',       number: 10 },
  { id: 'COL', name: 'Colapinto',   team: 'Alpine',       number: 43 },
  // Aston Martin
  { id: 'ALO', name: 'Alonso',      team: 'Aston Martin', number: 14 },
  { id: 'STR', name: 'Stroll',      team: 'Aston Martin', number: 18 },
  // Audi (ex-Sauber)
  { id: 'HUL', name: 'Hulkenberg',  team: 'Audi',         number: 27 },
  { id: 'BOR', name: 'Bortoleto',   team: 'Audi',         number: 5  },
  // Cadillac
  { id: 'PER', name: 'Pérez',       team: 'Cadillac',     number: 11 },
  { id: 'BOT', name: 'Bottas',      team: 'Cadillac',     number: 77 },
  // Ferrari
  { id: 'LEC', name: 'Leclerc',     team: 'Ferrari',      number: 16 },
  { id: 'HAM', name: 'Hamilton',    team: 'Ferrari',      number: 44 },
  // Haas
  { id: 'OCO', name: 'Ocon',        team: 'Haas',         number: 31 },
  { id: 'BEA', name: 'Bearman',     team: 'Haas',         number: 87 },
  // McLaren
  { id: 'NOR', name: 'Norris',      team: 'McLaren',      number: 4  },
  { id: 'PIA', name: 'Piastri',     team: 'McLaren',      number: 81 },
  // Mercedes
  { id: 'RUS', name: 'Russell',     team: 'Mercedes',     number: 63 },
  { id: 'ANT', name: 'Antonelli',   team: 'Mercedes',     number: 12 },
  // Racing Bulls
  { id: 'LAW', name: 'Lawson',      team: 'Racing Bulls', number: 30 },
  { id: 'LIN', name: 'Lindblad',    team: 'Racing Bulls', number: 6  },
  // Red Bull Racing
  { id: 'VER', name: 'Verstappen',  team: 'Red Bull',     number: 1  },
  { id: 'HAD', name: 'Hadjar',      team: 'Red Bull',     number: 22 },
  // Williams
  { id: 'SAI', name: 'Sainz',       team: 'Williams',     number: 55 },
  { id: 'ALB', name: 'Albon',       team: 'Williams',     number: 23 },
]

// ─── Colores por equipo ───────────────────────────────────────────────────────
export const TEAM_COLORS = {
  'Red Bull':      '#3671C6',
  'McLaren':       '#FF8000',
  'Ferrari':       '#E8002D',
  'Mercedes':      '#27F4D2',
  'Aston Martin':  '#229971',
  'Alpine':        '#FF87BC',
  'Audi':          '#D0D0D0',
  'Cadillac':      '#E91B8C',
  'Williams':      '#64C4FF',
  'Haas':          '#B6BABD',
  'Racing Bulls':  '#6692FF',
}

// ─── Lógica de scoring ────────────────────────────────────────────────────────
/**
 * Calcula el puntaje de una predicción contra los resultados reales.
 * @param {string[]} prediction - Array de driver IDs en orden P1..P10
 * @param {string[]} results    - Array de driver IDs en orden P1..P10 (resultado real)
 * @returns {{ total: number, detail: object[] }}
 */
export function calculateScore(prediction, results) {
  const TOP5_DRIVERS = new Set(results.slice(0, 5))
  const MID_DRIVERS  = new Set(results.slice(5, 10))

  let total = 0
  const detail = []

  prediction.forEach((driverId, idx) => {
    const predictedPos = idx + 1
    const actualPos    = results.indexOf(driverId) + 1 // 0 si no está en top10
    const isExact      = actualPos === predictedPos

    let base  = 0
    let bonus = 0

    if (TOP5_DRIVERS.has(driverId)) {
      base = 10
    } else if (MID_DRIVERS.has(driverId)) {
      base = 5
    }

    if (isExact && actualPos > 0) {
      bonus = F1_POINTS[actualPos] ?? 0
    }

    const pts = base + bonus
    total += pts

    detail.push({
      position:    predictedPos,
      driverId,
      actualPos:   actualPos || null,
      base,
      bonus,
      points:      pts,
      isExact,
      inTop5:      TOP5_DRIVERS.has(driverId),
      inMid:       MID_DRIVERS.has(driverId),
    })
  })

  return { total, detail }
}
