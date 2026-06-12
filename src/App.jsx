import React, { useState } from 'react';
import {
  Shield, Plus, Trash2, ChevronRight, ChevronLeft,
  Dice5, Skull, Copy, RotateCcw, Crown, User, Ghost, Swords,
  Sparkles, Zap, Footprints, Check, ScrollText, UserPlus, Pencil, X, Save, BookUser, LogOut
} from 'lucide-react';
import { supabase } from './supabase.js';
import './App.css';

/* ENGINE */
const tiraD20 = () => Math.floor(Math.random() * 20) + 1;
const tiraIniziativa = (modDes) => tiraD20() + Number(modDes || 0);
const confrontaIniziativa = (a, b) =>
  (b.iniziativa - a.iniziativa) || (Number(b.modDes) - Number(a.modDes)) || (b.spareggio - a.spareggio);
const ordinaPerIniziativa = (lista) => [...lista].sort(confrontaIniziativa);
const clampPf = (val, max) => Math.max(0, Math.min(max, val));
const azzeraEconomia = (c) => ({ ...c, azioneUsata: false, bonusUsata: false, reazioneUsata: false, movimentoUsato: 0 });
const fmtM = (n) => (Number.isInteger(n) ? `${n}` : `${n}`.replace(".", ","));
const azioniDisponibili = (c) => {
  const out = [];
  if (!c.azioneUsata) out.push("Azione");
  if (!c.bonusUsata) out.push("Bonus");
  if (!c.reazioneUsata) out.push("Reazione");
  const mov = c.velocita - c.movimentoUsato;
  if (mov > 0) out.push(`Movimento ${fmtM(mov)} m`);
  return out.length ? out.join(" · ") : "niente, turno esaurito";
};
const modCar = (p) => Math.floor(((Number(p) || 10) - 10) / 2);
const fmtMod = (m) => (m >= 0 ? `+${m}` : `${m}`);
const combattenteDaPersonaggio = (p) => {
  const pfMax = Math.max(1, Number(p.pfMax) || 1);
  return {
    id: uid("c"), personaggioId: p.id, nome: p.nome || "PG", tipo: "pg",
    ca: Number(p.ca) || 10, pfMax, pfAtt: pfMax, modDes: modCar(p.des),
    velocita: Math.max(0, Number(p.velocita) || 9), iniziativa: null, spareggio: Math.random(),
    azioneUsata: false, bonusUsata: false, reazioneUsata: false, movimentoUsato: 0,
  };
};

const TIPI = { pg: { label: "PG" }, png: { label: "PNG" }, mostro: { label: "Mostro" } };
const TIPO_ICONA = { pg: "crown", png: "user", mostro: "ghost" };
const CARATT = [["for","Forza"],["des","Destrezza"],["cos","Costituzione"],["int","Intelligenza"],["sag","Saggezza"],["car","Carisma"]];

let _seq = 0;
const uid = (p = "id") => `${p}_${++_seq}`;
const schedaVuota = () => ({ id: uid("p"), nome: "", classe: "", livello: 1,
  for: 10, des: 14, cos: 12, int: 10, sag: 10, car: 10, ca: 14, pfMax: 20, velocita: 9, mosse: [], incantesimi: [] });
const bozzaMostro = () => ({ nome: "", tipo: "mostro", ca: "13", pfMax: "11", modDes: "1", vel: "9" });

function Sigillo({ tipo }) {
  const IconName = TIPO_ICONA[tipo];
  const Icon = { crown: Crown, user: User, ghost: Ghost }[IconName];
  return <span className={`sigillo sig-${tipo}`} title={TIPI[tipo].label}>
    <Icon size={13} strokeWidth={2.2} /><span>{TIPI[tipo].label}</span></span>;
}

function BarraPf({ att, max }) {
  const ratio = max > 0 ? att / max : 0;
  const liv = att <= 0 ? "ko" : ratio > 0.5 ? "ok" : ratio > 0.25 ? "med" : "bassa";
  return <div className="pf-barra"><div className={`pf-fill pf-${liv}`} style={{ width: `${Math.max(0, ratio) * 100}%` }} /></div>;
}

function SchedaEditor({ valore, onSalva, onAnnulla }) {
  const [s, setS] = useState(valore);
  const set = (campo, v) => setS((x) => ({ ...x, [campo]: v }));
  const addRiga = (lista) => setS((x) => ({ ...x, [lista]: [...x[lista], { id: uid("r"), nome: "", nota: "" }] }));
  const setRiga = (lista, id, campo, v) => setS((x) => ({ ...x, [lista]: x[lista].map((r) => (r.id === id ? { ...r, [campo]: v } : r)) }));
  const delRiga = (lista, id) => setS((x) => ({ ...x, [lista]: x[lista].filter((r) => r.id !== id) }));

  const renderRighe = (lista, placeholder) => (
    <div className="lista-righe">
      {s[lista].map((r) => (
        <div className="riga" key={r.id}>
          <input className="input input-nome" placeholder={placeholder} value={r.nome}
            onChange={(e) => setRiga(lista, r.id, "nome", e.target.value)} />
          <input className="input" placeholder="nota (es. 1d8+3, gittata 9 m, Liv 1…)" value={r.nota}
            onChange={(e) => setRiga(lista, r.id, "nota", e.target.value)} />
          <button className="ico ico-rosso riga-del" onClick={() => delRiga(lista, r.id)} title="Rimuovi"><X size={15} /></button>
        </div>
      ))}
      <button className="add-riga" onClick={() => addRiga(lista)}><Plus size={14} /> Aggiungi</button>
    </div>
  );

  return (
    <div className="editor">
      <div className="editor-tit"><BookUser size={18} /> {valore.nome ? `Modifica: ${valore.nome}` : "Nuova scheda PG"}</div>
      <div className="form-grid">
        <label className="campo campo-nome"><span>Nome</span>
          <input className="input" placeholder="es. Aelar Cantachiaro" value={s.nome} onChange={(e) => set("nome", e.target.value)} /></label>
        <label className="campo"><span>Classe</span>
          <input className="input" placeholder="es. Ladro" value={s.classe} onChange={(e) => set("classe", e.target.value)} /></label>
        <label className="campo campo-mini"><span>Livello</span>
          <input className="input" type="number" value={s.livello} onChange={(e) => set("livello", Number(e.target.value))} /></label>
      </div>
      <div className="editor-sez">Caratteristiche</div>
      <div className="caratt-grid">
        {CARATT.map(([k, label]) => (
          <div className="caratt" key={k}>
            <label>{label}</label>
            <input type="number" value={s[k]} onChange={(e) => set(k, Number(e.target.value))} />
            <div className="caratt-mod">{fmtMod(modCar(s[k]))}</div>
          </div>
        ))}
      </div>
      <div className="editor-sez">Combattimento</div>
      <div className="form-grid">
        <label className="campo campo-mini"><span>CA</span>
          <input className="input" type="number" value={s.ca} onChange={(e) => set("ca", Number(e.target.value))} /></label>
        <label className="campo campo-mini"><span>PF max</span>
          <input className="input" type="number" value={s.pfMax} onChange={(e) => set("pfMax", Number(e.target.value))} /></label>
        <label className="campo campo-mini"><span>Vel (m)</span>
          <input className="input" type="number" step="1.5" value={s.velocita} onChange={(e) => set("velocita", Number(e.target.value))} /></label>
      </div>
      <div className="editor-sez"><Swords size={12} /> Mosse / attacchi</div>
      {renderRighe("mosse", "es. Stocco")}
      <div className="editor-sez"><ScrollText size={12} /> Incantesimi</div>
      {renderRighe("incantesimi", "es. Dardo di fuoco")}
      <div className="editor-comandi">
        <button className="btn btn-oro" onClick={() => onSalva(s)}><Save size={16} /> Salva scheda</button>
        <button className="btn btn-ghost" onClick={onAnnulla}>Annulla</button>
      </div>
    </div>
  );
}

export default function IniziativaApp({ sessione }) {
  const [personaggi, setPersonaggi] = useState([]);
  const [combattenti, setCombattenti] = useState([]);
  const [tab, setTab] = useState("schede");
  const [fase, setFase] = useState("prep");
  const [round, setRound] = useState(1);
  const [attivoId, setAttivoId] = useState(null);
  const [bozza, setBozza] = useState(bozzaMostro());
  const [importi, setImporti] = useState({});
  const [schedaInModifica, setSchedaInModifica] = useState(null);

  const nomeUtente = sessione?.user?.user_metadata?.username
    || sessione?.user?.email?.split('@')[0]
    || 'Avventuriero';

  const indiceAttivo = combattenti.findIndex((c) => c.id === attivoId);

  const nuovaScheda = () => setSchedaInModifica(schedaVuota());
  const modificaScheda = (p) => setSchedaInModifica({ ...p, mosse: p.mosse.map((m) => ({ ...m })), incantesimi: p.incantesimi.map((i) => ({ ...i })) });
  const eliminaScheda = (id) => setPersonaggi((prev) => prev.filter((p) => p.id !== id));
  const salvaScheda = (s) => {
    const pulita = { ...s, nome: (s.nome || "").trim() || "PG senza nome" };
    setPersonaggi((prev) => (prev.some((p) => p.id === s.id) ? prev.map((p) => (p.id === s.id ? pulita : p)) : [...prev, pulita]));
    setSchedaInModifica(null);
  };

  const inserisci = (c) => {
    if (fase === "combat") {
      c.iniziativa = tiraIniziativa(c.modDes);
      setCombattenti((prev) => ordinaPerIniziativa([...prev, c]));
    } else {
      setCombattenti((prev) => [...prev, c]);
    }
  };
  const aggiungiDaScheda = (p) => { inserisci(combattenteDaPersonaggio(p)); setTab("pugna"); };
  const creaMostro = () => {
    const b = bozza;
    const nome = (b.nome || "").trim() || `${TIPI[b.tipo].label} ${combattenti.length + 1}`;
    const pfMax = Math.max(1, Number(b.pfMax) || 1);
    return { id: uid("c"), personaggioId: null, nome, tipo: b.tipo, ca: Number(b.ca) || 10, pfMax, pfAtt: pfMax,
      modDes: Number(b.modDes) || 0, velocita: Math.max(0, Number(b.vel) || 9), iniziativa: null, spareggio: Math.random(),
      azioneUsata: false, bonusUsata: false, reazioneUsata: false, movimentoUsato: 0 };
  };
  const aggiungiMostro = () => { inserisci(creaMostro()); setBozza((b) => ({ ...bozzaMostro(), tipo: b.tipo })); };
  const duplica = (orig) => {
    const base = orig.nome.replace(/\s\(\d+\)$/, "");
    const n = combattenti.filter((x) => x.nome.replace(/\s\(\d+\)$/, "") === base).length + 1;
    inserisci({ ...orig, id: uid("c"), nome: `${base} (${n})`, pfAtt: orig.pfMax, iniziativa: null, spareggio: Math.random() });
  };
  const rimuovi = (id) => {
    setCombattenti((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (id === attivoId && next.length) {
        const i = Math.min(indiceAttivo, next.length - 1);
        setAttivoId(next[i]?.id ?? null);
      } else if (!next.length) { setAttivoId(null); setFase("prep"); }
      return next;
    });
  };
  const tiraTutte = () => {
    if (!combattenti.length) return;
    const ordinati = ordinaPerIniziativa(
      combattenti.map((c) => ({ ...azzeraEconomia(c), iniziativa: tiraIniziativa(c.modDes), spareggio: Math.random() }))
    );
    setCombattenti(ordinati); setRound(1); setAttivoId(ordinati[0].id); setFase("combat");
  };
  const modificaIniziativa = (id, valore) => {
    const v = valore === "" ? 0 : Number(valore);
    setCombattenti((prev) => ordinaPerIniziativa(prev.map((c) => (c.id === id ? { ...c, iniziativa: v } : c))));
  };
  const attiva = (id) => { setAttivoId(id); setCombattenti((prev) => prev.map((c) => (c.id === id ? azzeraEconomia(c) : c))); };
  const turnoAvanti = () => {
    if (indiceAttivo === -1) return;
    if (indiceAttivo === combattenti.length - 1) { setRound((r) => r + 1); attiva(combattenti[0].id); }
    else attiva(combattenti[indiceAttivo + 1].id);
  };
  const turnoIndietro = () => {
    if (indiceAttivo === -1) return;
    if (indiceAttivo === 0) { if (round === 1) return; setRound((r) => r - 1); attiva(combattenti[combattenti.length - 1].id); }
    else attiva(combattenti[indiceAttivo - 1].id);
  };
  const applicaPf = (id, delta) =>
    setCombattenti((prev) => prev.map((c) => (c.id === id ? { ...c, pfAtt: clampPf(c.pfAtt + delta, c.pfMax) } : c)));
  const danno = (id) => { applicaPf(id, -(Number(importi[id]) || 0)); setImporti((m) => ({ ...m, [id]: "" })); };
  const cura = (id) => { applicaPf(id, +(Number(importi[id]) || 0)); setImporti((m) => ({ ...m, [id]: "" })); };
  const toggleEcon = (id, chiave) => setCombattenti((prev) => prev.map((c) => (c.id === id ? { ...c, [chiave]: !c[chiave] } : c)));
  const muovi = (id, passi) => setCombattenti((prev) => prev.map((c) => (c.id === id ? { ...c, movimentoUsato: Math.max(0, Math.min(c.velocita, c.movimentoUsato + passi * 1.5)) } : c)));
  const terminaBattaglia = () => { setFase("prep"); setRound(1); setAttivoId(null); };
  const svuotaScontro = () => { setCombattenti([]); setFase("prep"); setRound(1); setAttivoId(null); };

  return (
    <div className="app">
      <div className="wrap">
        <header className="testata">
          <div className="marchio"><Swords size={26} strokeWidth={1.6} /></div>
          <div>
            <h1 className="titolo">Cronaca di Battaglia</h1>
            <p className="sub">Schede PG · iniziativa · economia del turno</p>
          </div>
          {fase === "combat" && tab === "pugna" && (
            <div className="round-chip"><span className="round-label">Round</span><span className="round-num">{round}</span></div>
          )}
          <div className="header-utente">
            <span className="header-username">{nomeUtente}</span>
            <button className="btn btn-ghost btn-logout" onClick={() => supabase.auth.signOut()} title="Esci dall'account">
              <LogOut size={13} /> Esci
            </button>
          </div>
        </header>

        <nav className="tabs">
          <button className={`tab${tab === "schede" ? " attiva" : ""}`} onClick={() => setTab("schede")}><BookUser size={15} /> Schede PG ({personaggi.length})</button>
          <button className={`tab${tab === "pugna" ? " attiva" : ""}`} onClick={() => setTab("pugna")}><Swords size={15} /> Combattimento</button>
        </nav>

        {tab === "schede" && (schedaInModifica ? (
          <SchedaEditor valore={schedaInModifica} onSalva={salvaScheda} onAnnulla={() => setSchedaInModifica(null)} />
        ) : (
          <>
            <div className="schede-azioni"><button className="btn btn-oro" onClick={nuovaScheda}><Plus size={16} /> Nuova scheda PG</button></div>
            {personaggi.length === 0 ? (
              <div className="vuoto"><BookUser size={30} strokeWidth={1.4} /><p>Nessun personaggio. Crea la scheda del tuo PG: resta in memoria per tutta la sessione e la userai negli scontri.</p></div>
            ) : (personaggi.map((p) => (
              <div className="scheda-card" key={p.id}>
                <div className="scheda-id">
                  <div className="scheda-nome">{p.nome} <Sigillo tipo="pg" /></div>
                  <div className="scheda-meta">{[p.classe, p.livello ? `Liv ${p.livello}` : null].filter(Boolean).join(" · ") || "—"} · CA {p.ca} · {p.pfMax} PF · Vel {fmtM(p.velocita)} m</div>
                  <div className="scheda-mods">{CARATT.map(([k, label]) => (<span className="mini-mod" key={k}>{label.slice(0, 3)} <span>{fmtMod(modCar(p[k]))}</span></span>))}</div>
                </div>
                <div className="scheda-btn">
                  <button className="btn btn-oro" onClick={() => aggiungiDaScheda(p)}><UserPlus size={15} /> Allo scontro</button>
                  <button className="btn btn-ghost" onClick={() => modificaScheda(p)}><Pencil size={14} /> Modifica</button>
                  <button className="btn btn-ghost" onClick={() => eliminaScheda(p.id)}><Trash2 size={14} /> Elimina</button>
                </div>
              </div>
            )))}
          </>
        ))}

        {tab === "pugna" && (
          <>
            <section className="pannello">
              <div className="pannello-tit">{fase === "combat" ? "Aggiungi al combattimento" : "Prepara lo scontro"}</div>
              {personaggi.length > 0 && (
                <div className="quick-pg">
                  <span className="quick-lbl">PG salvati:</span>
                  {personaggi.map((p) => (
                    <button key={p.id} className="pg-chip" onClick={() => aggiungiDaScheda(p)} title={`Aggiungi ${p.nome}`}><UserPlus size={12} /> {p.nome || "PG"}</button>
                  ))}
                </div>
              )}
              <div className="form-grid">
                <label className="campo campo-nome"><span>Mostro / PNG</span>
                  <input className="input" placeholder="es. Goblin" value={bozza.nome}
                    onChange={(e) => setBozza({ ...bozza, nome: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && aggiungiMostro()} /></label>
                <label className="campo"><span>Tipo</span>
                  <select className="input" value={bozza.tipo} onChange={(e) => setBozza({ ...bozza, tipo: e.target.value })}>
                    <option value="mostro">Mostro</option><option value="png">PNG</option><option value="pg">PG</option>
                  </select></label>
                <label className="campo campo-mini"><span>CA</span>
                  <input className="input" type="number" value={bozza.ca} onChange={(e) => setBozza({ ...bozza, ca: e.target.value })} /></label>
                <label className="campo campo-mini"><span>PF</span>
                  <input className="input" type="number" value={bozza.pfMax} onChange={(e) => setBozza({ ...bozza, pfMax: e.target.value })} /></label>
                <label className="campo campo-mini"><span>Mod. DES</span>
                  <input className="input" type="number" value={bozza.modDes} onChange={(e) => setBozza({ ...bozza, modDes: e.target.value })} /></label>
                <label className="campo campo-mini"><span>Vel (m)</span>
                  <input className="input" type="number" step="1.5" value={bozza.vel} onChange={(e) => setBozza({ ...bozza, vel: e.target.value })} /></label>
                <button className="btn btn-oro" onClick={aggiungiMostro}><Plus size={16} strokeWidth={2.4} /> Aggiungi</button>
              </div>
            </section>

            {combattenti.length === 0 ? (
              <div className="vuoto"><Dice5 size={30} strokeWidth={1.4} /><p>Scontro vuoto. Aggiungi i PG dalle schede e i mostri qui sopra, poi tira l'iniziativa.</p></div>
            ) : (
              <ul className="ladder">
                {combattenti.map((c, i) => {
                  const attivo = c.id === attivoId && fase === "combat";
                  const ko = c.pfAtt <= 0;
                  const p = c.personaggioId ? personaggi.find((x) => x.id === c.personaggioId) : null;
                  return (
                    <li key={c.id} className={`card${attivo ? " attivo" : ""}${ko ? " ko" : ""}`} style={{ animationDelay: `${i * 45}ms` }}>
                      <div className="init-col">
                        {fase === "combat" ? (
                          <>
                            <div className="ord">{i + 1}</div>
                            <input className="init-edit" value={c.iniziativa != null ? c.iniziativa : ""} onChange={(e) => modificaIniziativa(c.id, e.target.value)} title="Clicca per correggere l'iniziativa" />
                          </>
                        ) : (<div className="init-attesa">—</div>)}
                      </div>
                      <div className="centro">
                        <div className="riga-nome">
                          {attivo && <ChevronRight className="freccia" size={18} strokeWidth={3} />}
                          <span className="nome">{c.nome}</span>
                          <Sigillo tipo={c.tipo} />
                          {ko && <span className="tag-ko"><Skull size={12} /> a terra</span>}
                        </div>
                        <div className="stat-riga">
                          <span className="stat"><Shield size={13} /> CA {c.ca}</span>
                          <span className="stat pf-testo">{c.pfAtt} / {c.pfMax} PF</span>
                        </div>
                        <BarraPf att={c.pfAtt} max={c.pfMax} />
                        {fase === "combat" && (
                          <div className="econ">
                            <button className={`econ-chip${c.azioneUsata ? " usato" : ""}`} onClick={() => toggleEcon(c.id, "azioneUsata")} title="Azione">
                              {c.azioneUsata ? <Check size={12} /> : <Swords size={12} />} Azione
                            </button>
                            <button className={`econ-chip${c.bonusUsata ? " usato" : ""}`} onClick={() => toggleEcon(c.id, "bonusUsata")} title="Azione bonus">
                              {c.bonusUsata ? <Check size={12} /> : <Sparkles size={12} />} Bonus
                            </button>
                            <button className={`econ-chip${c.reazioneUsata ? " usato" : ""}`} onClick={() => toggleEcon(c.id, "reazioneUsata")} title="Reazione: una per round, si recupera all'inizio del tuo turno">
                              {c.reazioneUsata ? <Check size={12} /> : <Zap size={12} />} Reazione
                            </button>
                            <div className="mov">
                              <button className="mov-step" onClick={() => muovi(c.id, +1)} title="Muovi 1,5 m (un quadretto)">−</button>
                              <span className="mov-val"><Footprints size={12} /> {fmtM(c.velocita - c.movimentoUsato)}<span className="mov-tot">/{fmtM(c.velocita)} m</span></span>
                              <button className="mov-step" onClick={() => muovi(c.id, -1)} title="Recupera 1,5 m">+</button>
                            </div>
                          </div>
                        )}
                        {attivo && <div className="disponibili">Disponibili: {azioniDisponibili(c)}</div>}
                        {attivo && p && (
                          <div className="repertorio">
                            <div className="rep-col">
                              <div className="rep-tit"><Swords size={12} /> Mosse</div>
                              {p.mosse.length ? (
                                <ul className="rep-lista">{p.mosse.map((m) => <li key={m.id}>{m.nome}{m.nota && <i> — {m.nota}</i>}</li>)}</ul>
                              ) : <span className="rep-vuoto">nessuna in scheda</span>}
                            </div>
                            <div className="rep-col">
                              <div className="rep-tit"><ScrollText size={12} /> Incantesimi</div>
                              {p.incantesimi.length ? (
                                <ul className="rep-lista">{p.incantesimi.map((s) => <li key={s.id}>{s.nome}{s.nota && <i> — {s.nota}</i>}</li>)}</ul>
                              ) : <span className="rep-vuoto">nessuno in scheda</span>}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="azioni">
                        <div className="pf-ctrl">
                          <input className="input-mini" type="number" placeholder="0" value={importi[c.id] != null ? importi[c.id] : ""} onChange={(e) => setImporti((m) => ({ ...m, [c.id]: e.target.value }))} />
                          <button className="btn-pf btn-danno" onClick={() => danno(c.id)} title="Danno">−</button>
                          <button className="btn-pf btn-cura" onClick={() => cura(c.id)} title="Cura">+</button>
                        </div>
                        <div className="gestione">
                          <button className="ico" onClick={() => duplica(c)} title="Duplica"><Copy size={15} /></button>
                          <button className="ico ico-rosso" onClick={() => rimuovi(c.id)} title="Rimuovi"><Trash2 size={15} /></button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="comandi">
              {fase === "prep" ? (
                <>
                  <button className="btn btn-grande btn-sangue" onClick={tiraTutte} disabled={!combattenti.length}><Dice5 size={18} strokeWidth={2.2} /> Tira iniziativa</button>
                  {combattenti.length > 0 && <button className="btn btn-ghost" onClick={svuotaScontro}><RotateCcw size={15} /> Svuota</button>}
                </>
              ) : (
                <>
                  <button className="btn btn-ghost" onClick={turnoIndietro}><ChevronLeft size={16} /> Indietro</button>
                  <button className="btn btn-grande btn-oro" onClick={turnoAvanti}>Turno successivo <ChevronRight size={18} strokeWidth={2.4} /></button>
                  <button className="btn btn-ghost" onClick={terminaBattaglia}><RotateCcw size={15} /> Termina</button>
                </>
              )}
            </div>

            <p className="nota">
              I PG nascono dalle <em>schede</em> (la dimensione durevole); il combattente è il <em>fatto</em> volatile dello scontro.
              Al turno di un PG vedi le sue mosse e i suoi incantesimi. Prossimo passo: posizione, distanza e gittata.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
