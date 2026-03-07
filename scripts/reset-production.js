/**
 * scripts/reset-production.js
 *
 * Limpia la base de datos para el lanzamiento real:
 *   - Borra scores y predicciones de todos los usuarios
 *   - Borra los usuarios demo (demo.f1arsenal.app)
 *   - Quita los resultados de R1-R4 (vuelven a estado PENDIENTE)
 *   - Saudi R5 queda como SIGUIENTE con fecha real
 *
 * USO: node scripts/reset-production.js
 * CONFIRMAR: node scripts/reset-production.js --confirm
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const DEMO_EMAILS = [
  'diego@demo.f1arsenal.app',
  'carlos@demo.f1arsenal.app',
  'ana@demo.f1arsenal.app',
]

const CONFIRMED = process.argv.includes('--confirm')

async function main() {
  console.log('\n🏁 F1 Arsenal — Reset de Produccion\n')

  if (!CONFIRMED) {
    console.log('⚠️  DRY RUN — solo muestra lo que se borraria.')
    console.log('   Para ejecutar de verdad: node scripts/reset-production.js --confirm\n')
  }

  // ── 1. Contar registros actuales ─────────────────────────────────────────
  const { count: scoreCount }  = await supabase.from('scores').select('*', { count: 'exact', head: true })
  const { count: predCount }   = await supabase.from('predictions').select('*', { count: 'exact', head: true })
  const { count: playerCount } = await supabase.from('players').select('*', { count: 'exact', head: true })

  console.log(`📊 Estado actual:`)
  console.log(`   Jugadores: ${playerCount}`)
  console.log(`   Predicciones: ${predCount}`)
  console.log(`   Scores: ${scoreCount}\n`)

  if (!CONFIRMED) {
    console.log('🔍 Se ejecutaria:')
    console.log('   [1] DELETE scores (todos)')
    console.log('   [2] DELETE predictions (todas)')
    console.log(`   [3] DELETE usuarios demo: ${DEMO_EMAILS.join(', ')}`)
    console.log('   [4] UPDATE races R1-R4: results = NULL')
    console.log('\n   Corre con --confirm para ejecutar.\n')
    return
  }

  // ── 2. Borrar scores ──────────────────────────────────────────────────────
  console.log('🗑  Borrando scores...')
  const { error: e1 } = await supabase.from('scores').delete().neq('race_id', '00000000-0000-0000-0000-000000000000')
  if (e1) { console.error('   ERROR:', e1.message); process.exit(1) }
  console.log('   ✅ Scores eliminados')

  // ── 3. Borrar predicciones ────────────────────────────────────────────────
  console.log('🗑  Borrando predicciones...')
  const { error: e2 } = await supabase.from('predictions').delete().neq('race_id', '00000000-0000-0000-0000-000000000000')
  if (e2) { console.error('   ERROR:', e2.message); process.exit(1) }
  console.log('   ✅ Predicciones eliminadas')

  // ── 4. Borrar jugadores demo (players table) ──────────────────────────────
  console.log('🗑  Borrando jugadores demo...')
  const { data: demoPLayers } = await supabase
    .from('players')
    .select('id, email')
    .in('email', DEMO_EMAILS)

  if (demoPLayers?.length) {
    const ids = demoPLayers.map(p => p.id)
    const { error: e3 } = await supabase.from('players').delete().in('id', ids)
    if (e3) { console.error('   ERROR players:', e3.message) }
    else console.log(`   ✅ ${demoPLayers.length} jugadores demo eliminados de players`)

    // Borrar de auth.users via Admin API
    for (const p of demoPLayers) {
      const { error: authErr } = await supabase.auth.admin.deleteUser(p.id)
      if (authErr) console.log(`   ⚠️  Auth delete ${p.email}: ${authErr.message}`)
      else console.log(`   ✅ Auth user eliminado: ${p.email}`)
    }
  } else {
    console.log('   ℹ️  No se encontraron usuarios demo')
  }

  // ── 5. Limpiar resultados de R1-R4 ────────────────────────────────────────
  console.log('🔄 Limpiando resultados de carreras R1-R4...')
  const { error: e4 } = await supabase
    .from('races')
    .update({ results: null })
    .lte('round', 4)
  if (e4) { console.error('   ERROR:', e4.message); process.exit(1) }
  console.log('   ✅ R1-R4 sin resultados — estado PENDIENTE')

  // ── 6. Verificar estado final ─────────────────────────────────────────────
  const { count: finalScores }  = await supabase.from('scores').select('*', { count: 'exact', head: true })
  const { count: finalPreds }   = await supabase.from('predictions').select('*', { count: 'exact', head: true })
  const { count: finalPlayers } = await supabase.from('players').select('*', { count: 'exact', head: true })
  const { data: races }         = await supabase.from('races').select('round, name, results').order('round').limit(6)

  console.log('\n✅ Estado final:')
  console.log(`   Jugadores reales: ${finalPlayers}`)
  console.log(`   Predicciones: ${finalPreds}`)
  console.log(`   Scores: ${finalScores}`)
  console.log('\n📅 Calendario:')
  races?.forEach(r => {
    const estado = r.results ? '✅ COMPLETADA' : '⏳ PENDIENTE'
    console.log(`   R${r.round} ${r.name}: ${estado}`)
  })

  console.log('\n🚀 Base de datos lista para produccion!\n')
}

main()
