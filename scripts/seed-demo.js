/**
 * scripts/seed-demo.js
 *
 * Genera datos de prueba realistas para F1 Arsenal Fantasy:
 * - 3 jugadores fake (Diego, Carlos, Ana)
 * - Carreras 1-4 completadas con resultados reales 2026
 * - Carrera 5 abierta (dentro de 3 días, sin resultados)
 * - Predicciones variadas: uno muy bueno, uno regular, uno malo
 * - Scores calculados según las reglas del juego
 *
 * Uso: node scripts/seed-demo.js
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const SUPABASE_URL      = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Faltan variables de entorno en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Reglas de puntuación ──────────────────────────────────────────────────
const F1_POINTS = { 1:25, 2:18, 3:15, 4:12, 5:10, 6:8, 7:6, 8:4, 9:2, 10:1 }

function calculateScore(prediction, results) {
  const top5 = new Set(results.slice(0, 5))
  const mid5 = new Set(results.slice(5, 10))
  let total = 0
  const detail = { by_position: [], exact_count: 0, block_count: 0, base_points: 0, bonus_points: 0 }

  prediction.forEach((driverId, idx) => {
    const pos      = idx + 1
    const actualPos = results.indexOf(driverId) + 1
    const isExact   = actualPos === pos && actualPos > 0
    let base = 0, bonus = 0

    if (top5.has(driverId))       base = 10
    else if (mid5.has(driverId))  base = 5

    if (isExact) bonus = F1_POINTS[pos] ?? 0

    total += base + bonus
    if (isExact)         detail.exact_count++
    if (base > 0)        detail.block_count++
    detail.base_points  += base
    detail.bonus_points += bonus
    detail.by_position.push({ pos, driverId, actualPos: actualPos || null, base, bonus, isExact })
  })

  return { total, detail }
}

// ─── Jugadores demo ────────────────────────────────────────────────────────
const DEMO_PLAYERS = [
  { email: 'diego@demo.f1arsenal.app',  username: 'DiegoArepa',   password: 'demo123456' },
  { email: 'carlos@demo.f1arsenal.app', username: 'CarlitosSpeed', password: 'demo123456' },
  { email: 'ana@demo.f1arsenal.app',    username: 'AnaRacingFan',  password: 'demo123456' },
]

// ─── Resultados reales de las primeras 4 carreras 2026 ────────────────────
// (basados en el calendario real Jolpica / predicciones plausibles)
const RACE_RESULTS = {
  1: ['NOR','VER','LEC','PIA','RUS','HAM','ANT','SAI','ALB','GAS'],  // Australia
  2: ['VER','NOR','PIA','LEC','RUS','HAM','SAI','GAS','ALO','STR'],  // China
  3: ['LEC','PIA','NOR','VER','HAM','RUS','ANT','SAI','ALB','ALO'],  // Japón
  4: ['NOR','VER','LEC','HAM','PIA','RUS','SAI','ANT','GAS','HUL'],  // Bahréin
}

// ─── Predicciones por jugador ──────────────────────────────────────────────
// Diego: muy buen predictor (conoce F1)
// Carlos: regular (acierta algo del top 5)
// Ana: fan, acierta pocos pero entusiasta
const PREDICTIONS = {
  diego: {
    1: ['NOR','VER','LEC','PIA','RUS','HAM','ANT','SAI','ALB','GAS'],  // 4 exactos → máximo
    2: ['VER','NOR','PIA','LEC','RUS','SAI','HAM','GAS','ALO','STR'],  // 3 exactos, 2 cambiados
    3: ['LEC','PIA','NOR','HAM','VER','RUS','ANT','SAI','ALO','ALB'],  // 3 exactos
    4: ['NOR','VER','LEC','HAM','PIA','SAI','RUS','ANT','GAS','HUL'],  // 4 exactos
  },
  carlos: {
    1: ['VER','NOR','PIA','LEC','RUS','HAM','GAS','ANT','SAI','ALO'],  // 1 exacto top5, mix mid
    2: ['NOR','VER','LEC','PIA','HAM','RUS','SAI','GAS','STR','ALO'],  // 2 exactos
    3: ['NOR','LEC','PIA','VER','RUS','HAM','SAI','ANT','GAS','ALO'],  // 1 exacto
    4: ['VER','NOR','HAM','LEC','RUS','PIA','SAI','GAS','ANT','HUL'],  // 2 exactos
  },
  ana: {
    1: ['VER','HAM','LEC','NOR','ALO','RUS','SAI','PIA','GAS','BOT'],  // 1 exacto, varios fuera
    2: ['NOR','HAM','VER','ALO','LEC','RUS','PIA','SAI','BOT','GAS'],  // 1 exacto
    3: ['VER','NOR','HAM','LEC','ALO','RUS','SAI','GAS','PIA','ANT'],  // 0 exactos
    4: ['VER','NOR','HAM','LEC','RUS','PIA','ALO','SAI','GAS','ANT'],  // 2 exactos
  },
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🏎️  F1 Arsenal Fantasy — Seed Demo\n')

  // 1. Verificar que la columna username exista (ignorar si ya está)
  console.log('📋 Verificando columna username en players...')
  const { error: colErr } = await supabase
    .from('players')
    .select('username')
    .limit(1)
  if (colErr?.message?.includes('column "username" does not exist')) {
    console.error('❌ La columna username no existe.')
    console.error('   Ejecuta en el SQL Editor de Supabase:')
    console.error('   ALTER TABLE public.players ADD COLUMN IF NOT EXISTS username TEXT;')
    process.exit(1)
  }
  console.log('   ✅ Columna username OK')

  // 2. Crear (o recuperar) los 3 jugadores demo
  console.log('👤 Creando jugadores demo...')
  const playerIds = {}

  for (const p of DEMO_PLAYERS) {
    // Intentar crear el usuario
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email:             p.email,
      password:          p.password,
      email_confirm:     true,
      user_metadata:     { username: p.username },
    })

    let userId
    if (createErr) {
      // Ya existe → buscar por email
      console.log(`   ↳ ${p.username}: ya existe, buscando...`)
      const { data: users } = await supabase.auth.admin.listUsers()
      const existing = users?.users?.find(u => u.email === p.email)
      userId = existing?.id
      if (!userId) { console.error(`   ❌ No se pudo obtener el ID de ${p.email}`); continue }
    } else {
      userId = created.user.id
      console.log(`   ✅ ${p.username} creado (${userId.slice(0,8)}...)`)
    }

    playerIds[p.username] = userId

    // Upsert en tabla players con username
    await supabase
      .from('players')
      .upsert({ id: userId, email: p.email, username: p.username }, { onConflict: 'id' })
  }

  // 3. Obtener las carreras de la DB
  console.log('\n🏁 Obteniendo carreras...')
  const { data: races, error: racesErr } = await supabase
    .from('races')
    .select('id, round, name')
    .order('round', { ascending: true })
    .limit(6)

  if (racesErr || !races?.length) {
    console.error('❌ No hay carreras en la DB. Corre primero: npm run seed:races')
    process.exit(1)
  }
  console.log(`   ✅ ${races.length} carreras encontradas`)

  // 4. Actualizar carreras 1-4: fechas pasadas + resultados
  console.log('\n📅 Configurando carreras 1-4 como completadas...')
  const now = new Date()

  for (let round = 1; round <= 4; round++) {
    const race = races.find(r => r.round === round)
    if (!race) { console.log(`   ⚠️  Ronda ${round} no encontrada`); continue }

    const pastDate = new Date(now)
    pastDate.setDate(now.getDate() - (5 - round) * 14) // 2 semanas de diferencia

    const { error } = await supabase
      .from('races')
      .update({
        race_date: pastDate.toISOString(),
        results:   RACE_RESULTS[round],
      })
      .eq('id', race.id)

    if (error) console.error(`   ❌ R${round}: ${error.message}`)
    else       console.log(`   ✅ R${round} ${race.name} → resultados cargados`)
  }

  // 5. Configurar carrera 5 como la próxima (en 3 días, sin resultados)
  const race5 = races.find(r => r.round === 5)
  if (race5) {
    const futureDate = new Date(now)
    futureDate.setDate(now.getDate() + 3)
    futureDate.setHours(15, 0, 0, 0) // 3pm UTC

    await supabase
      .from('races')
      .update({ race_date: futureDate.toISOString(), results: null })
      .eq('id', race5.id)
    console.log(`\n🔜 R5 ${race5.name} → configurada como próxima (${futureDate.toLocaleDateString()})`)
  }

  // 6. Insertar predicciones y calcular scores
  console.log('\n🎯 Insertando predicciones y scores...')
  const playerMap = [
    { key: 'diego',  username: 'DiegoArepa'    },
    { key: 'carlos', username: 'CarlitosSpeed' },
    { key: 'ana',    username: 'AnaRacingFan'  },
  ]

  for (const { key, username } of playerMap) {
    const playerId = playerIds[username]
    if (!playerId) { console.log(`   ⚠️  Sin ID para ${username}`); continue }

    let totalPlayer = 0
    for (let round = 1; round <= 4; round++) {
      const race   = races.find(r => r.round === round)
      if (!race) continue

      const picks   = PREDICTIONS[key][round]
      const results = RACE_RESULTS[round]
      const { total, detail } = calculateScore(picks, results)
      totalPlayer += total

      const submittedAt = new Date(now)
      submittedAt.setDate(now.getDate() - (5 - round) * 14 - 1) // 1 día antes de la carrera

      // Upsert predicción
      const { error: predErr } = await supabase
        .from('predictions')
        .upsert({
          race_id:      race.id,
          player_id:    playerId,
          picks,
          submitted_at: submittedAt.toISOString(),
        }, { onConflict: 'race_id,player_id' })

      if (predErr) { console.error(`   ❌ Pred R${round} ${username}: ${predErr.message}`); continue }

      // Upsert score
      const { error: scoreErr } = await supabase
        .from('scores')
        .upsert({
          race_id:      race.id,
          player_id:    playerId,
          total_points: total,
          detail,
        }, { onConflict: 'race_id,player_id' })

      if (scoreErr) console.error(`   ❌ Score R${round} ${username}: ${scoreErr.message}`)
    }
    console.log(`   ✅ ${username}: ${totalPlayer} pts acumulados en 4 carreras`)
  }

  // 7. Resumen final
  console.log('\n═══════════════════════════════════════')
  console.log('✅  Seed completado!\n')
  console.log('👥  Jugadores creados:')
  DEMO_PLAYERS.forEach(p => {
    console.log(`    ${p.username}`)
    console.log(`    Email:    ${p.email}`)
    console.log(`    Password: ${p.password}`)
    console.log()
  })
  console.log('📊  Estado de la temporada:')
  console.log('    Carreras 1-4: Completadas con resultados')
  console.log('    Carrera 5:    Próxima (abierta para predicciones)')
  console.log('\n🔗  Verifica en: https://supabase.com/dashboard/project/dtpsvlwqrlbsntpunest')
  console.log('\n💡  Para limpiar estos datos: node scripts/clean-demo.js')
}

main().catch(err => {
  console.error('💥 Error fatal:', err)
  process.exit(1)
})
