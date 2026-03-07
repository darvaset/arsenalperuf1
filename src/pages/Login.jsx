import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background-dark font-display text-slate-100 flex flex-col items-center justify-center p-4">
      {/* Top red bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-red-800 to-primary" />

      {/* Background glow */}
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hero */}
      <div className="w-full max-w-md text-center mb-8">
        <div className="text-6xl mb-6">🏎️</div>
        <h1 className="text-white text-4xl font-bold tracking-tight mb-2">F1 Arsenal Fantasy</h1>
        <h2 className="text-primary text-xl font-semibold tracking-wide uppercase">Temporada 2026</h2>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-surface-dark rounded-xl shadow-2xl border border-border-dark overflow-hidden mb-6">
        <div className="p-8">
          {!sent ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-400">Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl">mail</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="w-full bg-background-dark border border-border-dark rounded-lg py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none placeholder-slate-600"
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                <span>{loading ? 'Enviando...' : 'Enviar link de acceso'}</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-xl">arrow_forward</span>
              </button>
            </form>
          ) : (
            <div className="text-center py-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-4xl">mark_email_unread</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Revisa tu correo</h3>
              <p className="text-slate-400 text-sm">
                Hemos enviado un enlace mágico a <span className="text-white font-medium">{email}</span>. Haz clic en el link para entrar sin contraseña.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-sm text-slate-500 hover:text-white transition-colors"
              >
                Usar otro correo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="text-slate-500 text-sm flex items-center gap-2">
        <span className="material-symbols-outlined text-base">lock</span>
        Solo participantes invitados pueden acceder
      </p>
    </div>
  )
}
