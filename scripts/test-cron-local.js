
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

async function simulateRaceEnd() {
  console.log('🧪 Simulación de fin de carrera para pruebas de Cron...')

  // 1. Buscar la R5 (que seed:demo dejó abierta)
  const roundToTest = 5
  const { data: race, error: fetchErr } = await supabase
    .from('races')
    .select('id, name, race_date')
    .eq('round', roundToTest)
    .single()

  if (fetchErr || !race) {
    console.error('❌ Error: No se encontró la Ronda 5. Asegúrate de haber corrido npm run seed:demo.')
    process.exit(1)
  }

  console.log(`📍 Carrera: ${race.name} (R${roundToTest})`)

  // 2. Mover la fecha a hace 2 horas
  const simulationDate = new Date()
  simulationDate.setHours(simulationDate.getHours() - 2)

  const { error: updateErr } = await supabase
    .from('races')
    .update({ 
      race_date: simulationDate.toISOString(),
      results: null // Aseguramos que no tenga resultados para que el cron la detecte
    })
    .eq('id', race.id)

  if (updateErr) {
    console.error('❌ Error actualizando fecha:', updateErr.message)
    process.exit(1)
  }

  console.log(`✅ Fecha de R${roundToTest} actualizada a: ${simulationDate.toISOString()} (HACE 2 HORAS)`)
  console.log('\n🚀 LISTO PARA PROBAR EL CRON EN LOCAL:')
  console.log('---------------------------------------------------------')
  console.log('1. Abre una terminal y corre: vercel dev')
  console.log('2. En otra terminal o en tu browser, llama a:')
  console.log(`   http://localhost:3000/api/cron-check-results?secret=${process.env.ADMIN_SECRET || 'TU_SECRET'}`)
  console.log('---------------------------------------------------------')
  console.log('💡 El cron debería detectar la R5 como pendiente y tratar de procesarla.')
}

simulateRaceEnd()
