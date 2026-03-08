import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, TEAM_COLORS } from '../lib/supabase'

const TEAMS_2026 = [
  'Alpine', 'Aston Martin', 'Audi', 'Cadillac',
  'Ferrari', 'Haas', 'McLaren', 'Mercedes',
  'Racing Bulls', 'Red Bull', 'Williams',
]

const TEAM_LOGOS = {
  'Alpine':        '🔵', 'Aston Martin': '🟢', 'Audi':          '⚪',
  'Cadillac':      '🩷', 'Ferrari':      '🔴', 'Haas':          '⬜',
  'McLaren':       '🟠', 'Mercedes':     '🩵', 'Racing Bulls':  '🔷',
  'Red Bull':      '🔵', 'Williams':     '🩵',
}

const ADMIN_EMAIL = 'darvaset@gmail.com'
const ROUNDS = Array.from({ length: 24 }, (_, i) => i + 1)

// ─── Admin Panel ───────────────────────────────────────────────────────────
function AdminPanel() {
  const [round,    setRound]    = useState('')
  const [secret,   setSecret]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)
  const [error,    setError]    = useState(null)
  const [expanded, setExpanded] = useState(false)

  const handleRun = async () => {
    if (!round || !secret) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const url  = `/api/process-results?round=${round}&secret=${encodeURIComponent(secret)}`
      const res  = await fetch(url)
      const data = await res.json()
      if (!res.ok || data.error) setError(data.error ?? 'Error desconocido')
      else setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 mb-8">
      {/* Header colapsable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between bg-slate-800/40 border border-slate-700 rounded-xl px-4 py-3 mb-0 transition-colors hover:bg-slate-800/60"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-slate-300">
          <span className="material-symbols-outlined text-primary text-lg">admin_panel_settings</span>
          Admin · Procesar resultados
        </span>
        <span className={`material-symbols-outlined text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {expanded && (
        <div className="bg-card-dark border border-slate-700 border-t-0 rounded-b-xl p-4 space-y-3">

          {/* Round selector */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
              Ronda
            </label>
            <select
              value={round}
              onChange={e => { setRound(e.target.value); setResult(null); setError(null) }}
              className="w-full bg-slate-800 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Seleccionar ronda...</option>
              {ROUNDS.map(r => (
                <option key={r} value={r}>Round {r}</option>
              ))}
            </select>
          </div>

          {/* Secret */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
              Admin Secret
            </label>
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="Tu clave secreta de Vercel..."
              className="w-full bg-slate-800 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:ring-2 focus:ring-primary placeholder-slate-600"
            />
          </div>

          {/* Button */}
          <button
            onClick={handleRun}
            disabled={!round || !secret || loading}
            className="w-full bg-primary text-white font-bold py-3 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                Procesando Round {round}...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">sports_score</span>
                Procesar Round {round || '–'}
              </>
            )}
          </button>

          {/* Info tip */}
          <p className="text-[10px] text-slate-600 text-center">
            Correr ~2-3h después de que termina la carrera · Es seguro re-ejecutar
          </p>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              <p className="text-red-400 text-xs font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">error</span>
                Error
              </p>
              <p className="text-red-300 text-xs mt-1">{error}</p>
              {error.includes('2-3h') && (
                <p className="text-slate-500 text-[10px] mt-1">
                  💡 Jolpica publica los resultados ~2-3h después del final de la carrera.
                </p>
              )}
            </div>
          )}

          {/* Success */}
          {result && (
            <div className="space-y-2">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                <p className="text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  {result.race} — {result.players_scored} jugador(es) actualizados
                </p>
                <p className="text-slate-500 text-[10px] mt-1 font-mono">
                  {result.results?.join(' · ')}
                </p>
              </div>
              {/* Mini leaderboard */}
              <div className="bg-slate-800/50 rounded-xl overflow-hidden">
                {result.leaderboard?.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/50 last:border-0">
                    <span className="text-base w-5">{['🥇','🥈','🥉'][i] ?? `${i+1}.`}</span>
                    <span className="flex-1 text-xs font-medium text-slate-200">{p.username}</span>
                    <span className="text-primary font-black text-sm">{p.total}</span>
                    <span className="text-slate-600 text-[10px]">pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Profile ──────────────────────────────────────────────────────────
export default function Profile({ session }) {
  const navigate = useNavigate()
  const [player,      setPlayer]      = useState(null)
  const [stats,       setStats]       = useState({ rank: '–', total: 0, exact: 0, best: null })
  const [history,     setHistory]     = useState([])
  const [username,    setUsername]    = useState('')
  const [favTeam,     setFavTeam]     = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [teamSaving,  setTeamSaving]  = useState(false)
  const [teamSaved,   setTeamSaved]   = useState(false)

  const isAdmin = session.user.email === ADMIN_EMAIL

  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase
        .from('players').select('*').eq('id', session.user.id).single()
      if (p) { setPlayer(p); setUsername(p.username ?? ''); setFavTeam(p.favorite_team ?? null) }

      const { data: myScoresRaw } = await supabase
        .from('scores')
        .select('total_points, detail, races(id, name, race_date, country, round)')
        .eq('player_id', session.user.id)
      const myScores = (myScoresRaw ?? []).sort((a, b) =>
        new Date(b.races?.race_date) - new Date(a.races?.race_date)
      )
      if (myScores.length > 0) {
        setHistory(myScores)
        const total = myScores.reduce((acc, s) => acc + s.total_points, 0)
        const exact = myScores.reduce((acc, s) => acc + (s.detail?.exact_count ?? 0), 0)
        const best  = myScores.reduce((prev, cur) => (!prev || cur.total_points > prev.total_points) ? cur : prev, null)
        setStats(prev => ({ ...prev, total, exact, best }))
      }

      const { data: allPlayers } = await supabase.from('players').select('id')
      const { data: allScores }  = await supabase.from('scores').select('player_id, total_points')
      if (allPlayers) {
        const totals = {}
        allPlayers.forEach(p => { totals[p.id] = 0 })
        if (allScores) allScores.forEach(s => { totals[s.player_id] = (totals[s.player_id] ?? 0) + s.total_points })
        const sorted = Object.entries(totals).sort((a,b) => b[1] - a[1])
        const rank = sorted.findIndex(([id]) => id === session.user.id) + 1
        setStats(prev => ({ ...prev, rank: rank || '–', total_players: sorted.length }))
      }
    }
    load()
  }, [session])

  const handleSave = async () => {
    if (!username.trim()) return
    setSaving(true)
    await supabase.from('players').update({ username: username.trim() }).eq('id', session.user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleSaveTeam = async (team) => {
    setFavTeam(team)
    setTeamSaving(true)
    await supabase.from('players').update({ favorite_team: team }).eq('id', session.user.id)
    setTeamSaving(false)
    setTeamSaved(true)
    setTimeout(() => setTeamSaved(false), 2000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const initials = (username || session.user.email || '??').slice(0, 2).toUpperCase()

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center bg-background-dark px-4 py-4 sticky top-0 z-10 border-b border-slate-800">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center pr-10">Mi Perfil</h2>
        {isAdmin && (
          <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
            Admin
          </span>
        )}
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {/* Avatar */}
        <div className="flex flex-col items-center p-8 bg-gradient-to-b from-primary/10 to-transparent">
          <div className="flex items-center justify-center bg-primary text-white text-4xl font-black rounded-full w-28 h-28 border-4 border-background-dark shadow-xl mb-4">
            {initials}
          </div>
          <p className="text-primary text-sm font-bold uppercase tracking-widest mb-1">F1 Arsenal Fantasy</p>
          <h1 className="text-2xl font-black italic">{username || 'Sin nickname'}</h1>
          <p className="text-slate-500 text-xs mt-1">{session.user.email}</p>
        </div>

        {/* Equipo Favorito */}
        <div className="px-4 mb-6">
          <label className="text-sm font-bold text-slate-400 ml-1 block mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">emoji_events</span>
            Equipo Favorito
            {teamSaved && <span className="text-emerald-400 text-xs font-bold ml-1">✓ Guardado</span>}
            {teamSaving && <span className="text-slate-500 text-xs ml-1">Guardando...</span>}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TEAMS_2026.map(team => {
              const color    = TEAM_COLORS[team] ?? '#888'
              const isActive = favTeam === team
              return (
                <button
                  key={team}
                  onClick={() => handleSaveTeam(team)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all text-left ${
                    isActive
                      ? 'border-white/30 bg-white/10'
                      : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className={`text-sm font-medium truncate ${
                    isActive ? 'text-white' : 'text-slate-300'
                  }`}>{team}</span>
                  {isActive && (
                    <span className="material-symbols-outlined text-xs ml-auto shrink-0 text-white">check</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Username */}
        <div className="px-4 mb-6">
          <label className="text-sm font-bold text-slate-400 ml-1 block mb-2">Nickname</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all pr-10"
                placeholder="tu_nickname"
              />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">edit</span>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-4 rounded-lg font-bold text-sm transition-colors ${
                saved ? 'bg-green-600 text-white' : 'bg-primary hover:bg-primary/80 text-white'
              } disabled:opacity-50`}
            >
              {saved ? '✓' : saving ? '...' : 'Guardar'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">analytics</span>
            Estadísticas
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Ranking',          value: stats.rank ? `${stats.rank}°` : '–', sub: `de ${stats.total_players ?? '–'}` },
              { label: 'Puntos Totales',   value: stats.total, sub: 'pts' },
              { label: 'Aciertos Exactos', value: stats.exact, sub: '🎯' },
              { label: 'Mejor Carrera',    value: stats.best?.races?.name ?? '–', sub: stats.best ? `${stats.best.total_points} pts` : '' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">{label}</p>
                <p className="text-xl font-black text-slate-100 leading-tight">{value}</p>
                {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="px-4 mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Historial de Carreras
            </h3>
            <div className="overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-800/80 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-bold">GP</th>
                    <th className="px-4 py-3 font-bold text-center">Pts</th>
                    <th className="px-4 py-3 font-bold text-right">🎯</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {history.map((s, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-slate-800/20' : 'bg-background-dark'}>
                      <td className="px-4 py-3 font-medium truncate max-w-[160px]">{s.races?.name ?? '–'}</td>
                      <td className="px-4 py-3 text-center text-primary font-bold">{s.total_points}</td>
                      <td className="px-4 py-3 text-right">{s.detail?.exact_count ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Admin Panel (solo visible para darvaset) ── */}
        {isAdmin && <AdminPanel />}

        {/* Logout */}
        <div className="px-4">
          <button
            onClick={handleLogout}
            className="w-full border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">logout</span>
            Cerrar sesión
          </button>
        </div>
      </main>
    </div>
  )
}
