/**
 * scripts/process-results.js
 *
 * Fetches official race results from Jolpica, saves them to Supabase,
 * and calculates scores for every player who submitted a prediction.
 *
 * Usage:
 *   node scripts/process-results.js <round>
 *   node scripts/process-results.js 5
 *
 * What it does:
 *   1. Fetches P1–P10 from Jolpica for the given round
 *   2. Updates races.results in Supabase
 *   3. Fetches all predictions for that race
 *   4. Calculates points for each prediction
 *   5. Upserts into scores table
 *   6. Prints a leaderboard summary for that race
 *
 * Safe to re-run: uses upsert, won't duplicate scores.
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1'
const SEASON       = 2026
const F1_POINTS    = { 1:25, 2:18, 3:15, 4:12, 5:10, 6:8, 7:6, 8:4, 9:2, 10:1 }

// ─── Jolpica driver ID → nuestro driver ID ────────────────────────────────
const JOLPICA_ID_MAP = {
  max_verstappen: 'VER', hamilton: 'HAM',  leclerc: 'LEC',
  norris:         'NOR', piastri: 'PIA',   russell: 'RUS',
  antonelli:      'ANT', alonso:  'ALO',   stroll:  'STR',
  gasly:          'GAS', colapinto: 'COL', hulkenberg: 'HUL',
  bortoleto:      'BOR', ocon:    'OCO',   bearman: 'BEA',
  lawson:         'LAW', lindblad: 'LIN', arvid_lindblad: 'LIN', hadjar: 'HAD',
  sainz:          'SAI', albon:   'ALB',   perez:   'PER',
  bottas:         'BOT',
}

// ─── Scoring logic (mirror de src/lib/supabase.js) ────────────────────────
function calculateScore(prediction, results) {
  let total  = 0
  const detail = {
    by_position: [],
    exact_count:  0,
    block_count:  0,
    base_points:  0,
    bonus_points: 0,
  }

  prediction.forEach((driverId, idx) => {
    const pos        = idx + 1
    const actualIdx  = results.indexOf(driverId)        // -1 si no está en top10
    const actualPos  = actualIdx >= 0 ? actualIdx + 1 : 0
    const isExact    = actualPos === pos && actualPos > 0

    // ── Regla de bloque: se gana base solo si piloto termina en el MISMO bloque
    //    que el slot de predicción. Cruce de bloques = 0 pts.
    const predictedTop5 = idx < 5
    const inActualTop5  = actualIdx >= 0 && actualIdx < 5
    const inActualMid5  = actualIdx >= 5 && actualIdx < 10

    let base = 0, bonus = 0
    if (predictedTop5 && inActualTop5)        base = 10
    else if (!predictedTop5 && inActualMid5)  base = 5
    if (isExact)                               bonus = F1_POINTS[pos] ?? 0

    total += base + bonus
    if (isExact)  detail.exact_count++
    if (base > 0) detail.block_count++
    detail.base_points  += base
    detail.bonus_points += bonus
    detail.by_position.push({
      pos,
      driverId,
      actualPos: actualPos || null,
      base,
      bonus,
      isExact,
    })
  })

  return { total, detail }
}

// ─── Fetch results from Jolpica ───────────────────────────────────────────
async function fetchResultsFromJolpica(round) {
  console.log(`📡 Fetching results for Round ${round} from Jolpica...`)
  const url = `${JOLPICA_BASE}/${SEASON}/${round}/results.json?limit=10`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Jolpica API error: ${res.status} for ${url}`)
  const data = await res.json()
  const race = data.MRData.RaceTable.Races[0]
  if (!race) throw new Error(`No results found for Round ${round}. Race may not have happened yet.`)
  return race
}

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  const round = parseInt(process.argv[2])
  if (!round || isNaN(round) || round < 1 || round > 24) {
    console.error('❌ Usage: node scripts/process-results.js <round>')
    console.error('   Example: node scripts/process-results.js 5')
    process.exit(1)
  }

  console.log(`\n🏎️  Processing results for F1 ${SEASON} Round ${round}\n`)

  // ── Step 1: Fetch from Jolpica ───────────────────────────────────────────
  let jolpicarace
  try {
    jolpicarace = await fetchResultsFromJolpica(round)
  } catch (err) {
    console.error(`❌ ${err.message}`)
    console.error('   Note: Results are usually available 2-3 hours after the race ends.')
    process.exit(1)
  }

  // Map to our driver IDs
  const results = jolpicarace.Results
    .sort((a, b) => parseInt(a.position) - parseInt(b.position))
    .slice(0, 10)
    .map(r => {
      const ourId = JOLPICA_ID_MAP[r.Driver.driverId]
      if (!ourId) console.warn(`  ⚠️  Unknown driver: ${r.Driver.driverId} (${r.Driver.familyName})`)
      return ourId ?? r.Driver.driverId
    })

  console.log(`✅ Race: ${jolpicarace.raceName}`)
  console.log(`   Results: ${results.join(' · ')}\n`)

  // ── Step 2: Get race from Supabase ───────────────────────────────────────
  const { data: race, error: raceErr } = await supabase
    .from('races')
    .select('id, name, round')
    .eq('round', round)
    .single()

  if (raceErr || !race) {
    console.error('❌ Race not found in Supabase. Run npm run seed:races first.')
    process.exit(1)
  }

  // ── Step 3: Save results to races table ─────────────────────────────────
  const { error: updateErr } = await supabase
    .from('races')
    .update({ results })
    .eq('id', race.id)

  if (updateErr) {
    console.error('❌ Failed to update race results:', updateErr.message)
    process.exit(1)
  }
  console.log(`✅ Saved results to races table\n`)

  // ── Step 4: Get all predictions for this race ────────────────────────────
  const { data: predictions, error: predErr } = await supabase
    .from('predictions')
    .select('player_id, picks, players(username, email)')
    .eq('race_id', race.id)

  if (predErr) {
    console.error('❌ Failed to fetch predictions:', predErr.message)
    process.exit(1)
  }

  if (!predictions?.length) {
    console.log('⚠️  No predictions found for this race. No scores to calculate.')
    process.exit(0)
  }

  console.log(`📊 Calculating scores for ${predictions.length} prediction(s)...\n`)

  // ── Step 5: Calculate and upsert scores ──────────────────────────────────
  const scoreRows = []
  const summary   = []

  for (const pred of predictions) {
    const { total, detail } = calculateScore(pred.picks, results)
    const username = pred.players?.username ?? pred.players?.email?.split('@')[0] ?? 'Jugador'

    scoreRows.push({
      race_id:      race.id,
      player_id:    pred.player_id,
      total_points: total,
      detail,
    })

    summary.push({ username, total, exact: detail.exact_count, block: detail.block_count })
  }

  const { error: scoreErr } = await supabase
    .from('scores')
    .upsert(scoreRows, { onConflict: 'race_id,player_id' })

  if (scoreErr) {
    console.error('❌ Failed to upsert scores:', scoreErr.message)
    process.exit(1)
  }

  // ── Step 6: Print race leaderboard ───────────────────────────────────────
  summary.sort((a, b) => b.total - a.total)

  console.log('─'.repeat(52))
  console.log(`  ${jolpicarace.raceName} — RESULTADOS FINALES`)
  console.log('─'.repeat(52))
  summary.forEach((s, i) => {
    const medal = ['🥇', '🥈', '🥉'][i] ?? `  ${i + 1}.`
    console.log(
      `  ${medal}  ${s.username.padEnd(20)} ${String(s.total).padStart(3)} pts  ` +
      `(${s.exact} exactos · ${s.block} en bloque)`
    )
  })
  console.log('─'.repeat(52))
  console.log(`\n✅ Scores saved. ${predictions.length} players updated.`)
  console.log('   Refresh the app to see the updated standings.\n')
}

main().catch(err => {
  console.error('💥 Unexpected error:', err)
  process.exit(1)
})
