import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'

import Layout    from './components/Layout'
import Login     from './pages/Login'
import Dashboard from './pages/Dashboard'
import Calendar  from './pages/Calendar'
import Predict   from './pages/Predict'
import Standings from './pages/Standings'
import RaceDetail from './pages/RaceDetail'
import Profile       from './pages/Profile'
import PlayerProfile from './pages/PlayerProfile'
import Admin         from './pages/Admin'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    const ensurePlayer = async (s) => {
      if (!s) return
      await supabase.from('players').upsert(
        { id: s.user.id, email: s.user.email },
        { onConflict: 'id', ignoreDuplicates: true }
      )
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      ensurePlayer(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      ensurePlayer(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-primary text-4xl animate-spin">⏳</div>
      </div>
    )
  }

  if (!session) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout session={session} />}>
          <Route index              element={<Dashboard session={session} />} />
          <Route path="calendar"    element={<Calendar  session={session} />} />
          <Route path="predict/:raceId" element={<Predict session={session} />} />
          <Route path="standings"   element={<Standings session={session} />} />
          <Route path="race/:raceId"    element={<RaceDetail    session={session} />} />
          <Route path="player/:playerId" element={<PlayerProfile session={session} />} />
          <Route path="admin"             element={<Admin         session={session} />} />
          <Route path="profile"     element={<Profile   session={session} />} />
          <Route path="*"           element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
