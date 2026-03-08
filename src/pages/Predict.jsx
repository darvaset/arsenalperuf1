import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, DRIVERS_2026 } from '../lib/supabase'

const TEAM_COLORS = {
  'Red Bull':      '#3671C6',
  'McLaren':       '#FF8000',
  'Ferrari':       '#E8002D',
  'Mercedes':      '#27F4D2',
  'Aston Martin':  '#229971',
  'Alpine':        '#0093CC',
  'Audi':          '#C8AA82',
  'Cadillac':      '#B3B3B3',
  'Haas':          '#B6BABD',
  'Racing Bulls':  '#6692FF',
  'Williams':      '#64C4FF',
}

function DriverRow({ position, driver, onSelect, isTop5 }) {
  const color = TEAM_COLORS[driver?.team] ?? '#888'
  return (
    <button
      onClick={onSelect}
      className={`flex items-center gap-3 bg-card-dark p-3 rounded-lg border-l-4 shadow-sm w-full text-left hover:bg-slate-800/60 transition-colors ${
        driver ? 'opacity-100' : 'opacity-70'
      }`}
      style={{ borderLeftColor: isTop5 ? '#F5D25D' : '#6B9BF4' }}
    >
      <div className="flex items-center justify-center rounded bg-slate-800 shrink-0 size-10 font-bold text-slate-100">
        {position}
      </div>
      {driver ? (
        <div className="flex-1 flex items-center gap-3 px-2">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-xs font-mono text-slate-400">{driver.number}</span>
          <p className="text-base font-medium">{driver.name}</p>
        </div>
      ) : (
        <p className="flex-1 px-2 text-slate-400 italic text-sm">Seleccionar Piloto</p>
      )}
      <span className="material-symbols-outlined text-slate-400">expand_more</span>
    </button>
  )
}

// FIX BUG-SEARCH: z-[200] para estar encima de todo, incluyendo nav bar
// + viewport-aware para teclado en móvil
function DriverPicker({ picks, onPick, onClose }) {
  const [search, setSearch] = useState('')
  const available = DRIVERS_2026.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) &&
    !picks.some(p => p?.id === d.id)
  )

  // Prevenir scroll del body cuando el picker está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end"
      style={{ zIndex: 200 }}
      onClick={onClose}
    >
      <div
        className="bg-[#1F1F2B] w-full rounded-t-2xl flex flex-col border-t border-slate-700"
        style={{ maxHeight: '70dvh', zIndex: 201 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 shrink-0">
          <h3 className="font-bold text-lg">Seleccionar Piloto</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 pt-3 pb-2 shrink-0">
          <input
            autoFocus
            type="text"
            placeholder="Buscar piloto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800 rounded-lg px-4 py-2.5 text-white outline-none focus:ring-2 focus:ring-primary placeholder-slate-500"
          />
        </div>

        {/* Results list — scrollable, nunca detrás de nada */}
        <div className="overflow-y-auto flex-1 px-4 pb-6 space-y-1">
          {available.map(driver => (
            <button
              key={driver.id}
              onPointerDown={e => { e.stopPropagation(); onPick(driver) }}
              className="flex items-center gap-3 w-full p-3 hover:bg-slate-800/60 active:bg-slate-700 rounded-lg transition-colors"
            >
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: TEAM_COLORS[driver.team] ?? '#888' }} />
              <span className="text-xs font-mono text-slate-500 w-8">{driver.number}</span>
              <span className="font-medium flex-1 text-left">{driver.name}</span>
              <span className="text-xs text-slate-500">{driver.team}</span>
            </button>
          ))}
          {available.length === 0 && (
            <p className="text-center text-slate-500 py-8">No hay pilotos disponibles</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Predict({ session }) {
  const { raceId } = useParams()
  const navigate   = useNavigate()

  const [race, setRace]           = useState(null)
  const [picks, setPicks]         = useState(Array(10).fill(null))
  const [editing, setEditing]     = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [timeLeft, setTimeLeft]   = useState('')
  const [existingPred, setExisting] = useState(null)

  useEffect(() => {
    const load = async () => {
      await supabase.from('players').upsert(
        { id: session.user.id, email: session.user.email },
        { onConflict: 'id', ignoreDuplicates: true }
      )
      const { data } = await supabase.from('races').select('*').eq('id', raceId).single()
      if (data) setRace(data)

      const { data: pred } = await supabase
        .from('predictions').select('*')
        .eq('race_id', raceId).eq('player_id', session.user.id)
        .maybeSingle()

      if (pred) {
        setExisting(pred)
        const existing = pred.picks.map(id => DRIVERS_2026.find(d => d.id === id) ?? null)
        setPicks(existing)
        setSubmitted(true)
      }
    }
    load()
  }, [raceId, session])

  useEffect(() => {
    if (!race) return
    const deadline = new Date(new Date(race.race_date).getTime() - 3600000)
    const calc = () => {
      const diff = deadline - new Date()
      if (diff <= 0) return setTimeLeft('Cerrado')
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [race])

  const handlePick = (driver) => {
    const next = [...picks]
    next[editing] = driver
    setPicks(next)
    setEditing(null)
  }

  const handleSubmit = async () => {
    if (picks.some(p => !p)) return
    setSaving(true)
    const pickIds = picks.map(p => p.id)
    const payload = { race_id: raceId, player_id: session.user.id, picks: pickIds, submitted_at: new Date().toISOString() }
    let saveError = null
    if (existingPred) {
      const { error } = await supabase.from('predictions')
        .update({ picks: pickIds, submitted_at: new Date().toISOString() })
        .eq('race_id', raceId).eq('player_id', session.user.id)
      saveError = error
    } else {
      const { error } = await supabase.from('predictions').insert(payload)
      saveError = error
    }
    setSaving(false)
    if (saveError) { alert(`Error al guardar: ${saveError.message}`); return }
    setSubmitted(true)
    navigate('/')
  }

  const isComplete = picks.every(p => !!p)
  const isDeadlinePassed = race
    ? new Date() >= new Date(new Date(race.race_date).getTime() - 3600000)
    : false

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 bg-background-dark border-b border-slate-800" style={{ zIndex: 100 }}>
        <div className="flex items-center p-4 justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="hover:bg-slate-800 p-2 rounded-full transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h2 className="text-lg font-bold leading-tight tracking-tight">
                {race?.country_flag && <span className="mr-1.5">{race.country_flag}</span>}
                {race?.name ?? 'Cargando...'}
              </h2>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Predicción Oficial</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-primary text-sm font-bold leading-none">{timeLeft}</span>
            <span className="text-[10px] text-slate-400 uppercase">Cierre</span>
          </div>
        </div>
      </header>

      {isDeadlinePassed && !existingPred && (
        <div className="bg-slate-800 text-slate-300 text-sm text-center p-3">
          ⏰ El plazo de predicción ha cerrado para esta carrera.
        </div>
      )}

      <main className="max-w-2xl mx-auto p-4 pb-32">
        <div className="mb-8">
          <div className="flex items-center mb-4 px-1">
            <h3 className="text-gold-accent text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">stars</span>
              Top 5 · 10 pts c/u
            </h3>
          </div>
          <div className="space-y-3">
            {[0,1,2,3,4].map(i => (
              <DriverRow key={i} position={i+1} driver={picks[i]}
                onSelect={() => !isDeadlinePassed && setEditing(i)} isTop5={true} />
            ))}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center mb-4 px-1">
            <h3 className="text-blue-accent text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">leaderboard</span>
              Medios · 5 pts c/u
            </h3>
          </div>
          <div className="space-y-3">
            {[5,6,7,8,9].map(i => (
              <DriverRow key={i} position={i+1} driver={picks[i]}
                onSelect={() => !isDeadlinePassed && setEditing(i)} isTop5={false} />
            ))}
          </div>
        </div>
      </main>

      {!isDeadlinePassed && (
        <div className="fixed left-0 right-0 bg-background-dark/90 backdrop-blur-md p-4 border-t border-slate-800"
          style={{ bottom: '76px', zIndex: 90 }}>
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleSubmit}
              disabled={!isComplete || saving}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{saving ? 'Guardando...' : existingPred ? 'Actualizar predicción' : 'Enviar predicción'}</span>
              <span className="material-symbols-outlined">send</span>
            </button>
            {!isComplete && (
              <p className="text-center text-xs text-slate-500 mt-2">
                Selecciona {picks.filter(p => !p).length} piloto(s) más para continuar
              </p>
            )}
          </div>
        </div>
      )}

      {editing !== null && (
        <DriverPicker picks={picks} onPick={handlePick} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
