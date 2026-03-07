/**
 * scripts/seed-darva.js
 *
 * Añade scores para el usuario darvaset@gmail.com
 * usando sus predicciones para las carreras 1-4 ya completadas.
 *
 * Uso: node scripts/seed-darva.js
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const F1_POINTS = { 1:25, 2:18, 3:15, 4:12, 5:10, 6:8, 7:6, 8:4, 9:2, 10:1 }

function calculateScore(prediction, results) {
  const top5 = new Set(results.slice(0, 5))
  const mid5 = new Set(results.slice(5, 10))
  let total = 0
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

// Resultados reales de las 4 carreras
const RACE_RESULTS = {
  1: ['NOR','VER','LEC','PIA','RUS','HAM','ANT','SAI','ALB','GAS'],  // Australia
  2: ['VER','NOR','PIA','LEC','RUS','HAM','SAI','GAS','ALO','STR'],  // China
  3: ['LEC','PIA','NOR','VER','HAM','RUS','ANT','SAI','ALB','ALO'],  // Japón
  4: ['NOR','VER','LEC','HAM','PIA','RUS','SAI','ANT','GAS','HUL'],  // Bahréin
}

// Predicciones de darvaset — alguien que sabe de F1, mezcla de buenos y mediocres
const DARVA_PICKS = {
  1: ['NOR','LEC','VER','PIA','HAM','RUS','ANT','GAS','SAI','ALB'],  // 1 exacto (NOR P1)
  2: ['NOR','VER','LEC','PIA','HAM','RUS','SAI','ALO','GAS','STR'],  // 2 exactos
  3: ['LEC','NOR','PIA','VER','HAM','RUS','SAI','ANT','ALO','ALB'],  // 1 exacto (LEC P1)
  4: ['NOR','VER','HAM','LEC','RUS','PIA','SAI','ANT','GAS','HUL'],  // 3 exactos
}

async function main() {
  console.log('🏎️  Seed scores para darvaset\n')

  // 1. Buscar el usuario
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const darva = users?.find(u => u.email === 'darvaset@gmail.com')
  if (!darva) {
    console.error('❌ No se encontró darvaset@gmail.com en Supabase Auth')
    console.error('   Asegúrate de haberte registrado primero en la app')
    process.exit(1)
  }
  console.log(`✅ Usuario encontrado: ${darva.id.slice(0,8)}...`)

  // 2. Asegurarse de que tiene username en players
  await supabase
    .from('players')
    .upsert({ id: darva.id, email: darva.email, username: 'Darva' }, { onConflict: 'id' })

  // 3. Obtener carreras 1-4
  const { data: races } = await supabase
    .from('races')
    .select('id, round, name')
    .in('round', [1, 2, 3, 4])
    .order('round')

  if (!races?.length) {
    console.error('❌ No hay carreras. Corre npm run seed:races primero')
    process.exit(1)
  }

  // 4. Insertar predicciones + scores para cada carrera
  const now = new Date()
  let totalPts = 0

  for (const race of races) {
    const picks   = DARVA_PICKS[race.round]
    const results = RACE_RESULTS[race.round]
    const { total, detail } = calculateScore(picks, results)
    totalPts += total

    // Fecha de predicción: 1 día antes de la carrera
    const submittedAt = new Date(now)
    submittedAt.setDate(now.getDate() - (5 - race.round) * 14 - 1)

    // Upsert predicción
    await supabase.from('predictions').upsert({
      race_id:      race.id,
      player_id:    darva.id,
      picks,
      submitted_at: submittedAt.toISOString(),
    }, { onConflict: 'race_id,player_id' })

    // Upsert score
    await supabase.from('scores').upsert({
      race_id:      race.id,
      player_id:    darva.id,
      total_points: total,
      detail,
    }, { onConflict: 'race_id,player_id' })

    console.log(`   R${race.round} ${race.name}: ${total} pts (${detail.exact_count} exactos, ${detail.block_count} en bloque)`)
  }

  console.log(`\n✅ Darva total: ${totalPts} pts en 4 carreras`)
  console.log('   Recarga la app para ver los datos')
}

main().catch(err => {
  console.error('💥', err)
  process.exit(1)
})
