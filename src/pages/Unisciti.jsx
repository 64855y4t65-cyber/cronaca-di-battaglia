import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getSessionePerCodice, aggiungiPartecipante, connetti } from '../lib/supabaseSessioni.js'

export default function Unisciti() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [codice, setCodice] = useState(searchParams.get('codice') || '')
  const [sessione, setSessione] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errore, setErrore] = useState('')

  useEffect(() => {
    if (codice.length === 6) cercaSessione()
  }, [])

  const cercaSessione = async () => {
    setLoading(true)
    setErrore('')
    try {
      const s = await getSessionePerCodice(codice)
      if (!s) return setErrore('Sessione non trovata. Controlla il codice.')
      if (s.stato === 'terminata') return setErrore('Questa sessione è terminata.')
      setSessione(s)
    } catch (err) {
      setErrore('Errore nella ricerca.')
    } finally {
      setLoading(false)
    }
  }

  const handleUnisciti = async () => {
    setLoading(true)
    try {
      await aggiungiPartecipante(sessione.id, 'giocatore')
      await connetti(sessione.id)
      navigate(`/sessione/${sessione.id}`)
    } catch (err) {
      console.error(err)
      setErrore('Errore durante la connessione.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.titolo}>🎲 Unisciti a una sessione</h2>

        {!sessione ? (
          <>
            <label style={styles.label}>Inserisci il codice sessione (6 caratteri)</label>
            <input
              style={styles.input}
              placeholder="es. A2B3C4"
              maxLength={6}
              value={codice}
              onChange={e => {
                setCodice(e.target.value.toUpperCase())
                setErrore('')
              }}
            />
            {errore && <p style={styles.errore}>{errore}</p>}
            <button style={styles.btnPrimario} onClick={cercaSessione} disabled={loading || codice.length !== 6}>
              {loading ? 'Ricerca...' : 'Cerca sessione'}
            </button>
            <button style={styles.btnGhost} onClick={() => navigate('/')}>
              ← Torna al combat tracker
            </button>
          </>
        ) : (
          <>
            <div style={styles.sessioneInfo}>
              <p style={styles.sessioneNome}>{sessione.nome}</p>
              {sessione.descrizione && <p style={styles.sessioneDesc}>{sessione.descrizione}</p>}
              <p style={styles.sessioneStato}>Stato: {sessione.stato === 'in_attesa' ? '⏳ In attesa' : '🎭 In corso'}</p>
            </div>
            {errore && <p style={styles.errore}>{errore}</p>}
            <button style={styles.btnPrimario} onClick={handleUnisciti} disabled={loading}>
              {loading ? 'Connessione...' : 'Entra nella sessione'}
            </button>
            <button style={styles.btnGhost} onClick={() => setSessione(null)}>
              ← Cambia codice
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1a1a2e',
    padding: 20,
  },
  card: {
    background: '#16213e',
    border: '1px solid #c9a24b44',
    borderRadius: 12,
    padding: 40,
    maxWidth: 480,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  titolo: {
    color: '#c9a24b',
    fontFamily: 'serif',
    margin: 0,
    marginBottom: 8,
  },
  label: {
    color: '#aaa',
    fontSize: 13,
    margin: 0,
  },
  input: {
    background: '#0f3460',
    border: '1px solid #c9a24b44',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#fff',
    fontSize: 22,
    letterSpacing: 6,
    fontFamily: 'monospace',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    textTransform: 'uppercase',
  },
  errore: {
    color: '#ff6b6b',
    fontSize: 13,
    margin: 0,
  },
  btnPrimario: {
    background: '#c9a24b',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: 8,
    padding: '12px 20px',
    fontWeight: 700,
    fontSize: 15,
    cursor: 'pointer',
    marginTop: 8,
  },
  btnGhost: {
    background: 'transparent',
    color: '#c9a24b',
    border: '1px solid #c9a24b44',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 14,
    cursor: 'pointer',
  },
  sessioneInfo: {
    background: '#0f3460',
    borderRadius: 8,
    padding: 16,
    borderLeft: '3px solid #c9a24b',
  },
  sessioneNome: {
    color: '#c9a24b',
    fontFamily: 'serif',
    fontSize: 20,
    margin: '0 0 6px 0',
  },
  sessioneDesc: {
    color: '#aaa',
    fontSize: 14,
    margin: '0 0 6px 0',
  },
  sessioneStato: {
    color: '#888',
    fontSize: 13,
    margin: 0,
  },
}