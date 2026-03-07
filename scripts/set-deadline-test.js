/**
 * scripts/set-deadline-test.js
 * 
 * Mueve la race_date de una ronda a X minutos desde ahora.
 * Uso:
 *   node scripts/set-deadline-test.js <round> <minutes>
 *   node scripts/set-deadline-test.js 5 65   ← Saudi GP en 65 min (deadline en 5 min)
 *   node scripts/set-deadline-test.js 5 reset ← restaura la fecha real de Jolpica
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
const SEASON = 2026

async function main() {
  const round   = parseInt(process.argv[2])
  const minutes = process.argv[3]

  if (!round || !minutes) {
    console.error('❌ Uso: node scripts/set-deadline-test.js <round> <minutes|reset>')
    console.error('   Ejemplo: node scripts/set-deadline-test.js 5 65')
    process.exit(1)
  }

  // Obtener race actual
  const { data: race, error } = await supabase
    .from('races').select('id, name, race_date, round').eq('round', round).single()
  if (error || !race) {
    console.error('❌ Carrera no encontrada:', error?.message)
    process.exit(1)
  }

  let newDate

  if (minutes === 'reset') {
    // Restaurar desde Jolpica
    console.log(`🔄 Restaurando fecha real de Round ${round} desde Jolpica...`)
    const res  = await fetch(`${JOLPICA_BASE}/${SEASON}/${round}.json`)
    const data = await res.json()
    const r    = data.MRData.RaceTable.Races[0]
    if (!r) { console.error('❌ No encontrado en Jolpica'); process.exit(1) }
    newDate = r.time ? new Date(`${r.date}T${r.time}`) : new Date(`${r.date}T14:00:00Z`)
  } else {
    // Mover a now + N minutos
    const mins = parseInt(minutes)
    newDate = new Date(Date.now() + mins * 60 * 1000)
  }

  const { error: updateErr } = await supabase
    .from('races').update({ race_date: newDate.toISOString() }).eq('id', race.id)

  if (updateErr) {
    console.error('❌ Error actualizando:', updateErr.message)
    process.exit(1)
  }

  const deadline = new Date(newDate.getTime() - 60 * 60 * 1000)
  const now      = new Date()
  const minsToDeadline = Math.round((deadline - now) / 60000)

  console.log(`\n✅ ${race.name} (Round ${round}) actualizado:`)
  console.log(`   Race date: ${newDate.toLocaleTimeString()} (en ${Math.round((newDate - now) / 60000)} min)`)
  console.log(`   Deadline:  ${deadline.toLocaleTimeString()} (en ${minsToDeadline} min)`)

  if (minutes === 'reset') {
    console.log('\n🔄 Fecha restaurada a la real de la temporada.')
  } else if (minsToDeadline > 0) {
    console.log(`\n⚠️  Deadline en ${minsToDeadline} minutos — predicciones AÚN ABIERTAS.`)
    console.log('   Para testear bloqueo inmediato: node scripts/set-deadline-test.js 5 30')
  } else {
    console.log(`\n🔒 Deadline ya PASÓ hace ${Math.abs(minsToDeadline)} minutos — predicciones BLOQUEADAS.`)
  }
  console.log()
}

main()
