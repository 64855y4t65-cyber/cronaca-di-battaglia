import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Auth from './Auth.jsx'
import CreaSessione from './pages/CreaSessione.jsx'
import Unisciti from './pages/Unisciti.jsx'
import Sessione from './pages/Sessione.jsx'
import { supabase } from './supabase.js'

function Root() {
  const [sessione, setSessione] = useState(null)
  const [caricamento, setCaricamento] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessione(session)
      setCaricamento(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessione(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (caricamento) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#c9a24b', fontFamily: 'serif' }}>
      Caricamento...
    </div>
  )

  if (!sessione) return <Auth />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App sessione={sessione} />} />
        <Route path="/crea-sessione" element={<CreaSessione />} />
        <Route path="/unisciti" element={<Unisciti />} />
        <Route path="/sessione/:sessioneId" element={<Sessione />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)