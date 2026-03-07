/**
 * scripts/clean-demo.js
 *
 * Elimina todos los datos de prueba generados por seed-demo.js:
 * - Borra usuarios demo de auth.users (cascadea a players, predictions, scores)
 * - Limpia resultados de carreras 1-4 (las deja null para el futuro real)
 * - Restaura fechas de carreras al calendario original de Jolpica
 *
 * Uso: node scripts/clean-demo.js
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

async function main() {
  console.log('🧹 Limpiando datos demo...\n')

  // 1. Buscar y borrar usuarios demo
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const demoUsers = users?.filter(u => DEMO_EMAILS.includes(u.email)) ?? []

  for (const user of demoUsers) {
    const { error } = await supabase.auth.admin.deleteUser(user.id)
    if (error) console.error(`❌ Error borrando ${user.email}: ${error.message}`)
    else       console.log(`✅ Usuario ${user.email} eliminado`)
  }

  // 2. Limpiar resultados de carreras 1-4
  const { data: races } = await supabase
    .from('races')
    .select('id, round, name')
    .in('round', [1, 2, 3, 4])
    .order('round')

  for (const race of races ?? []) {
    await supabase.from('races').update({ results: null }).eq('id', race.id)
    console.log(`🏁 R${race.round} ${race.name} → resultados limpiados`)
  }

  console.log('\n✅ Demo data eliminado. Corre seed:races para restaurar el calendario.')
}

main().catch(err => {
  console.error('💥', err)
  process.exit(1)
})
