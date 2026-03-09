/**
 * api/cron-check-results.js
 *
 * Endpoint de Vercel Cron — se ejecuta cada 30 minutos (vía GitHub Actions).
 * 1. Busca carreras terminadas sin resultados.
 * 2. Busca carreras que cierran pronto para avisar a jugadores pendientes.
 */

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const cronAuth = req.headers['x-vercel-cron'] === '1'
  const adminAuth = req.query.secret === process.env.ADMIN_SECRET

  if (!cronAuth && !adminAuth) {
    return res.status(401).json({ error: 'Unauthorized.' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const logs = []
  const now = new Date().toISOString()

  // ── TAREA 1: Procesar resultados de carreras terminadas ──────────────────
  try {
    const { data: pendingRace } = await supabase
      .from('races')
      .select('round, name, race_date')
      .is('results', null)
      .lt('race_date', now)
      .order('round', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (pendingRace) {
      logs.push(`Found pending race R${pendingRace.round}. Triggering processing...`)
      const protocol = req.headers['x-forwarded-proto'] || 'http'
      const host = req.headers.host
      const processUrl = `${protocol}://${host}/api/process-results?round=${pendingRace.round}&secret=${process.env.ADMIN_SECRET}`
      await fetch(processUrl)
    } else {
      logs.push('No races to process results for.')
    }
  } catch (err) {
    logs.push(`Error in processing: ${err.message}`)
  }

  // ── TAREA 2: Recordatorios de Deadline (carreras futuras) ────────────────
  try {
    const threeHoursFromNow = new Date(Date.now() + (3 * 60 * 60 * 1000)).toISOString()
    
    const { data: upcomingRace } = await supabase
      .from('races')
      .select('id, name, round, race_date')
      .is('results', null)
      .gt('race_date', now)
      .lt('race_date', threeHoursFromNow)
      .maybeSingle()

    if (upcomingRace) {
      logs.push(`Deadline approaching for ${upcomingRace.name}. checking players...`)
      
      const { data: players } = await supabase.from('players').select('id')
      const { data: preds } = await supabase.from('predictions').select('player_id').eq('race_id', upcomingRace.id)
      
      const predictedPlayerIds = preds?.map(p => p.player_id) || []
      const missingPlayers = players?.filter(p => !predictedPlayerIds.includes(p.id)) || []

      if (missingPlayers.length > 0) {
        const reminderRows = []
        for (const player of missingPlayers) {
          // Evitar duplicados para la misma carrera en las últimas 24h
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
          logs.push(`Sent ${reminderRows.length} reminders.`)
        }
      }
    } else {
      logs.push('No upcoming deadlines in the next 2 hours.')
    }
  } catch (err) {
    logs.push(`Error in reminders: ${err.message}`)
  }

  return res.status(200).json({ success: true, logs })
}
