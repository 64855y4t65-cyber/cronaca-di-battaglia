import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Auth from './Auth.jsx'
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

  return sessione ? <App sessione={sessione} /> : <Auth />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
