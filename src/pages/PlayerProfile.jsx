import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, DRIVERS_2026 } from '../lib/supabase'

const TEAM_COLORS = {
  'Red Bull': '#3671C6', McLaren: '#FF8000', Ferrari: '#E8002D',
  Mercedes: '#27F4D2', 'Aston Martin': '#229971', Alpine: '#FF87BC',
  Audi: '#C8AA82', Cadillac: '#E91B8C', Haas: '#B6BABD',
  'Racing Bulls': '#6692FF', Williams: '#64C4FF',
}
const FLAG_MAP = {
  Australia: '🇦🇺', China: '🇨🇳', Japan: '🇯🇵', Bahrain: '🇧🇭',
  'Saudi Arabia': '🇸🇦', 'United States': '🇺🇸', USA: '🇺🇸', Italy: '🇮🇹',
  Monaco: '🇲🇨', Spain: '🇪🇸', Canada: '🇨🇦', Austria: '🇦🇹',
  'United Kingdom': '🇬🇧', UK: '🇬🇧', Hungary: '🇭🇺', Belgium: '🇧🇪',
  Netherlands: '🇳🇱', Singapore: '🇸🇬', Azerbaijan: '🇦🇿',
  Mexico: '🇲🇽', Brazil: '🇧🇷', 'Las Vegas': '🇺🇸', Qatar: '🇶🇦',
  'Abu Dhabi': '🇦🇪', UAE: '🇦🇪',
}
const F1_PTS = { 1:25,2:18,3:15,4:12,5:10,6:8,7:6,8:4,9:2,10:1 }

function getFlag(c) { return FLAG_MAP[c] ?? '🏁' }
function getDriver(id) { return DRIVERS_2026.find(d => d.id === id) }
function getColor(id) { return TEAM_COLORS[getDriver(id)?.team] ?? '#555' }

// ─── Barra de puntos visual ────────────────────────────────────────────────
function PointsBar({ value, max, color = '#e00700' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

// ─── Fila de carrera expandible ────────────────────────────────────────────
function RaceRow({ score, allScores, session, onNavigate }) {
  const [open, setOpen] = useState(false)
  const race    = score.races
  const detail  = score.detail ?? {}
  const picks   = score.picks ?? []
  const results = race?.results ?? []
  const isMe    = score.player_id === session?.user?.id

  // Posición en esta carrera vs otros
  const sortedScores = [...allScores].sort((a,b) => b.total_points - a.total_points)
  const raceRank = sortedScores.findIndex(s => s.player_id === score.player_id) + 1

  return (
    <div className={`rounded-xl overflow-hidden border transition-colors ${
      open ? 'border-slate-600' : 'border-slate-800'
    } bg-slate-800/30`}>
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setOpen(!open)}
      >
        {/* Round + flag */}
        <div className="flex flex-col items-center min-w-[36px]">
          <span className="text-[10px] font-bold text-slate-500">R{race?.round}</span>
          <span className="text-xl">{race?.country_flag ?? getFlag(race?.country)}</span>
        </div>

        {/* Race name + stats */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-slate-100 truncate">{race?.name}</p>
          <p className="text-xs text-slate-500">
            {detail.exact_count ?? 0} exactos · {detail.block_count ?? 0} en bloque
            {raceRank > 0 && allScores.length > 1 && (
              <span className="ml-2 text-slate-600">· #{raceRank} en grupo</span>
            )}
          </p>
        </div>

        {/* Points */}
        <div className="text-right shrink-0 mr-1">
          <p className="text-xl font-black text-primary leading-none">{score.total_points}</p>
          <p className="text-[9px] text-slate-500 uppercase">pts</p>
        </div>

        <span className={`material-symbols-outlined text-slate-500 text-sm transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {/* Expanded: pick by pick */}
      {open && (
        <div className="border-t border-slate-700/50">
          {picks.length > 0 && results.length > 0 ? (
            <div className="px-4 py-3 space-y-1.5">
              {picks.map((driverId, idx) => {
                const driver    = getDriver(driverId)
                const color     = getColor(driverId)
                const actualIdx = results.indexOf(driverId)
                const actualPos = actualIdx >= 0 ? actualIdx + 1 : null
                const isExact   = actualPos === idx + 1
                const inBlock   = !isExact && actualPos !== null && (
                  idx < 5 ? actualPos <= 5 : actualPos > 5 && actualPos <= 10
                )
                const rowPts = (detail.by_position?.[idx]?.base ?? 0) +
                               (detail.by_position?.[idx]?.bonus ?? 0)

                return (
                  <div key={idx} className={`flex items-center gap-2.5 py-1 px-2 rounded-lg text-sm ${
                    isExact ? 'bg-emerald-500/10 text-emerald-300' :
                    inBlock ? 'bg-blue-500/10 text-blue-300' :
                              'text-slate-600'
                  }`}>
                    <span className="w-7 font-bold shrink-0 text-xs">P{idx+1}</span>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="flex-1 truncate text-xs">{driver?.name ?? driverId}</span>
                    {actualPos && !isExact && (
                      <span className="text-slate-600 text-xs shrink-0">→ P{actualPos}</span>
                    )}
                    <span className={`text-xs font-bold shrink-0 w-8 text-right ${
                      rowPts > 0 ? (isExact ? 'text-emerald-400' : 'text-blue-400') : 'text-slate-700'
                    }`}>
                      {rowPts > 0 ? `+${rowPts}` : '–'}
                    </span>
                    <span className="shrink-0">
                      {isExact ? (
                        <span className="material-symbols-outlined text-emerald-400 text-base">done_all</span>
                      ) : inBlock ? (
                        <span className="material-symbols-outlined text-blue-400 text-base">check_circle</span>
                      ) : (
                        <span className="material-symbols-outlined text-slate-600 text-base">close</span>
                      )}
                    </span>
                  </div>
                )
              })}

              {/* Ver detalle completo */}
              <button
                onClick={() => onNavigate(`/race/${race.id}`)}
                className="w-full mt-2 py-2 text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">open_in_new</span>
                Ver detalle completo de la carrera
              </button>
            </div>
          ) : picks.length > 0 ? (
            <div className="px-4 py-3">
              <p className="text-xs text-slate-500 text-center">Predicción enviada · Resultados pendientes</p>
              <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
                {picks.map((id, i) => {
                  const d = getDriver(id)
                  return (
                    <div key={i} className="flex items-center gap-1 bg-slate-800 rounded px-2 py-1 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getColor(id) }} />
                      <span className="text-slate-400">P{i+1}</span>
                      <span className="text-slate-300">{d?.name ?? id}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="px-4 py-3 text-xs text-slate-600 text-center">Sin predicción en esta carrera</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function PlayerProfile({ session }) {
  const { playerId } = useParams()
  const navigate     = useNavigate()

  const [player,   setPlayer]   = useState(null)
  const [scores,   setScores]   = useState([])   // scores de este jugador
  const [allRaceScores, setAllRaceScores] = useState({}) // { raceId: [scores] } para ranking por carrera
  const [loading,  setLoading]  = useState(true)

  const isMe = session?.user?.id === playerId

  useEffect(() => {
    const load = async () => {
      // Jugador
      const { data: p } = await supabase
        .from('players').select('*').eq('id', playerId).single()
      setPlayer(p)

      // Scores de este jugador con datos de carrera
      const { data: scRaw, error: scErr } = await supabase
        .from('scores')
        .select('*, races(id, name, race_date, country, round, results)')
        .eq('player_id', playerId)
      if (scErr) console.error('[PlayerProfile] scores error:', scErr.message)
      const sorted = (scRaw ?? []).sort((a,b) =>
        new Date(a.races?.race_date) - new Date(b.races?.race_date)
      )

      // Predicciones de este jugador
      const raceIds = sorted.map(s => s.race_id)
      let predsMap = {}
      if (raceIds.length > 0) {
        const { data: preds } = await supabase
          .from('predictions')
          .select('race_id, picks')
          .eq('player_id', playerId)
          .in('race_id', raceIds)
        preds?.forEach(p => { predsMap[p.race_id] = p.picks })
      }
      const withPicks = sorted.map(s => ({ ...s, picks: predsMap[s.race_id] ?? [] }))
      setScores(withPicks)

      // Todos los scores por carrera (para ranking contextual)
      if (raceIds.length > 0) {
        const { data: allSc } = await supabase
          .from('scores')
          .select('race_id, player_id, total_points')
          .in('race_id', raceIds)
        const byRace = {}
        allSc?.forEach(s => {
          if (!byRace[s.race_id]) byRace[s.race_id] = []
          byRace[s.race_id].push(s)
        })
        setAllRaceScores(byRace)
      }

      setLoading(false)
    }
    load()
  }, [playerId])

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-slate-500">
      <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
    </div>
  )

  const total     = scores.reduce((acc, s) => acc + s.total_points, 0)
  const exactos   = scores.reduce((acc, s) => acc + (s.detail?.exact_count ?? 0), 0)
  const enBloque  = scores.reduce((acc, s) => acc + (s.detail?.block_count ?? 0), 0)
  const bestRace  = scores.reduce((prev, cur) => (!prev || cur.total_points > prev.total_points) ? cur : prev, null)
  const maxPts    = bestRace?.total_points ?? 0
  const avgPts    = scores.length > 0 ? Math.round(total / scores.length) : 0

  const initials = (player?.username ?? player?.email ?? 'U')
    .slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-dark/95 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center px-4 py-3 max-w-2xl mx-auto gap-3">
          <button onClick={() => navigate(-1)} className="hover:bg-slate-800 p-2 rounded-full transition-colors shrink-0">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center font-bold text-primary shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-base leading-tight truncate flex items-center gap-2">
                {player?.username ?? player?.email ?? 'Jugador'}
                {isMe && (
                  <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold shrink-0">TÚ</span>
                )}
              </h2>
              <p className="text-xs text-slate-500">{scores.length} carreras · Temporada 2026</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-primary leading-none">{total}</p>
            <p className="text-[9px] text-slate-500 uppercase">pts totales</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 pb-8">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mt-4 mb-6">
          <div className="bg-card-dark rounded-xl p-4 border border-slate-800 col-span-2">
            <div className="flex items-end justify-between mb-2">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Promedio por carrera</p>
              <p className="text-3xl font-black text-slate-100">{avgPts} <span className="text-sm font-normal text-slate-500">pts</span></p>
            </div>
            <PointsBar value={avgPts} max={176} />
            <p className="text-[10px] text-slate-600 mt-1">Máximo posible: 176 pts por carrera</p>
          </div>

          <div className="bg-card-dark rounded-xl p-4 border border-slate-800">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Exactos total</p>
            <p className="text-2xl font-black text-emerald-400">{exactos}</p>
            <p className="text-[10px] text-slate-600">{scores.length > 0 ? (exactos / scores.length).toFixed(1) : 0} por carrera</p>
          </div>

          <div className="bg-card-dark rounded-xl p-4 border border-slate-800">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Mejor carrera</p>
            <p className="text-2xl font-black text-primary">{maxPts}</p>
            <p className="text-[10px] text-slate-600 truncate">{bestRace?.races?.name ?? '–'}</p>
          </div>
        </div>

        {/* Race history */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Historial de carreras</h3>
          <span className="text-xs text-slate-600">{scores.length} jugadas</span>
        </div>

        {scores.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <span className="material-symbols-outlined text-4xl block mb-2">sports_score</span>
            <p>Sin carreras jugadas aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {scores.map(score => (
              <RaceRow
                key={score.race_id}
                score={score}
                allScores={allRaceScores[score.race_id] ?? []}
                session={session}
                onNavigate={navigate}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
