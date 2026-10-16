(() => {
  "use strict";

  const STORAGE_KEY = "ultimate-clock-v2"; /* Legacy: migración a tres claves */
  const KEY_MATCH = "ultimate-clock-match";
  const KEY_SHEETS = "ultimate-clock-sheets";
  const KEY_TOURNAMENTS = "ultimate-clock-tournaments";
  const app = document.getElementById("app");
  const modalRoot = document.getElementById("modalRoot");
  const tutorialRoot = document.getElementById("tutorialRoot");
  const toast = document.getElementById("toast");
  const liveRegion = document.getElementById("liveRegion");
  const root = document.documentElement;

  const E = ClockEngine;
  const TN = UCTournament;
  /* Idioma: el texto en español es la clave; UCI18N tiene la versión en inglés. Los datos guardados siguen en español. */
  let lang=UCI18N.initial();
  const t=(text,vars)=>UCI18N.t(lang,text,vars);
  const RULESETS = E.defaults;

  const BUILT_IN_THEMES = [
    { id: "light", name: "Claro", swatch: "#1b47e2" },
    { id: "dark", name: "Oscuro", swatch: "#1b47e2" }
  ];

  const TUTORIAL_STEPS = [
    {target:'.clock-card',title:'Tiempo del partido',text:'Iniciá el reloj principal cuando empieza el juego. Es el único que podés pausar. Al cumplirse el primer tiempo aparecerá el aviso para iniciar el descanso.'},
    {target:'.team-card.team-1',title:'Equipos y goles',text:'Tocá el nombre para cambiarlo o elegir un color. Con + el gol se suma al instante y se abre un cuadro para anotar quién dio el pase y quién hizo el gol, o deshacerlo. El botón − corrige el puntaje y deja registro del ajuste. En modo torneo elegís los jugadores de la lista; en modo partido los escribís o los elegís si los cargaste.'},
    {target:'.mode-badge',title:'Modo partido y modo torneo',text:'El cartel indica el modo. En modo partido escribís los nombres y, si querés, cargás los jugadores de cada partido. En modo torneo cargás equipos y jugadores una sola vez y los elegís de listas. Cambiás de modo desde MENU.'},
    {target:'.timer-call-0',title:'Llamados por equipo',text:'Cada equipo tiene su propio Llamado. Tocá INICIAR, elegí la categoría y se registrará qué equipo hizo el llamado. La cuenta sigue hasta el final.'},
    {target:'.timer-pull',title:'Pull',text:'Tocá INICIAR al preparar el lanzamiento. Dura 90 s y no se pausa: avisa con 1, 2 y 3 silbatos a los 45, 60 y 75 s y con 4 al terminar. REINICIAR la devuelve a LISTO sin arrancarla.'},
    {target:'.timeout-card',title:'Time Out',text:'Tocá INICIAR en el botón del equipo que pide el tiempo. Cada botón muestra cuántos le quedan; el contador es único y no se puede pausar.'},
    {target:'.menu-button',title:'Menú y planilla',text:'Desde MENU empezás un partido nuevo, entrás o salís del modo torneo, abrís la planilla (con las guardadas y los botones para exportar) y la configuración. Ahí también activás y probás el sonido antes del partido.'}
  ];

  const THEME_VARS = [
    ["bg", "Fondo", "#f8f9fb"],
    ["panel", "Panel", "#ffffff"],
    ["ink", "Texto", "#191c1e"],
    ["accent", "Acción", "#1b47e2"],
    ["accent-2", "Panel oscuro", "#16171b"]
  ];

  const THEME_FALLBACKS = {
    light: { bg: "#f8f9fb", panel: "#ffffff", ink: "#191c1e", accent: "#1b47e2", "accent-2": "#16171b" },
    dark: { bg: "#0b0c0e", panel: "#16171b", ink: "#f7f8fa", accent: "#4971ff", "accent-2": "#0b0c0e" }
  };

  /* Logo: un disco visto de frente con la corona de un cronómetro y el tiempo transcurrido en blanco. */
  const WHATSAPP_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2l-.4-.3Z"/></svg>';
  const LOGO_SVG = '<svg class="logo" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect x="25" y="2" width="14" height="7" rx="2.5" fill="currentColor"/><rect x="29.5" y="8" width="5" height="6" fill="currentColor"/><circle cx="32" cy="38" r="23" fill="#1b47e2"/><circle cx="32" cy="38" r="21.5" fill="none" stroke="#0b2a9e" stroke-width="3"/><circle cx="32" cy="38" r="15.5" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2.5"/><path d="M32 38V22.5A15.5 15.5 0 0 1 45.42 30.25Z" fill="#fff"/><circle cx="32" cy="38" r="3" fill="#fff"/></svg>';
  /* Enlace de donación (perfil de Cafecito de Juan). Si queda vacío, el botón explica que todavía no hay enlace. */
  const DONATION_URL = 'https://cafecito.app/juanaustral';
  const WEBSITE_URL = 'https://juanmartinezgarcia.com/';

  const TEAM_DEFAULTS = [
    { name: "Equipo 1", color: "#1b47e2" },
    { name: "Equipo 2", color: "#f59e0b" }
  ];
  const CALL_CATEGORIES = ['Falta','Violación','Pick','Travel','Conteo','Gol discutido','Lesión','Tiempo de Espíritu'];
  const CALL_GUIDANCE = {
    'Falta':'Contacto antirreglamentario entre jugadores. La resolución depende de si el llamado se acepta o se disputa.',
    'Violación':'Incumplimiento de una regla distinto de una falta; el reglamento define cómo reanudar el juego.',
    'Pick':'Un defensor queda impedido de seguir a quien marca por la posición o movimiento de otra persona.',
    'Travel':'Desplazamiento o pivote incorrecto de quien tiene el disco; puede tratarse como infracción o violación según el caso.',
    'Conteo':'Conteo agotado antes del lanzamiento. Registrá el llamado; la posesión se resuelve según el reglamento.',
    'Gol discutido':'Disputa sobre si hubo gol. Al resolverse, el reinicio puede requerir un check.',
    'Lesión':'Detención por seguridad. Las sustituciones y los time outs asociados dependen del reglamento.',
    'Tiempo de Espíritu':'Detención para tratar problemas de Espíritu de Juego; tiene condiciones propias y no equivale a una falta común.'
  };

  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || min));
  const seconds = value => Math.max(0, Number(value) || 0);
  const fmt = value => {
    const total = Math.max(0, Math.ceil(value));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };
  const dateLabel = value => new Intl.DateTimeFormat(lang==='en'?"en-US":"es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  const nowIso = () => new Date().toISOString();

  const contrastColor = hex => E.ink(hex);
  const isHexColor = value => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value));

  function getRuleset() { return E.configuration(state.settings); }
  function rulesetLabel(id,match) {return state?.customRulesets?.find(profile=>profile.id===id)?.name||match?.rulesetName||RULESETS[id]?.label||t('Personalizado');}

  function makeTimer(id, label, duration, thresholds) {
    return { id, label, duration, thresholds: thresholds.map(item => ({ ...item })), elapsed: 0, running: false, startedAt: null, completed: false, alerted: [] };
  }

  function makeMatch(ruleset = "wfdf") {
    const config = typeof state !== "undefined" && state ? getRuleset() : RULESETS[ruleset] || RULESETS.wfdf;
    return {
      id: uid("match"),
      createdAt: nowIso(),
      savedAt: null,
      ruleset,
      status: "active",
      mode: "match",
      teams: TEAM_DEFAULTS.map(team => ({ ...team, name: t(team.name), tid: '', roster: [], score: 0, goals: [], adjustments: [] })),
      clock: { elapsed: 0, running: false, startedAt: null, halfAlerted: false, capAlerted: false, status: "Preparado", gameCap: config.gameCap, halfCap: config.halfCap, halftime: config.halftime },
      timers: {
        pull: makeTimer("pull", "Pull", E.PULL.duration, E.pullThresholds()),
        call: makeTimer("call-0", "Llamado equipo 1", config.call.restart, [{at:config.call.restart,label:'Tiempo cumplido'}]),
        call2: makeTimer("call-1", "Llamado equipo 2", config.call.restart, [{at:config.call.restart,label:'Tiempo cumplido'}]),
        timeout: makeTimer("timeout", "Time out", config.timeoutDuration, [{at:config.timeoutDuration,label:'Tiempo cumplido'}])
      },
      timeoutState: { activeTeam: null, usages: [0, 0], mode: "" },
      callTypes: ["Falta", "Falta"],
      half: 1,
      config: clone(config),
      breakTimer: makeTimer("break", "Medio tiempo", config.halftime, [{at:config.halftime,label:"Tiempo cumplido"}]),
      pendingHalfPrompt:false,
      pendingSecondHalfPrompt:false,
      events: []
    };
  }

  function freshState() {
    return {
      version: 2,
      settings: { theme: "light", ruleset: "wfdf", sound: true, volume: 0.85, overrides: {}, baseRuleset: "wfdf" },
      customThemes: [],
      customRulesets: [],
      pendingAlerts: [],
      timerProfiles: [],
      tournament: null,
      otherTournaments: [],
      activeMatch: makeMatch("wfdf"),
      savedMatches: []
    };
  }

  let state = null;
  let storageBlocked = false;
  let storageInvalid = false;
  let storageRaw = null;
  let draftRuleset = false;
  let selectedProfileId = null;
  let tutorialIndex = -1;
  let writerId=uid('tab');
  try {writerId=sessionStorage.getItem('ultimate-clock-tab')||writerId;sessionStorage.setItem('ultimate-clock-tab',writerId);}catch{}
  try {
    storageRaw = localStorage.getItem(STORAGE_KEY);
    if (storageRaw) {
      // Migración: partir la clave única legacy en tres claves
      const stored = JSON.parse(storageRaw);
      state = mergeState(stored);
      saveState(); try { localStorage.removeItem(STORAGE_KEY); } catch {}
    } else {
      const matchRaw = localStorage.getItem(KEY_MATCH);
      if (matchRaw) {
        storageRaw = matchRaw;
        const matchData = JSON.parse(matchRaw);
        const sheetsRaw = localStorage.getItem(KEY_SHEETS);
        const tournamentsRaw = localStorage.getItem(KEY_TOURNAMENTS);
        const tournamentsData = tournamentsRaw ? JSON.parse(tournamentsRaw) : {};
        state = mergeState({
          version: 2, ...matchData,
          savedMatches: sheetsRaw ? JSON.parse(sheetsRaw) : [],
          tournament: tournamentsData.tournament ?? null,
          otherTournaments: tournamentsData.otherTournaments || []
        });
      } else {
        state = freshState();
      }
    }
  } catch {
    storageBlocked = true;
    storageInvalid = !!storageRaw;
    state = freshState();
  }
  lang=UCI18N.initial(state.settings.lang);

  function mergeState(stored) {
    if(stored.version !== 2 || !stored.activeMatch || !Array.isArray(stored.savedMatches) || !Array.isArray(stored.customThemes)) throw new Error('Formato no compatible');
    const m=stored.activeMatch;
    if(!Array.isArray(m.teams)||m.teams.length!==2||!m.clock||!m.timers||!m.breakTimer||!Array.isArray(m.events))throw new Error('Partido incompleto');
    for(const t of [m.timers.pull,m.timers.call,m.timers.timeout,m.breakTimer]) {
      if(!t||!Array.isArray(t.thresholds)||!Array.isArray(t.alerted)||!Number.isFinite(t.elapsed)||t.elapsed<0||!Number.isFinite(t.duration))throw new Error('Contador inválido');
    }
    if(E.validate(E.configuration(stored.settings)))throw new Error('Configuración inválida');
    stored.customRulesets ||= [];
    for(const old of stored.timerProfiles||[])if(!stored.customRulesets.some(p=>p.id===`profile-${old.id}`))stored.customRulesets.push({id:`profile-${old.id}`,name:old.name,config:old.config});
    if(stored.settings.ruleset==='custom'&&!stored.customRulesets.some(p=>p.id==='profile-legacy')){
      stored.customRulesets.push({id:'profile-legacy',name:'Personalizado anterior',config:E.configuration(stored.settings)});
      stored.settings.ruleset='profile-legacy';
      if(m.ruleset==='custom')m.ruleset='profile-legacy';
    }
    stored.tournament=TN.sanitize(stored.tournament);
    stored.otherTournaments=(Array.isArray(stored.otherTournaments)?stored.otherTournaments:[]).map(TN.sanitize).filter(Boolean).slice(0,TN.LIMITS.tournaments-1);
    if(!['light','dark'].includes(stored.settings.theme))stored.settings.theme='light';
    m.timers.call.id='call-0';m.timers.call.label=`Llamado ${m.teams[0].name}`;
    m.timers.call2 ||= makeTimer('call-1',`Llamado ${m.teams[1].name}`,m.config.call.restart,[{at:m.config.call.restart,label:'Tiempo cumplido'}]);
    if(!Array.isArray(m.timers.call2.thresholds)||!Array.isArray(m.timers.call2.alerted)||!Number.isFinite(m.timers.call2.elapsed)||m.timers.call2.elapsed<0||!Number.isFinite(m.timers.call2.duration))throw new Error('Contador de llamado inválido');
    m.callTypes=Array.isArray(m.callTypes)&&m.callTypes.length===2?m.callTypes:[m.callType||'Falta','Falta'];
    for(const timer of [m.timers.call,m.timers.call2,m.timers.timeout,m.breakTimer])timer.thresholds=[{at:timer.duration,label:'Tiempo cumplido'}];
    if(!m.timers.pull.running&&!m.timers.pull.completed)Object.assign(m.timers.pull,{duration:E.PULL.duration,elapsed:0,alerted:[]});
    m.timers.pull.thresholds=m.timers.pull.duration===E.PULL.duration?E.pullThresholds():[{at:m.timers.pull.duration,label:'Tiempo cumplido'}];
    if(m.mode!=='tournament'&&m.mode!=='match')m.mode=m.teams.some(x=>x.tid)?'tournament':'match';
    m.pendingHalfPrompt ||= false;m.pendingSecondHalfPrompt ||= false;
    m.teams.forEach((team,i)=>{if(!isHexColor(team.color))team.color=TEAM_DEFAULTS[i].color;team.roster=Array.isArray(team.roster)?team.roster.filter(p=>p&&typeof p.id==='string'&&typeof p.name==='string').map(p=>({id:p.id,name:String(p.name).slice(0,TN.LIMITS.name),number:TN.cleanNumber(p.number)})).slice(0,TN.LIMITS.players):[];});
    return stored;
  }

  function persistMatch() {
    storageBlocked = false;
    try { localStorage.setItem(KEY_MATCH, JSON.stringify({version:2,writerId,settings:state.settings,customThemes:state.customThemes,customRulesets:state.customRulesets,pendingAlerts:state.pendingAlerts,activeMatch:state.activeMatch})); return true; }
    catch { storageBlocked=true; showStorageError(); return false; }
  }
  function persistSheets() {
    storageBlocked = false;
    try { localStorage.setItem(KEY_SHEETS, JSON.stringify(state.savedMatches)); return true; }
    catch { storageBlocked=true; showStorageError(); return false; }
  }
  function persistTournaments() {
    storageBlocked = false;
    try { localStorage.setItem(KEY_TOURNAMENTS, JSON.stringify({tournament:state.tournament,otherTournaments:state.otherTournaments})); return true; }
    catch { storageBlocked=true; showStorageError(); return false; }
  }
  // Si un guardado falló antes, reintentar en cada cambio en vez de apagar el guardado para siempre.
  function saveState() { const a=persistMatch(),b=persistSheets(),c=persistTournaments(); return a&&b&&c; }
  function showStorageError() {
    let banner=document.getElementById('storageWarning');
    if(!banner){banner=document.createElement('div');banner.id='storageWarning';banner.className='storage-warning';banner.setAttribute('role','alert');document.body.prepend(banner);}
    banner.innerHTML=`${esc(t('El almacenamiento local no está disponible o contiene un formato no compatible. Tus datos anteriores se conservan.'))} <button data-action="export-backup">${esc(t('Descargar respaldo'))}</button> <button data-action="retry-storage">${esc(t('Reintentar guardado'))}</button>`;
  }
  function logEvent(type, detail={}) { const m=activeMatch(); m.events.push({type,at:nowIso(),elapsed:m.clock.elapsed,...detail}); }
  function isLocked() {const m=activeMatch();return m.status==='saved';}
  function hasStarted() {const m=activeMatch();return m.clock.elapsed>0||m.clock.running||m.events.length>0;}
  function download(content,type,name) {const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function exportData(data,name) {download(JSON.stringify(data,null,2),'application/json',name);}
