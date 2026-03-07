import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, DRIVERS_2026 } from '../lib/supabase'

const TEAM_COLORS = {
  'Red Bull':     '#3671C6', McLaren: '#FF8000', Ferrari: '#E8002D',
  Mercedes:       '#27F4D2', 'Aston Martin': '#229971', Alpine: '#FF87BC',
  Audi:           '#C8AA82', Cadillac: '#E91B8C', Haas: '#B6BABD',
  'Racing Bulls': '#6692FF', Williams: '#64C4FF',
}
const F1_PTS = [25,18,15,12,10,8,6,4,2,1]

function getDriver(id) { return DRIVERS_2026.find(d => d.id === id) }
function getColor(id)  { return TEAM_COLORS[getDriver(id)?.team] ?? '#555' }

// --- Tab: Mi Prediccion ---------------------------------------------------
function MyPrediction({ myScore, myPicks, results }) {
  if (!myPicks?.length) {
    return (
      <div className="px-4 py-12 text-center text-slate-500">
        <span className="material-symbols-outlined text-4xl mb-2 block">edit_off</span>
        <p className="font-medium">No hiciste prediccion para esta carrera</p>
      </div>
    )
  }

  // FIX BUG-02: sin resultados aun => mostrar picks en modo "esperando"
  if (!results?.length) {
    return (
      <div className="px-4 pb-6">
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4 mt-2">
          <span className="material-symbols-outlined text-amber-400 text-lg">hourglass_empty</span>
          <div>
            <p className="text-xs font-bold text-amber-300">Esperando resultados oficiales</p>
            <p className="text-[10px] text-slate-500">Los puntos se calcularan cuando termine la carrera</p>
          </div>
        </div>
        <div className="space-y-2">
          {myPicks.map((driverId, idx) => {
            const driver = getDriver(driverId)
            const color  = getColor(driverId)
            const isTop5 = idx < 5
            return (
              <div key={idx} className={`flex items-center gap-3 rounded-xl p-3 border ${
                isTop5 ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-blue-500/20 bg-blue-500/5'
              }`}>
                <div className="flex items-center justify-center size-9 rounded-lg bg-slate-800 font-bold text-sm shrink-0">P{idx+1}</div>
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-200 truncate">{driver?.name ?? driverId}</p>
                  <p className="text-[10px] text-slate-500">{driver?.team} #{driver?.number}</p>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  isTop5 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'
                }`}>{isTop5 ? '10 pts base' : '5 pts base'}</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const detail = myScore?.detail ?? {}
  const byPos  = detail.by_position ?? []

  return (
    <div className="px-4 pb-6">
      <div className="grid grid-cols-3 gap-3 mb-6 mt-2">
        <div className="bg-card-dark rounded-xl p-3 text-center border border-slate-800">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Puntos</p>
          <p className="text-2xl font-black text-primary">{myScore?.total_points ?? 0}</p>
        </div>
        <div className="bg-card-dark rounded-xl p-3 text-center border border-slate-800">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Exactos</p>
          <p className="text-2xl font-black text-emerald-400">{detail.exact_count ?? 0}</p>
        </div>
        <div className="bg-card-dark rounded-xl p-3 text-center border border-slate-800">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">En bloque</p>
          <p className="text-2xl font-black text-blue-400">{detail.block_count ?? 0}</p>
        </div>
      </div>

      <div className="space-y-2">
        {myPicks.map((driverId, idx) => {
          const driver    = getDriver(driverId)
          const color     = getColor(driverId)
          const pos       = idx + 1
          const actualIdx = results.indexOf(driverId)
          const actualPos = actualIdx >= 0 ? actualIdx + 1 : null
          const rowData   = byPos[idx] ?? {}
          const isExact   = rowData.isExact
          const inBlock   = !isExact && (rowData.base ?? 0) > 0
          const pts       = (rowData.base ?? 0) + (rowData.bonus ?? 0)

          return (
            <div key={idx} className={`flex items-center gap-3 rounded-xl p-3 border ${
              isExact ? 'bg-emerald-500/10 border-emerald-500/30' :
              inBlock ? 'bg-blue-500/10 border-blue-500/20' :
                        'bg-slate-800/40 border-slate-800'
            }`}>
              <div className="flex items-center justify-center size-9 rounded-lg bg-slate-800 font-bold text-sm shrink-0">P{pos}</div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <div className="min-w-0">
                  <p className={`font-bold text-sm truncate ${
                    isExact ? 'text-emerald-300' : inBlock ? 'text-blue-300' : 'text-slate-400'
                  }`}>{driver?.name ?? driverId}</p>
                  <p className="text-[10px] text-slate-500">{driver?.team} #{driver?.number}</p>
                </div>
              </div>
              <div className="text-center shrink-0 min-w-[48px]">
                {actualPos ? (
                  <>
                    <p className={`text-xs font-bold ${isExact ? 'text-emerald-400' : 'text-slate-400'}`}>Real: P{actualPos}</p>
                    {isExact && <p className="text-[10px] text-emerald-500 font-bold">EXACTO</p>}
                  </>
                ) : (
                  <p className="text-xs text-slate-600">Fuera top10</p>
                )}
              </div>
              <div className="text-right shrink-0 min-w-[44px]">
                <p className={`font-black text-lg leading-none ${
                  pts > 0 ? (isExact ? 'text-emerald-400' : 'text-blue-400') : 'text-slate-700'
                }`}>{pts > 0 ? `+${pts}` : '0'}</p>
                {isExact && rowData.bonus > 0 && (
                  <p className="text-[9px] text-emerald-600">{rowData.base}+{rowData.bonus}</p>
                )}
              </div>
              <div className="shrink-0">
                {isExact ? (
                  <span className="material-symbols-outlined text-emerald-400 fill-icon text-lg">check_circle</span>
                ) : inBlock ? (
                  <span className="material-symbols-outlined text-blue-400 text-lg">check</span>
                ) : (
                  <span className="material-symbols-outlined text-slate-700 text-lg">close</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 bg-card-dark rounded-xl p-4 border border-slate-800">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Desglose de puntos</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Puntos base (bloque)</span>
            <span className="font-bold text-slate-200">{detail.base_points ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Bonus exactos</span>
            <span className="font-bold text-emerald-400">+{detail.bonus_points ?? 0}</span>
          </div>
          <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
            <span className="font-bold text-slate-200">Total</span>
            <span className="font-black text-white text-base">{myScore?.total_points ?? 0} pts</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Tab: Ranking del grupo -----------------------------------------------
// FIX: recibe predCount para mostrar estado correcto cuando no hay scores aun
function GroupRanking({ scores, results, session, predCount }) {
  const [expanded, setExpanded] = useState(null)

  if (!scores.length) {
    return (
      <div className="px-4 py-10 text-center">
        {predCount > 0 ? (
          <>
            <span className="material-symbols-outlined text-4xl mb-3 block text-amber-400">hourglass_empty</span>
            <p className="font-bold text-slate-300 mb-1">Esperando resultados</p>
            <p className="text-sm text-slate-500">
              {predCount} jugador{predCount !== 1 ? 'es' : ''} {predCount !== 1 ? 'enviaron' : 'envio'} prediccion
            </p>
            <p className="text-xs text-slate-600 mt-2">El ranking se publicara cuando se procesen los resultados oficiales</p>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-4xl mb-2 block text-slate-600">group</span>
            <p className="text-slate-500">Nadie ha jugado esta carrera aun</p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 pb-6 space-y-3 mt-2">
      {scores.map((s, i) => {
        const isMe     = s.player_id === session.user.id
        const isOpen   = expanded === s.player_id
        const username = s.players?.username ?? 'Jugador'
        const detail   = s.detail ?? {}
        const picks    = s.picks ?? []

        return (
          <div key={s.player_id} className={`rounded-xl overflow-hidden border ${
            isMe ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-slate-800 bg-slate-800/30'
          }`}>
            <button
              className="w-full flex items-center p-4 text-left"
              onClick={() => setExpanded(isOpen ? null : s.player_id)}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white mr-3 shrink-0 ${
                isMe ? 'bg-emerald-500' : i === 0 ? 'bg-yellow-500' : 'bg-slate-700'
              }`}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm flex items-center gap-1.5 truncate">
                  {username}
                  {isMe && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded shrink-0">TU</span>}
                </p>
                <p className="text-xs text-slate-400">
                  {detail.exact_count ?? 0} exactos {detail.block_count ?? 0} en bloque
                </p>
              </div>
              <div className="text-right mr-3 shrink-0">
                <p className={`text-xl font-black ${isMe ? 'text-emerald-400' : 'text-slate-100'}`}>
                  {s.total_points}
                </p>
                <p className="text-[9px] uppercase text-slate-500">pts</p>
              </div>
              <span className={`material-symbols-outlined text-slate-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>

            {isOpen && picks.length > 0 && results.length > 0 && (
              <div className="border-t border-slate-700/50 px-4 pb-3 pt-3 space-y-1">
                {picks.map((driverId, idx) => {
                  const driver    = getDriver(driverId)
                  const actualIdx = results.indexOf(driverId)
                  const actualPos = actualIdx >= 0 ? actualIdx + 1 : null
                  const isExact   = actualPos === idx + 1
                  const inBlock   = !isExact && actualPos !== null && (
                    idx < 5 ? actualPos <= 5 : actualPos > 5 && actualPos <= 10
                  )
                  return (
                    <div key={idx} className={`flex items-center gap-2 text-xs py-0.5 px-2 rounded ${
                      isExact ? 'text-emerald-300' : inBlock ? 'text-blue-300' : 'text-slate-600'
                    }`}>
                      <span className="w-7 font-bold shrink-0">P{idx+1}</span>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getColor(driverId) }} />
                      <span className="flex-1 truncate">{driver?.name ?? driverId}</span>
                      <span className="shrink-0">{isExact ? 'X' : inBlock ? 'v' : 'x'}</span>
                      {actualPos && !isExact && (
                        <span className="text-slate-600 shrink-0">P{actualPos}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// --- Tab: Resultados Oficiales --------------------------------------------
function OfficialResults({ results }) {
  if (!results.length) {
    return (
      <div className="px-4 py-12 text-center text-slate-500">
        <span className="material-symbols-outlined text-4xl mb-2 block">hourglass_empty</span>
        <p>Resultados aun no disponibles</p>
      </div>
    )
  }

  const posColors = ['text-yellow-400', 'text-slate-300', 'text-amber-600']

  return (
    <div className="px-4 pb-6 mt-2 space-y-2">
      {results.slice(0, 10).map((driverId, idx) => {
        const driver = getDriver(driverId)
        const color  = getColor(driverId)
        return (
          <div key={idx} className="flex items-center bg-slate-800/50 p-3 rounded-xl border-l-4"
            style={{ borderLeftColor: color }}>
            <span className={`w-8 font-black italic text-xl shrink-0 ${posColors[idx] ?? 'text-slate-500'}`}>
              {idx + 1}
            </span>
            <div className="flex-1 flex flex-col px-2">
              <span className="font-bold text-sm">{driver?.name ?? driverId}</span>
              <span className="text-[10px] text-slate-500 uppercase font-medium">{driver?.team ?? '-'}</span>
            </div>
            <span className={`text-sm font-bold shrink-0 ${posColors[idx] ?? 'text-slate-400'}`}>
              {F1_PTS[idx]} pts
            </span>
          </div>
        )
      })}
    </div>
  )
}

// --- Main Page ------------------------------------------------------------
export default function RaceDetail({ session }) {
  const { raceId } = useParams()
  const navigate   = useNavigate()

  const [race,      setRace]      = useState(null)
  const [scores,    setScores]    = useState([])
  const [predCount, setPredCount] = useState(0)
  const [myPicks,   setMyPicks]   = useState([])
  const [myScore,   setMyScore]   = useState(null)
  const [tab,       setTab]       = useState('prediction')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: raceData } = await supabase
        .from('races').select('*').eq('id', raceId).single()
      setRace(raceData)

      // Scores del grupo
      const { data: scData } = await supabase
        .from('scores')
        .select('*, players(username)')
        .eq('race_id', raceId)
        .order('total_points', { ascending: false })

      // Predicciones de todos — fetch siempre para predCount y para ranking expandible
      const { data: predsData } = await supabase
        .from('predictions')
        .select('player_id, picks')
        .eq('race_id', raceId)
      const predsMap = {}
      predsData?.forEach(p => { predsMap[p.player_id] = p.picks })
      setPredCount(predsData?.length ?? 0)

      // Enriquecer scores con picks
      const scoresWithPicks = (scData ?? []).map(s => ({
        ...s,
        picks: predsMap[s.player_id] ?? []
      }))
      setScores(scoresWithPicks)

      // Mi prediccion y score
      const myScoreRow = scData?.find(s => s.player_id === session.user.id)
      setMyScore(myScoreRow ?? null)

      if (predsMap[session.user.id]) {
        setMyPicks(predsMap[session.user.id])
      } else {
        const { data: pred } = await supabase
          .from('predictions')
          .select('picks')
          .eq('race_id', raceId)
          .eq('player_id', session.user.id)
          .maybeSingle()
        if (pred) setMyPicks(pred.picks)
      }

      setLoading(false)
    }
    load()
  }, [raceId, session])

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-slate-500">
      <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
    </div>
  )
  if (!race) return (
    <div className="flex items-center justify-center h-screen text-slate-500">Carrera no encontrada</div>
  )

  const results = race.results ?? []

  const TABS = [
    { key: 'prediction', label: 'Mi Prediccion', icon: 'sports_score' },
    { key: 'ranking',    label: 'Ranking',        icon: 'leaderboard'  },
    { key: 'results',    label: 'Resultados',     icon: 'flag'         },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 bg-background-dark/90 backdrop-blur-md border-b border-slate-800">
        <div className="flex items-center px-4 py-3 justify-between max-w-2xl mx-auto w-full">
          <button onClick={() => navigate(-1)} className="hover:bg-slate-800 p-2 rounded-full transition-colors shrink-0">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex-1 px-3 min-w-0">
            <h2 className="text-base font-bold leading-tight truncate">{race.name}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">calendar_today</span>
              {new Date(race.race_date).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' })}
              {results.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-primary/20 text-primary text-[9px] font-bold rounded uppercase">
                  Finalizada
                </span>
              )}
            </p>
          </div>
          {myScore && (
            <div className="text-right shrink-0">
              <p className="text-2xl font-black text-primary leading-none">{myScore.total_points}</p>
              <p className="text-[9px] text-slate-500 uppercase">mis pts</p>
            </div>
          )}
        </div>

        <div className="flex border-b border-slate-800 px-4 max-w-2xl mx-auto">
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 border-b-2 transition-colors text-xs font-bold ${
                tab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className={`material-symbols-outlined text-base ${tab === key ? 'fill-icon' : ''}`}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full">
        {tab === 'prediction' && (
          <MyPrediction myScore={myScore} myPicks={myPicks} results={results} />
        )}
        {tab === 'ranking' && (
          <GroupRanking scores={scores} results={results} session={session} predCount={predCount} />
        )}
        {tab === 'results' && (
          <OfficialResults results={results} />
        )}
      </main>
    </div>
  )
}
