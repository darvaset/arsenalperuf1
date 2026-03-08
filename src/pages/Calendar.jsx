import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, formatRaceDateTime } from '../lib/supabase'

const COUNTRY_FLAGS = {
  Australia: '🇦🇺', China: '🇨🇳', Japan: '🇯🇵', Bahrain: '🇧🇭',
  'United States': '🇺🇸', USA: '🇺🇸', Italy: '🇮🇹', Monaco: '🇲🇨', Spain: '🇪🇸',
  Canada: '🇨🇦', Austria: '🇦🇹', UK: '🇬🇧', 'United Kingdom': '🇬🇧', Hungary: '🇭🇺',
  Belgium: '🇧🇪', Netherlands: '🇳🇱', Singapore: '🇸🇬', Azerbaijan: '🇦🇿',
  Mexico: '🇲🇽', Brazil: '🇧🇷', 'Las Vegas': '🇺🇸', Qatar: '🇶🇦',
  'Abu Dhabi': '🇦🇪', UAE: '🇦🇪', 'Saudi Arabia': '🇸🇦',
}

function getFlag(country) {
  return COUNTRY_FLAGS[country] ?? '🏁'
}

// formatRaceDateTime importada desde supabase.js

export default function Calendar({ session }) {
  const navigate = useNavigate()
  const [races, setRaces]           = useState([])
  const [myPredictions, setMyPreds] = useState({})
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: raceData } = await supabase
        .from('races')
        .select('*')
        .order('race_date', { ascending: true })

      if (raceData) setRaces(raceData)

      const { data: preds } = await supabase
        .from('predictions')
        .select('race_id')
        .eq('player_id', session.user.id)

      if (preds) {
        const map = {}
        preds.forEach(p => { map[p.race_id] = true })
        setMyPreds(map)
      }

      setLoading(false)
    }
    load()
  }, [session])

  const now     = new Date()
  // next = primera carrera cuyo DEADLINE aún no ha pasado
  const nextIdx = races.findIndex(r => !r.results && (new Date(r.race_date).getTime() - 3600000) > now.getTime())

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background-dark/90 backdrop-blur-md border-b border-slate-800 px-4 py-4">
        <h1 className="text-xl font-bold tracking-tight text-center">Calendario 2026</h1>
      </header>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Cargando calendario...</div>
      ) : (
        <div className="flex flex-col">
          {races.map((race, idx) => {
            const raceDate    = new Date(race.race_date)
            const deadline    = new Date(raceDate.getTime() - 3600000)
            const isCompleted = !!race.results
            const isLive      = !isCompleted && deadline <= now         // Deadline pasó, sin resultados aún
            const isNext      = !isLive && !isCompleted && idx === nextIdx
            const isPending   = !isCompleted && !isLive && !isNext
            const hasPred     = myPredictions[race.id]
            const flag        = getFlag(race.country)
            const isOpen      = now < deadline && !isCompleted

            if (isNext) {
              return (
                <div key={race.id} className="relative bg-primary/10 border-y border-primary/30 px-4 py-6 my-2">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center min-w-[40px]">
                      <span className="text-xs font-black text-primary">R{race.round}</span>
                      <span className="text-2xl">{flag}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-primary text-[10px] font-black text-white italic">🔜 SIGUIENTE</span>
                        {hasPred && (
                          <span className="text-[10px] font-medium text-green-500 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px] fill-icon">check_circle</span>
                            Predicción enviada
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg leading-tight">{race.name}</h3>
                      <p className="text-xs text-slate-400">{race.circuit}</p>
                      <p className="text-xs font-bold text-primary mt-2 uppercase tracking-widest">
                        {formatRaceDateTime(race.race_date)}
                      </p>
                    </div>
                    <button
                      onClick={() => isOpen ? navigate(`/predict/${race.id}`) : navigate(`/race/${race.id}`)}
                      className="bg-primary text-white p-2 rounded-lg shadow-lg shadow-primary/20"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
              )
            }

            if (isCompleted) {
              return (
                <button
                  key={race.id}
                  onClick={() => navigate(`/race/${race.id}`)}
                  className="flex items-center gap-4 px-4 py-4 border-b border-slate-800 opacity-60 hover:opacity-80 hover:bg-white/5 transition-all"
                >
                  <div className="flex flex-col items-center justify-center min-w-[40px]">
                    <span className="text-xs font-bold text-slate-500">R{race.round}</span>
                    <span className="text-2xl">{flag}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-sm">{race.name}</h3>
                    <p className="text-xs text-slate-500">{race.circuit}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">{formatRaceDateTime(race.race_date)}</p>
                  </div>
                  <span className="px-2 py-1 rounded bg-slate-800 text-[10px] font-bold text-slate-500">✅ COMPLETADA</span>
                </button>
              )
            }

            if (isLive) {
              return (
                <button
                  key={race.id}
                  onClick={() => navigate(`/race/${race.id}`)}
                  className="flex items-center gap-4 px-4 py-4 border-b border-slate-800 bg-yellow-500/5 border-l-2 border-l-yellow-500/40 hover:bg-white/5 transition-all"
                >
                  <div className="flex flex-col items-center justify-center min-w-[40px]">
                    <span className="text-xs font-bold text-yellow-400">R{race.round}</span>
                    <span className="text-2xl">{flag}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-sm text-slate-200">{race.name}</h3>
                    <p className="text-xs text-slate-500">{race.circuit}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">{formatRaceDateTime(race.race_date)}</p>
                  </div>
                  <span className="px-2 py-1 rounded border border-yellow-700/50 text-[10px] font-bold text-yellow-400 uppercase animate-pulse">
                    🏁 En curso
                  </span>
                </button>
              )
            }

            return (
              <button
                key={race.id}
                onClick={() => isOpen ? navigate(`/predict/${race.id}`) : undefined}
                className="flex items-center gap-4 px-4 py-4 border-b border-slate-800 hover:bg-white/5 transition-all"
              >
                <div className="flex flex-col items-center justify-center min-w-[40px]">
                  <span className="text-xs font-bold text-slate-400">R{race.round}</span>
                  <span className="text-2xl">{flag}</span>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-sm text-slate-200">{race.name}</h3>
                  <p className="text-xs text-slate-500">{race.circuit}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">{formatRaceDateTime(race.race_date)}</p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                  {hasPred ? (
                    <span className="px-2 py-1 rounded border border-green-700 text-[10px] font-bold text-green-500 uppercase">✅ Enviada</span>
                  ) : (
                    <span className="px-2 py-1 rounded border border-slate-700 text-[10px] font-bold text-slate-500 uppercase">⏳ Pendiente</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
