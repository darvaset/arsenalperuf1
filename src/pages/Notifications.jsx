import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Notifications({ session }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [session?.user?.id])

  const fetchNotifications = async () => {
    if (!session?.user?.id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('player_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) console.error('Error fetching notifications:', error)
    else setNotifications(data || [])
    setLoading(false)
  }

  const markAsRead = async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    }
  }

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('player_id', session.user.id)
      .eq('is_read', false)

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    }
  }

  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }) + ' ' + 
           date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  return (
    <div className="px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black italic tracking-tight text-white">NOTIFICACIONES</h1>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={markAllAsRead}
            className="text-xs font-bold text-primary hover:text-red-400 transition-colors uppercase tracking-wider"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-card-dark/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">notifications_off</span>
          <p className="text-slate-500 font-medium">No tienes notificaciones aún.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((n) => (
            <div 
              key={n.id}
              className={`relative p-4 rounded-2xl border transition-all duration-300 ${
                n.is_read 
                  ? 'bg-card-dark/40 border-white/5 opacity-70' 
                  : 'bg-card-dark border-white/10 shadow-lg shadow-black/20 ring-1 ring-white/5'
              }`}
            >
              {!n.is_read && (
                <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(224,7,0,0.6)]" />
              )}
              
              <div className="flex flex-col gap-1 pr-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  {formatTime(n.created_at)}
                </span>
                <h3 className={`font-black italic text-sm ${n.is_read ? 'text-slate-300' : 'text-white'}`}>
                  {n.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {n.message}
                </p>
                
                <div className="flex items-center gap-3 mt-3">
                  {n.link && (
                    <Link 
                      to={n.link}
                      onClick={() => markAsRead(n.id)}
                      className="text-[10px] font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg border border-white/10 transition-colors"
                    >
                      Ver detalle
                    </Link>
                  )}
                  {!n.is_read && (
                    <button 
                      onClick={() => markAsRead(n.id)}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-widest"
                    >
                      Ignorar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
