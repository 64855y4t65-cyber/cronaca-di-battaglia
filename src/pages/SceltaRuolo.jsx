import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'

export default function SceltaRuolo() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.titolo}>🎲 Chi vuoi essere?</h1>
        <p style={styles.sottotitolo}>Scegli il tuo ruolo per questa sessione</p>

        <div style={styles.opzioni}>
          <button style={styles.opzioneCard} onClick={() => navigate('/crea-sessione')}>
            <span style={styles.icona}>📖</span>
            <span style={styles.opzioneTitolo}>Dungeon Master</span>
            <span style={styles.opzioneDesc}>Crea e gestisci una sessione</span>
          </button>

          <button style={styles.opzioneCard} onClick={() => navigate('/unisciti')}>
            <span style={styles.icona}>⚔️</span>
            <span style={styles.opzioneTitolo}>Avventuriero</span>
            <span style={styles.opzioneDesc}>Unisciti a una sessione esistente</span>
          </button>
        </div>

        <button style={styles.btnLogout} onClick={handleLogout}>
          Esci dall'account
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#1a1a2e',
    display: 'grid',
    placeItems: 'center',
    padding: 20,
  },
  card: {
    background: '#16213e',
    border: '1px solid #c9a24b44',
    borderRadius: 16,
    padding: 40,
    maxWidth: 500,
    width: '100%',
    textAlign: 'center',
  },
  titolo: {
    color: '#c9a24b',
    fontFamily: 'serif',
    fontSize: 28,
    margin: '0 0 8px 0',
  },
  sottotitolo: {
    color: '#aaa',
    margin: '0 0 32px 0',
    fontSize: 15,
  },
  opzioni: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginBottom: 24,
  },
  opzioneCard: {
    background: '#0f3460',
    border: '1px solid #c9a24b44',
    borderRadius: 12,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    transition: 'transform 0.15s, border-color 0.15s',
  },
  icona: {
    fontSize: 36,
  },
  opzioneTitolo: {
    color: '#c9a24b',
    fontSize: 18,
    fontWeight: 700,
    fontFamily: 'serif',
  },
  opzioneDesc: {
    color: '#aaa',
    fontSize: 13,
  },
  btnLogout: {
    background: 'transparent',
    color: '#c9a24b88',
    border: '1px solid #c9a24b22',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 13,
    cursor: 'pointer',
  },
}