import { supabase } from '../supabase.js'

// ─── SESSIONI ────────────────────────────────────────────

export async function creaSessione({ nome, descrizione }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Utente non autenticato')

  const { data, error } = await supabase
    .from('sessioni')
    .insert({ nome, descrizione, dm_id: user.id, stato: 'in_attesa' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSessioneById(id) {
  const { data, error } = await supabase
    .from('sessioni')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getSessionePerCodice(codice) {
  const { data, error } = await supabase
    .from('sessioni')
    .select('*')
    .eq('codice_sessione', codice.toUpperCase())
    .single()

  if (error) return null
  return data
}

export async function avviaCombattimento(sessioneId) {
  const { error } = await supabase
    .from('sessioni')
    .update({ stato: 'in_corso', data_inizio: new Date().toISOString() })
    .eq('id', sessioneId)

  if (error) throw error
}

export async function terminaSessione(sessioneId) {
  const { error } = await supabase
    .from('sessioni')
    .update({ stato: 'terminata', data_fine: new Date().toISOString() })
    .eq('id', sessioneId)

  if (error) throw error
}

// ─── PARTECIPANTI ────────────────────────────────────────

export async function aggiungiPartecipante(sessioneId, ruolo = 'giocatore') {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Utente non autenticato')

  const { error } = await supabase
    .from('partecipanti')
    .insert({ sessione_id: sessioneId, utente_id: user.id, ruolo })

  if (error && !error.message.includes('duplicate')) throw error
}

// ─── GIOCATORI ATTIVI (presenza real-time) ───────────────

export async function connetti(sessioneId, personaggioId = null) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('sessioni_giocatori_attivi')
    .upsert({
      sessione_id: sessioneId,
      user_id: user.id,
      personaggio_id: personaggioId,
      stato_connessione: 'connesso',
      ultima_attivita: new Date().toISOString()
    }, { onConflict: 'sessione_id,user_id' })
    .select()
    .single()

  if (error) {
    console.error('Errore connetti:', error)
    return null
  }
  return data
}

export async function disconnetti(sessioneId) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('sessioni_giocatori_attivi')
    .delete()
    .eq('sessione_id', sessioneId)
    .eq('user_id', user.id)
}

// Helper interno: arricchisce righe di giocatori con username (profili) e nome PG (personaggi)
async function arricchisciGiocatori(righe) {
  if (!righe || righe.length === 0) return []

  const userIds = [...new Set(righe.map(r => r.user_id).filter(Boolean))]
  const pgIds = [...new Set(righe.map(r => r.personaggio_id).filter(Boolean))]

  // Mappa user_id -> username
  let mappaUsername = {}
  if (userIds.length) {
    const { data: profili } = await supabase
      .from('profili')
      .select('id, username')
      .in('id', userIds)
    if (profili) {
      mappaUsername = Object.fromEntries(profili.map(p => [p.id, p.username]))
    }
  }

  // Mappa personaggio_id -> nome
  let mappaPg = {}
  if (pgIds.length) {
    const { data: pgs } = await supabase
      .from('personaggi')
      .select('id, nome')
      .in('id', pgIds)
    if (pgs) {
      mappaPg = Object.fromEntries(pgs.map(p => [p.id, p.nome]))
    }
  }

  return righe.map(r => ({
    ...r,
    username: mappaUsername[r.user_id] || null,
    nomePg: r.personaggio_id ? (mappaPg[r.personaggio_id] || null) : null,
  }))
}

export async function getGiocatoriAttivi(sessioneId) {
  const { data, error } = await supabase
    .from('sessioni_giocatori_attivi')
    .select('*')
    .eq('sessione_id', sessioneId)
    .eq('stato_connessione', 'connesso')

  if (error) {
    console.error('Errore getGiocatoriAttivi:', error)
    return []
  }
  return arricchisciGiocatori(data)
}

export async function getGiocatoreAttivoById(id) {
  const { data, error } = await supabase
    .from('sessioni_giocatori_attivi')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  const arricchiti = await arricchisciGiocatori([data])
  return arricchiti[0] || null
}

// ─── REALTIME ────────────────────────────────────────────

export function subscribeSessione(sessioneId, onChange) {
  const nomeCanale = `sessione:${sessioneId}:${Date.now()}:${Math.random().toString(36).slice(2)}`

  const canale = supabase
    .channel(nomeCanale)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'sessioni',
      filter: `id=eq.${sessioneId}`
    }, (payload) => onChange({ tipo: 'sessione', dati: payload.new }))
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'sessioni_giocatori_attivi',
      filter: `sessione_id=eq.${sessioneId}`
    }, (payload) => onChange({ tipo: 'giocatore_entrato', dati: payload.new }))
    .on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'sessioni_giocatori_attivi',
      filter: `sessione_id=eq.${sessioneId}`
    }, (payload) => onChange({ tipo: 'giocatore_uscito', dati: payload.old }))
    .subscribe()

  return () => {
    supabase.removeChannel(canale)
  }
}