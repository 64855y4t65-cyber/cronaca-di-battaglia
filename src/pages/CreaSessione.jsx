import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { creaSessione, aggiungiPartecipante } from '../lib/supabaseSessioni.js'

export default function CreaSessione() {
  const navigate = useNavigate()
  const [nome, setNome] = useState('')
  const [descrizione, setDescrizione] = useState('')
  const [loading, setLoading] = useState(false)
  const [creata, setCreata] = useState(null) // { id, codice_sessione }

  const handleCrea = async () => {
    if (!nome.trim()) return alert('Inserisci un nome per la sessione')
    setLoading(true)
    try {
      const sessione = await creaSessione({ nome: nome.trim(), descrizione: descrizione.trim() })
      await aggiungiPartecipante(sessione.id, 'dm')
      setCreata(sessione)
    } catch (err) {
      console.error(err)
      alert('Errore nella creazione della sessione')
    } finally {
      setLoading(false)
    }
  }

  const urlInvito = creata
    ? `${window.location.origin}/unisciti?codice=${creata.codice_sessione}`
    : ''

  if (creata) return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.titolo}>✅ Sessione creata!</h2>
        <p style={styles.label}>Codice sessione:</p>
        <div style={styles.codiceBox}>
          <span style={styles.codice}>{creata.codice_sessione}</span>
          <button style={styles.btnCopia} onClick={() => {
            navigator.clipboard.writeText(creata.codice_sessione)
            alert('Codice copiato!')
          }}>Copia</button>
        </div>
        <p style={styles.label}>QR Code:</p>
        <div style={styles.qrBox}>
          <QRCodeSVG value={urlInvito} size={200} level="H" includeMargin />
        </div>
        <p style={styles.hint}>Mostra il QR ai giocatori oppure condividi il codice</p>
        <button style={styles.btnPrimario} onClick={() => navigate(`/sessione/${creata.id}`)}>
          Entra nella lobby →
        </button>
      </div>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.titolo}>⚔️ Nuova sessione</h2>
        <label style={styles.label}>Nome avventura</label>
        <input
          style={styles.input}
          placeholder="es. La torre del mago scuro"
          value={nome}
          onChange={e => setNome(e.target.value)}
        />
        <label style={styles.label}>Descrizione (opzionale)</label>
        <textarea
          style={{ ...styles.input, height: 80, resize: 'vertical' }}
          placeholder="Descrivi brevemente l'avventura..."
          value={descrizione}
          onChange={e => setDescrizione(e.target.value)}
        />
        <button style={styles.btnPrimario} onClick={handleCrea} disabled={loading}>
          {loading ? 'Creazione...' : 'Crea sessione'}
        </button>
        <button style={styles.btnGhost} onClick={() => navigate('/')}>
          ← Torna al combat tracker
        </button>
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
    fontSize: 15,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
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
  codiceBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#0f3460',
    borderRadius: 8,
    padding: '12px 16px',
  },
  codice: {
    color: '#c9a24b',
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: 4,
    fontFamily: 'monospace',
  },
  btnCopia: {
    background: '#c9a24b',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: 6,
    padding: '6px 12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  qrBox: {
    background: '#fff',
    borderRadius: 8,
    padding: 12,
    display: 'inline-block',
    alignSelf: 'center',
  },
  hint: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    margin: 0,
  },
}