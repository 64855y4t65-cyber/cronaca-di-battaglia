import { useState } from 'react'
import { supabase } from './supabase'
import { Swords, Mail, Lock, User } from 'lucide-react'

export default function Auth() {
  const [modalita, setModalita] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [caricamento, setCaricamento] = useState(false)
  const [errore, setErrore] = useState(null)
  const [messaggio, setMessaggio] = useState(null)

  const handleLogin = async () => {
    setCaricamento(true)
    setErrore(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setErrore(error.message)
    setCaricamento(false)
  }

  const handleSignup = async () => {
    setCaricamento(true)
    setErrore(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username.trim() } }
    })
    if (error) { setErrore(error.message); setCaricamento(false); return }
    setMessaggio('Registrazione completata! Controlla la tua email per confermare, poi accedi.')
    setCaricamento(false)
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-logo">
          <Swords size={32} strokeWidth={1.6} />
        </div>
        <h1 className="auth-titolo">D&D Players Tool</h1>
        <p className="auth-sub">
          {modalita === 'login' ? 'Accedi al tuo account' : 'Crea il tuo account'}
        </p>

        {errore && <div className="auth-errore">{errore}</div>}
        {messaggio && <div className="auth-ok">{messaggio}</div>}

        {modalita === 'signup' && (
          <div className="auth-campo">
            <User size={15} />
            <input
              className="auth-input"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
        )}

        <div className="auth-campo">
          <Mail size={15} />
          <input
            className="auth-input"
            placeholder="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="auth-campo">
          <Lock size={15} />
          <input
            className="auth-input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (modalita === 'login' ? handleLogin() : handleSignup())}
          />
        </div>

        <button
          className="auth-btn"
          onClick={modalita === 'login' ? handleLogin : handleSignup}
          disabled={caricamento}
        >
          {caricamento ? 'Attendere...' : modalita === 'login' ? 'Accedi' : 'Registrati'}
        </button>

        <p className="auth-switch">
          {modalita === 'login' ? 'Non hai un account?' : 'Hai già un account?'}
          <button
            className="auth-link"
            onClick={() => { setModalita(modalita === 'login' ? 'signup' : 'login'); setErrore(null); setMessaggio(null) }}
          >
            {modalita === 'login' ? 'Registrati' : 'Accedi'}
          </button>
        </p>
      </div>
    </div>
  )
}