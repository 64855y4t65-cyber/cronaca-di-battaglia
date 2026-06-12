import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase.js'
import {
  getSessioneById,
  getGiocatoriAttivi,
  connetti,
  disconnetti,
  avviaCombattimento,
  terminaSessione,
  subscribeSessione
} from '../lib/supabaseSessioni.js'

export default function Sessione() {
  const { sessioneId } = useParams()
  const navigate = useNavigate()

  const [sessione, setSessione] = useState(null)
  const [giocatori, setGiocatori] = useState([])
  const [isDM, setIsDM] = useState(false)
  const [loading, setLoading] = useState(true)

  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    let unsubscribe = null

    // Rilegge sempre l'intera lista dal DB: il database è la fonte di verità.
    // Evita card duplicate o fantasma dovute a eventi Realtime ripetuti.
    const ricaricaGiocatori = async () => {
      const lista = await getGiocatoriAttivi(sessioneId)
      setGiocatori(lista)
    }

    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const s = await getSessioneById(sessioneId)
        if (!s) return navigate('/')

        setSessione(s)
        setIsDM(s.dm_id === user.id)

        await connetti(sessioneId)
        await ricaricaGiocatori()

        unsubscribe = subscribeSessione(sessioneId, async (cambio) => {
          if (cambio.tipo === 'sessione') {
            setSessione(cambio.dati)
            if (cambio.dati.stato === 'in_corso') {
              setTimeout(() => navigate(`/combattimento/${sessioneId}`), 1500)
            }
            if (cambio.dati.stato === 'terminata') {
              navigate('/')
            }
          }
          // Qualsiasi cambiamento sui giocatori → rileggi tutta la lista
          if (cambio.tipo === 'giocatore_entrato' || cambio.tipo === 'giocatore_uscito') {
            await ricaricaGiocatori()
          }
        })

        setLoading(false)
      } catch (err) {
        console.error(err)
        navigate('/')
      }
    }

    init()

    return () => {
      if (unsubscribe) unsubscribe()
      disconnetti(sessioneId)
      initRef.current = false
    }
  }, [sessioneId])

  const handleAvvia = async () => {
    try {
      await avviaCombattimento(sessioneId)
    } catch (err) {
      alert('Errore nell\'avvio del combattimento')
    }
  }

  const handleTermina = async () => {
    if (!confirm('Terminare la sessione? Tutti i giocatori verranno disconnessi.')) return
    try {
      await terminaSessione(sessioneId)
      navigate('/')
    } catch (err) {
      alert('Errore nella terminazione della sessione')
    }
  }

  const handleEsci = () => {
    disconnetti(sessioneId)
    navigate('/')
  }

  const etichettaGiocatore = (g) => {
    const username = g.username || 'Avventuriero'
    return g.nomePg ? `${username} · 🧙 ${g.nomePg}` : username
  }

  if (loading) return (
    <div style={styles.loading}>Connessione alla sessione...</div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.titolo}>{sessione?.nome}</h1>
          <span style={{
            ...styles.badge,
            background: sessione?.stato === 'in_attesa' ? '#856404' : '#155724'
          }}>
            {sessione?.stato === 'in_attesa' ? '⏳ In attesa' : '🎭 In corso'}
          </span>
        </div>
        <div style={styles.headerAzioni}>
          {isDM && (
            <>
              <div style={styles.codiceBox}>
                <span style={styles.codiceLabel}>Codice:</span>
                <span style={styles.codice}>{sessione?.codice_sessione}</span>
              </div>
              <button
                style={styles.btnAvvia}
                onClick={handleAvvia}
                disabled={sessione?.stato !== 'in_attesa'}
              >
                ⚔️ Avvia combattimento
              </button>
              <button style={styles.btnTermina} onClick={handleTermina}>
                🛑 Termina
              </button>
            </>
          )}
          {!isDM && (
            <button style={styles.btnGhost} onClick={handleEsci}>
              ← Esci
            </button>
          )}
        </div>
      </div>

      {sessione?.descrizione && (
        <div style={styles.descrizione}>
          <p style={styles.descrizioneLabel}>📖 L'avventura</p>
          <p style={styles.descrizioneText}>{sessione.descrizione}</p>
        </div>
      )}

      <div style={styles.giocatoriBox}>
        <h3 style={styles.giocatoriTitolo}>
          👥 Giocatori connessi ({giocatori.length})
        </h3>
        {giocatori.length === 0 ? (
          <p style={styles.vuoto}>Nessun giocatore connesso ancora...</p>
        ) : (
          <div style={styles.giocatoriGrid}>
            {giocatori.map(g => (
              <div key={g.id} style={styles.giocatoreCard}>
                <span style={styles.pallino} />
                <span style={styles.giocatoreNome}>
                  {etichettaGiocatore(g)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.statoBox}>
        {sessione?.stato === 'in_attesa' && (
          <>
            <h2 style={styles.statoTitolo}>⏳ In attesa dell'inizio...</h2>
            <p style={styles.statoTesto}>
              {isDM
                ? 'Quando tutti i giocatori sono pronti, avvia il combattimento.'
                : 'Il DM avvierà il combattimento quando siete tutti pronti.'}
            </p>
          </>
        )}
        {sessione?.stato === 'in_corso' && (
          <>
            <h2 style={styles.statoTitolo}>⚔️ Combattimento in corso!</h2>
            <p style={styles.statoTesto}>Reindirizzamento al combat tracker...</p>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  loading: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    background: '#1a1a2e',
    color: '#c9a24b',
    fontFamily: 'serif',
    fontSize: 18,
  },
  container: {
    minHeight: '100vh',
    background: '#1a1a2e',
    padding: 20,
    maxWidth: 900,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
    background: '#16213e',
    border: '1px solid #c9a24b44',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  },
  titolo: {
    color: '#c9a24b',
    fontFamily: 'serif',
    margin: '0 0 8px 0',
    fontSize: 26,
  },
  badge: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: 20,
  },
  headerAzioni: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  codiceBox: {
    background: '#0f3460',
    borderRadius: 8,
    padding: '8px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  codiceLabel: {
    color: '#aaa',
    fontSize: 12,
  },
  codice: {
    color: '#c9a24b',
    fontFamily: 'monospace',
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: 3,
  },
  btnAvvia: {
    background: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 18px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 14,
  },
  btnTermina: {
    background: '#c62828',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 18px',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 14,
  },
  btnGhost: {
    background: 'transparent',
    color: '#c9a24b',
    border: '1px solid #c9a24b44',
    borderRadius: 8,
    padding: '10px 18px',
    fontSize: 14,
    cursor: 'pointer',
  },
  descrizione: {
    background: '#16213e',
    border: '1px solid #c9a24b44',
    borderLeft: '3px solid #c9a24b',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  descrizioneLabel: {
    color: '#c9a24b',
    fontWeight: 700,
    margin: '0 0 8px 0',
    fontSize: 14,
  },
  descrizioneText: {
    color: '#ccc',
    margin: 0,
    lineHeight: 1.6,
  },
  giocatoriBox: {
    background: '#16213e',
    border: '1px solid #c9a24b44',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  },
  giocatoriTitolo: {
    color: '#c9a24b',
    margin: '0 0 16px 0',
    fontSize: 16,
  },
  giocatoriGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 12,
  },
  giocatoreCard: {
    background: '#0f3460',
    borderRadius: 8,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    border: '1px solid #c9a24b22',
  },
  pallino: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#4caf50',
    flexShrink: 0,
  },
  giocatoreNome: {
    color: '#ccc',
    fontSize: 14,
  },
  vuoto: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '20px 0',
  },
  statoBox: {
    background: '#16213e',
    border: '1px solid #c9a24b44',
    borderRadius: 12,
    padding: 32,
    textAlign: 'center',
  },
  statoTitolo: {
    color: '#c9a24b',
    fontFamily: 'serif',
    margin: '0 0 12px 0',
  },
  statoTesto: {
    color: '#aaa',
    margin: 0,
    fontSize: 15,
  },
}