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
    
    // ... resto de la lógica de procesamiento ...
    const protocol = req.headers['x-forwarded-proto'] || 'http'
    const host = req.headers.host
    const baseUrl = `${protocol}://${host}`
    const processUrl = `${baseUrl}/api/process-results?round=${pendingRace.round}&secret=${process.env.ADMIN_SECRET}`
    
    await fetch(processUrl)
    // No bloqueamos el cron si falla Jolpica, seguimos con los recordatorios
  } catch (err) {
    console.error('Cron Error (Processing):', err.message)
  }

  // ── 3. Lógica de Recordatorios de Deadline ──────────────────────────────
  try {
    const now = new Date()
    const twoHoursFromNow = new Date(now.getTime() + (2 * 60 * 60 * 1000)).toISOString()

    // Buscar carrera cuyo deadline (race_date - 1h) sea en las próximas 2 horas
    // deadline < twoHoursFromNow  =>  race_date < threeHoursFromNow
    const threeHoursFromNow = new Date(now.getTime() + (3 * 60 * 60 * 1000)).toISOString()
    
    const { data: upcomingRace } = await supabase
      .from('races')
      .select('id, name, round, race_date')
      .is('results', null)
      .gt('race_date', now.toISOString())
      .lt('race_date', threeHoursFromNow)
      .single()

    if (upcomingRace) {
      console.log(`Cron: Deadline approaching for ${upcomingRace.name}`)
      
      // Obtener todos los jugadores
      const { data: players } = await supabase.from('players').select('id')
      
      // Obtener quiénes YA predijeron
      const { data: preds } = await supabase
        .from('predictions')
        .select('player_id')
        .eq('race_id', upcomingRace.id)
      
      const predictedPlayerIds = preds?.map(p => p.player_id) || []
      const missingPlayers = players?.filter(p => !predictedPlayerIds.includes(p.id)) || []

      if (missingPlayers.length > 0) {
        const reminderRows = []
        for (const player of missingPlayers) {
          // Verificar si ya le enviamos un recordatorio para esta carrera hoy
          // para no spamear cada 30 min
          const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('player_id', player.id)
            .eq('title', '⏳ ¡Última oportunidad!')
            .ilike('message', `%${upcomingRace.name}%`)

          if (count === 0) {
            reminderRows.push({
              player_id: player.id,
              title:     '⏳ ¡Última oportunidad!',
              message:   `El deadline para el ${upcomingRace.name} cierra pronto. ¡Envía tu Top 10 ya!`,
              link:      `/predict/${upcomingRace.id}`,
            })
          }
        }

        if (reminderRows.length > 0) {
          await supabase.from('notifications').insert(reminderRows)
          console.log(`Cron: Sent ${reminderRows.length} deadline reminders.`)
        }
      }
    }

    return res.status(200).json({ success: true, message: 'Cron job finished correctly.' })
  } catch (err) {
    console.error('Cron Error (Reminders):', err.message)
    return res.status(500).json({ error: err.message })
  }
}
