import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Countdown({ raceDate }) {
  const [time, setTime] = useState({ days: '00', hrs: '00', min: '00' })

  useEffect(() => {
    const calc = () => {
      const diff = new Date(raceDate) - new Date()
      if (diff <= 0) return setTime({ days: '00', hrs: '00', min: '00' })
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setTime({
        days: String(d).padStart(2, '0'),
        hrs:  String(h).padStart(2, '0'),
        min:  String(m).padStart(2, '0'),
      })
    }
    calc()
    const id = setInterval(calc, 30000)
    return () => clearInterval(id)
  }, [raceDate])

  return (
    <div className="flex gap-3 mb-6">
      {[['DIAS', time.days], ['HRS', time.hrs], ['MIN', time.min]].map(([label, val]) => (
        <div key={label} className="flex-1 bg-slate-800/50 rounded-lg p-2 text-center">
          <p className="text-xl font-bold">{val}</p>
          <p className="text-[10px] uppercase text-slate-500 font-semibold tracking-tighter">{label}</p>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard({ session }) {
  const navigate = useNavigate()
  const [nextRace, setNextRace]       = useState(null)
  const [standings, setStandings]     = useState([])
  const [lastRace, setLastRace]       = useState(null)
  const [myLastScore, setMyLastScore] = useState(null)
  const [loading, setLoading]         = useState(true)

  const initials = session?.user?.email?.slice(0, 2).toUpperCase() ?? 'F1'
  const [username, setUsername] = useState(
    session?.user?.email?.split('@')[0] ?? 'Piloto'
  )

  useEffect(() => {
    const load = async () => {
      // Username desde tabla players
      const { data: player } = await supabase
        .from('players')
        .select('username')
        .eq('id', session.user.id)
        .maybeSingle()
      if (player?.username) setUsername(player.username)

      // Next race = primera sin resultados
      const { data: races } = await supabase
        .from('races')
        .select('*')
        .is('results', null)
        .order('race_date', { ascending: true })
        .limit(1)
      if (races?.length) setNextRace(races[0])

      // Last completed race
      const { data: completed } = await supabase
        .from('races')
        .select('*')
        .not('results', 'is', null)
        .order('race_date', { ascending: false })
        .limit(1)
      if (completed?.length) {
        setLastRace(completed[0])
        const { data: sc } = await supabase
          .from('scores')
          .select('total_points')
          .eq('race_id', completed[0].id)
          .eq('player_id', session.user.id)
          .maybeSingle()
        if (sc) setMyLastScore(sc.total_points)
      }

      // Global top 3
      const { data: allScores } = await supabase
        .from('scores')
        .select('player_id, total_points, players(username)')
      if (allScores) {
        const totals = {}
        allScores.forEach(s => {
          totals[s.player_id] = totals[s.player_id] || { pts: 0, username: s.players?.username ?? '?' }
          totals[s.player_id].pts += s.total_points
        })
        const sorted = Object.values(totals).sort((a, b) => b.pts - a.pts).slice(0, 3)
        setStandings(sorted)
      }

      setLoading(false)
    }
    load()
  }, [session])

  const medals = ['🥇', '🥈', '🥉']
  const deadline = nextRace ? new Date(new Date(nextRace.race_date).getTime() - 3600000) : null
  const isOpen   = deadline ? new Date() < deadline : false

  return (
    <div className="px-4">
      {/* Header */}
      <header className="flex items-center justify-between py-4 sticky top-0 bg-background-dark/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg ring-2 ring-primary/20">
            {initials}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Hola de nuevo!</p>
            <h1 className="text-lg font-bold leading-tight">{username}</h1>
          </div>
        </div>
        <button className="size-10 flex items-center justify-center rounded-full bg-slate-800/50">
          <span className="material-symbols-outlined text-slate-100">notifications</span>
        </button>
      </header>

      <div className="space-y-6 pb-4">
        {/* Next Race Card */}
        {loading ? (
          <div className="h-48 bg-card-dark rounded-xl animate-pulse" />
        ) : nextRace ? (
          <section>
            <div className="relative overflow-hidden rounded-xl bg-card-dark border border-slate-800 shadow-xl">
              <div className="absolute top-0 right-0 p-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  isOpen
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : 'bg-slate-700/50 text-slate-400 border-slate-700'
                }`}>
                  <span className={`size-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                  {isOpen ? 'Abierto' : 'Cerrado'}
                </span>
              </div>
              <div className="p-5">
                <div className="flex flex-col gap-1 mb-4">
                  <p className="text-primary text-sm font-bold uppercase tracking-widest">Proxima Carrera</p>
                  <h2 className="text-2xl font-black">
                    {nextRace.country_flag ?? '🏁'} {nextRace.name}
                  </h2>
                  <p className="text-slate-400 text-sm">{nextRace.circuit}</p>
                </div>
                <Countdown raceDate={nextRace.race_date} />

                {/* FIX: boton cambia segun estado open/closed */}
                <button
                  onClick={() => isOpen
                    ? navigate(`/predict/${nextRace.id}`)
                    : navigate(`/race/${nextRace.id}`)
                  }
                  className={`w-full font-extrabold py-4 rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg ${
                    isOpen
                      ? 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 shadow-slate-900/20'
                  }`}
                >
                  {isOpen ? 'Hacer mi prediccion' : 'Ver carrera'}
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
              <div className="h-1.5 w-full bg-slate-800">
                <div className="h-full bg-primary shadow-[0_0_10px_rgba(224,7,0,0.5)]" style={{ width: isOpen ? '100%' : '0%' }} />
              </div>
            </div>
          </section>
        ) : (
          <div className="bg-card-dark rounded-xl p-6 text-center text-slate-400 border border-slate-800">
            No hay carreras proximas programadas
          </div>
        )}

        {/* Top 3 */}
        {standings.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100">Top Global</h3>
              <button onClick={() => navigate('/standings')} className="text-xs font-semibold text-primary">
                Ver tabla completa
              </button>
            </div>
            <div className="bg-card-dark rounded-xl border border-slate-800 divide-y divide-slate-800">
              {standings.map((p, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <span className="text-2xl">{medals[i]}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{p.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-100">{p.pts}</p>
                    <p className="text-[10px] uppercase text-slate-500 font-bold">PTS</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Last Race Summary */}
        {lastRace && (
          <section className="space-y-3">
            <h3 className="font-bold text-slate-100">Resumen Carrera Anterior</h3>
            <button
              onClick={() => navigate(`/race/${lastRace.id}`)}
              className="w-full bg-gradient-to-br from-slate-800 to-card-dark rounded-xl p-4 border border-slate-700/50 flex items-center justify-between hover:border-primary/30 transition-colors"
            >
              <div className="flex flex-col gap-1 text-left">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {lastRace.country_flag ?? '🏁'} {lastRace.name}
                </p>
                <p className="text-sm font-medium text-slate-200">Tus resultados</p>
              </div>
              <div className="flex gap-4">
                <div className="text-center bg-slate-900/40 px-3 py-2 rounded-lg min-w-[60px]">
                  <p className="text-xs text-slate-500 font-bold uppercase">Pts</p>
                  <p className="text-lg font-black text-primary">{myLastScore ?? '-'}</p>
                </div>
              </div>
            </button>
          </section>
        )}
      </div>
    </div>
  )
}
