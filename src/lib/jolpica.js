// ─── Jolpica F1 API (sucesor oficial de Ergast) ──────────────────────────────
// Docs: https://github.com/jolpica/jolpica-f1
// Base: https://api.jolpi.ca/ergast/f1/
// Gratis, sin API key, sin auth requerida.

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1'

/**
 * Obtiene el calendario completo de una temporada.
 * @param {number} season - Año (ej: 2026)
 * @returns {Promise<Race[]>}
 */
export async function fetchSeasonSchedule(season = 2026) {
  const res = await fetch(`${JOLPICA_BASE}/${season}.json?limit=30`)
  if (!res.ok) throw new Error(`Jolpica API error: ${res.status}`)
  const data = await res.json()
  return data.MRData.RaceTable.Races
}

/**
 * Obtiene los resultados de una carrera específica.
 * @param {number} season
 * @param {number} round - Número de ronda
 * @returns {Promise<RaceResult[]>} Top 10 como array de driver IDs
 */
export async function fetchRaceResults(season, round) {
  const res = await fetch(`${JOLPICA_BASE}/${season}/${round}/results.json?limit=10`)
  if (!res.ok) throw new Error(`Jolpica API error: ${res.status}`)
  const data = await res.json()
  const race = data.MRData.RaceTable.Races[0]
  if (!race) throw new Error(`No results found for ${season} round ${round}`)
  return race
}

/**
 * Convierte una carrera del formato Jolpica al formato de nuestra tabla `races`.
 * @param {object} jolpicarace - Objeto de carrera de la API
 * @returns {object} Row listo para insertar en Supabase
 */
export function mapRaceToRow(jolpicarace) {
  const { round, raceName, date, time, Circuit } = jolpicarace

  // La API devuelve date (YYYY-MM-DD) y time (HH:MM:SSZ) por separado
  const raceDate = time
    ? new Date(`${date}T${time}`)
    : new Date(`${date}T14:00:00Z`) // fallback: 2pm UTC si no hay hora

  return {
    round:      parseInt(round),
    name:       raceName,
    circuit:    Circuit.circuitName,
    country:    Circuit.Location.country,
    locality:   Circuit.Location.locality,
    race_date:  raceDate.toISOString(),
  }
}

/**
 * Mapea los resultados de una carrera a un array de driver IDs en orden P1..P10.
 * Usa nuestra tabla DRIVERS_2026 para hacer la conversión de driverId → nuestro ID.
 *
 * @param {object} raceData - Objeto de carrera con Results[]
 * @param {object[]} drivers - DRIVERS_2026 array
 * @returns {string[]} Array de nuestros driver IDs, P1 a P10
 */
export function mapResultsToDriverIds(raceData, drivers) {
  // Mapa de familyName (lowercase) y número → nuestro ID
  // La API de Jolpica devuelve driverId tipo 'max_verstappen', 'hamilton', etc.
  const jolpicaToOurId = {
    'max_verstappen': 'VER',
    'hamilton':       'HAM',
    'leclerc':        'LEC',
    'norris':         'NOR',
    'piastri':        'PIA',
    'russell':        'RUS',
    'antonelli':      'ANT',
    'alonso':         'ALO',
    'stroll':         'STR',
    'gasly':          'GAS',
    'colapinto':      'COL',
    'hulkenberg':     'HUL',
    'bortoleto':      'BOR',
    'ocon':           'OCO',
    'bearman':        'BEA',
    'lawson':         'LAW',
    'lindblad':       'LIN',
    'hadjar':         'HAD',
    'sainz':          'SAI',
    'albon':          'ALB',
    'perez':          'PER',
    'bottas':         'BOT',
  }

  return raceData.Results
    .sort((a, b) => parseInt(a.position) - parseInt(b.position))
    .slice(0, 10)
    .map(r => jolpicaToOurId[r.Driver.driverId] ?? r.Driver.driverId)
}
