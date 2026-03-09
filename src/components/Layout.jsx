import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const staticNavItems = [
  { to: '/',          icon: 'home',          label: 'Inicio',     exact: true },
  { to: '/calendar',  icon: 'calendar_month', label: 'Calendario' },
  // 'Predecir' se maneja por separado
  { to: '/standings', icon: 'leaderboard',   label: 'Tabla'      },
  { to: '/profile',   icon: 'person',        label: 'Perfil'     },
]

export default function Layout({ session }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handlePredict = async () => {
    const now = new Date()
    // Buscar la carrera más próxima sin resultados (futura) cuya deadline no haya pasado
    const { data: races } = await supabase
      .from('races')
      .select('id, race_date, results')
      .is('results', null)           // sin resultados = no terminada
      .gte('race_date', now.toISOString())
      .order('race_date', { ascending: true })
      .limit(1)

    if (races?.[0]) {
      const deadline = new Date(new Date(races[0].race_date).getTime() - 3600000)
      if (now < deadline) {
        navigate(`/predict/${races[0].id}`)
        return
      }
    }

    // Si no hay carrera abierta, ir a calendario
    navigate('/calendar')
  }

  const isPredictActive = location.pathname.startsWith('/predict')

  return (
    <div className="min-h-screen bg-background-dark font-display text-slate-100">
      {/* Red top bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-red-800 to-primary z-50" />

      {/* Floating Header (Discreto) */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background-dark/80 backdrop-blur-md border-b border-white/5 px-4 h-14 flex items-center justify-between max-w-2xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-black italic tracking-tighter text-primary">Arsenal<span className="text-slate-100 not-italic ml-1 uppercase">Peru F1</span></span>
        </Link>
      </header>

      {/* Page content */}
      <main className="max-w-2xl mx-auto w-full pb-28 pt-16">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card-dark border-t border-white/10 px-4 pb-6 pt-2">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          {/* Inicio y Calendario */}
          {staticNavItems.slice(0, 2).map(({ to, icon, label, exact }) => (
            <NavLink
              key={to} to={to} end={exact}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 transition-colors ${
                  isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined ${isActive ? 'fill-icon' : ''}`}>{icon}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? 'text-primary' : ''}`}>{label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* Botón Predecir (inteligente) */}
          <button
            onClick={handlePredict}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isPredictActive ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className={`material-symbols-outlined ${isPredictActive ? 'fill-icon' : ''}`}>edit_note</span>
            <span className={`text-[10px] font-bold uppercase tracking-wide ${isPredictActive ? 'text-primary' : ''}`}>Predecir</span>
          </button>

          {/* Tabla y Perfil */}
          {staticNavItems.slice(2).map(({ to, icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 transition-colors ${
                  isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`material-symbols-outlined ${isActive ? 'fill-icon' : ''}`}>{icon}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? 'text-primary' : ''}`}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
