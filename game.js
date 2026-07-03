/* ============================================================
   CalcioMat — le tabelline (e i verbi!) in gol.
   Due giochi con lo stesso gameplay calcistico:
   ✖️ Tabelline (2-10) · 📖 Verbi (coniugazioni italiane attive)
   ============================================================ */
'use strict';

/* ---------------- squadre (tutte inventate) e turni ---------------- */
const TEAMS = [
  { crest: '🐣', name: 'Pulcini FC',        color: '#f7c948', table: 2,  stadium: 'Stadio del Pulcino' },
  { crest: '🦖', name: 'Dinamo Dino',       color: '#7bc043', table: 3,  stadium: 'Arena Giurassica' },
  { crest: '🤖', name: 'Robot United',      color: '#9aa7b8', table: 4,  stadium: 'RoboArena' },
  { crest: '🐬', name: 'Stella Marina',     color: '#38b6d8', table: 5,  stadium: 'Stadio degli Abissi' },
  { crest: '🌋', name: 'Vulcano Rosso',     color: '#e74c3c', table: 6,  stadium: 'Cratere Arena' },
  { crest: '🦅', name: 'Falchi Azzurri',    color: '#2d7dd2', table: 7,  stadium: 'Nido dei Falchi' },
  { crest: '🐺', name: 'Lupi del Nord',     color: '#b8c6d8', table: 8,  stadium: 'Palazzo di Ghiaccio' },
  { crest: '🐉', name: 'Draghi Viola',      color: '#9b59b6', table: 9,  stadium: 'Tana del Drago' },
  { crest: '🚀', name: 'Galattici Oro',     color: '#f2a71b', table: 10, stadium: 'Astrodromo Galattico' },
];

const ROUNDS = [
  { label: 'Fase a gironi · 1ª partita', short: 'GIRONI · PARTITA 1', icon: '1️⃣' },
  { label: 'Fase a gironi · 2ª partita', short: 'GIRONI · PARTITA 2', icon: '2️⃣' },
  { label: 'Fase a gironi · 3ª partita', short: 'GIRONI · PARTITA 3', icon: '3️⃣' },
  { label: 'Fase a gironi · 4ª partita', short: 'GIRONI · PARTITA 4', icon: '4️⃣' },
  { label: 'Sedicesimi di finale', short: 'SEDICESIMI', icon: '🎯' },
  { label: 'Ottavi di finale', short: 'OTTAVI', icon: '⚡' },
  { label: 'Quarti di finale', short: 'QUARTI', icon: '🔥' },
  { label: 'Semifinale', short: 'SEMIFINALE', icon: '🌟' },
  { label: 'FINALE', short: 'FINALE', icon: '🏆' },
];

const QUESTIONS_PER_MATCH = 15;
const MIN_PER_QUESTION = 6;

// timer per turno (ms): comodo nei gironi, tosto in finale.
// Il gioco dei verbi non ha timer: si scrive con calma.
const TIMERS_TAB = [22000, 20000, 18000, 16000, 14000, 12500, 11000, 10000, 9000];
const FRIENDLY_TIMER_TAB = 16000;

/* ---------------- telecronaca ---------------- */
const SAY = {
  correctYou: ['Risposta giusta! Ora il passaggio!', 'Perfetto! Disegna il passaggio!', 'Che numero! Trova il compagno libero!'],
  wrongYou: ['Palla persa! Recuperala!', 'Intercettato! Ora difendi!', 'Ahi, contropiede avversario!', 'L\'avversario ruba palla!'],
  tackle: ['Contrasto vinto! Palla tua! 🟢', 'Che recupero! Grande difesa!', 'Scivolata perfetta, palla riconquistata!', 'Intercetto da maestro!'],
  oppAdvance: ['L\'avversario avanza... fermalo!', 'Attenzione, si avvicinano alla tua porta!', 'Difesa in difficoltà!', 'Stanno arrivando... concentrati!'],
  passOk: ['Che passaggio! Si vola! 🎯', 'Filtrante perfetto!', 'Palla morbida sul piede del compagno!', 'Il pubblico applaude! 👏'],
  passBad: ['Intercettato! Che peccato!', 'Il difensore legge il passaggio!', 'Traiettoria troppo facile: palla persa!'],
  shotChance: ['SEI DAVANTI ALLA PORTA! Rispondi e tira! ⚽', 'Occasione d\'oro!', 'Solo davanti al portiere!'],
  goalYou: ['GOOOOL! Che meraviglia! 🎉', 'RETE! Il pubblico impazzisce!', 'GOL DA CINEMA! ⭐'],
  missYou: ['Fuori di un soffio! Riprova!', 'Alto sopra la traversa!', 'Nooo, a lato!'],
  savedYou: ['Parata del portiere! Che riflessi!', 'Il portiere ci arriva! Peccato!'],
  oppGoal: ['Gol subìto... riparti e recupera! 💙', 'Segnano loro. Ora tocca a te rimontare!'],
  oppMiss: ['IL TUO PORTIERE PARA! 🧤 Che campione!', 'Miracolo del tuo portiere! Palla tua!', 'Fuori! Ti è andata bene!'],
  timeout: ['Tempo scaduto! Palla persa!', 'Troppo lento, palla all\'avversario!'],
};
const say = (k) => SAY[k][Math.floor(Math.random() * SAY[k].length)];

/* ============================================================
   MOTORE DEI VERBI — coniugazioni attive regolari + essere/avere
   ============================================================ */
const PRONOUNS = ['io', 'tu', 'lui/lei', 'noi', 'voi', 'loro'];
const PERSON_LABEL = ['1ª persona singolare', '2ª persona singolare', '3ª persona singolare',
                      '1ª persona plurale', '2ª persona plurale', '3ª persona plurale'];
const PERSON_SHORT = ['1ª sing.', '2ª sing.', '3ª sing.', '1ª plur.', '2ª plur.', '3ª plur.'];

const TEMPI = [
  { key: 'ind_presente',            modo: 'Indicativo',   tempo: 'Presente',            finite: true },
  { key: 'ind_imperfetto',          modo: 'Indicativo',   tempo: 'Imperfetto',          finite: true },
  { key: 'ind_passato_prossimo',    modo: 'Indicativo',   tempo: 'Passato prossimo',    finite: true, compound: 'ind_presente' },
  { key: 'ind_passato_remoto',      modo: 'Indicativo',   tempo: 'Passato remoto',      finite: true },
  { key: 'ind_trapassato_prossimo', modo: 'Indicativo',   tempo: 'Trapassato prossimo', finite: true, compound: 'ind_imperfetto' },
  { key: 'ind_trapassato_remoto',   modo: 'Indicativo',   tempo: 'Trapassato remoto',   finite: true, compound: 'ind_passato_remoto' },
  { key: 'ind_futuro',              modo: 'Indicativo',   tempo: 'Futuro semplice',     finite: true },
  { key: 'ind_futuro_anteriore',    modo: 'Indicativo',   tempo: 'Futuro anteriore',    finite: true, compound: 'ind_futuro' },
  { key: 'cong_presente',           modo: 'Congiuntivo',  tempo: 'Presente',            finite: true },
  { key: 'cong_passato',            modo: 'Congiuntivo',  tempo: 'Passato',             finite: true, compound: 'cong_presente' },
  { key: 'cong_imperfetto',         modo: 'Congiuntivo',  tempo: 'Imperfetto',          finite: true },
  { key: 'cong_trapassato',         modo: 'Congiuntivo',  tempo: 'Trapassato',          finite: true, compound: 'cong_imperfetto' },
  { key: 'cond_presente',           modo: 'Condizionale', tempo: 'Presente',            finite: true },
  { key: 'cond_passato',            modo: 'Condizionale', tempo: 'Passato',             finite: true, compound: 'cond_presente' },
  { key: 'imp_presente',            modo: 'Imperativo',   tempo: 'Presente',            finite: true },
  { key: 'inf_presente',            modo: 'Infinito',     tempo: 'Presente' },
  { key: 'inf_passato',             modo: 'Infinito',     tempo: 'Passato' },
  { key: 'part_presente',           modo: 'Participio',   tempo: 'Presente' },
  { key: 'part_passato',            modo: 'Participio',   tempo: 'Passato' },
  { key: 'ger_presente',            modo: 'Gerundio',     tempo: 'Presente' },
  { key: 'ger_passato',             modo: 'Gerundio',     tempo: 'Passato' },
];
const TEMPO_BY_KEY = Object.fromEntries(TEMPI.map(t => [t.key, t]));
const MODI = ['Indicativo', 'Congiuntivo', 'Condizionale', 'Imperativo', 'Infinito', 'Participio', 'Gerundio'];

const VERBS = [
  { inf: 'mangiare', cls: 'are', aux: 'avere' },
  { inf: 'giocare',  cls: 'are', aux: 'avere' },
  { inf: 'parlare',  cls: 'are', aux: 'avere' },
  { inf: 'cantare',  cls: 'are', aux: 'avere' },
  { inf: 'studiare', cls: 'are', aux: 'avere' },
  { inf: 'pagare',   cls: 'are', aux: 'avere' },
  { inf: 'lavare',   cls: 'are', aux: 'avere' },
  { inf: 'arrivare', cls: 'are', aux: 'essere' },
  { inf: 'entrare',  cls: 'are', aux: 'essere' },
  { inf: 'tornare',  cls: 'are', aux: 'essere' },
  { inf: 'credere',  cls: 'ere', aux: 'avere' },
  { inf: 'vendere',  cls: 'ere', aux: 'avere' },
  { inf: 'ripetere', cls: 'ere', aux: 'avere' },
  { inf: 'temere',   cls: 'ere', aux: 'avere' },
  { inf: 'battere',  cls: 'ere', aux: 'avere' },
  { inf: 'dormire',  cls: 'ire', aux: 'avere' },
  { inf: 'sentire',  cls: 'ire', aux: 'avere' },
  { inf: 'seguire',  cls: 'ire', aux: 'avere' },
  { inf: 'partire',  cls: 'ire', aux: 'essere' },
  { inf: 'finire',   cls: 'ire_isc', aux: 'avere' },
  { inf: 'capire',   cls: 'ire_isc', aux: 'avere' },
  { inf: 'pulire',   cls: 'ire_isc', aux: 'avere' },
  { inf: 'spedire',  cls: 'ire_isc', aux: 'avere' },
  { inf: 'essere',   cls: 'essere', aux: 'essere' },
  { inf: 'avere',    cls: 'avere',  aux: 'avere' },
];

const IRR = {
  essere: {
    ind_presente: ['sono', 'sei', 'è', 'siamo', 'siete', 'sono'],
    ind_imperfetto: ['ero', 'eri', 'era', 'eravamo', 'eravate', 'erano'],
    ind_passato_remoto: ['fui', 'fosti', 'fu', 'fummo', 'foste', 'furono'],
    ind_futuro: ['sarò', 'sarai', 'sarà', 'saremo', 'sarete', 'saranno'],
    cong_presente: ['sia', 'sia', 'sia', 'siamo', 'siate', 'siano'],
    cong_imperfetto: ['fossi', 'fossi', 'fosse', 'fossimo', 'foste', 'fossero'],
    cond_presente: ['sarei', 'saresti', 'sarebbe', 'saremmo', 'sareste', 'sarebbero'],
    imp_presente: [null, 'sii', null, 'siamo', 'siate', null],
    part_presente: null,
    part_passato: 'stato',
    ger_presente: 'essendo',
    inf_presente: 'essere',
  },
  avere: {
    ind_presente: ['ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno'],
    ind_imperfetto: ['avevo', 'avevi', 'aveva', 'avevamo', 'avevate', 'avevano'],
    ind_passato_remoto: ['ebbi', 'avesti', 'ebbe', 'avemmo', 'aveste', 'ebbero'],
    ind_futuro: ['avrò', 'avrai', 'avrà', 'avremo', 'avrete', 'avranno'],
    cong_presente: ['abbia', 'abbia', 'abbia', 'abbiamo', 'abbiate', 'abbiano'],
    cong_imperfetto: ['avessi', 'avessi', 'avesse', 'avessimo', 'aveste', 'avessero'],
    cond_presente: ['avrei', 'avresti', 'avrebbe', 'avremmo', 'avreste', 'avrebbero'],
    imp_presente: [null, 'abbi', null, 'abbiamo', 'abbiate', null],
    part_presente: 'avente',
    part_passato: 'avuto',
    ger_presente: 'avendo',
    inf_presente: 'avere',
  },
};

/* attacca la desinenza a una radice in -are rispettando l'ortografia:
   gioc+i → giochi · mangi+iamo → mangiamo · studi+i → studi */
function joinAre(root, ending) {
  if (/[cg]$/.test(root) && /^[ei]/.test(ending)) return root + 'h' + ending;
  if (/i$/.test(root) && /^i/.test(ending)) return root.slice(0, -1) + ending;
  return root + ending;
}

function futStem(verb) {
  const root = verb.inf.slice(0, -3);
  if (verb.cls === 'are') {
    if (/[cg]$/.test(root)) return root + 'her';
    if (/[cg]i$/.test(root)) return root.slice(0, -1) + 'er';
    return root + 'er';
  }
  if (verb.cls === 'ere') return root + 'er';
  return root + 'ir'; // ire, ire_isc
}

const FUT_END = ['ò', 'ai', 'à', 'emo', 'ete', 'anno'];
const COND_END = ['ei', 'esti', 'ebbe', 'emmo', 'este', 'ebbero'];

const ENDINGS = {
  are: {
    ind_presente: ['o', 'i', 'a', 'iamo', 'ate', 'ano'],
    ind_imperfetto: ['avo', 'avi', 'ava', 'avamo', 'avate', 'avano'],
    ind_passato_remoto: ['ai', 'asti', 'ò', 'ammo', 'aste', 'arono'],
    cong_presente: ['i', 'i', 'i', 'iamo', 'iate', 'ino'],
    cong_imperfetto: ['assi', 'assi', 'asse', 'assimo', 'aste', 'assero'],
    imp_presente: [null, 'a', null, 'iamo', 'ate', null],
    part_presente: 'ante', part_passato: 'ato', ger_presente: 'ando',
  },
  ere: {
    ind_presente: ['o', 'i', 'e', 'iamo', 'ete', 'ono'],
    ind_imperfetto: ['evo', 'evi', 'eva', 'evamo', 'evate', 'evano'],
    ind_passato_remoto: [['etti', 'ei'], ['esti'], ['ette', 'è'], ['emmo'], ['este'], ['ettero', 'erono']],
    cong_presente: ['a', 'a', 'a', 'iamo', 'iate', 'ano'],
    cong_imperfetto: ['essi', 'essi', 'esse', 'essimo', 'este', 'essero'],
    imp_presente: [null, 'i', null, 'iamo', 'ete', null],
    part_presente: 'ente', part_passato: 'uto', ger_presente: 'endo',
  },
  ire: {
    ind_presente: ['o', 'i', 'e', 'iamo', 'ite', 'ono'],
    ind_imperfetto: ['ivo', 'ivi', 'iva', 'ivamo', 'ivate', 'ivano'],
    ind_passato_remoto: ['ii', 'isti', 'ì', 'immo', 'iste', 'irono'],
    cong_presente: ['a', 'a', 'a', 'iamo', 'iate', 'ano'],
    cong_imperfetto: ['issi', 'issi', 'isse', 'issimo', 'iste', 'issero'],
    imp_presente: [null, 'i', null, 'iamo', 'ite', null],
    part_presente: null, part_passato: 'ito', ger_presente: 'endo',
  },
  ire_isc: {
    ind_presente: ['isco', 'isci', 'isce', 'iamo', 'ite', 'iscono'],
    ind_imperfetto: ['ivo', 'ivi', 'iva', 'ivamo', 'ivate', 'ivano'],
    ind_passato_remoto: ['ii', 'isti', 'ì', 'immo', 'iste', 'irono'],
    cong_presente: ['isca', 'isca', 'isca', 'iamo', 'iate', 'iscano'],
    cong_imperfetto: ['issi', 'issi', 'isse', 'issimo', 'iste', 'issero'],
    imp_presente: [null, 'isci', null, 'iamo', 'ite', null],
    part_presente: null, part_passato: 'ito', ger_presente: 'endo',
  },
};

const toArr = (v) => v == null ? null : Array.isArray(v) ? v : [v];

/* forme semplici: array di 6 slot (ognuno array di varianti accettate) o
   { single: [...] } per le forme non finite; null se il tempo non esiste per quel verbo */
function simpleForms(verb, key) {
  const tempo = TEMPO_BY_KEY[key];
  const irr = IRR[verb.cls];

  if (key === 'inf_presente') return { single: [verb.inf] };
  if (key === 'ind_futuro') {
    if (irr) return irr.ind_futuro.map(toArr);
    return FUT_END.map(e => [futStem(verb) + e]);
  }
  if (key === 'cond_presente') {
    if (irr) return irr.cond_presente.map(toArr);
    return COND_END.map(e => [futStem(verb) + e]);
  }

  if (irr) {
    const v = irr[key];
    if (v == null) return null;
    if (tempo.finite) return v.map(toArr);
    return { single: toArr(v) };
  }

  const table = ENDINGS[verb.cls];
  const root = verb.inf.slice(0, -3);
  const join = verb.cls === 'are' ? (e) => joinAre(root, e) : (e) => root + e;
  const v = table[key];
  if (v == null) return null;
  if (tempo.finite) {
    return v.map(slot => slot == null ? null : toArr(slot).map(join));
  }
  return { single: toArr(v).map(join) };
}

/* participio passato accordato: singolare → -o/-a, plurale → -i/-e */
function agreePP(pp, personIdx) {
  const base = pp.slice(0, -1);
  return personIdx <= 2 ? [base + 'o', base + 'a'] : [base + 'i', base + 'e'];
}

/* tutte le forme (semplici e composte) per verbo+tempo.
   Ritorna { finite, slots } o { finite:false, single } — array di varianti accettate. */
function verbForms(verb, key) {
  const tempo = TEMPO_BY_KEY[key];
  const auxVerb = VERBS.find(v => v.inf === verb.aux);
  const pp = simpleForms(verb, 'part_passato').single[0];
  const ppFor = (i) => verb.aux === 'essere' ? agreePP(pp, i) : [pp];

  if (tempo.compound) {
    const auxSlots = simpleForms(auxVerb, tempo.compound);
    if (!auxSlots) return null;
    return {
      finite: true,
      slots: auxSlots.map((slot, i) => slot == null ? null :
        slot.flatMap(a => ppFor(i).map(p => a + ' ' + p))),
    };
  }
  if (key === 'inf_passato') {
    return { finite: false, single: (verb.aux === 'essere' ? ['essere'] : ['avere']).flatMap(a => (verb.aux === 'essere' ? [pp.slice(0, -1) + 'o', pp.slice(0, -1) + 'a', pp.slice(0, -1) + 'i', pp.slice(0, -1) + 'e'] : [pp]).map(p => a + ' ' + p)) };
  }
  if (key === 'ger_passato') {
    const aux = verb.aux === 'essere' ? 'essendo' : 'avendo';
    return { finite: false, single: (verb.aux === 'essere' ? [pp.slice(0, -1) + 'o', pp.slice(0, -1) + 'a', pp.slice(0, -1) + 'i', pp.slice(0, -1) + 'e'] : [pp]).map(p => aux + ' ' + p) };
  }
  const s = simpleForms(verb, key);
  if (s == null) return null;
  if (tempo.finite) return { finite: true, slots: s };
  return { finite: false, single: s.single };
}

/* normalizza la risposta scritta: minuscole, spazi, e' → è, é ≡ è */
function normVerb(s) {
  return s.toLowerCase().trim().replace(/\s+/g, ' ')
    .replace(/([aeiou])['’`]/g, (m, v) => ({ a: 'à', e: 'è', i: 'ì', o: 'ò', u: 'ù' }[v]))
    .replace(/é/g, 'è');
}
const matchForm = (input, accepted) => accepted.some(a => normVerb(a) === normVerb(input));

/* tutte le combinazioni (tempo, persona) che generano esattamente questa forma */
function acceptedCombos(verb, form) {
  const combos = [];
  for (const t of TEMPI) {
    const F = verbForms(verb, t.key);
    if (!F) continue;
    if (F.finite) {
      F.slots.forEach((slot, i) => {
        if (slot && matchForm(form, slot)) combos.push({ key: t.key, persona: i });
      });
    } else if (matchForm(form, F.single)) {
      combos.push({ key: t.key, persona: -1 });
    }
  }
  return combos;
}

/* gruppi di tempi: turni del Mondiale dei Verbi e scelte dell'amichevole */
const VERB_GROUPS = [
  { name: 'Indicativo presente', keys: ['ind_presente'] },
  { name: 'Imperfetto', keys: ['ind_imperfetto'] },
  { name: 'Futuro semplice', keys: ['ind_futuro'] },
  { name: 'Passato prossimo', keys: ['ind_passato_prossimo'] },
  { name: 'Passato remoto', keys: ['ind_passato_remoto'] },
  { name: 'Tempi composti avanzati', keys: ['ind_trapassato_prossimo', 'ind_trapassato_remoto', 'ind_futuro_anteriore'] },
  { name: 'Congiuntivo', keys: ['cong_presente', 'cong_passato', 'cong_imperfetto', 'cong_trapassato'] },
  { name: 'Condizionale e imperativo', keys: ['cond_presente', 'cond_passato', 'imp_presente'] },
  { name: 'Forme non finite + tutto', keys: ['inf_presente', 'inf_passato', 'part_presente', 'part_passato', 'ger_presente', 'ger_passato'] },
];

/* ---------------- stato e salvataggio ---------------- */
const SAVE_KEY = 'calciomat_save_v1';

function freshCareer() { return { unlocked: 1, beaten: [false, false, false, false, false, false, false, false, false, false] }; }

function freshState() {
  const tabFacts = {};
  for (let t = 2; t <= 10; t++) for (let n = 1; n <= 10; n++) tabFacts[`${t}x${n}`] = 0;
  const verbFacts = {};
  TEMPI.forEach(t => { verbFacts[t.key] = 0; });
  return {
    v: 2, name: '', sound: true,
    stats: { goals: 0, matches: 0, wins: 0, correct: 0, wrong: 0 },
    games: {
      tab: { career: freshCareer(), facts: tabFacts },
      verb: { career: freshCareer(), facts: verbFacts },
    },
    sel: { tab: [2, 3, 4, 5, 6, 7, 8, 9, 10], verb: ['Indicativo'] },
  };
}
let state = freshState();

function saveLocal() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* spazio pieno o privacy mode */ }
}
function loadLocal() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (s && s.v === 2 && s.games) {
      state = Object.assign(freshState(), s);
      // la selezione dei verbi ora è per modo: sistema i salvataggi vecchi (indici numerici)
      if (!Array.isArray(state.sel.verb) || state.sel.verb.some(v => typeof v !== 'string')) {
        state.sel.verb = ['Indicativo'];
      }
      return true;
    }
    if (s && s.v === 1 && s.facts && s.career) {
      // migrazione dal vecchio salvataggio (solo tabelline)
      const f = freshState();
      f.name = s.name; f.sound = s.sound; f.stats = Object.assign(f.stats, s.stats);
      f.games.tab.career = Object.assign(freshCareer(), s.career);
      f.games.tab.facts = Object.assign(f.games.tab.facts, s.facts);
      state = f;
      saveLocal();
      return true;
    }
  } catch (e) { /* ignora */ }
  return false;
}

/* ---------------- codice di salvataggio (base32 + checksum) ---------------- */
const B32 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

class BitWriter {
  constructor() { this.bits = []; }
  w(val, n) { for (let i = n - 1; i >= 0; i--) this.bits.push((val >> i) & 1); }
  toB32() {
    while (this.bits.length % 5) this.bits.push(0);
    let out = '';
    for (let i = 0; i < this.bits.length; i += 5) {
      let v = 0;
      for (let j = 0; j < 5; j++) v = (v << 1) | this.bits[i + j];
      out += B32[v];
    }
    return out;
  }
}
class BitReader {
  constructor(str) {
    this.bits = [];
    for (const ch of str) {
      const v = B32.indexOf(ch);
      if (v < 0) throw new Error('char');
      for (let j = 4; j >= 0; j--) this.bits.push((v >> j) & 1);
    }
    this.pos = 0;
  }
  r(n) {
    let v = 0;
    for (let i = 0; i < n; i++) v = (v << 1) | (this.bits[this.pos++] || 0);
    return v;
  }
}

function checksum(body) {
  let sum = 0;
  for (const ch of body) sum = (sum + B32.indexOf(ch) * 7 + 3) % 1024;
  return B32[sum >> 5] + B32[sum & 31];
}

function encodeCode() {
  const w = new BitWriter();
  w.w(2, 4); // versione
  const name = state.name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 12);
  w.w(name.length, 4);
  for (const ch of name) w.w(ch.charCodeAt(0) - 65, 5);
  w.w(Math.min(state.stats.goals, 4095), 12);
  w.w(Math.min(state.stats.matches, 1023), 10);
  w.w(Math.min(state.stats.wins, 1023), 10);
  w.w(Math.min(state.stats.correct, 16383), 14);
  w.w(Math.min(state.stats.wrong, 16383), 14);
  for (const g of ['tab', 'verb']) {
    w.w(state.games[g].career.unlocked, 4);
    for (let i = 0; i < 10; i++) w.w(state.games[g].career.beaten[i] ? 1 : 0, 1);
  }
  for (let t = 2; t <= 10; t++) for (let n = 1; n <= 10; n++) w.w(state.games.tab.facts[`${t}x${n}`] & 7, 3);
  TEMPI.forEach(t => w.w(state.games.verb.facts[t.key] & 7, 3));
  let body = w.toB32();
  body += checksum(body);
  return 'CM1' + body.replace(/(.{4})/g, '-$1');
}

function decodeCode(str) {
  const clean = str.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean.startsWith('CM1')) return null;
  const body = clean.slice(3);
  if (body.length < 10) return null;
  const data = body.slice(0, -2);
  if (checksum(data) !== body.slice(-2)) return null;
  try {
    const r = new BitReader(data);
    const ver = r.r(4);
    const s = freshState();
    if (ver === 1) {
      // vecchi codici: solo tabelline
      s.games.tab.career.unlocked = Math.min(Math.max(r.r(4), 1), 9);
      for (let i = 0; i < 10; i++) s.games.tab.career.beaten[i] = !!r.r(1);
      s.stats.goals = r.r(12); s.stats.matches = r.r(10); s.stats.wins = r.r(10);
      s.stats.correct = r.r(14); s.stats.wrong = r.r(14);
      const len = r.r(4);
      let name = '';
      for (let i = 0; i < len; i++) name += String.fromCharCode(65 + r.r(5));
      s.name = name ? name.charAt(0) + name.slice(1).toLowerCase() : '';
      for (let t = 2; t <= 10; t++) for (let n = 1; n <= 10; n++) s.games.tab.facts[`${t}x${n}`] = Math.min(r.r(3), 5);
      return s;
    }
    if (ver !== 2) return null;
    const len = r.r(4);
    let name = '';
    for (let i = 0; i < len; i++) name += String.fromCharCode(65 + r.r(5));
    s.name = name ? name.charAt(0) + name.slice(1).toLowerCase() : '';
    s.stats.goals = r.r(12); s.stats.matches = r.r(10); s.stats.wins = r.r(10);
    s.stats.correct = r.r(14); s.stats.wrong = r.r(14);
    for (const g of ['tab', 'verb']) {
      s.games[g].career.unlocked = Math.min(Math.max(r.r(4), 1), 9);
      for (let i = 0; i < 10; i++) s.games[g].career.beaten[i] = !!r.r(1);
    }
    for (let t = 2; t <= 10; t++) for (let n = 1; n <= 10; n++) s.games.tab.facts[`${t}x${n}`] = Math.min(r.r(3), 5);
    TEMPI.forEach(t => { s.games.verb.facts[t.key] = Math.min(r.r(3), 5); });
    return s;
  } catch (e) { return null; }
}

/* ---------------- domande TABELLINE ---------------- */
let lastFactKey = '';

function weightedPick(pool) {
  const total = pool.reduce((s, p) => s + p.weight, 0);
  let roll = Math.random() * total;
  for (const p of pool) { roll -= p.weight; if (roll <= 0) return p; }
  return pool[0];
}

function pickTabQuestion(focusTables, reviewTables) {
  const useReview = reviewTables.length && Math.random() < 0.3;
  const tables = useReview ? reviewTables : focusTables;
  const pool = [];
  for (const t of tables) {
    for (let n = 1; n <= 10; n++) {
      const key = `${t}x${n}`;
      if (key === lastFactKey) continue;
      const lvl = state.games.tab.facts[key];
      pool.push({ t, n, key, weight: Math.pow(6 - lvl, 2) }); // sbagli spesso → esce più spesso
    }
  }
  const pick = weightedPick(pool);
  lastFactKey = pick.key;
  const flip = Math.random() < 0.5;
  return { a: flip ? pick.n : pick.t, b: flip ? pick.t : pick.n, answer: pick.t * pick.n, key: pick.key };
}

/* ---------------- domande VERBI ---------------- */
function verbHasTempo(verb, key) {
  return verbForms(verb, key) != null;
}

function pickVerbQuestion(focusKeys, reviewKeys) {
  const useReview = reviewKeys.length && Math.random() < 0.25;
  const keys = useReview ? reviewKeys : focusKeys;
  const pool = keys.map(k => ({ key: k, weight: Math.pow(6 - state.games.verb.facts[k], 2) }));
  const tempoKey = weightedPick(pool).key;
  const tempo = TEMPO_BY_KEY[tempoKey];
  let verb;
  do { verb = VERBS[Math.floor(Math.random() * VERBS.length)]; } while (!verbHasTempo(verb, tempoKey));
  const F = verbForms(verb, tempoKey);
  let persona = -1;
  if (F.finite) {
    const valid = F.slots.map((s, i) => s ? i : -1).filter(i => i >= 0);
    persona = valid[Math.floor(Math.random() * valid.length)];
  }
  let type = Math.random() < 0.5 ? 'A' : 'B';
  if (tempoKey === 'inf_presente') type = 'B'; // "scrivi l'infinito di mangiare" sarebbe troppo facile
  const accepted = F.finite ? F.slots[persona] : F.single;
  return { type, verb, tempoKey, tempo, persona, accepted, display: accepted[0] };
}

/* aggiorna la memoria di gioco (ripetizione intelligente) */
function updateFact(game, key, correct, fast) {
  const facts = state.games[game].facts;
  const lvl = facts[key] ?? 0;
  if (correct) facts[key] = Math.min(5, lvl + (fast ? 2 : 1));
  else facts[key] = Math.max(0, lvl - 2);
  if (correct) state.stats.correct++; else state.stats.wrong++;
  saveLocal();
}

function tableStars(t) {
  let sum = 0;
  for (let n = 1; n <= 10; n++) sum += state.games.tab.facts[`${t}x${n}`];
  return starsFromAvg(sum / 10);
}
function groupStars(gi) {
  const keys = VERB_GROUPS[gi].keys;
  const sum = keys.reduce((s, k) => s + state.games.verb.facts[k], 0);
  return starsFromAvg(sum / keys.length);
}
const starsFromAvg = (avg) => avg >= 4.5 ? 3 : avg >= 3 ? 2 : avg >= 1.5 ? 1 : 0;
const starStr = (s) => '⭐'.repeat(s) + '☆'.repeat(3 - s);
const roundSubject = (game, i) => game === 'tab' ? `Tabellina del ${TEAMS[i].table}` : VERB_GROUPS[i].name;

/* ---------------- utilità UI ---------------- */
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const SVGNS = 'http://www.w3.org/2000/svg';

function el(tag, attrs, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $('screen-' + id).classList.add('active');
}

function cameraCut() {
  const f = $('flash');
  f.classList.remove('hidden');
  f.style.animation = 'none';
  void f.offsetWidth;
  f.style.animation = '';
  setTimeout(() => f.classList.add('hidden'), 300);
}

let toastTimer = null;
function toast(msg, ms = 2200) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), ms);
}

function modal({ title, text, input = false, okText = 'OK', cancel = true, placeholder = '' }) {
  return new Promise(resolve => {
    const m = $('modal'), inp = $('modal-input');
    $('modal-title').textContent = title;
    $('modal-text').textContent = text;
    inp.classList.toggle('hidden', !input);
    inp.value = ''; inp.placeholder = placeholder;
    $('modal-ok').textContent = okText;
    $('modal-cancel').style.display = cancel ? '' : 'none';
    m.classList.remove('hidden');
    if (input) setTimeout(() => inp.focus(), 100);
    const done = (val) => {
      m.classList.add('hidden');
      $('modal-ok').onclick = $('modal-cancel').onclick = inp.onkeydown = null;
      resolve(val);
    };
    $('modal-ok').onclick = () => done(input ? inp.value.trim() : true);
    $('modal-cancel').onclick = () => done(null);
    inp.onkeydown = (e) => { if (e.key === 'Enter') done(inp.value.trim()); };
  });
}

/* disegna un omino stile cartoon (vista di fronte) */
function drawPlayer(parent, x, y, jersey, scale = 1, skin = '#ffd9b0') {
  const g = el('g', { transform: `translate(${x},${y}) scale(${scale})` }, parent);
  el('ellipse', { cx: 0, cy: 46, rx: 20, ry: 6, fill: '#000', opacity: 0.2 }, g);
  el('rect', { x: -16, y: 30, width: 12, height: 16, rx: 5, fill: '#12233d' }, g);
  el('rect', { x: 4, y: 30, width: 12, height: 16, rx: 5, fill: '#12233d' }, g);
  el('rect', { x: -14, y: 2, width: 28, height: 32, rx: 9, fill: jersey }, g);
  el('rect', { x: -22, y: 4, width: 9, height: 20, rx: 4.5, fill: jersey }, g);
  el('rect', { x: 13, y: 4, width: 9, height: 20, rx: 4.5, fill: jersey }, g);
  el('circle', { cx: 0, cy: -8, r: 11, fill: skin }, g);
  el('path', { d: 'M -11 -11 A 11 11 0 0 1 11 -11 L 11 -14 A 11 11 0 0 0 -11 -14 Z', fill: '#4a2d12' }, g);
  return g;
}

/* ---------------- menu gioco e amichevole ---------------- */
let currentGame = 'tab'; // 'tab' | 'verb'

const GAME_META = {
  tab:  { title: '✖️ Tabelline', career: '🏆 Mondiale delle Tabelline', selHint: 'Quali tabelline vuoi allenare?' },
  verb: { title: '📖 Verbi', career: '🏆 Mondiale dei Verbi', selHint: 'Quali modi vuoi allenare?' },
};

function openGameMenu(game) {
  currentGame = game;
  $('gm-title').textContent = GAME_META[game].title;
  renderSelection();
  show('gamemenu');
}

/* i chip di selezione (quali tabelline / quali tempi) — sempre visibili nel menu del gioco */
function renderSelection() {
  $('friendly-hint').textContent = GAME_META[currentGame].selHint;
  const box = $('sel-chips');
  box.innerHTML = '';
  const items = currentGame === 'tab'
    ? [2, 3, 4, 5, 6, 7, 8, 9, 10].map(t => ({ id: t, label: `Tabellina del ${t}` }))
    : MODI.map(m => ({ id: m, label: m }));
  items.forEach(item => {
    const c = document.createElement('button');
    c.className = 'chip' + (state.sel[currentGame].includes(item.id) ? ' sel' : '');
    c.textContent = item.label;
    c.addEventListener('click', () => {
      Sfx.click();
      const sel = state.sel[currentGame];
      const i = sel.indexOf(item.id);
      if (i >= 0) { if (sel.length > 1) sel.splice(i, 1); } // almeno una selezionata
      else sel.push(item.id);
      saveLocal();
      c.classList.toggle('sel', sel.includes(item.id));
    });
    box.appendChild(c);
  });
}

/* ---------------- Mondiale (schermata torneo) ---------------- */
function renderCareer() {
  const game = currentGame;
  const career = state.games[game].career;
  $('career-title').textContent = GAME_META[game].career;
  const road = $('cup-road');
  road.innerHTML = '';
  ROUNDS.forEach((r, i) => {
    const s = document.createElement('span');
    s.className = 'step' + (career.beaten[i] ? ' done' : i === career.unlocked - 1 ? ' now' : '');
    s.textContent = r.icon;
    road.appendChild(s);
  });

  const list = $('team-list');
  list.innerHTML = '';
  TEAMS.forEach((team, i) => {
    if (i === 0 || i === 4) {
      const h = document.createElement('div');
      h.className = 'round-header';
      h.textContent = i === 0 ? '🌍 Fase a gironi' : '⚔️ Fase a eliminazione diretta';
      list.appendChild(h);
    }
    const unlocked = i < career.unlocked;
    const beaten = career.beaten[i];
    const stars = game === 'tab' ? tableStars(team.table) : groupStars(i);
    const card = document.createElement('div');
    card.className = 'team-card' + (unlocked ? '' : ' locked') + (beaten ? ' beaten' : '') + (i === 8 ? ' final' : '');
    card.innerHTML = `
      <div class="team-crest" style="background:${team.color}33;border-color:${team.color}">${team.crest}</div>
      <div class="team-info">
        <div class="team-name">${team.name}</div>
        <div class="team-sub">${ROUNDS[i].label} · ${roundSubject(game, i)}</div>
        <div class="team-stars">${starStr(stars)}</div>
      </div>
      <div class="team-state">${unlocked ? (beaten ? '✅' : '▶️') : '🔒'}</div>`;
    if (unlocked) card.addEventListener('click', () => { Sfx.click(); startMatch(game, i); });
    list.appendChild(card);
  });
}

/* ---------------- trofei ---------------- */
function renderTrophies() {
  const acc = state.stats.correct + state.stats.wrong;
  const pct = acc ? Math.round(state.stats.correct * 100 / acc) : 0;
  const trophies = state.games.tab.career.beaten.filter(Boolean).length + state.games.verb.career.beaten.filter(Boolean).length;
  $('stats-box').innerHTML = `
    <div><div class="stat-num">${state.stats.matches}</div><div class="stat-label">Partite</div></div>
    <div><div class="stat-num">${state.stats.wins}</div><div class="stat-label">Vittorie</div></div>
    <div><div class="stat-num">${state.stats.goals}</div><div class="stat-label">Gol fatti</div></div>
    <div><div class="stat-num">${state.stats.correct}</div><div class="stat-label">Risposte giuste</div></div>
    <div><div class="stat-num">${pct}%</div><div class="stat-label">Precisione</div></div>
    <div><div class="stat-num">${trophies}</div><div class="stat-label">Trofei</div></div>`;
  const list = $('trophy-list');
  list.innerHTML = '';
  [['tab', '✖️ Mondiale delle Tabelline'], ['verb', '📖 Mondiale dei Verbi']].forEach(([game, title]) => {
    const h = document.createElement('div');
    h.className = 'round-header';
    h.textContent = title;
    list.appendChild(h);
    TEAMS.forEach((team, i) => {
      const beaten = state.games[game].career.beaten[i];
      const stars = game === 'tab' ? tableStars(team.table) : groupStars(i);
      const row = document.createElement('div');
      row.className = 'trophy-row' + (beaten ? '' : ' locked');
      const label = i === 8 ? `🏆 Coppa del ${game === 'tab' ? 'Mondiale delle Tabelline' : 'Mondiale dei Verbi'}` : ROUNDS[i].label;
      const sub = (beaten ? `Hai battuto ${team.name}!` : `Batti ${team.name}`) + ` · ${roundSubject(game, i)} ${starStr(stars)}`;
      row.innerHTML = `
        <div class="trophy-icon">${beaten ? (i === 8 ? '🏆' : '🏅') : '🔒'}</div>
        <div class="trophy-info"><div class="trophy-name">${label}</div><div class="trophy-sub">${sub}</div></div>`;
      list.appendChild(row);
    });
  });
  const reset = document.createElement('button');
  reset.className = 'btn btn-dark';
  reset.style.marginTop = '10px';
  reset.textContent = '🔄 Ricomincia da zero';
  reset.addEventListener('click', async () => {
    const ok = await modal({ title: 'Sicuro?', text: 'Cancelli tutti i progressi e i trofei di TUTTI i giochi. Non si può annullare!', okText: 'Sì, ricomincia' });
    if (ok) {
      state = freshState();
      saveLocal();
      toast('Tutto azzerato: si riparte!');
      show('home');
    }
  });
  list.appendChild(reset);
}

/* ---------------- campo (vista dall'alto) ---------------- */
const ZONE_X = [42, 111, 180, 249, 318];

function initField() {
  const stripes = $('pitch-stripes');
  for (let i = 0; i < 6; i++) {
    el('rect', { x: i * 60, y: 0, width: 30, height: 200, fill: '#27924a', opacity: 0.5 }, stripes);
  }
  const players = $('field-players');
  const spots = [
    { x: 30, y: 100, you: true }, { x: 85, y: 50, you: true }, { x: 85, y: 150, you: true },
    { x: 150, y: 80, you: true }, { x: 150, y: 125, you: true },
    { x: 330, y: 100 }, { x: 275, y: 55 }, { x: 275, y: 145 },
    { x: 215, y: 75 }, { x: 215, y: 130 },
  ];
  spots.forEach(s => {
    const g = el('g', { transform: `translate(${s.x},${s.y})` }, players);
    el('ellipse', { cx: 0, cy: 6, rx: 8, ry: 3, fill: '#000', opacity: 0.25 }, g);
    el('circle', { cx: 0, cy: 0, r: 7.5, fill: s.you ? '#2d7dd2' : '#e74c3c', stroke: '#fff', 'stroke-width': 2 }, g);
    el('circle', { cx: 0, cy: -2.5, r: 3, fill: '#ffd9b0' }, g);
  });
}

function setBall(zone, sound = true) {
  const y = 100 + (zone === 2 ? 0 : (zone % 2 ? -14 : 14));
  $('ball-marker').style.transform = `translate(${ZONE_X[zone]}px, ${y}px)`;
  if (sound) Sfx.kick();
}

function setPossession(who) {
  const tag = $('possession-tag');
  tag.className = 'possession-tag ' + who;
  tag.textContent = who === 'you' ? 'PALLA A TE!' : 'PALLA A LORO!';
  $('ball-glow').setAttribute('fill', who === 'you' ? '#ffe95c' : '#ff8f82');
}

/* ---------------- partita ---------------- */
const match = {
  active: false, game: 'tab', teamIdx: 0, friendly: false,
  focus: [], review: [], timer: 15000, oppGoalChance: 0.55,
  score: [0, 0], minute: 0, zone: 2, poss: 'you', quit: false,
  errors: [], reviewing: false,
};

/* carta soluzione: resta finché il giocatore non conferma di aver capito */
function showSolution(html) {
  return new Promise(resolve => {
    $('solution-text').innerHTML = html;
    const card = $('solution-card');
    card.classList.remove('hidden');
    Sfx.ohh();
    $('solution-ok').onclick = () => {
      Sfx.click();
      card.classList.add('hidden');
      $('solution-ok').onclick = null;
      resolve();
    };
  });
}

function rememberError(err) {
  if (match.reviewing) return;
  const id = JSON.stringify(err);
  if (!match.errors.some(e => JSON.stringify(e) === id)) match.errors.push(err);
}

let timerHandle = null;

function startTimer(ms, onTimeout) {
  const wrap = $('timer-bar-wrap');
  wrap.classList.toggle('hidden', !ms);
  if (!ms) return; // niente timer (gioco dei verbi): tutto il tempo che serve
  const bar = $('timer-bar');
  bar.style.transition = 'none';
  bar.style.transform = 'scaleX(1)';
  void bar.offsetWidth; // reflow: fa ripartire l'animazione
  bar.style.transition = `transform ${ms}ms linear`;
  bar.style.transform = 'scaleX(0)';
  timerHandle = setTimeout(onTimeout, ms);
}
function stopTimer() {
  clearTimeout(timerHandle);
  timerHandle = null;
  const bar = $('timer-bar');
  const w = getComputedStyle(bar).transform;
  bar.style.transition = 'none';
  bar.style.transform = w === 'none' ? 'scaleX(1)' : w; // congela dov'è
}

function setComment(txt) { $('commentary').textContent = txt; }

function updateScoreboard(pens = null) {
  $('sb-score').textContent = pens
    ? `${match.score[0]} - ${match.score[1]}  (${pens[0]}-${pens[1]})`
    : `${match.score[0]} - ${match.score[1]}`;
  $('sb-minute').textContent = `${Math.min(match.minute, 90)}'`;
}

/* ---------------- UI domanda: dispatcher ---------------- */
function showPanel(which) {
  $('qa-tab').classList.toggle('hidden', which !== 'tab');
  $('qa-verb-a').classList.toggle('hidden', which !== 'va');
  $('qa-verb-b').classList.toggle('hidden', which !== 'vb');
}

function askQuestion() {
  return match.game === 'tab' ? askTabQuestion() : askVerbQuestion();
}

/* --- tabelline: tastierino --- */
let keyHandler = null;

function askTabQuestion(preset) {
  return new Promise(resolve => {
    const q = preset || pickTabQuestion(match.focus, match.review);
    const qt = $('question-text');
    qt.classList.remove('q-correct', 'q-wrong', 'q-verb');
    qt.innerHTML = `${q.a} × ${q.b} = <span id="typed" class="typed"></span>`;
    showPanel('tab');
    const typedEl = $('typed');
    let typed = '';
    let settled = false;
    const t0 = performance.now();
    const keys = [...document.querySelectorAll('.key')];
    keys.forEach(k => { k.disabled = false; });

    const finish = (correct, timedOut = false) => {
      if (settled) return;
      settled = true;
      stopTimer();
      document.removeEventListener('keydown', keyHandler);
      keyHandler = null;
      keys.forEach(k => { k.disabled = true; });
      updateFact('tab', q.key, correct, performance.now() - t0 < 4500);
      if (correct) {
        qt.classList.add('q-correct');
        Sfx.correct();
        resolve({ correct, timedOut });
      } else {
        // momento chiave per imparare: soluzione ben chiara, si prosegue solo dopo averla letta
        qt.classList.add('q-wrong');
        qt.innerHTML = `${q.a} × ${q.b} = <span class="typed">${q.answer}</span>`;
        Sfx.wrong();
        rememberError({ game: 'tab', a: q.a, b: q.b, answer: q.answer, key: q.key });
        showSolution(`<b>${q.a} × ${q.b} = ${q.answer}</b>`).then(() => resolve({ correct, timedOut }));
      }
    };

    const press = (k) => {
      if (settled) return;
      if (k === 'del') { typed = typed.slice(0, -1); Sfx.click(); }
      else if (k === 'ok') { if (typed) finish(+typed === q.answer); return; }
      else { if (typed.length >= 3) return; typed += k; Sfx.click(); }
      typedEl.textContent = typed;
    };

    keys.forEach(k => { k.onclick = () => press(k.dataset.k); });
    keyHandler = (e) => {
      if (e.key >= '0' && e.key <= '9') press(e.key);
      else if (e.key === 'Backspace') press('del');
      else if (e.key === 'Enter') press('ok');
    };
    document.addEventListener('keydown', keyHandler);

    startTimer(match.timer, () => finish(false, true));
  });
}

/* --- verbi: due tipi di domanda --- */
function chipRow(container, labels, onPick) {
  container.innerHTML = '';
  const chips = labels.map(lab => {
    const c = document.createElement('button');
    c.className = 'chip';
    c.textContent = lab;
    c.addEventListener('click', () => { Sfx.click(); onPick(lab, c); });
    container.appendChild(c);
    return c;
  });
  return chips;
}
const selectChip = (chips, chosen) => chips.forEach(c => c.classList.toggle('sel', c === chosen));

/* ricostruisce una domanda-verbo identica da un errore salvato */
function rebuildVerbQ(err) {
  const verb = VERBS.find(v => v.inf === err.verbInf);
  const tempo = TEMPO_BY_KEY[err.tempoKey];
  const F = verbForms(verb, err.tempoKey);
  const accepted = F.finite ? F.slots[err.persona] : F.single;
  return { type: err.type, verb, tempoKey: err.tempoKey, tempo, persona: err.persona, accepted, display: accepted[0] };
}

function askVerbQuestion(preset) {
  return new Promise(resolve => {
    const q = preset ? rebuildVerbQ(preset) : pickVerbQuestion(match.focus, match.review);
    const qt = $('question-text');
    qt.classList.remove('q-correct', 'q-wrong');
    qt.classList.add('q-verb');
    let settled = false;
    const t0 = performance.now();
    let cleanupExtra = () => {};

    const finish = (correct, timedOut, solutionHtml, cardHtml) => {
      if (settled) return;
      settled = true;
      stopTimer();
      cleanupExtra();
      updateFact('verb', q.tempoKey, correct, performance.now() - t0 < 9000);
      if (correct) {
        qt.classList.add('q-correct');
        Sfx.correct();
        resolve({ correct, timedOut });
      } else {
        qt.classList.add('q-wrong');
        qt.innerHTML = solutionHtml; // la soluzione, ben visibile
        Sfx.wrong();
        rememberError({ game: 'verb', type: q.type, verbInf: q.verb.inf, tempoKey: q.tempoKey, persona: q.persona });
        showSolution(cardHtml).then(() => resolve({ correct, timedOut }));
      }
    };

    if (q.type === 'A') {
      /* prompt: modo+tempo+persona+verbo → scegli il pronome e scrivi la forma */
      const personaTxt = q.persona >= 0 ? ` · ${PERSON_LABEL[q.persona]}` : '';
      qt.innerHTML = `<div class="q-line1">${q.tempo.modo.toUpperCase()} ${q.tempo.tempo.toUpperCase()}${personaTxt}</div>
                      <div class="q-line2">del verbo <b>${q.verb.inf.toUpperCase()}</b></div>`;
      showPanel('va');
      const input = $('va-input');
      input.value = '';
      input.disabled = false;
      let pronoun = -2; // -2 = non scelto, -1 = non serve
      const needPronoun = q.persona >= 0;

      const pronChips = needPronoun
        ? chipRow($('va-pronouns'), PRONOUNS, (lab, c) => { pronoun = PRONOUNS.indexOf(lab); selectChip(pronChips, c); })
        : ($('va-pronouns').innerHTML = '', []);
      if (!needPronoun) pronoun = -1;

      chipRow($('va-accents'), ['à', 'è', 'ì', 'ò', 'ù'], (lab) => {
        input.value += lab;
        input.focus();
      });

      const solution = `<div class="q-line1">${q.persona >= 0 ? PRONOUNS[q.persona] + ' ' : ''}<b class="typed">${q.display}</b></div>
                        <div class="q-line2">${q.tempo.modo} ${q.tempo.tempo.toLowerCase()} di ${q.verb.inf}</div>`;
      const card = `${q.persona >= 0 ? PRONOUNS[q.persona] + ' ' : ''}<b>${q.display}</b>
                    <small>${q.tempo.modo} ${q.tempo.tempo.toLowerCase()}${q.persona >= 0 ? ' · ' + PERSON_LABEL[q.persona] : ''} del verbo ${q.verb.inf.toUpperCase()}</small>`;
      const submit = () => {
        if (settled) return;
        const txt = input.value;
        if (!txt.trim()) return;
        const okPronoun = !needPronoun || pronoun === q.persona;
        finish(okPronoun && matchForm(txt, q.accepted), false, solution, card);
      };
      $('va-ok').onclick = submit;
      input.onkeydown = (e) => { if (e.key === 'Enter') submit(); };
      cleanupExtra = () => { input.disabled = true; $('va-ok').onclick = null; input.onkeydown = null; };

      startTimer(match.timer, () => finish(false, true, solution, card));
    } else {
      /* prompt: la forma → scegli modo, tempo e persona */
      qt.innerHTML = `<div class="q-line1">«<b class="typed">${q.display}</b>»</div>
                      <div class="q-line2">del verbo <b>${q.verb.inf.toUpperCase()}</b> — che forma è?</div>`;
      showPanel('vb');
      const combos = acceptedCombos(q.verb, q.display);
      let modo = null, tempoKey = null, persona = -2;

      const tempoBox = $('vb-tempo');
      const personaChips = chipRow($('vb-persona'), [...PERSON_SHORT, '—'], (lab, c) => {
        persona = lab === '—' ? -1 : PERSON_SHORT.indexOf(lab);
        selectChip(personaChips, c);
      });
      const renderTempi = () => {
        const tempi = TEMPI.filter(t => t.modo === modo);
        const chips = chipRow(tempoBox, tempi.map(t => t.tempo), (lab, c) => {
          tempoKey = tempi.find(t => t.tempo === lab).key;
          selectChip(chips, c);
        });
      };
      const modoChips = chipRow($('vb-modo'), MODI, (lab, c) => {
        modo = lab; tempoKey = null;
        selectChip(modoChips, c);
        renderTempi();
      });
      tempoBox.innerHTML = '<span class="chip-hint">← scegli prima il modo</span>';

      const best = combos[0];
      const bt = TEMPO_BY_KEY[best.key];
      const solution = `<div class="q-line1"><b class="typed">${bt.modo} ${bt.tempo.toLowerCase()}</b>${best.persona >= 0 ? ' · ' + PERSON_SHORT[best.persona] : ''}</div>
                        <div class="q-line2">«${q.display}» — ${q.verb.inf}</div>`;
      const comboLine = (c) => {
        const t = TEMPO_BY_KEY[c.key];
        return `${t.modo} ${t.tempo.toLowerCase()}${c.persona >= 0 ? ' · ' + PERSON_LABEL[c.persona] : ''}`;
      };
      const card = `«<b>${q.display}</b>»
                    <small>${combos.map(comboLine).join('<br>oppure: ')}<br>del verbo ${q.verb.inf.toUpperCase()}</small>`;
      $('vb-ok').onclick = () => {
        if (settled || !tempoKey || persona === -2) return;
        const ok = combos.some(c => c.key === tempoKey && c.persona === persona);
        finish(ok, false, solution, card);
      };
      cleanupExtra = () => { $('vb-ok').onclick = null; };

      startTimer(match.timer, () => finish(false, true, solution, card));
    }
  });
}

/* card pre-partita / annunci */
async function overlayCard(roundTxt, subTxt, team, ms = 2600) {
  $('oc-round').textContent = roundTxt;
  $('oc-crest-you').textContent = '🦁';
  $('oc-name-you').textContent = `FC ${state.name || 'Campione'}`;
  $('oc-crest-opp').textContent = team.crest;
  $('oc-name-opp').textContent = team.name;
  $('oc-sub').textContent = subTxt;
  const oc = $('overlay-card');
  oc.classList.remove('hidden');
  await sleep(ms);
  oc.classList.add('hidden');
}

/* prepara e gioca una partita (mondiale o amichevole) */
async function startMatch(game, teamIdx, friendly = false) {
  const team = TEAMS[teamIdx];
  const career = state.games[game].career;

  let focus, review;
  if (game === 'tab') {
    if (friendly) { focus = [...state.sel.tab]; review = []; }
    else {
      focus = [team.table];
      review = TEAMS.slice(0, Math.min(career.unlocked, 9)).map(t => t.table).filter(t => t !== team.table);
    }
  } else {
    if (friendly) { focus = TEMPI.filter(t => state.sel.verb.includes(t.modo)).map(t => t.key); review = []; }
    else {
      focus = VERB_GROUPS[teamIdx].keys.slice();
      if (teamIdx === 8) review = VERB_GROUPS.slice(0, 8).flatMap(g => g.keys); // finale: ripasso di tutto
      else review = VERB_GROUPS.slice(0, Math.min(career.unlocked, 9)).flatMap(g => g.keys).filter(k => !focus.includes(k));
    }
  }

  Object.assign(match, {
    active: true, game, teamIdx, friendly, focus, review,
    timer: game === 'verb' ? 0 : (friendly ? FRIENDLY_TIMER_TAB : TIMERS_TAB[teamIdx]),
    oppGoalChance: 0.5 + teamIdx * 0.03,
    score: [0, 0], minute: 0, zone: 2, poss: 'you', quit: false,
    errors: [], reviewing: false,
  });

  $('sb-you-name').textContent = state.name || 'Tu';
  $('sb-opp-name').textContent = team.name;
  $('sb-opp-crest').textContent = team.crest;
  updateScoreboard();
  setPossession('you');
  setBall(2, false);
  setComment('Fischio d\'inizio!');
  show('match');
  Sfx.whistle();
  await overlayCard(
    friendly ? 'AMICHEVOLE' : ROUNDS[teamIdx].short,
    `${friendly ? (game === 'tab' ? 'Tabelline scelte da te' : 'Tempi scelti da te') : roundSubject(game, teamIdx)} · ${team.stadium}`,
    team
  );

  for (let qi = 0; qi < QUESTIONS_PER_MATCH && !match.quit; qi++) {
    if (qi === Math.floor(QUESTIONS_PER_MATCH / 2)) {
      Sfx.whistle();
      await overlayCard('SECONDO TEMPO', 'Si riparte! Forza!', team, 1800);
    }
    match.minute = qi * MIN_PER_QUESTION + 1;
    updateScoreboard();
    const { correct, timedOut } = await askQuestion();
    if (match.quit) break;
    await sleep(700);

    if (match.poss === 'you') {
      if (correct) {
        if (match.zone >= 4) {
          cameraCut();
          const res = await runShot(false);
          if (match.quit) break;
          cameraCut();
          if (res === 'goal') {
            match.score[0]++; state.stats.goals++; saveLocal();
            setComment(say('goalYou'));
          } else {
            setComment(res === 'save' ? say('savedYou') : say('missYou'));
          }
          show('match');
          match.zone = 2; match.poss = 'opp';
          setBall(2, false); setPossession('opp');
          updateScoreboard();
          await sleep(1400);
        } else {
          setComment(say('correctYou'));
          await sleep(700);
          cameraCut();
          const res = await runPass(match.zone, match.teamIdx);
          if (match.quit) break;
          cameraCut();
          show('match');
          if (res === 'ok') {
            match.zone++;
            setBall(match.zone);
            setComment(match.zone >= 4 ? say('shotChance') : say('passOk'));
          } else {
            match.poss = 'opp';
            setPossession('opp');
            setComment(say('passBad'));
          }
          await sleep(1300);
        }
      } else {
        // la soluzione è già stata letta sulla carta: si riparte subito
        match.poss = 'opp';
        setPossession('opp');
        setComment(timedOut ? say('timeout') : say('wrongYou'));
        await sleep(1100);
      }
    } else { // palla all'avversario
      if (correct) {
        match.poss = 'you';
        setPossession('you');
        setComment(say('tackle'));
        await sleep(1100);
      } else {
        match.zone--;
        setBall(match.zone);
        if (match.zone <= 0) {
          setComment(`Tiro di ${team.name}...`);
          await sleep(1400);
          if (Math.random() < match.oppGoalChance) {
            match.score[1]++;
            Sfx.ohh();
            setComment(say('oppGoal'));
          } else {
            Sfx.save();
            setComment(say('oppMiss'));
          }
          match.zone = 2; match.poss = 'you';
          setBall(2, false); setPossession('you');
          updateScoreboard();
          await sleep(1700);
        } else {
          setComment(say('oppAdvance'));
          await sleep(1400);
        }
      }
    }
  }

  if (match.quit) {
    // abbandono = si torna dritti al menu principale (facile cambiare gioco)
    match.active = false;
    show('home');
    return;
  }

  match.minute = 90;
  updateScoreboard();
  Sfx.whistle(true);

  if (match.score[0] === match.score[1]) {
    await penalties(team);
  }
  await endMatch(team);
}

/* ---------------- rigori ---------------- */
async function penalties(team) {
  await overlayCard('CALCI DI RIGORE', 'Pareggio! Si decide dal dischetto! 😱', team, 2400);
  const pens = [0, 0];
  let round = 0;
  const decided = (kicksLeft) => Math.abs(pens[0] - pens[1]) > kicksLeft;
  while (true) {
    round++;
    setComment(`Rigore ${round}: rispondi e tira!`);
    const { correct } = await askQuestion();
    if (match.quit) return;
    let mine = 'miss';
    if (correct) {
      await sleep(700);
      cameraCut();
      mine = await runShot(true);
      cameraCut();
    } else {
      await sleep(1500);
    }
    if (mine === 'goal') pens[0]++;
    show('match');
    updateScoreboard(pens);
    setComment(mine === 'goal' ? 'Rigore segnato! 🎯' : 'Rigore sbagliato...');
    await sleep(1500);
    if (round <= 5 && decided(5 - round)) break;

    setComment(`Rigore di ${team.name}...`);
    await sleep(1600);
    if (Math.random() < 0.62) { pens[1]++; Sfx.ohh(); setComment('Segnano loro.'); }
    else { Sfx.save(); setComment('IL TUO PORTIERE PARA! 🧤'); }
    updateScoreboard(pens);
    await sleep(1600);
    if (round < 5) { if (decided(5 - round)) break; }
    else if (pens[0] !== pens[1]) break; // oltre il 5°: si decide appena uno sbaglia
    if (round > 20) { pens[0]++; break; } // paracadute
  }
  if (pens[0] > pens[1]) match.score[0]++;
  else match.score[1]++;
}

/* ---------------- fine partita ---------------- */
function resultConfetti() {
  const box = $('result-confetti');
  box.innerHTML = '';
  const colors = ['#ffe95c', '#2ecc71', '#e74c3c', '#2d7dd2', '#f2a71b', '#fff', '#9b59b6'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.className = 'conf-piece';
    p.style.left = Math.random() * 100 + '%';
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = (2.2 + Math.random() * 2.5) + 's';
    p.style.animationDelay = (Math.random() * 2.5) + 's';
    box.appendChild(p);
  }
}

async function endMatch(team) {
  match.active = false;
  const won = match.score[0] > match.score[1];
  const i = match.teamIdx;
  const game = match.game;
  const career = state.games[game].career;
  state.stats.matches++;
  if (won) {
    state.stats.wins++;
    if (!match.friendly && !career.beaten[i]) {
      career.beaten[i] = true;
      career.unlocked = Math.max(career.unlocked, Math.min(i + 2, 9));
    }
  }
  saveLocal();

  const isFinal = !match.friendly && i === 8;
  const cupName = game === 'tab' ? 'Coppa del Mondiale delle Tabelline' : 'Coppa del Mondiale dei Verbi';
  $('result-emoji').textContent = won ? (isFinal ? '🏆' : '🥇') : '💪';
  $('result-title').textContent = won ? (isFinal ? 'CAMPIONE DEL MONDIALE!' : 'HAI VINTO!') : 'Peccato!';
  $('result-score').textContent = `${match.score[0]} - ${match.score[1]}`;
  $('result-text').textContent = won
    ? (match.friendly
        ? `Bella amichevole! L'allenamento ti rende più forte. 💪`
        : isFinal
          ? `${state.name}, hai alzato la ${cupName}! Sei una leggenda! 👑`
          : `Hai battuto ${team.name} e superato: ${ROUNDS[i].label}! ${i + 1 < 9 ? 'Ti aspetta: ' + ROUNDS[i + 1].label + '!' : ''}`)
    : `${team.name} ha vinto stavolta. Riprova: ogni partita ti rende più forte!`;
  const stars = game === 'tab'
    ? (match.friendly ? starStr(starsFromAvg(state.sel.tab.reduce((s, t) => s + tableStars(t), 0) / state.sel.tab.length * 5 / 3)) : starStr(tableStars(team.table)))
    : starStr(match.friendly ? 0 : groupStars(i));
  $('result-stars').innerHTML = match.friendly ? '' : `${roundSubject(game, i)}: ${stars}`;
  $('result-confetti').innerHTML = '';
  if (won) resultConfetti();
  const rb = $('btn-result-review');
  rb.classList.toggle('hidden', match.errors.length === 0);
  rb.textContent = `📝 Ripeti gli errori (${match.errors.length})`;
  show('result');
  if (won) Sfx.trophy(); else Sfx.ohh();
}

/* ---------------- ripasso degli errori (fine livello) ---------------- */
async function reviewErrors() {
  const queue = match.errors.map(e => ({ err: e, tries: 0 }));
  const total = queue.length;
  match.reviewing = true;
  match.quit = false;
  match.timer = 0; // niente pressione: si impara
  let doneCount = 0;

  $('screen-match').classList.add('review');
  $('sb-you-name').textContent = state.name || 'Tu';
  $('sb-opp-name').textContent = 'Ripasso';
  $('sb-opp-crest').textContent = '📝';
  $('sb-score').textContent = `${doneCount}/${total}`;
  $('sb-minute').textContent = '📖';
  setComment('Rifai gli esercizi sbagliati: si impara così! 💪');
  show('match');
  await sleep(1200);

  while (queue.length && !match.quit) {
    const item = queue.shift();
    $('sb-score').textContent = `${doneCount}/${total}`;
    const { correct } = await (item.err.game === 'tab'
      ? askTabQuestion(item.err)
      : askVerbQuestion(item.err));
    if (match.quit) break;
    if (correct) {
      doneCount++;
      setComment(['Giusto! 💪', 'Ora la sai!', 'Perfetto, imparata!'][doneCount % 3]);
    } else {
      item.tries++;
      if (item.tries < 3) queue.push(item); // riprova più tardi, la soluzione l'hai appena vista
      else doneCount++;
      setComment('La ritroverai tra poco: riprova!');
    }
    await sleep(900);
  }

  match.reviewing = false;
  $('screen-match').classList.remove('review');
  if (!match.quit) {
    match.errors = [];
    toast('Ripasso completato! 🎉');
    Sfx.trophy();
    $('btn-result-review').classList.add('hidden');
  }
  show('result');
}

/* ============================================================
   GEOMETRIA COMUNE: traccia col dito → curva di Bézier
   ============================================================ */
function svgPoint(svg, cx, cy) {
  return new DOMPoint(cx, cy).matrixTransform(svg.getScreenCTM().inverse());
}

function bezierAt(p0, p1, p2, t) {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

function traceToBezier(points, clampEnd) {
  const p0 = points[0];
  const raw = points[points.length - 1];
  const p2 = clampEnd ? clampEnd(raw) : raw;
  const dx = p2.x - p0.x, dy = p2.y - p0.y, L = Math.hypot(dx, dy) || 1;
  let maxDev = 0, found = false;
  for (const q of points) {
    const dev = ((q.x - p0.x) * dy - (q.y - p0.y) * dx) / L;
    if (Math.abs(dev) > Math.abs(maxDev)) { maxDev = dev; found = true; }
  }
  const mid = { x: (p0.x + p2.x) / 2, y: (p0.y + p2.y) / 2 };
  const nx = dy / L, ny = -dx / L;
  const p1 = found ? { x: mid.x + nx * maxDev * 1.7, y: mid.y + ny * maxDev * 1.7 } : mid;
  return { p0, p1, p2 };
}

function collectTrace(svg, tracePath, startPt, startRadius, minLen, onTooShort) {
  return new Promise(resolve => {
    let pts = [];
    let drawing = false;
    let done = false;
    const onDown = (e) => {
      if (done) return;
      const p = svgPoint(svg, e.clientX, e.clientY);
      if (Math.hypot(p.x - startPt.x, p.y - startPt.y) < startRadius) {
        drawing = true;
        pts = [{ x: startPt.x, y: startPt.y }];
        try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
      }
    };
    const onMove = (e) => {
      if (!drawing || done) return;
      const p = svgPoint(svg, e.clientX, e.clientY);
      const last = pts[pts.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) > 4) {
        pts.push({ x: p.x, y: p.y });
        tracePath.setAttribute('d', 'M' + pts.map(q => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' L'));
      }
    };
    const onUp = () => {
      if (!drawing || done) return;
      drawing = false;
      const p0 = pts[0], pEnd = pts[pts.length - 1];
      if (!pEnd || Math.hypot(pEnd.x - p0.x, pEnd.y - p0.y) < minLen || pEnd.y > p0.y - 30) {
        onTooShort();
        pts = [];
        tracePath.setAttribute('d', '');
        return;
      }
      done = true;
      cleanup();
      resolve(pts);
    };
    const cleanup = () => {
      svg.removeEventListener('pointerdown', onDown);
      svg.removeEventListener('pointermove', onMove);
      svg.removeEventListener('pointerup', onUp);
      svg.removeEventListener('pointercancel', onUp);
    };
    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', onUp);
  });
}

/* anima la palla lungo la Bézier; si ferma a stopT se indicato.
   Watchdog: se i frame non arrivano (scheda in secondo piano), salta alla fine. */
function animateBall(ballEl, p0, p1, p2, ms, { stopT = 1, shrink = 0 } = {}) {
  return new Promise(resolve => {
    const t0 = performance.now();
    let done = false;
    const paint = (raw) => {
      const t = raw * stopT;
      const pos = bezierAt(p0, p1, p2, t);
      const scale = 1 - shrink * t;
      ballEl.style.transform = `translate(${pos.x}px, ${pos.y}px) scale(${scale})`;
    };
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(watchdog);
      paint(1);
      resolve();
    };
    const watchdog = setTimeout(finish, ms + 500);
    const frame = () => {
      if (done) return;
      const raw = Math.min(1, (performance.now() - t0) / ms);
      paint(raw);
      if (raw < 1) requestAnimationFrame(frame);
      else finish();
    };
    requestAnimationFrame(frame);
  });
}

/* ============================================================
   PASSAGGIO — cambia inquadratura, disegna la traiettoria,
   i difensori intercettano le traiettorie pigre!
   ============================================================ */
const PASS_BALL = { x: 180, y: 600 };

function initPassScene() {
  const lines = $('pass-lines');
  [60, 180, 310, 450, 600].forEach((y, i) => {
    el('rect', { x: 0, y, width: 360, height: [50, 58, 66, 76, 90][i], fill: '#2c944a', opacity: 0.45 }, lines);
  });
}

function passLayout(zone, teamIdx) {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const mates = [
    { x: rnd(60, 130), y: rnd(230, 320) },
    { x: rnd(230, 300), y: rnd(215, 305) },
  ];
  const nDef = Math.min(3, 1 + (zone >= 3 ? 1 : 0) + (teamIdx >= 5 ? 1 : 0));
  const defs = [];
  for (let i = 0; i < nDef; i++) {
    const target = mates[i % 2];
    const t = rnd(0.4, 0.62);
    defs.push({
      x: PASS_BALL.x + (target.x - PASS_BALL.x) * t + rnd(-34, 34),
      y: PASS_BALL.y + (target.y - PASS_BALL.y) * t + rnd(-22, 22),
    });
  }
  return { mates, defs };
}

function drawPassScene(zone, teamIdx, layout) {
  const actors = $('pass-actors');
  actors.innerHTML = '';
  const lines = $('pass-lines');
  [...lines.querySelectorAll('.deco')].forEach(n => n.remove());
  if (zone <= 2) {
    const c = el('circle', { cx: 180, cy: 100, r: 120, fill: 'none', stroke: '#e8f5e9', 'stroke-width': 3, opacity: 0.5 }, lines);
    c.classList.add('deco');
  } else {
    const r = el('rect', { x: 40, y: -50, width: 280, height: 170, fill: 'none', stroke: '#e8f5e9', 'stroke-width': 3, opacity: 0.6 }, lines);
    r.classList.add('deco');
    const l = el('line', { x1: 0, y1: 44, x2: 360, y2: 44, stroke: '#e8f5e9', 'stroke-width': 3, opacity: 0.4 }, lines);
    l.classList.add('deco');
  }
  const team = TEAMS[teamIdx];
  layout.mates.forEach(m => {
    el('circle', { cx: m.x, cy: m.y + 20, r: 44, fill: '#ffe95c', opacity: 0.14 }, actors);
    const ring = el('circle', { cx: m.x, cy: m.y + 20, r: 44, fill: 'none', stroke: '#ffe95c', 'stroke-width': 3, 'stroke-dasharray': '8 7' }, actors);
    ring.classList.add('ring-pulse');
    drawPlayer(actors, m.x, m.y, '#2d7dd2', 0.85);
  });
  layout.defGroups = layout.defs.map(d => drawPlayer(actors, d.x, d.y, team.color, 0.95));
  drawPlayer(actors, 180, 668, '#2d7dd2', 1.05);
}

function runPass(zone, teamIdx) {
  return new Promise(async resolve => {
    const svg = $('passSvg');
    const trace = $('pass-trace');
    const layout = passLayout(zone, teamIdx);
    drawPassScene(zone, teamIdx, layout);
    trace.setAttribute('d', '');
    $('pass-ball').style.transform = `translate(${PASS_BALL.x}px, ${PASS_BALL.y}px)`;
    $('pass-result').classList.add('hidden');
    $('pass-msg').classList.remove('hidden');
    $('pass-msg').innerHTML = 'Disegna il passaggio verso un compagno! 👆<br><small>Occhio ai difensori: gli passano vicino? Intercettano!</small>';
    show('pass');

    const pts = await collectTrace(svg, trace, PASS_BALL, 105, 60,
      () => { $('pass-msg').innerHTML = 'Parti dalla palla e disegna fino a un compagno! 👆'; });
    if (match.quit) return resolve('quit');
    $('pass-msg').classList.add('hidden');

    const { p0, p1, p2 } = traceToBezier(pts, null);
    trace.setAttribute('d', `M${p0.x},${p0.y} Q${p1.x},${p1.y} ${p2.x},${p2.y}`);
    Sfx.pass();

    const INTERCEPT_R = 30;
    let stopT = 1, interceptedBy = -1;
    outer:
    for (let s = 1; s <= 60; s++) {
      const t = s / 60;
      const pos = bezierAt(p0, p1, p2, t);
      for (let d = 0; d < layout.defs.length; d++) {
        const def = layout.defs[d];
        if (Math.hypot(pos.x - def.x, pos.y - (def.y + 15)) < INTERCEPT_R) {
          stopT = t; interceptedBy = d;
          break outer;
        }
      }
    }
    const nearMate = layout.mates.some(m => Math.hypot(p2.x - m.x, p2.y - (m.y + 20)) < 48);
    const outcome = interceptedBy >= 0 ? 'intercept' : nearMate ? 'ok' : 'lost';

    await animateBall($('pass-ball'), p0, p1, p2, 620 * stopT + 120, { stopT });

    const resEl = $('pass-result');
    resEl.classList.remove('hidden');
    if (outcome === 'ok') {
      resEl.textContent = 'BEL PASSAGGIO! 🎯';
      resEl.style.color = '#b8ffcf';
      Sfx.passOk();
    } else if (outcome === 'intercept') {
      resEl.textContent = 'INTERCETTATO! 😱';
      resEl.style.color = '#ffd0c9';
      Sfx.intercept();
      const g = layout.defGroups[interceptedBy];
      if (g) g.style.filter = 'drop-shadow(0 0 10px #fff)';
    } else {
      resEl.textContent = 'PASSAGGIO A VUOTO!';
      resEl.style.color = '#ffd0c9';
      Sfx.ohh();
    }
    await sleep(outcome === 'ok' ? 900 : 1300);
    resolve(outcome === 'ok' ? 'ok' : 'lost');
  });
}

/* ============================================================
   TIRO IN PORTA — l'effetto a giro inganna il portiere
   ============================================================ */
const SHOT = {
  ballStart: { x: 180, y: 690 },
  goal: { left: 68, right: 292, top: 292, bottom: 466 },
  keeperY: 412,
};

function initShotScene() {
  const net = $('net');
  for (let x = 62; x <= 300; x += 17) {
    el('line', { x1: x, y1: 280, x2: x, y2: 462, stroke: '#cfe8d5', 'stroke-width': 1, opacity: 0.5 }, net);
  }
  for (let y = 288; y <= 460; y += 16) {
    el('line', { x1: 58, y1: y, x2: 302, y2: y, stroke: '#cfe8d5', 'stroke-width': 1, opacity: 0.5 }, net);
  }
  const crowd = $('crowd');
  for (let i = 0; i < 90; i++) {
    el('circle', {
      cx: 4 + Math.random() * 352, cy: 178 + Math.random() * 68,
      r: 3 + Math.random() * 2,
      fill: ['#f2a71b', '#e74c3c', '#2d7dd2', '#ffe95c', '#ecf0f1', '#9b59b6'][i % 6],
      opacity: 0.85,
    }, crowd);
  }
  const gs = $('grass-stripes');
  [280, 360, 450, 580].forEach((y, i) => {
    el('rect', { x: 0, y, width: 360, height: [40, 45, 60, 90][i], fill: '#2c944a', opacity: 0.55 }, gs);
  });
}

function resetShotScene() {
  const keeperShirt = TEAMS[match.teamIdx].color;
  const keeper = $('keeper');
  keeper.innerHTML = '';
  const g = el('g', {}, keeper);
  el('ellipse', { cx: 0, cy: 58, rx: 26, ry: 7, fill: '#000', opacity: 0.2 }, g);
  el('rect', { x: -13, y: 10, width: 26, height: 36, rx: 9, fill: keeperShirt }, g);
  el('rect', { x: -11, y: 42, width: 9, height: 16, rx: 4, fill: '#12233d' }, g);
  el('rect', { x: 2, y: 42, width: 9, height: 16, rx: 4, fill: '#12233d' }, g);
  el('rect', { x: -24, y: 0, width: 9, height: 26, rx: 4.5, fill: keeperShirt, transform: 'rotate(18)' }, g);
  el('rect', { x: 15, y: 0, width: 9, height: 26, rx: 4.5, fill: keeperShirt, transform: 'rotate(-18)' }, g);
  el('circle', { cx: 0, cy: 0, r: 11, fill: '#ffd9b0' }, g);
  el('path', { d: 'M -11 -3 A 11 11 0 0 1 11 -3 L 11 -6 A 11 11 0 0 0 -11 -6 Z', fill: '#7a4a1e' }, g);
  $('trace').setAttribute('d', '');
  $('shot-ball').style.transform = `translate(${SHOT.ballStart.x}px, ${SHOT.ballStart.y}px)`;
  $('keeper').style.transition = 'none';
  $('keeper').style.transform = `translate(180px, ${SHOT.keeperY}px)`;
  void $('keeper').offsetWidth;
  $('keeper').style.transition = '';
  $('shot-result').classList.add('hidden');
  $('shot-msg').classList.remove('hidden');
  $('confetti').innerHTML = '';
}

function confettiBurst() {
  const g = $('confetti');
  const colors = ['#ffe95c', '#2ecc71', '#e74c3c', '#2d7dd2', '#f2a71b', '#fff'];
  for (let i = 0; i < 34; i++) {
    const r = el('rect', {
      x: 40 + Math.random() * 280, y: 150 + Math.random() * 220,
      width: 7, height: 11, fill: colors[i % colors.length],
    }, g);
    r.setAttribute('class', 'confetto');
    r.style.animationDelay = (Math.random() * 0.4) + 's';
  }
}

/** Mini-gioco del tiro. penalty = portiere più reattivo. Ritorna 'goal' | 'save' | 'miss'. */
function runShot(penalty) {
  return new Promise(async resolve => {
    const svg = $('shotSvg');
    resetShotScene();
    $('shot-msg').innerHTML = penalty
      ? 'Rigore! Disegna il tiro! 👆'
      : 'Disegna la traiettoria del tiro! 👆<br><small>Tira negli angoli o dai l\'effetto per battere il portiere!</small>';
    show('shot');

    const pts = await collectTrace(svg, $('trace'), SHOT.ballStart, 110, 80,
      () => { $('shot-msg').innerHTML = 'Traccia più lunga, verso la porta! 👆'; });
    if (match.quit) return resolve('quit');
    $('shot-msg').classList.add('hidden');

    const { p0, p1, p2 } = traceToBezier(pts, raw => ({ x: raw.x, y: Math.max(265, Math.min(480, raw.y)) }));

    // il portiere "legge" la direzione iniziale del tiro: l'effetto lo inganna!
    const early = pts[Math.max(1, Math.floor(pts.length * 0.3))];
    let guessX;
    const edy = early.y - p0.y;
    if (Math.abs(edy) < 5) guessX = p2.x;
    else guessX = p0.x + (early.x - p0.x) * ((SHOT.keeperY + 30 - p0.y) / edy);
    guessX += (Math.random() - 0.5) * 24;
    guessX = Math.max(85, Math.min(275, guessX));

    const g = SHOT.goal;
    const onTarget = p2.x > g.left && p2.x < g.right && p2.y > g.top && p2.y < g.bottom;
    const reach = penalty ? 58 : 46;
    let saved = onTarget && Math.abs(guessX - p2.x) < reach;
    if (onTarget && Math.abs(p2.x - 180) < 34 && Math.random() < 0.55) { saved = true; guessX = p2.x; }

    $('trace').setAttribute('d', `M${p0.x},${p0.y} Q${p1.x},${p1.y} ${p2.x},${p2.y}`);
    Sfx.kick();

    const keeper = $('keeper');
    setTimeout(() => {
      const dir = guessX < 180 ? -18 : 18;
      keeper.style.transform = `translate(${guessX}px, ${SHOT.keeperY + 14}px) rotate(${dir}deg)`;
    }, 130);
    await animateBall($('shot-ball'), p0, p1, p2, 720, { shrink: 0.45 });

    const result = !onTarget ? 'miss' : saved ? 'save' : 'goal';
    const resEl = $('shot-result');
    resEl.classList.remove('hidden');
    if (result === 'goal') {
      resEl.textContent = 'GOOOOL! 🎉';
      resEl.style.color = '#ffe95c';
      Sfx.goal();
      confettiBurst();
    } else if (result === 'save') {
      resEl.textContent = 'PARATA! 🧤';
      resEl.style.color = '#bfe3fa';
      Sfx.save();
    } else {
      resEl.textContent = 'FUORI! 😅';
      resEl.style.color = '#ffd0c9';
      Sfx.ohh();
    }
    await sleep(result === 'goal' ? 2100 : 1600);
    resolve(result);
  });
}

/* ---------------- schermata codice ---------------- */
function renderCode() {
  $('save-code').textContent = state.name ? encodeCode() : 'Gioca almeno una volta per creare il codice!';
  $('code-feedback').textContent = '';
  $('code-input').value = '';
}

/* ---------------- avvio ---------------- */
function updateSoundBtn() {
  $('btn-sound').innerHTML = state.sound ? '🔊<small>Suoni ON</small>' : '🔇<small>Suoni OFF</small>';
  Sfx.setEnabled(state.sound);
}

async function ensureName() {
  if (state.name) return true;
  const name = await modal({
    title: 'Benvenuto, campione! ⚽',
    text: 'Come ti chiami? Il tuo nome apparirà sulla maglia!',
    input: true, okText: 'Inizia!', placeholder: 'Il tuo nome',
  });
  if (name === null) return false;
  state.name = (name || 'Campione').replace(/[^A-Za-zÀ-ÿ ]/g, '').slice(0, 12) || 'Campione';
  saveLocal();
  toast(`Forza ${state.name}! 💪`);
  return true;
}

function init() {
  loadLocal();
  initField();
  initPassScene();
  initShotScene();
  updateSoundBtn();

  $('btn-tab').addEventListener('click', async () => { Sfx.unlock(); Sfx.click(); if (await ensureName()) openGameMenu('tab'); });
  $('btn-verb').addEventListener('click', async () => { Sfx.unlock(); Sfx.click(); if (await ensureName()) openGameMenu('verb'); });
  $('btn-trophies').addEventListener('click', () => { Sfx.click(); renderTrophies(); show('trophies'); });
  $('btn-code').addEventListener('click', () => { Sfx.click(); renderCode(); show('code'); });
  $('btn-sound').addEventListener('click', () => {
    state.sound = !state.sound;
    saveLocal();
    updateSoundBtn();
    Sfx.click();
  });

  $('btn-mondiale').addEventListener('click', () => { Sfx.click(); renderCareer(); show('career'); });
  $('btn-sel-all').addEventListener('click', () => {
    Sfx.click();
    state.sel[currentGame] = currentGame === 'tab' ? [2, 3, 4, 5, 6, 7, 8, 9, 10] : [...MODI];
    saveLocal();
    renderSelection();
  });
  $('btn-friendly-play').addEventListener('click', () => {
    Sfx.click();
    const opp = TEAMS[Math.floor(Math.random() * TEAMS.length)];
    startMatch(currentGame, TEAMS.indexOf(opp), true);
  });

  document.querySelectorAll('.btn-back').forEach(b =>
    b.addEventListener('click', () => { Sfx.click(); show(b.dataset.back); }));

  $('btn-quit').addEventListener('click', async () => {
    const ok = await modal({ title: 'Abbandoni la partita?', text: 'Quello che hai imparato resta salvato, ma la partita non conta.', okText: 'Sì, esci' });
    if (ok) { match.quit = true; stopTimer(); }
  });

  $('btn-result-review').addEventListener('click', () => { Sfx.click(); reviewErrors(); });
  $('btn-result-home').addEventListener('click', () => { Sfx.click(); show('home'); });
  $('btn-result-career').addEventListener('click', () => {
    Sfx.click();
    if (match.friendly) show('gamemenu');
    else { renderCareer(); show('career'); }
  });
  $('btn-result-replay').addEventListener('click', () => { Sfx.click(); startMatch(match.game, match.teamIdx, match.friendly); });

  $('btn-copy-code').addEventListener('click', async () => {
    const code = $('save-code').textContent;
    if (!code.startsWith('CM1')) return;
    try {
      await navigator.clipboard.writeText(code);
      toast('Codice copiato! 📋');
    } catch (e) {
      toast('Tieni premuto sul codice per copiarlo');
    }
  });

  $('btn-load-code').addEventListener('click', async () => {
    const fb = $('code-feedback');
    const s = decodeCode($('code-input').value);
    if (!s) {
      fb.textContent = '❌ Codice non valido, controlla di averlo copiato tutto.';
      fb.className = 'code-feedback err';
      return;
    }
    const ok = await modal({ title: 'Carico il salvataggio?', text: `Trovata la carriera di ${s.name || 'Campione'}. Sostituisce i progressi attuali su questo dispositivo.`, okText: 'Carica' });
    if (!ok) return;
    s.sound = state.sound;
    state = s;
    saveLocal();
    fb.textContent = `✅ Bentornato, ${state.name}!`;
    fb.className = 'code-feedback ok';
    toast(`Carriera di ${state.name} caricata! ⚽`);
  });

  // ---- installazione come app (PWA) ----
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let installPrompt = null;

  if (!isStandalone) $('btn-install').classList.remove('hidden');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e; // Android / Chrome: potremo aprire il prompt nativo
    $('btn-install').classList.remove('hidden');
  });

  window.addEventListener('appinstalled', () => {
    $('btn-install').classList.add('hidden');
    toast('App installata! La trovi tra le tue app 🎉');
  });

  $('btn-install').addEventListener('click', async () => {
    Sfx.click();
    if (installPrompt) {
      // Android e Chrome: installazione con un tocco
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') installPrompt = null;
      return;
    }
    if (isIOS) {
      await modal({
        title: '📲 Installa su iPhone/iPad',
        text: 'Da Safari:\n\n1️⃣  Tocca il pulsante Condividi in basso (il quadrato con la freccia ↑)\n\n2️⃣  Scorri e scegli "Aggiungi alla schermata Home"\n\n3️⃣  Tocca "Aggiungi"\n\nCalcioMat apparirà tra le tue app, con la sua icona, e funzionerà anche senza internet!',
        okText: 'Ho capito', cancel: false,
      });
    } else {
      await modal({
        title: '📲 Installa l\'app',
        text: 'Apri il menu del browser (⋮ o ⋯ in alto) e scegli "Installa app" oppure "Aggiungi a schermata Home".\n\nCalcioMat apparirà tra le tue app e funzionerà anche senza internet!',
        okText: 'Ho capito', cancel: false,
      });
    }
  });

  // sblocca l'audio al primo tocco (richiesto da iOS)
  document.addEventListener('pointerdown', () => Sfx.unlock(), { once: true });

  // PWA
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

init();
