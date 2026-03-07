/**
 * api/process-results.js
 *
 * Vercel Serverless Function — procesa resultados de una carrera F1.
 * Protegida con ADMIN_SECRET para que solo tú puedas triggearla.
 *
 * Uso desde el browser o curl:
 *   GET /api/process-results?round=5&secret=TU_SECRET
 *
 * Variables de entorno requeridas en Vercel (Settings → Environment Variables):
 *   SUPABASE_URL           → igual que VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY → tu service_role key (NUNCA la anon key)
 *   ADMIN_SECRET           → string secreto que solo tú conoces (ej: "arepa2026")
 */

import { createClient } from '@supabase/supabase-js'

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1'
const SEASON       = 2026
const F1_POINTS    = { 1:25, 2:18, 3:15, 4:12, 5:10, 6:8, 7:6, 8:4, 9:2, 10:1 }

const JOLPICA_ID_MAP = {
  max_verstappen: 'VER', hamilton: 'HAM',  leclerc: 'LEC',
  norris:         'NOR', piastri: 'PIA',   russell: 'RUS',
  antonelli:      'ANT', alonso:  'ALO',   stroll:  'STR',
  gasly:          'GAS', colapinto: 'COL', hulkenberg: 'HUL',
  bortoleto:      'BOR', ocon:    'OCO',   bearman: 'BEA',
  lawson:         'LAW', lindblad: 'LIN',  hadjar:  'HAD',
  sainz:          'SAI', albon:   'ALB',   perez:   'PER',
  bottas:         'BOT',
}

function calculateScore(prediction, results) {
  const top5 = new Set(results.slice(0, 5))
  const mid5 = new Set(results.slice(5, 10))
  let total  = 0
  const detail = { by_position: [], exact_count: 0, block_count: 0, base_points: 0, bonus_points: 0 }

  prediction.forEach((driverId, idx) => {
    const pos       = idx + 1
    const actualPos = results.indexOf(driverId) + 1
    const isExact   = actualPos === pos && actualPos > 0
    let base = 0, bonus = 0
    if (top5.has(driverId))      base = 10
    else if (mid5.has(driverId)) base = 5
    if (isExact)                 bonus = F1_POINTS[pos] ?? 0
    total += base + bonus
    if (isExact)  detail.exact_count++
    if (base > 0) detail.block_count++
    detail.base_points  += base
    detail.bonus_points += bonus
    detail.by_position.push({ pos, driverId, actualPos: actualPos || null, base, bonus, isExact })
  })

  return { total, detail }
}

export default async function handler(req, res) {
  // ── CORS para poder llamarlo desde el browser ──────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { round, secret } = req.query

  // ── Auth check ─────────────────────────────────────────────────────────
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized. Missing or invalid secret.' })
  }

  // ── Validate round ──────────────────────────────────────────────────────
  const roundNum = parseInt(round)
  if (!roundNum || isNaN(roundNum) || roundNum < 1 || roundNum > 24) {
    return res.status(400).json({ error: 'Invalid round. Must be between 1 and 24.' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const log = []
  const info  = (msg) => { log.push(msg); console.log(msg) }
  const error = (msg) => { log.push(`ERROR: ${msg}`); console.error(msg) }

  try {
    // ── 1. Fetch results from Jolpica ──────────────────────────────────────
    info(`Fetching Round ${roundNum} from Jolpica...`)
    const jolpikaRes = await fetch(
      `${JOLPICA_BASE}/${SEASON}/${roundNum}/results.json?limit=10`
    )
    if (!jolpikaRes.ok) throw new Error(`Jolpica API error: ${jolpikaRes.status}`)
    const jolpikaData = await jolpikaRes.json()
    const jolpikaRace = jolpikaData.MRData.RaceTable.Races[0]
    if (!jolpikaRace) {
      return res.status(404).json({
        error: `No results found for Round ${roundNum}. Race may not have happened yet or Jolpica hasn't published results (wait 2-3h after race end).`,
        log,
      })
    }

    const results = jolpikaRace.Results
      .sort((a, b) => parseInt(a.position) - parseInt(b.position))
      .slice(0, 10)
      .map(r => JOLPICA_ID_MAP[r.Driver.driverId] ?? r.Driver.driverId)

    info(`Race: ${jolpikaRace.raceName}`)
    info(`Results: ${results.join(' · ')}`)

    // ── 2. Get race from Supabase ──────────────────────────────────────────
    const { data: race, error: raceErr } = await supabase
      .from('races').select('id, name').eq('round', roundNum).single()
    if (raceErr || !race) throw new Error('Race not found in Supabase')

    // ── 3. Save results ────────────────────────────────────────────────────
    const { error: updateErr } = await supabase
      .from('races').update({ results }).eq('id', race.id)
    if (updateErr) throw new Error(`Failed to save results: ${updateErr.message}`)
    info('Results saved to races table')

    // ── 4. Get all predictions ─────────────────────────────────────────────
    const { data: predictions, error: predErr } = await supabase
      .from('predictions')
      .select('player_id, picks, players(username, email)')
      .eq('race_id', race.id)
    if (predErr) throw new Error(`Failed to fetch predictions: ${predErr.message}`)
    if (!predictions?.length) {
      return res.status(200).json({ message: 'No predictions found for this race.', results, log })
    }

    // ── 5. Calculate & save scores ─────────────────────────────────────────
    const scoreRows = []
    const leaderboard = []

    for (const pred of predictions) {
      const { total, detail } = calculateScore(pred.picks, results)
      const username = pred.players?.username ?? pred.players?.email?.split('@')[0] ?? 'Jugador'
      scoreRows.push({ race_id: race.id, player_id: pred.player_id, total_points: total, detail })
      leaderboard.push({ username, total, exact: detail.exact_count, block: detail.block_count })
    }

    const { error: scoreErr } = await supabase
      .from('scores').upsert(scoreRows, { onConflict: 'race_id,player_id' })
    if (scoreErr) throw new Error(`Failed to save scores: ${scoreErr.message}`)

    leaderboard.sort((a, b) => b.total - a.total)
    info(`Scores saved for ${predictions.length} player(s)`)

    return res.status(200).json({
      success:      true,
      race:         jolpikaRace.raceName,
      round:        roundNum,
      results,
      leaderboard,
      players_scored: predictions.length,
      log,
    })

  } catch (err) {
    error(err.message)
    return res.status(500).json({ error: err.message, log })
  }
}
