import { useState } from 'react'

const ROUNDS = Array.from({ length: 24 }, (_, i) => i + 1)

export default function Admin({ session }) {
  const [round,   setRound]   = useState('')
  const [secret,  setSecret]  = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState(null)

  const handleRun = async () => {
    if (!round || !secret) return
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const url = `/api/process-results?round=${round}&secret=${encodeURIComponent(secret)}`
      const res  = await fetch(url)
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? 'Error desconocido')
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight">Admin</h1>
        <p className="text-slate-500 text-sm mt-1">Procesar resultados de carrera</p>
      </div>

      {/* Form */}
      <div className="bg-card-dark rounded-2xl p-5 border border-slate-800 space-y-4">
        <div>
          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
            Ronda
          </label>
          <select
            value={round}
            onChange={e => setRound(e.target.value)}
            className="w-full bg-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Seleccionar ronda...</option>
            {ROUNDS.map(r => (
              <option key={r} value={r}>Round {r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-slate-500 tracking-wider block mb-1.5">
            Admin Secret
          </label>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="Tu clave secreta..."
            className="w-full bg-slate-800 rounded-lg px-4 py-3 text-white outline-none focus:ring-2 focus:ring-primary placeholder-slate-600"
          />
        </div>

        <button
          onClick={handleRun}
          disabled={!round || !secret || loading}
          className="w-full bg-primary text-white font-bold py-4 rounded-xl disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
              Procesando...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">sports_score</span>
              Procesar Round {round || '–'}
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-red-400 text-sm font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            Error
          </p>
          <p className="text-red-300 text-sm mt-1">{error}</p>
          {error.includes('wait 2-3h') && (
            <p className="text-slate-400 text-xs mt-2">
              💡 Los resultados de Jolpica suelen estar disponibles 2-3 horas después de que termina la carrera.
            </p>
          )}
        </div>
      )}

      {/* Success */}
      {result && (
        <div className="mt-4 space-y-3">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-emerald-400 text-sm font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              {result.race}
            </p>
            <p className="text-slate-400 text-xs mt-1">
              {result.players_scored} jugador(es) actualizados
            </p>
            <p className="text-slate-500 text-xs mt-1 font-mono">
              {result.results?.join(' · ')}
            </p>
          </div>

          {/* Leaderboard de la carrera */}
          <div className="bg-card-dark rounded-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800">
              <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Podio de la carrera</p>
            </div>
            {result.leaderboard?.map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/50 last:border-0">
                <span className="text-lg w-6">{['🥇','🥈','🥉'][i] ?? `${i+1}.`}</span>
                <span className="flex-1 font-medium text-sm">{p.username}</span>
                <span className="text-primary font-black">{p.total}</span>
                <span className="text-slate-600 text-xs">pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 bg-slate-900 rounded-xl p-4 border border-slate-800">
        <p className="text-xs font-bold uppercase text-slate-600 tracking-wider mb-2">¿Cuándo usar esto?</p>
        <ul className="space-y-1 text-xs text-slate-500">
          <li>🏁 Espera ~2-3h después de que termine la carrera</li>
          <li>🔢 Selecciona la ronda correcta</li>
          <li>🔑 Ingresa tu ADMIN_SECRET de Vercel</li>
          <li>✅ Los scores se calculan para todos los jugadores</li>
          <li>🔄 Puedes correrlo múltiples veces — es seguro (upsert)</li>
        </ul>
      </div>
    </div>
  )
}
