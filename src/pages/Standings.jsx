import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// ─── Mapa de banderas por country (viene de Jolpica API) ──────────────────
const FLAG_MAP = {
  Australia: '🇦🇺', China: '🇨🇳', Japan: '🇯🇵', Bahrain: '🇧🇭',
  'Saudi Arabia': '🇸🇦', 'United States': '🇺🇸', USA: '🇺🇸', Italy: '🇮🇹',
  Monaco: '🇲🇨', Spain: '🇪🇸', Canada: '🇨🇦',
  Austria: '🇦🇹', UK: '🇬🇧', 'United Kingdom': '🇬🇧',
  Hungary: '🇭🇺', Belgium: '🇧🇪', Netherlands: '🇳🇱',
  Singapore: '🇸🇬', Azerbaijan: '🇦🇿', Mexico: '🇲🇽',
  Brazil: '🇧🇷', 'Las Vegas': '🇺🇸', Qatar: '🇶🇦',
  'Abu Dhabi': '🇦🇪', UAE: '🇦🇪',
}
function getFlag(country) { return FLAG_MAP[country] ?? '🏁' }

// ─── Modal: historial de un jugador ────────────────────────────────────────
function PlayerModal({ player, onClose }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('scores')
        .select('total_points, detail, races(id, name, race_date, country, round)')
        .eq('player_id', player.id)
      // Ordenar por race_date en el cliente (evita el bug de order con foreign tables)
      const sorted = (data ?? []).sort((a, b) =>
        new Date(a.races?.race_date) - new Date(b.races?.race_date)
      )
      setHistory(sorted)
      setLoading(false)
    }
    load()
  }, [player.id])

  const initials = player.username.slice(0, 2).toUpperCase()

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-surface-dark w-full max-w-md max-h-[80vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 p-5 border-b border-slate-800">
          <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-white font-bold border border-primary/30">
            {initials}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{player.username}</h3>
            <p className="text-sm text-slate-400">{player.pts} pts · {player.races} carrera{player.races !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Race list */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Cargando...</div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-slate-500">Sin carreras jugadas</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {history.map((s, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex flex-col items-center min-w-[32px]">
                    <span className="text-xs font-bold text-slate-500">R{s.races?.round}</span>
                    <span className="text-lg">{getFlag(s.races?.country)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-slate-100">{s.races?.name}</p>
                    <p className="text-xs text-slate-500">
                      {s.detail?.exact_count ?? 0} exactos · {s.detail?.block_count ?? 0} en bloque
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-primary">{s.total_points}</p>
                    <p className="text-[10px] text-slate-500 uppercase">pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="border-t border-slate-800 px-5 py-4 flex items-center justify-between bg-slate-900/50">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total temporada</span>
          <span className="text-2xl font-black text-white">{player.pts} pts</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function Standings({ session }) {
  const navigate   = useNavigate()
  const [players,  setPlayers]  = useState([])
  const [tab,      setTab]      = useState('leaderboard')
  const [loading,  setLoading]  = useState(true)
  const [myRaces,  setMyRaces]  = useState([])
  // Modal eliminado — ahora navega a /player/:id

  useEffect(() => {
    const load = async () => {
      // Scores agrupados por jugador
      const { data: allScores } = await supabase
        .from('scores')
        .select('player_id, total_points, players(id, username)')

      // Lista de todos los jugadores (para incluir los que tienen 0 pts)
      const { data: allPlayers } = await supabase
        .from('players')
        .select('id, username, email')

      if (allScores && allPlayers) {
        const totals = {}

        // Inicializar todos los jugadores con 0
        allPlayers.forEach(p => {
          totals[p.id] = {
            id:       p.id,
            username: p.username ?? p.email?.split('@')[0] ?? 'Jugador',
            pts:      0,
            races:    0,
          }
        })

        // Sumar scores
        allScores.forEach(s => {
          const id = s.player_id
          if (totals[id]) {
            totals[id].pts   += s.total_points
            totals[id].races += 1
          }
        })

        const sorted = Object.values(totals).sort((a, b) => b.pts - a.pts)
        setPlayers(sorted)
      }

      // Mis carreras
      const { data: myScoresRaw } = await supabase
        .from('scores')
        .select('total_points, detail, races(id, name, race_date, country, round)')
        .eq('player_id', session.user.id)
      const myScores = (myScoresRaw ?? []).sort((a, b) =>
        new Date(b.races?.race_date) - new Date(a.races?.race_date)
      )
      setMyRaces(myScores)

      setLoading(false)
    }
    load()
  }, [session])

  const medals  = ['🥇', '🥈', '🥉']
  const myRank  = players.findIndex(p => p.id === session.user.id) + 1

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-1 px-4 pt-4 pb-0 sticky top-0 bg-background-dark/95 backdrop-blur-md z-10 border-b border-white/5">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-100">Tabla General</h1>
        <p className="text-primary text-sm font-semibold uppercase tracking-wide">Temporada 2026 · S/{players.length * 50} en juego</p>

        {/* Tabs */}
        <div className="flex border-b border-white/10 gap-8 mt-2">
          {[['leaderboard', 'Leaderboard'], ['mis-carreras', 'Mis Carreras']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`pb-3 pt-2 text-sm font-bold border-b-[3px] transition-colors ${
                tab === key
                  ? 'border-primary text-slate-100'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-500">Cargando...</div>
      ) : tab === 'leaderboard' ? (
        <div className="flex flex-col divide-y divide-white/5 mb-24">
          {players.map((p, i) => {
            const isMe = p.id === session.user.id
            return (
              <button
                key={p.id}
                onClick={() => navigate(`/player/${p.id}`)}
                className={`flex items-center gap-4 px-4 min-h-[72px] py-3 w-full text-left transition-colors hover:bg-white/5 active:bg-white/10 ${
                  isMe ? 'bg-primary/10 border-l-4 border-primary' : ''
                }`}
              >
                <div className="flex items-center justify-center w-8 shrink-0">
                  {i < 3 ? (
                    <span className="text-2xl">{medals[i]}</span>
                  ) : (
                    <span className={`font-bold text-lg ${isMe ? 'text-slate-100' : 'text-slate-400'}`}>{i + 1}</span>
                  )}
                </div>

                <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 text-white font-bold shrink-0">
                  {p.username.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-slate-100 text-base font-bold leading-tight truncate">{p.username}</p>
                    {isMe && (
                      <span className="bg-primary text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold uppercase shrink-0">Tú</span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs">
                    {p.races > 0 ? `${p.races} carrera${p.races !== 1 ? 's' : ''} jugada${p.races !== 1 ? 's' : ''}` : 'Sin carreras aún'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-slate-100 text-lg font-bold">{p.pts}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">pts</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-600 text-lg">chevron_right</span>
                </div>
              </button>
            )
          })}

          {players.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-2 block">emoji_events</span>
              <p>Aún no hay participantes</p>
            </div>
          )}
        </div>
      ) : (
        /* Mis Carreras */
        <div className="flex flex-col mb-24">
          {myRaces.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-2 block">sports_score</span>
              <p className="font-medium mb-1">Aún no tienes carreras jugadas</p>
              <p className="text-xs">¡Haz tu primera predicción para aparecer aquí!</p>
            </div>
          ) : (
            myRaces.map((s, i) => (
              <button
                key={i}
                onClick={() => navigate(`/race/${s.races?.id}`)}
                className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/20 text-primary">
                    <span className="material-symbols-outlined">flag</span>
                  </div>
                  <div className="text-left">
                    <p className="text-slate-100 font-bold text-sm">
                      {getFlag(s.races?.country)} {s.races?.name ?? 'Carrera'}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {s.detail?.exact_count ?? 0} exactos · {s.detail?.block_count ?? 0} en bloque
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-primary font-black text-lg">+{s.total_points}</p>
                  <span className="material-symbols-outlined text-slate-500 text-lg">chevron_right</span>
                </div>
              </button>
            ))
          )}

          {/* Total */}
          {myRaces.length > 0 && (
            <div className="mx-4 mt-4 bg-card-dark rounded-xl p-4 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Total temporada</p>
                <p className="text-sm text-slate-400">
                  Posición #{myRank} de {players.length}
                </p>
              </div>
              <p className="text-3xl font-black text-white">
                {myRaces.reduce((acc, s) => acc + s.total_points, 0)}
                <span className="text-sm font-normal text-slate-500 ml-1">pts</span>
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
