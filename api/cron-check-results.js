/**
 * api/cron-check-results.js
 *
 * Endpoint de Vercel Cron — se ejecuta cada 30 minutos.
 * Busca la carrera más antigua sin resultados que ya haya terminado
 * y llama a la lógica de procesamiento.
 */

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // ── Auth check for Vercel Cron (X-Vercel-Cron header) ──────────────────
  // En desarrollo/test local puedes usar el ADMIN_SECRET
  const cronAuth = req.headers['x-vercel-cron'] === '1'
  const adminAuth = req.query.secret === process.env.ADMIN_SECRET

  if (!cronAuth && !adminAuth) {
    return res.status(401).json({ error: 'Unauthorized. Cron access only.' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    const now = new Date().toISOString()
    
    // ── 1. Buscar la carrera más antigua sin resultados que ya debió terminar ──
    // Consideramos que terminó si race_date < NOW (o race_date + 2h para ser seguros)
    const { data: pendingRace, error: raceErr } = await supabase
      .from('races')
      .select('round, name, race_date')
      .is('results', null)
      .lt('race_date', now) // Ya pasó la hora de largada
      .order('round', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (raceErr) throw new Error(`Database error: ${raceErr.message}`)
    
    if (!pendingRace) {
      return res.status(200).json({ message: 'No pending races to process at this time.' })
    }

    console.log(`Cron: Found pending race R${pendingRace.round} (${pendingRace.name})`)

    // ── 2. Llamar internamente al procesador de resultados ──────────────────
    // Nota: En Vercel no podemos hacer un "fetch" a nosotros mismos fácilmente sin la URL completa,
    // así que lo ideal sería mover la lógica de process-results.js a una función compartida
    // o simplemente importar el handler si es posible (más complejo).
    // Por simplicidad en este MVP, haremos un fetch a la URL de producción o usaremos el ADMIN_SECRET.
    
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const host = req.headers.host
    const baseUrl = `${protocol}://${host}`
    const processUrl = `${baseUrl}/api/process-results?round=${pendingRace.round}&secret=${process.env.ADMIN_SECRET}`

    console.log(`Cron: Triggering ${processUrl}`)
    
    const response = await fetch(processUrl)
    const resultData = await response.json()

    if (response.ok) {
      return res.status(200).json({
        message: `Cron successfully triggered processing for R${pendingRace.round}`,
        details: resultData
      })
    } else {
      // Si falla (ej. Jolpica no tiene resultados aún), devolvemos 200 para que el cron no marque error,
      // pero informamos que aún no hay datos.
      return res.status(200).json({
        message: `Cron triggered R${pendingRace.round} but processing returned info/error (normal if results not ready).`,
        api_response: resultData
      })
    }

  } catch (err) {
    console.error('Cron Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
