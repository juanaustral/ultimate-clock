(() => {
  "use strict";

  const STORAGE_KEY = "ultimate-clock-v2";
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
    {target:'.team-card.team-1',title:'Equipos y goles',text:'Tocá el nombre para cambiarlo o elegir un color. Con + el gol se suma al instante y se abre un cuadro para anotar quién dio el pase y quién hizo el gol, o deshacerlo. El botón − corrige el puntaje y deja registro del ajuste.'},
    {target:'.timer-call-0',title:'Llamados por equipo',text:'Cada equipo tiene su propio Llamado. Tocá INICIAR, elegí la categoría y se registrará qué equipo hizo el llamado. La cuenta sigue hasta el final.'},
    {target:'.timer-pull',title:'Pull',text:'Tocá INICIAR al preparar el lanzamiento. Dura 90 s y no se pausa: avisa con 1, 2 y 3 silbatos a los 45, 60 y 75 s y con 4 al terminar. REINICIAR la devuelve a LISTO sin arrancarla.'},
    {target:'.timeout-card',title:'Time Out',text:'Tocá INICIAR en el botón del equipo que pide el tiempo. Cada botón muestra cuántos le quedan; el contador es único y no se puede pausar.'},
    {target:'.menu-button',title:'Menú y planilla',text:'Desde MENU empezás un partido nuevo, abrís la planilla (con las guardadas y los botones para exportar) y la configuración. Ahí también activás y probás el sonido antes del partido.'}
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
      teams: TEAM_DEFAULTS.map(team => ({ ...team, name: t(team.name), score: 0, goals: [], adjustments: [] })),
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
    const stored = JSON.parse(storageRaw || "null");
    state = stored ? mergeState(stored) : freshState();
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
    if(!['light','dark'].includes(stored.settings.theme))stored.settings.theme='light';
    m.timers.call.id='call-0';m.timers.call.label=`Llamado ${m.teams[0].name}`;
    m.timers.call2 ||= makeTimer('call-1',`Llamado ${m.teams[1].name}`,m.config.call.restart,[{at:m.config.call.restart,label:'Tiempo cumplido'}]);
    if(!Array.isArray(m.timers.call2.thresholds)||!Array.isArray(m.timers.call2.alerted)||!Number.isFinite(m.timers.call2.elapsed)||m.timers.call2.elapsed<0||!Number.isFinite(m.timers.call2.duration))throw new Error('Contador de llamado inválido');
    m.callTypes=Array.isArray(m.callTypes)&&m.callTypes.length===2?m.callTypes:[m.callType||'Falta','Falta'];
    for(const timer of [m.timers.call,m.timers.call2,m.timers.timeout,m.breakTimer])timer.thresholds=[{at:timer.duration,label:'Tiempo cumplido'}];
    if(!m.timers.pull.running&&!m.timers.pull.completed)Object.assign(m.timers.pull,{duration:E.PULL.duration,elapsed:0,alerted:[]});
    m.timers.pull.thresholds=m.timers.pull.duration===E.PULL.duration?E.pullThresholds():[{at:m.timers.pull.duration,label:'Tiempo cumplido'}];
    m.pendingHalfPrompt ||= false;m.pendingSecondHalfPrompt ||= false;
    m.teams.forEach((team,i)=>{if(!isHexColor(team.color))team.color=TEAM_DEFAULTS[i].color;});
    return stored;
  }

  function saveState() {
    if(storageBlocked) return false;
    try { state.writerId=writerId; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; }
    catch { storageBlocked=true; showStorageError(); return false; }
  }
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

  function themeName(id) {
    return BUILT_IN_THEMES.find(theme => theme.id === id)?.name || state.customThemes.find(theme => theme.id === id)?.name || "Personalizado";
  }

  function currentThemeVars() {
    const custom = state.customThemes.find(theme => theme.id === state.settings.theme);
    if (custom) return custom.vars;
    const styles = getComputedStyle(root);
    const fallback = THEME_FALLBACKS[state.settings.theme] || THEME_FALLBACKS.light;
    return Object.fromEntries(THEME_VARS.map(([key]) => [key, styles.getPropertyValue(`--${key}`).trim() || fallback[key]]));
  }

  function applyTheme(id,persist=true) {
    const custom=state.customThemes.find(t=>t.id===id);
    root.removeAttribute('style');
    root.dataset.theme=custom?'custom':id;
    if(custom){
      const v=custom.vars;
      Object.entries(v).forEach(([k,val])=>root.style.setProperty(`--${k}`,val));
      const foreground=E.contrast(v.ink,v.bg)>=4.5 && E.contrast(v.ink,v.panel)>=4.5?v.ink:E.ink(v.panel);
      root.style.setProperty('--ink',foreground);
      root.style.setProperty('--muted',foreground);
      root.style.setProperty('--line',foreground);
      root.style.setProperty('--bg-2',v.panel);
      root.style.setProperty('--page-ink',E.contrast(foreground,v.bg)>=4.5?foreground:E.ink(v.bg));
    }
    const style=getComputedStyle(root),fallback=THEME_FALLBACKS[id]||THEME_FALLBACKS.light,bg=style.getPropertyValue('--bg').trim()||fallback.bg,panel=style.getPropertyValue('--panel').trim()||fallback.panel,accent=style.getPropertyValue('--accent').trim()||fallback.accent;
    root.style.setProperty('--accent-ink',E.ink(accent));
    root.style.setProperty('--panel-display',E.ink(panel));
    state.settings.theme=id; if(persist)saveState();updateThemeMeta();
  }

  function updateThemeMeta() {
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.content=getComputedStyle(root).getPropertyValue('--bg').trim()||THEME_FALLBACKS[state.settings.theme]?.bg||THEME_FALLBACKS.light.bg;
    document.querySelectorAll('[data-action="quick-theme"]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.theme===state.settings.theme)));
  }

  /* actions: [{label, action, data}] rendered as buttons handled by the global click listener. */
  function showToast(message, actions = []) {
    toast.textContent = message;
    for (const item of actions) {
      const button = document.createElement("button");
      button.type = "button"; button.className = "toast-action"; button.textContent = item.label; button.dataset.action = item.action;
      Object.entries(item.data || {}).forEach(([key, value]) => { button.dataset[key] = value; });
      toast.append(button);
    }
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(hideToast, actions.length ? 6000 : 3200);
  }
  function hideToast() { window.clearTimeout(showToast.timer); toast.hidden = true; toast.textContent = ""; }

  function announce(message) {
    liveRegion.textContent = "";
    window.setTimeout(() => { liveRegion.textContent = message; }, 10);
  }

  function updateAudioControls(){
    const button=document.querySelector('[data-action="enable-audio"]');
    if(!button)return;
    const active=ClockAlerts.ready,label=active?t('DESACTIVAR SONIDO'):t('ACTIVAR SONIDO');
    button.querySelector('.audio-label').textContent=label;
    button.setAttribute('aria-label',label);
    button.setAttribute('aria-pressed',String(active));
  }
  function enterFullscreen(){
    if(document.fullscreenElement||!document.documentElement.requestFullscreen)return;
    document.documentElement.requestFullscreen().catch(()=>{});
  }
  function updateFullscreenControl(){
    const button=document.querySelector('[data-action="fullscreen"]');
    if(!button)return;
    const active=Boolean(document.fullscreenElement);
    button.textContent=active?t('SALIR DE PANTALLA COMPLETA'):t('PANTALLA COMPLETA');
    button.setAttribute('aria-label',button.textContent);
  }
  /* Keeps the screen on while any clock runs, so the phone does not sleep on the sideline. */
  let wakeLock=null,wakeWanted=false;
  function updateWakeLock(running){
    if(running===wakeWanted||!('wakeLock' in navigator))return;
    wakeWanted=running;
    if(running&&!document.hidden)navigator.wakeLock.request('screen').then(lock=>{if(wakeWanted)wakeLock=lock;else lock.release();}).catch(()=>{});
    else if(!running){wakeLock?.release().catch(()=>{});wakeLock=null;}
  }
  async function unlockAudio(){
    if(!state.settings.sound)return false;
    const ready=await ClockAlerts.unlock();
    ClockAlerts.setSound(ready);
    if(!ready){state.settings.sound=false;saveState();const field=document.getElementById('sound');if(field)field.value='off';showToast(t('El navegador no habilitó el sonido. Usá PROBAR SONIDO en MENU.'));}
    updateAudioControls();
    return ready;
  }
  function dispatchAlert(item) {ClockAlerts.enqueue(item.kind,()=>{alertVisual(item.kind,item.timer,item.count);announce(item.message);state.pendingAlerts=(state.pendingAlerts||[]).filter(a=>a.id!==item.id);saveState();});}
  function queueAlert(kind,id,message,count=0) {const item={id:uid('alert'),kind,timer:id,message,count};state.pendingAlerts||=[];state.pendingAlerts.push(item);dispatchAlert(item);}

  function alertVisual(kind, timerId, count = 0) {
    document.body.classList.remove("flash-threshold", "flash-complete");
    void document.body.offsetWidth;
    document.body.classList.add(kind === "complete" ? "flash-complete" : "flash-threshold");
    if (count) try { navigator.vibrate?.(Array.from({length:count*2-1},(_,i)=>i%2?140:260)); } catch {}
    else if (kind === "complete") try { navigator.vibrate?.([220, 120, 220, 120, 420]); } catch {}
    const card = document.querySelector(`[data-timer-card="${timerId}"]`);
    if (card) {
      card.classList.remove("alert");
      void card.offsetWidth;
      card.classList.add("alert");
    }
  }

  function triggerTimerAlert(timer, threshold, kind = "threshold") {
    logEvent('limit',{timer:timer.id,label:threshold.label,limit:threshold.at});
    queueAlert(kind,timer.id,`${timerLabel(timer)}: ${t(threshold.label)}`,threshold.whistles||0);
    saveState();
  }

  function timerLabel(timer) {
    const call=/^call-(\d)$/.exec(timer.id);
    if(call)return t('Llamado {team}',{team:activeMatch().teams[Number(call[1])]?.name||''});
    return t({pull:'Pull',timeout:'Time out',break:'Medio tiempo'}[timer.id]||timer.label);
  }
  function elapsedFor(item) {return E.elapsed(item);}

  function updateRunningValue(item) {
    if(!item.running)return false;
    E.advance(item).forEach(t=>triggerTimerAlert(item,t,t.at>=item.duration?'complete':'threshold'));
    if(item.id==='break'&&item.completed&&!activeMatch().pendingSecondHalfPrompt&&activeMatch().half===1)activeMatch().pendingSecondHalfPrompt=true;
    return true;
  }

  function updateClock() {
    const match=state.activeMatch,clock=match?.clock;
    if(!clock?.running)return false;
    clock.elapsed=E.elapsed(clock);clock.startedAt=Date.now();
    if(match.half===1&&!clock.halfAlerted&&clock.elapsed>=clock.halfCap){
      clock.elapsed=clock.halfCap;clock.running=false;clock.startedAt=null;clock.halfAlerted=true;clock.status='Primer tiempo cumplido';match.pendingHalfPrompt=true;
      logEvent('limit',{timer:'clock',label:'Primer tiempo cumplido',limit:clock.halfCap});queueAlert('complete','clock',t('Primer tiempo cumplido'));saveState();
    }else if(match.half===2&&!clock.capAlerted&&clock.elapsed>=clock.gameCap){
      clock.elapsed=clock.gameCap;clock.running=false;clock.startedAt=null;clock.capAlerted=true;clock.status='Tiempo total cumplido';
      logEvent('limit',{timer:'clock',label:'Tiempo total cumplido',limit:clock.gameCap});queueAlert('complete','clock',t('Tiempo total cumplido'));saveState();
    }
    return true;
  }

  function showPendingTimePrompt() {
    const match=state.activeMatch;if(!match||modalRoot.querySelector('dialog[open]'))return;
    if(match.pendingHalfPrompt){match.pendingHalfPrompt=false;saveState();openModal(t('PRIMER TIEMPO CUMPLIDO'),`<div class="milestone-modal"><div class="milestone-clock">${fmt(match.clock.elapsed)}</div><p>${esc(t('El reloj del partido se detuvo al llegar al primer tiempo.'))}</p><button class="button button-primary" data-action="start-break">${esc(t('INICIAR MEDIO TIEMPO'))}</button></div>`);}
    else if(match.pendingSecondHalfPrompt){match.pendingSecondHalfPrompt=false;saveState();openModal(t('MEDIO TIEMPO CUMPLIDO'),`<div class="milestone-modal"><div class="milestone-clock">00:00</div><p>${esc(t('El descanso terminó. El reloj del partido se reanudará al comenzar la segunda mitad.'))}</p><button class="button button-primary" data-action="second-half">${esc(t('INICIAR SEGUNDO TIEMPO'))}</button></div>`);}
  }

  /* Timers keep start anchors, so the state saved on each discrete change is
     enough to recover after a reload; ticks only repaint. */
  let lastPaint = 0;
  function tick(timestamp) {
    try {
      const match=state.activeMatch;
      if(match?.status==='active'){
        const timers=[match.clock,...Object.values(match.timers),match.breakTimer],runningBefore=timers.filter(t=>t.running).length;
        let changed=updateClock();
        for(const timer of timers.slice(1))changed=updateRunningValue(timer)||changed;
        /* A timer that just finished always repaints, or its last frame could be skipped by the throttle. */
        const stopped=timers.filter(t=>t.running).length<runningBefore;
        if(changed&&(stopped||timestamp-lastPaint>80)){updateDisplays();lastPaint=timestamp;}
        if((match.pendingHalfPrompt||match.pendingSecondHalfPrompt)&&!modalRoot.querySelector('dialog[open]')){if(app.querySelector('.dashboard-screen'))renderDashboard();showPendingTimePrompt();}
        updateWakeLock(changed);
      }else updateWakeLock(false);
    } finally {window.requestAnimationFrame(tick);}
  }
  window.requestAnimationFrame(tick);

  function activeMatch() { return state.activeMatch || (state.activeMatch = makeMatch(state.settings.ruleset)); }

  function updateTimerConfig(match) {
    if(match.status==='saved'||hasStarted()) return;
    const c=getRuleset();match.config=clone(c);
    const p=match.timers.pull;p.duration=E.PULL.duration;p.thresholds=E.pullThresholds();
    for(const t of [match.timers.call,match.timers.call2]){t.duration=c.call.restart;t.thresholds=[{at:t.duration,label:'Tiempo cumplido'}];}
    configureTimeout(match,'Durante una posesión');
    Object.assign(match.clock,{gameCap:c.gameCap,halfCap:c.halfCap,halftime:c.halftime});
    match.breakTimer.duration=c.halftime;match.breakTimer.thresholds=[{at:c.halftime,label:'Tiempo cumplido'}];
  }
  function configureTimeout(match,mode) {
    const c=match.config||getRuleset(),timer=match.timers.timeout;
    timer.duration=c.timeoutDuration;
    timer.thresholds=[{at:timer.duration,label:'Tiempo cumplido'}];
  }

  function setRunning(item, running) {
    if(item.running===running)return;
    if(!running)updateRunningValue(item);
    if(item.running!==running)E.toggle(item);
  }

  function toggleTimer(id,fromCard=false) {
    if(isLocked())return;
    unlockAudio();const m=activeMatch();
    if(id==='clock'){
      if(m.clock.capAlerted){showToast(t('El tiempo total ya se cumplió.'));return;}
      if(m.half===1&&m.clock.halfAlerted){showToast(t('Iniciá el medio tiempo para continuar.'));return;}
      updateClock();if(m.clock.capAlerted||(m.half===1&&m.clock.halfAlerted)){saveState();renderDashboard();return;}
      m.clock.running=!m.clock.running;m.clock.startedAt=m.clock.running?Date.now():null;m.clock.status=m.clock.running?'Corriendo':'Pausado';
      logEvent(m.clock.running?'resume':'pause',{timer:'clock'});
    }else{
      if(!['pull','call-0','call-1'].includes(id))return;
      const index=id==='call-1'?1:0,timer=id==='pull'?m.timers.pull:index===0?m.timers.call:m.timers.call2;
      /* Pull y Llamado: mientras corren, el botón es REINICIAR (vuelve a cero). Tocar la tarjeta no reinicia. */
      if(timer.running){if(fromCard)return;Object.assign(timer,{elapsed:0,running:false,startedAt:null,completed:false,alerted:[]});saveState();renderDashboard();return;}
      if(timer.completed){Object.assign(timer,{elapsed:0,running:false,startedAt:null,completed:false,alerted:[]});saveState();renderDashboard();return;}
      if(id!=='pull'){openCall(index);return;}
      setRunning(timer,true);logEvent('start',{timer:id});
    }
    saveState();renderDashboard();
  }
  /* El llamado arranca al tocarlo; mientras corre se elige la categoría. Cerrar el cuadro lo registra con la categoría marcada. */
  let pendingCall=null;
  const callTimer=(m,index)=>index===0?m.timers.call:m.timers.call2;
  function openCall(teamIndex) {
    const m=activeMatch(),timer=callTimer(m,teamIndex);
    if(timer.running){showToast(t('El llamado corre hasta el final.'));return;}
    if(timer.completed)Object.assign(timer,{elapsed:0,completed:false,alerted:[],startedAt:null});
    unlockAudio();m.callTypes[teamIndex]='';setRunning(timer,true);saveState();renderDashboard();
    openModal(t('Llamado de {team}',{team:m.teams[teamIndex].name}),`<form data-form="call" data-team="${teamIndex}"><fieldset class="call-types"><legend>${esc(t('Categoría de llamado'))}</legend>${CALL_CATEGORIES.map((x,i)=>`<label class="call-type"><input type="radio" name="type" value="${esc(x)}" ${i===0?'checked':''}><span>${esc(t(x))}</span></label>`).join('')}</fieldset><p class="call-guidance" id="call-guidance">${esc(t(CALL_GUIDANCE.Falta))}</p><p>${esc(t('El reloj registra el llamado; no aplica sanciones ni reemplaza las reglas.'))} <a href="${m.ruleset==='usau'?'https://usaultimate.org/rules/':'https://rules.wfdf.sport/'}" target="_blank" rel="noopener noreferrer">${esc(t('Consultar reglamento ↗'))}</a></p><div class="modal-actions"><button class="button" type="button" data-action="cancel-call" data-team="${teamIndex}">${esc(t('CANCELAR LLAMADO'))}</button><button class="button button-primary">${esc(t('REGISTRAR'))}</button></div></form>`);
    pendingCall=teamIndex;
  }
  function registerCall(index,category) {
    const m=activeMatch(),timer=callTimer(m,index);
    if(!CALL_CATEGORIES.includes(category))category=CALL_CATEGORIES[0];
    m.callTypes[index]=category;logEvent('call',{team:index,timer:timer.id,label:category});saveState();renderDashboard();
  }
  function cancelCall(index) {
    const m=activeMatch(),timer=callTimer(m,index);
    Object.assign(timer,{elapsed:0,running:false,startedAt:null,completed:false,alerted:[]});m.callTypes[index]='';saveState();renderDashboard();
  }
  function startTimeout(teamIndex) {
    const m=activeMatch(),timer=m.timers.timeout;
    if((timer.running||timer.elapsed>0)&&!timer.completed){showToast(t('Terminá el time-out activo antes de registrar otro.'));return;}
    if(m.timeoutState.usages[teamIndex]>=m.config.timeoutsPerTeam){showToast(t('Este equipo no tiene time-outs disponibles.'));return;}
    openModal(t('Iniciar time out'),`<form data-form="timeout" data-team="${teamIndex}"><p>${t('<strong>{team}</strong> usará uno de sus {n} time outs de este tiempo. La cuenta de {time} no se puede pausar; el reloj del partido sigue corriendo.',{team:esc(m.teams[teamIndex].name),n:m.config.timeoutsPerTeam,time:fmt(m.config.timeoutDuration)})}</p><div class="modal-actions"><button type="button" class="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-primary">${esc(t('INICIAR TIME OUT'))}</button></div></form>`);
  }

  const timerButtonLabel=(id,timer)=>timer.completed||timer.running?'REINICIAR':'INICIAR';
  function timerState(timer) {
    if(isLocked())return {label:t('Finalizado'),className:'complete'};
    if(timer.completed)return {label:t('Tiempo cumplido'),className:'complete'};
    if(!timer.running)return {label:t('Listo'),className:''};
    const passed=timer.id==='pull'?(timer.thresholds||[]).filter(x=>x.whistles&&x.at<timer.duration&&timer.elapsed>=x.at).length:0;
    if(passed)return {label:t('{n}º AVISO',{n:passed}),className:'running'};
    return {label:t('En curso'),className:'running'};
  }

  function clockState(clock) {
    if(isLocked())return {label:t('Finalizado'),className:'complete'};
    if(clock.capAlerted)return {label:t('Tiempo total cumplido'),className:'complete'};
    if(clock.halfAlerted&&activeMatch().half===1)return {label:t('Primer tiempo cumplido'),className:'complete'};
    if(clock.running)return {label:t('Corriendo'),className:'running'};
    return {label:t(clock.elapsed>0?'Pausado':'Preparado'),className:clock.elapsed>0?'paused':''};
  }
  function statusMarkup(status) {
    return `<span class="status-line ${status.className}">${esc(status.label)}</span>`;
  }

  function teamStyle(team) {
    return `--team-color:${esc(team.color)};--team-ink:${contrastColor(team.color)};`;
  }

  function teamMarkup(team,index) {
    return `<article class="instrument team-card team-${index+1}" data-team-card="${index}" style="${teamStyle(team)}">
      <button class="team-name-button" type="button" data-action="edit-team" data-team="${index}" aria-label="${esc(t('Editar nombre y color de {team}',{team:team.name}))}"><strong class="team-name">${esc(team.name)}</strong><span class="team-edit" aria-hidden="true">✎</span></button>
      <div class="score-display" role="img" aria-label="${esc(t('{n} goles de {team}',{n:team.score,team:team.name}))}">${team.score}</div>
      <div class="score-actions"><button class="score-button minus" type="button" data-action="minus" data-team="${index}" aria-label="${esc(t('Restar un punto a {team}',{team:team.name}))}">−</button><button class="score-button plus" type="button" data-action="goal" data-team="${index}" aria-label="${esc(t('Sumar un gol a {team}',{team:team.name}))}">${esc(t('+ GOL'))}</button></div>
    </article>`;
  }

  function clockMarkup(match) {
    const status=clockState(match.clock);
    return `<article class="instrument clock-card ${status.className==='running'?'is-running':status.className==='paused'?'is-paused':status.className==='complete'?'is-complete':''}" data-timer-card="clock">
      <div class="clock-head"><span class="status-line ${status.className}" data-display="clock-status">${esc(status.label)}</span><span class="half-badge">${esc(t(match.half===1?'1º TIEMPO':'2º TIEMPO'))}</span></div>
      <button type="button" class="clock-display" data-action="toggle-clock" aria-label="${esc(t('Tiempo jugado del partido: iniciar, pausar o reanudar'))}" data-display="clock">${fmt(match.clock.elapsed)}</button>
      <div class="clock-details"><div class="clock-detail"><span>${esc(t('RESTA'))}</span><b data-display="game-remaining">${fmt(match.clock.gameCap-match.clock.elapsed)}</b></div>${match.half===1?`<div class="clock-detail"><span>${esc(t('AL DESCANSO'))}</span><b data-display="half-remaining">${fmt(match.clock.halfCap-match.clock.elapsed)}</b></div>`:''}</div>
      <div class="clock-actions"><button class="button button-primary" type="button" data-action="toggle-clock">${esc(t(match.clock.running?'Ⅱ PAUSAR':match.clock.elapsed>0?'▶ REANUDAR':'▶ INICIAR'))}</button></div>
    </article>`;
  }

  /* During the half-time break this card takes the game clock's place, so the board never grows. */
  function breakMarkup(match) {
    const b=match.breakTimer,state=b.running?'running':b.completed?'complete':'';
    return `<article class="instrument clock-card break-panel ${b.running?'is-running':''} ${b.completed?'is-complete':''}" data-timer-card="break">
      <div class="clock-head"><span class="status-line ${state}">${esc(t(b.running?'Descanso en curso':b.completed?'Descanso cumplido':'Primer tiempo cumplido'))}</span><span class="half-badge">${esc(t('MEDIO TIEMPO'))}</span></div>
      <strong class="clock-display" data-display="break">${fmt(b.duration-b.elapsed)}</strong>
      <div class="clock-details"><div class="clock-detail"><span>${esc(t('JUGADO'))}</span><b>${fmt(match.clock.elapsed)}</b></div><div class="progress-track" role="progressbar" aria-label="${esc(t('Progreso del medio tiempo'))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(100*b.elapsed/b.duration)}"><span class="progress-fill" style="--progress:${Math.min(100,100*b.elapsed/b.duration)}%"></span></div></div>
      <div class="clock-actions">${!b.running&&!isLocked()?`<button class="button button-primary" type="button" data-action="${b.completed?'second-half':'start-break'}">${esc(t(b.completed?'▶ SEGUNDO TIEMPO':'▶ INICIAR DESCANSO'))}</button>`:''}</div>
    </article>`;
  }

  function timerMarkup(match,id,title,teamIndex=null) {
    const timer=id==='call-0'?match.timers.call:id==='call-1'?match.timers.call2:match.timers.pull,status=timerState(timer),team=teamIndex===null?null:match.teams[teamIndex];
    const sub=team?`${esc(team.name)}${(timer.running||timer.completed)&&match.callTypes[teamIndex]?` · ${esc(t(match.callTypes[teamIndex]))}`:''}`:esc(t('Lanzamiento'));
    return `<article class="instrument timer-card ${team?'timer-call team-timer':''} timer-${id} ${timer.running?'is-running':''} ${status.className==='complete'?'is-complete':''}" data-timer-card="${id}" ${team?`style="${teamStyle(team)}"`:''}><div class="tile">
      <div class="timer-head"><div><h2 class="timer-title">${esc(t(title))}</h2><span class="timer-sub">${sub}</span></div><span class="status-line ${status.className}">${esc(status.label)}</span></div>
      <strong class="timer-display" data-display="${id}">${fmt(timer.duration-timer.elapsed)}</strong>
      <button class="timer-main-action" type="button" data-action="toggle-timer" data-timer="${id}" ${isLocked()?'disabled':''}>${esc(t(timerButtonLabel(id,timer)))}</button>
      <div class="progress-track" role="progressbar" aria-label="${esc(t('Progreso de {timer}',{timer:t(title)}))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(100*timer.elapsed/timer.duration)}"><span class="progress-fill" style="--progress:${Math.min(100,100*timer.elapsed/timer.duration)}%"></span>${id==='pull'?(timer.thresholds||[]).filter(x=>x.at<timer.duration).map(x=>`<i class="progress-mark${timer.elapsed>=x.at?' passed':''}" data-at="${x.at}" style="--at:${100*x.at/timer.duration}%"></i>`).join(''):''}</div>
    </div></article>`;
  }

  const timeoutGoLabel = (match,index) => match.timeoutState.activeTeam===index&&match.timers.timeout.running?t('EN CURSO'):match.timeoutState.usages[index]>=match.config.timeoutsPerTeam?t('SIN CUPO'):t('INICIAR');

  function timeoutMarkup(match) {
    const timer=match.timers.timeout,status=timerState(timer),active=match.timeoutState.activeTeam,c=match.config;
    return `<article class="instrument timeout-card ${timer.running?'is-active':''}" data-timer-card="timeout" ${active!==null?`style="${teamStyle(match.teams[active])}"`:''}><div class="tile">
      <div class="timer-head"><div><h2 class="timer-title">TIME OUT</h2><span class="timer-sub">${active===null?esc(t('{n} por tiempo',{n:c.timeoutsPerTeam})):esc(match.teams[active].name)}</span></div><span class="timeout-phase status-line ${active===null?'':status.className}" data-display="timeout-phase">${active===null?esc(t('Disponible')):esc(status.label)}</span></div>
      <strong class="timeout-display" data-display="timeout">${fmt(timer.duration-timer.elapsed)}</strong>
      <div class="timeout-actions">${match.teams.map((team,index)=>`<button class="timeout-team-button ${active===index?'is-current':''}" type="button" data-action="timeout" data-team="${index}" style="${teamStyle(team)}" aria-label="${esc(t('Iniciar time out de {team}. {left} de {n} disponibles',{team:team.name,left:Math.max(0,c.timeoutsPerTeam-match.timeoutState.usages[index]),n:c.timeoutsPerTeam}))}" ${isLocked()||timer.running||match.timeoutState.usages[index]>=c.timeoutsPerTeam?'disabled':''}><span>${esc(team.name)}</span><strong data-timeout-remaining="${index}">${Math.max(0,c.timeoutsPerTeam-match.timeoutState.usages[index])}/${c.timeoutsPerTeam}</strong><b class="timeout-go" data-timeout-go="${index}">${timeoutGoLabel(match,index)}</b></button>`).join('')}</div>
      <div class="progress-track" role="progressbar" aria-label="${esc(t('Progreso del time out'))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(100*timer.elapsed/timer.duration)}"><span class="progress-fill" style="--progress:${Math.min(100,100*timer.elapsed/timer.duration)}%"></span></div>
    </div></article>`;
  }

  function renderDashboard() {
    const match=activeMatch();updateTimerConfig(match);
    const center=match.half===1&&match.clock.halfAlerted?breakMarkup(match):clockMarkup(match);
    app.innerHTML=`<section id="tablero" class="dashboard-screen"><div class="main-grid">${center}${teamMarkup(match.teams[0],0)}${teamMarkup(match.teams[1],1)}</div><div class="timer-grid">${timerMarkup(match,'call-0','LLAMADO',0)}${timerMarkup(match,'call-1','LLAMADO',1)}${timerMarkup(match,'pull','PULL')}${timeoutMarkup(match)}</div></section>`;
    updateDisplays();if(isLocked())app.querySelectorAll('[data-action="goal"],[data-action="minus"],[data-action="edit-team"],[data-action="toggle-clock"],[data-action="toggle-timer"],[data-action="timeout"]').forEach(el=>el.disabled=true);
    updateThemeMeta();
  }

  function updateDisplays() {
    const match=state.activeMatch;if(!match)return;const clock=match.clock;
    const set=(selector,value)=>document.querySelectorAll(`[data-display="${selector}"]`).forEach(el=>{if(el.textContent!==value)el.textContent=value;});
    set('clock',fmt(Math.floor(clock.elapsed)));set('game-remaining',fmt(clock.gameCap-clock.elapsed));set('half-remaining',match.half===1?fmt(clock.halfCap-clock.elapsed):fmt(clock.gameCap-clock.elapsed));
    const clockCard=document.querySelector('[data-timer-card="clock"]'),cs=clockState(clock),clockStatus=document.querySelector('[data-display="clock-status"]');
    if(clockStatus){clockStatus.textContent=cs.label;clockStatus.className=`status-line ${cs.className}`;}
    if(clockCard){clockCard.classList.toggle('is-running',clock.running);clockCard.classList.toggle('is-paused',!clock.running&&clock.elapsed>0);clockCard.classList.toggle('is-complete',cs.className==='complete');const button=clockCard.querySelector('.clock-actions [data-action="toggle-clock"]');if(button){button.textContent=t(isLocked()?'FINALIZADO':clock.running?'Ⅱ PAUSAR':clock.elapsed>0?'▶ REANUDAR':'▶ INICIAR');button.disabled=isLocked()||clock.capAlerted||(match.half===1&&clock.halfAlerted);}}
    for(const id of ['pull','call-0','call-1']){const timer=id==='call-0'?match.timers.call:id==='call-1'?match.timers.call2:match.timers.pull,card=document.querySelector(`[data-timer-card="${id}"]`);if(!card)continue;set(id,fmt(timer.duration-timer.elapsed));const status=card.querySelector('.status-line'),ts=timerState(timer);status.textContent=ts.label;status.className=`status-line ${ts.className}`;card.classList.toggle('is-complete',timer.completed);card.classList.toggle('is-running',timer.running);card.classList.toggle('is-ending',isEnding(timer));const button=card.querySelector('[data-action="toggle-timer"]');const label=t(timerButtonLabel(id,timer));if(button.textContent!==label)button.textContent=label;button.disabled=isLocked();setProgress(card,timer.elapsed,timer.duration);card.querySelectorAll('.progress-mark').forEach(mark=>mark.classList.toggle('passed',timer.elapsed>=Number(mark.dataset.at)));}
    const timeout=match.timers.timeout,timeoutCard=document.querySelector('[data-timer-card="timeout"]');
    if(timeoutCard){
      const active=match.timeoutState.activeTeam,ts=timerState(timeout),phase=timeoutCard.querySelector('[data-display="timeout-phase"]');
      set('timeout',fmt(timeout.duration-timeout.elapsed));
      phase.textContent=active===null?t('Disponible'):ts.label;
      phase.className=`timeout-phase status-line ${active===null?'':ts.className}`;
      timeoutCard.classList.toggle('is-active',timeout.running);
      timeoutCard.classList.toggle('is-ending',isEnding(timeout));
      setProgress(timeoutCard,timeout.elapsed,timeout.duration);
      timeoutCard.querySelectorAll('[data-action="timeout"]').forEach((button,index)=>{
        const remaining=Math.max(0,match.config.timeoutsPerTeam-match.timeoutState.usages[index]);
        button.querySelector('[data-timeout-remaining]').textContent=`${remaining}/${match.config.timeoutsPerTeam}`;
        button.setAttribute('aria-label',t('Iniciar time out de {team}. {left} de {n} disponibles',{team:match.teams[index].name,left:remaining,n:match.config.timeoutsPerTeam}));
        button.classList.toggle('is-current',active===index);
        const go=button.querySelector('[data-timeout-go]'),label=timeoutGoLabel(match,index);if(go.textContent!==label)go.textContent=label;
        button.disabled=isLocked()||timeout.running||remaining===0;
      });
    }
    const breakCard=document.querySelector('[data-timer-card="break"]');if(breakCard){set('break',fmt(match.breakTimer.duration-match.breakTimer.elapsed));setProgress(breakCard,match.breakTimer.elapsed,match.breakTimer.duration);}
    const liveClock=document.querySelector('.sheet-live-clock');if(liveClock)liveClock.textContent=fmt(Math.floor(clock.elapsed));
  }
  const isEnding = timer => timer.running && timer.duration - timer.elapsed <= 10;
  function setProgress(card,elapsed,duration){const bar=card.querySelector('.progress-track');if(!bar)return;const percent=Math.max(0,Math.min(100,Math.round(100*elapsed/duration)));bar.setAttribute('aria-valuenow',String(percent));bar.querySelector('.progress-fill').style.setProperty('--progress',`${percent}%`);}

  function eventDescription(event,match) {
    const team=event.team===undefined?'':` · ${esc(match.teams[event.team].name)}`;
    const names=event.type==='goal'?`${event.scorer?` · ${esc(event.scorer)}`:''}${event.assist?` · ${esc(t('pase'))} ${esc(event.assist)}`:''}`:'';
    const kind={goal:'Gol',timeout:'Time-out',call:'Llamado',adjustment:'Ajuste manual',pause:'Pausa',resume:'Inicio / reanudación',limit:'Límite superado',start:'Inicio',half:'Descanso / mitad',incident:'Incidencia',saved:'Guardado'}[event.type];
    return `${kind?esc(t(kind)):esc(event.type)}${team}${event.label?` · ${esc(t(event.label))}`:''}${names}${event.mode?` · ${esc(t(event.mode))}`:''}${event.note?` · ${esc(event.note)}`:''}`;
  }
  /* planilla-equipo-1-vs-equipo-2-2026-10-02 */
  function exportName(match) {
    const slug=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'equipo';
    return `${t('planilla')}-${slug(match.teams[0].name)}-vs-${slug(match.teams[1].name)}-${String(match.savedAt||match.createdAt||nowIso()).slice(0,10)}`;
  }
  /* wa.me opens the WhatsApp app on phones and WhatsApp Web on computers, with the message ready to pick a chat. */
  function shareWhatsApp(text) {
    const opened=window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank','noopener');
    if(!opened)location.href=`https://wa.me/?text=${encodeURIComponent(text)}`;
  }
  function exportButtons(match,label) {
    return `<div class="export-actions" role="group" aria-label="${esc(label)}">${['pdf','csv','json'].map(format=>`<button class="button${format==='pdf'?' button-primary':''}" type="button" data-action="export-sheet" data-format="${format}" data-match="${esc(match.id)}">${format.toUpperCase()}</button>`).join('')}<button class="button export-whatsapp" type="button" data-action="export-sheet" data-format="whatsapp" data-match="${esc(match.id)}">${WHATSAPP_SVG}${esc(t('ENVIAR POR WHATSAPP'))}</button></div>`;
  }
  function savedSheetsMarkup() {
    const items=state.savedMatches;
    return `<section class="event-section saved-section"><div class="section-heading"><h2>${esc(t('Planillas guardadas'))}</h2><span>${items.length} · ${esc(t('DATOS LOCALES'))}</span></div>${items.length?`<div class="history-list">${items.map(match=>`<button class="history-item" type="button" data-history="${esc(match.id)}"><span><span class="history-teams">${esc(match.teams[0].name)} <small>vs</small> ${esc(match.teams[1].name)}</span><span class="history-date">${dateLabel(match.savedAt||match.createdAt)} · ${esc(rulesetLabel(match.ruleset,match))}</span></span><strong class="history-score">${match.teams[0].score} — ${match.teams[1].score}</strong></button>`).join('')}</div>`:`<p class="empty-events">${esc(t('Al tocar Guardar, la planilla del partido queda acá para abrirla y exportarla.'))}</p>`}</section>`;
  }
  function renderLiveSheet() {
    const m=activeMatch(),events=[...m.events].reverse();
    app.innerHTML=`<section class="sheet-screen"><div class="screen-head"><button class="back-button" data-action="back-dashboard">← <span>${esc(t('Tablero'))}</span></button><div><span class="screen-eyebrow">${esc(t(m.status==='saved'?'PARTIDO CERRADO':'PARTIDO ACTUAL'))}</span><h1>${esc(t('Planilla'))}</h1></div></div>
      <div class="sheet-live-strip"><span>${esc(t(m.status==='saved'?'CERRADO':m.clock.running?'EN CURSO':m.clock.elapsed>0?'PAUSADO':'PREPARADO'))} · ${esc(t(m.half===1?'1º TIEMPO':'2º TIEMPO'))}</span><strong class="sheet-live-clock">${fmt(Math.floor(m.clock.elapsed))}</strong><small>${esc(rulesetLabel(m.ruleset))}</small></div>
      <div class="sheet-score-grid">${m.teams.map((team,index)=>`<div class="sheet-score-team sheet-score-${index+1}" style="${teamStyle(team)}"><strong>${esc(team.name)}</strong><b>${team.score}</b><small>${esc(t('TIME OUTS'))} ${Math.max(0,m.config.timeoutsPerTeam-m.timeoutState.usages[index])}/${m.config.timeoutsPerTeam}</small></div>`).join('')}</div>
      ${m.status==='active'?`<section class="quick-entry"><div class="section-heading"><h2>${esc(t('Registro rápido'))}</h2><span>${esc(t('ESTE DISPOSITIVO'))}</span></div><div class="quick-grid"><button class="quick-primary" data-action="goal-picker">＋ ${esc(t('Gol'))}</button><button data-action="quick-call">⚠ ${esc(t('Llamado'))}</button><button data-action="timeout-picker">◷ ${esc(t('Time-out'))}</button><button data-action="incident">△ ${esc(t('Incidencia'))}</button></div></section>`:''}
      <section class="event-section"><div class="section-heading"><h2>${esc(t('Eventos'))}</h2><span>${events.length} ${esc(t(events.length===1?'REGISTRO':'REGISTROS'))}</span></div>${events.length?`<ol class="event-feed">${events.map(e=>`<li><time>${fmt(e.elapsed||0)}</time><span>${eventDescription(e,m)}</span></li>`).join('')}</ol>`:`<p class="empty-events">${esc(t('Todavía no hay eventos. Usá el registro rápido para comenzar.'))}</p>`}</section>
      <section class="event-section"><div class="section-heading"><h2>${esc(t('Exportar este partido'))}</h2><span>PDF · CSV · JSON · WHATSAPP</span></div>${exportButtons(m,t('Exportar la planilla de este partido'))}</section>
      <div class="sheet-actions">${m.status==='saved'?`<button class="button button-primary" data-action="new-match">${esc(t('Nuevo partido'))}</button>`:`<button class="button button-primary" data-action="save">${esc(t('Guardar planilla'))}</button>`}<button class="button" data-action="back-dashboard">${esc(t('Volver al tablero'))}</button></div>
      ${savedSheetsMarkup()}</section>`;
    updateDisplays();
  }
  function openGoalPicker() {openModal(t('Registrar gol'),`<p>${esc(t('Elegí qué equipo anotó.'))}</p><div class="picker-options">${activeMatch().teams.map((team,index)=>`<button class="button" data-action="goal" data-team="${index}" data-origin="sheet">${esc(team.name)}</button>`).join('')}</div>`);}
  function openTimeoutPicker() {openModal(t('Pedir time-out'),`<p>${esc(t('Elegí el equipo que pide tiempo.'))}</p><div class="picker-options">${activeMatch().teams.map((team,index)=>`<button class="button" data-action="timeout" data-team="${index}">${esc(team.name)}</button>`).join('')}</div>`);}
  function openCallPicker() {openModal(t('Registrar llamado'),`<p>${esc(t('Elegí el equipo que hizo el llamado.'))}</p><div class="picker-options">${activeMatch().teams.map((team,index)=>`<button class="button" data-action="pick-call-team" data-team="${index}">${esc(team.name)}</button>`).join('')}</div>`);}
  function openIncident() {openModal(t('Anotar incidencia'),`<form data-form="incident"><div class="field"><label for="incident-type">${esc(t('Tipo'))}</label><select id="incident-type" name="type"><option>TFR</option><option>PMF</option><option value="Otra">${esc(t('Otra'))}</option></select></div><div class="field"><label for="incident-note">${esc(t('Nota opcional'))}</label><input id="incident-note" name="note" maxlength="160"></div><p>${esc(t('Registro descriptivo. No aplica sanciones ni certifica decisiones.'))}</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-primary">${esc(t('Anotar'))}</button></div></form>`);}

  function renderSettings() {
    const config=getRuleset(),locked=hasStarted()||isLocked();
    const currentProfile=state.customRulesets.find(p=>p.id===state.settings.ruleset);
    const editing=draftRuleset||!!currentProfile;
    const editLocked=locked&&!draftRuleset;
    const options=`<option value="wfdf" ${!draftRuleset&&state.settings.ruleset==='wfdf'?'selected':''}>WFDF 2025–2028</option><option value="usau" ${!draftRuleset&&state.settings.ruleset==='usau'?'selected':''}>USA Ultimate 2026–2027</option><option value="create" ${draftRuleset?'selected':''}>${esc(t('PERSONALIZADO · Crear perfil'))}</option>${state.customRulesets.map(p=>`<option value="${esc(p.id)}" ${!draftRuleset&&state.settings.ruleset===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}`;
    const durations=durationRows(config);
    app.innerHTML=`<section class="settings-screen"><div class="screen-head"><button class="back-button" data-action="back-dashboard">← ${esc(t('Tablero'))}</button><div><span class="screen-eyebrow">${esc(t('CONFIGURACIÓN'))}</span><h1>${esc(t('Preparar partido'))}</h1></div></div>
      <section class="settings-section"><div class="section-heading"><h2>${esc(t('Reglamento'))}</h2></div><div class="settings-row"><div class="field"><label for="ruleset">${esc(t('Perfil'))}</label><select id="ruleset" data-setting="ruleset" ${locked?'disabled':''}>${options}</select></div><div class="field"><label for="sound">${esc(t('Avisos'))}</label><select id="sound" data-setting="sound"><option value="on" ${state.settings.sound?'selected':''}>${esc(t('Sonido y aviso visual'))}</option><option value="off" ${!state.settings.sound?'selected':''}>${esc(t('Solo aviso visual'))}</option></select></div></div><p>${esc(t('WFDF y USA Ultimate cargan sus tiempos de referencia. Los límites de duración del partido pueden depender del torneo: confirmalos antes de jugar.'))}</p></section>
      <section class="settings-section"><div class="section-heading"><h2>${esc(t('Tiempos totales'))}</h2><span>${esc(t(editing?'PERFIL PERSONALIZADO':'PERFIL DE REFERENCIA'))}</span></div><p>${esc(t('Un valor por reloj. Cada cuenta de Pull, Llamado, Time out y Medio tiempo corre hasta cero y termina con cinco alarmas.'))}</p>${editing?`<form data-form="ruleset-profile" data-profile="${esc(draftRuleset?'':currentProfile?.id||'')}"><div class="field"><label for="profile-name">${esc(t('Nombre del perfil'))}</label><input id="profile-name" name="name" maxlength="40" value="${esc(draftRuleset?'':currentProfile?.name||'')}" placeholder="${esc(t('Ej.: Torneo local'))}" required ${editLocked?'disabled':''}></div><div class="duration-grid">${durations.map(([key,label,value,unit])=>durationField(key,label,value,unit,editLocked)).join('')}</div><button class="button button-primary settings-save" ${editLocked?'disabled':''}>${esc(t(draftRuleset?'GUARDAR PERFIL PERSONALIZADO':currentProfile?'GUARDAR CAMBIOS':'GUARDAR PERFIL PERSONALIZADO'))}</button>${!draftRuleset&&currentProfile?`<button class="button button-danger settings-delete" type="button" data-action="delete-profile" data-profile="${esc(currentProfile.id)}" ${locked?'disabled':''}>${esc(t('ELIMINAR PERFIL'))}</button>`:''}</form>`:`<div class="duration-grid">${durations.map(([key,label,value,unit])=>`<div class="duration-readout"><span>${esc(label)}</span><strong>${value}${unit?` <small>${unit}</small>`:''}</strong></div>`).join('')}</div><p>${esc(t('Elegí “PERSONALIZADO · Crear perfil” para cambiar los valores y guardarlos en el desplegable.'))}</p>`}</section>
      ${locked?`<p class="settings-locked">${esc(t('El partido ya comenzó. Prepará un nuevo partido para cambiar el reglamento o sus tiempos.'))}</p>`:''}
      <p class="settings-source">${esc(t('Referencias:'))} <a href="https://rules.wfdf.sport/" target="_blank" rel="noreferrer">WFDF</a> · <a href="https://usaultimate.org/rules/" target="_blank" rel="noreferrer">USA Ultimate</a>.</p>
    </section>`;
  }
  function durationField(key,label,value,unit,locked,plain=false){return `<div class="field duration-field"><label for="duration-${key}">${esc(label)}${unit?` · ${unit}`:''}</label><input id="duration-${key}" name="${key}" ${plain?'type="text" autocomplete="off"':`type="number" min="1" max="${key==='timeoutsPerTeam'?20:1440}" step="1"`} inputmode="numeric" pattern="[0-9]*" data-numeric="int" value="${value}" required ${locked?'disabled':''}></div>`;}
  function durationRows(config){return [['gameCap',t('Tiempo total del partido'),Math.round(config.gameCap/60),'min'],['halfCap',t('Primer tiempo'),Math.round(config.halfCap/60),'min'],['halftime',t('Medio tiempo'),Math.round(config.halftime/60),'min'],['call','Llamado',config.call.restart,'s'],['timeout','Time out',config.timeoutDuration,'s'],['timeoutsPerTeam',t('Time outs por equipo y por tiempo'),config.timeoutsPerTeam,'']];}

  function langSwitch() {
    return `<div class="mode-switch lang-switch" role="group" aria-label="Idioma / Language">${[['es','ESPAÑOL'],['en','ENGLISH']].map(([id,label])=>`<button type="button" data-action="set-lang" data-lang="${id}" lang="${id}" aria-pressed="${lang===id}">${label}</button>`).join('')}</div>`;
  }
  /* Pop up de inicio en tres pantallas: 1 equipos, 2 perfil de tiempo, 3 tiempos personalizados. */
  const WELCOME_STEPS=['teams','profile','custom'];
  let welcomeStep='teams';
  function profileChoices() {return [{id:'wfdf',name:'WFDF 2025–2028'},{id:'usau',name:'USA Ultimate 2026–2027'},...state.customRulesets.map(p=>({id:p.id,name:p.name}))];}
  function profileConfig(id) {const profile=state.customRulesets.find(p=>p.id===id);return clone(profile?profile.config:E.defaults[id]||E.defaults.wfdf);}
  /* Con un torneo cargado, cada equipo del partido se puede elegir de la lista (nombre, color y jugadores). */
  function tournamentPicker(team,pick) {
    const teams=state.tournament?.teams||[];if(!teams.length)return '';
    return `<select class="tournament-pick" name="tid-${pick}" data-pick-team="${pick}" aria-label="${esc(t('Equipo del torneo'))}"><option value="">${esc(t('Equipo libre (escribir a mano)'))}</option>${teams.map(x=>`<option value="${esc(x.id)}" ${x.id===team.tid?'selected':''}>${esc(x.name)}</option>`).join('')}</select>`;
  }
  function linkTournamentTeam(team,id) {team.tid=state.tournament?.teams.some(x=>x.id===id)?id:'';}
  function teamSetupMarkup(teams) {
    return teams.map((team,i)=>`<div class="team-setup" role="group" aria-labelledby="team-setup-${i}" style="${teamStyle(team)}"><span class="team-setup-label" id="team-setup-${i}">${esc(t('Equipo {n}',{n:i+1}))}</span>${tournamentPicker(team,i)}<input name="name-${i}" value="${esc(team.name)}" maxlength="30" autocomplete="off" aria-label="${esc(t('Nombre del equipo {n}',{n:i+1}))}" ${i===0?'autofocus':''}><div class="team-setup-colors">${TEAM_PRESETS.map(c=>`<button type="button" class="color-preset${c===team.color?' active':''}" style="background:${c};color:${E.ink(c)}" data-action="setup-color" data-team="${i}" data-color="${c}" aria-label="${esc(t('Elegir color {color}',{color:c}))}" aria-pressed="${c===team.color}"></button>`).join('')}<label class="color-custom" title="${esc(t('Elegí cualquier color'))}"><span aria-hidden="true">＋</span><input type="color" name="color-${i}" value="${esc(team.color)}" data-setup-team="${i}" aria-label="${esc(t('Elegí cualquier color'))}"></label></div></div>`).join('');
  }
  function applyTeamsForm(form) {
    const data=new FormData(form);
    activeMatch().teams.forEach((team,i)=>{team.name=String(data.get(`name-${i}`)||'').trim()||t('Equipo {n}',{n:i+1});const color=String(data.get(`color-${i}`)||'');if(isHexColor(color))team.color=color;linkTournamentTeam(team,String(data.get(`tid-${i}`)||''));});
    saveState();
  }
  function openWelcome(step=welcomeStep) {
    if(hasStarted()||isLocked())return;
    welcomeStep=WELCOME_STEPS.includes(step)?step:'teams';
    const index=WELCOME_STEPS.indexOf(welcomeStep),m=activeMatch();
    const steps=`<p class="welcome-step" aria-hidden="true">${esc(t('PASO {n} DE {total}',{n:index+1,total:WELCOME_STEPS.length}))}</p>`;
    const back=`<button class="button welcome-back" type="button" data-action="welcome-back">← ${esc(t('ATRÁS'))}</button>`;
    let title,body;
    if(welcomeStep==='teams'){
      title=t('Te damos la bienvenida');
      body=`<div class="welcome-hero">${LOGO_SVG}<div><strong class="info-name">ULTIMATE CLOCK</strong><p>${esc(t('Reloj, goles, llamados, pull, time outs y planilla de tu partido. Gratis y sin internet.'))}</p></div></div>${langSwitch()}${steps}<form data-form="welcome-teams" class="teams-setup welcome-flow"><p>${esc(t('Escribí el nombre y elegí el color de cada equipo.'))}</p>${teamSetupMarkup(m.teams)}<div class="modal-actions"><button class="button button-primary" type="submit">${esc(t('SIGUIENTE'))} →</button></div></form>`;
    } else if(welcomeStep==='profile') {
      const current=profileChoices().some(p=>p.id===selectedProfileId)?selectedProfileId:state.settings.ruleset;
      selectedProfileId=current;
      title=t('Perfil de tiempo');
      body=`<div class="welcome-flow">${steps}<p>${esc(t('Elegí los tiempos para este partido antes de empezar.'))}</p><div class="profile-choices">${profileChoices().map(p=>{const custom=!['wfdf','usau'].includes(p.id);return `<div class="profile-row${custom?' is-custom':''}"><button class="profile-choice ${p.id===current?'active':''}" type="button" data-action="select-profile" data-profile="${esc(p.id)}" aria-pressed="${p.id===current}"><strong>${esc(p.name)}</strong><span>${esc(t(p.id===current?'SELECCIONADO':'ELEGIR'))}</span></button>${custom?`<button class="profile-delete" type="button" data-action="delete-profile" data-profile="${esc(p.id)}" aria-label="${esc(t('Eliminar el perfil {name}',{name:p.name}))}">${esc(t('ELIMINAR'))}</button>`:''}</div>`;}).join('')}</div><div class="profile-actions"><button class="button profile-continue" type="button" data-action="use-profile" autofocus>${esc(t('EMPEZAR'))}</button><button class="button profile-new" type="button" data-action="new-profile">${esc(t('TIEMPOS PERSONALIZADOS'))}</button>${back}</div></div>`;
    } else {
      title=t('Tiempos personalizados');
      body=`<form data-form="welcome-profile" class="welcome-flow" novalidate>${steps}<div class="field"><label for="profile-name">${esc(t('Nombre del perfil'))}</label><input id="profile-name" name="name" maxlength="40" autocomplete="off" placeholder="${esc(t('Ej.: Torneo local'))}" required></div><div class="duration-grid">${durationRows(profileConfig(selectedProfileId)).map(([key,label,value,unit])=>durationField(key,label,value,unit,false,true)).join('')}</div><button class="button button-primary" type="submit">${esc(t('GUARDAR PERFIL Y EMPEZAR'))}</button>${back}${storageNote(t('Este perfil se guarda en la sesión de este navegador y quedará disponible en la lista de perfiles. Si borrás sus datos, usás modo incógnito o cambiás de equipo, se pierde.'))}</form>`;
    }
    openModal(title,body);
  }
  /* Borra un perfil guardado. El partido en curso conserva sus tiempos; si no empezó y lo usaba, vuelve a WFDF. */
  function deleteProfile(id) {
    const index=state.customRulesets.findIndex(p=>p.id===id);if(index<0)return false;
    const started=hasStarted()&&!isLocked();
    if(started&&activeMatch().ruleset===id){showToast(t('Este perfil se usa en el partido actual. Prepará otro partido para eliminarlo.'));return false;}
    const [profile]=state.customRulesets.splice(index,1);
    /* Las planillas guardadas siguen mostrando el nombre del perfil. */
    for(const m of [state.activeMatch,...state.savedMatches])if(m&&m.ruleset===id)m.rulesetName=profile.name;
    if(state.settings.ruleset===id){state.settings.ruleset='wfdf';state.settings.baseRuleset='wfdf';state.settings.overrides={};if(!started&&!isLocked()){activeMatch().ruleset='wfdf';updateTimerConfig(activeMatch());}}
    if(selectedProfileId===id)selectedProfileId=state.settings.ruleset;
    saveState();showToast(t('Perfil {name} eliminado.',{name:profile.name}));
    return true;
  }
  function startWithProfile(id) {
    const profile=state.customRulesets.find(p=>p.id===id);
    if(!profile&&!['wfdf','usau'].includes(id))return;
    state.settings.ruleset=id;state.settings.baseRuleset=profile?'wfdf':id;state.settings.overrides=profile?clone(profile.config):{};
    activeMatch().ruleset=id;updateTimerConfig(activeMatch());saveState();renderDashboard();enterFullscreen();closeModal();
  }
  function storageNote(text=t('Perfiles y planillas se guardan solo en este navegador. Si borrás sus datos, usás modo incógnito o cambiás de equipo, se pierden. En iPhone, agregá la app a la pantalla de inicio. Exportá lo que quieras conservar.')) {
    return `<p class="storage-note"><span aria-hidden="true">🔒</span> ${esc(text)}</p>`;
  }

  function closeTutorial(){
    if(tutorialIndex<0)return;
    tutorialIndex=-1;
    tutorialRoot.innerHTML='';
    document.querySelector('.app-shell').inert=false;
    document.querySelector('.menu-button')?.focus({preventScroll:true});
  }

  function positionTutorial(){
    if(tutorialIndex<0)return;
    const target=document.querySelector(TUTORIAL_STEPS[tutorialIndex].target);
    if(!target){closeTutorial();return;}
    const rect=target.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.innerHeight,pad=6;
    const left=Math.max(6,Math.floor(rect.left-pad)),top=Math.max(6,Math.floor(rect.top-pad));
    const right=Math.min(vw-6,Math.ceil(rect.right+pad)),bottom=Math.min(vh-6,Math.ceil(rect.bottom+pad));
    const box={left,top,width:right-left,height:bottom-top};
    const regions={top:[0,0,vw,top],bottom:[0,bottom,vw,vh-bottom],left:[0,top,left,bottom-top],right:[right,top,vw-right,bottom-top]};
    for(const [side,[x,y,w,h]] of Object.entries(regions)){
      const shade=tutorialRoot.querySelector(`[data-tour-shade="${side}"]`);
      Object.assign(shade.style,{left:`${x}px`,top:`${y}px`,width:`${Math.max(0,w)}px`,height:`${Math.max(0,h)}px`});
    }
    const highlight=tutorialRoot.querySelector('.tour-highlight');
    Object.assign(highlight.style,{left:`${box.left}px`,top:`${box.top}px`,width:`${box.width}px`,height:`${box.height}px`});
    const card=tutorialRoot.querySelector('.tour-card'),cw=card.offsetWidth,ch=card.offsetHeight,gap=12,margin=8;
    const clamp=(value,min,max)=>Math.max(min,Math.min(value,max));
    const centeredX=clamp((left+right-cw)/2,margin,vw-cw-margin);
    const centeredY=clamp((top+bottom-ch)/2,margin,vh-ch-margin);
    let placement,x,y;
    if(bottom+gap+ch<=vh-margin){placement='below';x=centeredX;y=bottom+gap;}
    else if(top-gap-ch>=margin){placement='above';x=centeredX;y=top-gap-ch;}
    else if(right+gap+cw<=vw-margin){placement='right';x=right+gap;y=centeredY;}
    else if(left-gap-cw>=margin){placement='left';x=left-gap-cw;y=centeredY;}
    else {placement='floating';x=centeredX;y=Math.max(margin,vh-ch-margin);}
    card.dataset.placement=placement;
    Object.assign(card.style,{left:`${x}px`,top:`${y}px`});
  }

  function showTutorialStep(index){
    if(index>=TUTORIAL_STEPS.length){closeTutorial();return;}
    tutorialIndex=Math.max(0,index);
    const step=TUTORIAL_STEPS[tutorialIndex],last=tutorialIndex===TUTORIAL_STEPS.length-1;
    tutorialRoot.innerHTML=`<div class="tour-layer"><div class="tour-shade" data-tour-shade="top"></div><div class="tour-shade" data-tour-shade="bottom"></div><div class="tour-shade" data-tour-shade="left"></div><div class="tour-shade" data-tour-shade="right"></div><div class="tour-highlight" aria-hidden="true"></div><section class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tourTitle" aria-describedby="tourDescription"><div class="tour-card-top"><span>${esc(t('PASO {n} DE {total}',{n:tutorialIndex+1,total:TUTORIAL_STEPS.length}))}</span><button type="button" data-action="tour-close" aria-label="${esc(t('Cerrar tutorial'))}">×</button></div><h2 id="tourTitle">${esc(t(step.title))}</h2><p id="tourDescription">${esc(t(step.text))}</p><div class="tour-actions"><button type="button" data-action="tour-prev" ${tutorialIndex===0?'disabled':''}>${esc(t('ANTERIOR'))}</button><button type="button" data-action="tour-next">${esc(t(last?'TERMINAR':'SIGUIENTE →'))}</button></div></section></div>`;
    requestAnimationFrame(()=>{positionTutorial();tutorialRoot.querySelector('[data-action="tour-next"]')?.focus({preventScroll:true});});
  }

  function startTutorial(){
    closeModal();
    if(!app.querySelector('.dashboard-screen'))renderDashboard();
    document.querySelector('.app-shell').inert=true;
    showTutorialStep(0);
  }

  function openModal(title,body) {
    if(tutorialIndex>=0)closeTutorial();
    const previous=document.activeElement;closeModal();modalRoot._returnFocus=previous;
    modalRoot.innerHTML=`<dialog class="modal" aria-labelledby="modalTitle"><header class="modal-header"><h2 class="modal-title" id="modalTitle">${esc(title)}</h2><button class="modal-close" data-action="close-modal" aria-label="${esc(t('Cerrar'))}">×</button></header><div class="modal-body">${body}</div></dialog>`;
    const dialog=modalRoot.querySelector('dialog');dialog.showModal();dialog.addEventListener('cancel',e=>{e.preventDefault();closeModal();});
    if(!dialog.querySelector('[autofocus]'))(dialog.querySelector('.modal-body .button-primary')||dialog.querySelector('.modal-body button'))?.focus({preventScroll:true});
  }

  function closeModal() {if(pendingCall!==null){const index=pendingCall,choice=modalRoot.querySelector('[data-form="call"] input[name="type"]:checked')?.value;pendingCall=null;registerCall(index,choice);}modalRoot.querySelector('dialog')?.close();modalRoot.innerHTML='';if(modalRoot._returnFocus?.isConnected)modalRoot._returnFocus.focus();}

  function openInfo() {
    const donate=DONATION_URL?`<a class="button info-donate" href="${esc(DONATION_URL)}" target="_blank" rel="noopener noreferrer">♥ ${esc(t('DONÁ PARA APOYAR EL PROYECTO'))} ↗</a>`:`<button class="button info-donate" type="button" data-action="donation-info">♥ ${esc(t('DONÁ PARA APOYAR EL PROYECTO'))}</button>`;
    openModal(t("Sobre Ultimate Clock"), `<div class="info-hero">${LOGO_SVG}<div><strong class="info-name">ULTIMATE CLOCK</strong><p>${esc(t('Un tablero para llevar los tiempos y la planilla del partido desde la línea de juego.'))}</p></div></div><div class="info-copy"><p><strong>${esc(t('Desarrollado por Juan Martínez García.'))}</strong> ${esc(t('Esta app es gratuita para la comunidad del Ultimate Frisbee.'))}</p></div>${storageNote()}<div class="info-links"><a class="button button-primary" href="${WEBSITE_URL}" target="_blank" rel="noopener noreferrer">${esc(t('VISITÁ MI SITIO WEB ↗'))}</a>${donate}<a class="button info-ufm" href="https://www.instagram.com/ultimatefrisbeemza/" target="_blank" rel="noopener noreferrer">${esc(t('CONOCÉ ULTIMATE FRISBEE MENDOZA ↗'))}</a></div>`);
  }

  function addGoal(teamIndex,origin='dashboard') {
    const m=activeMatch(),team=m.teams[teamIndex];if(!team)return;
    const goal={id:uid('goal'),elapsed:m.clock.elapsed,at:nowIso(),assist:'',scorer:''};
    team.score+=1;team.goals.push(goal);logEvent('goal',{team:teamIndex,goal:goal.id,assist:'',scorer:''});
    closeModal();saveState();rerender(origin);announce(t('Gol de {team}. {a} a {b}',{team:team.name,a:m.teams[0].score,b:m.teams[1].score}));
    openGoal(teamIndex,goal.id,origin,true);
  }
  function undoGoal(teamIndex,goalId,origin) {
    const m=activeMatch(),team=m.teams[teamIndex],at=team?.goals.findIndex(g=>g.id===goalId);
    if(!team||at<0){showToast(t('Ese gol ya no se puede deshacer.'));return;}
    team.goals.splice(at,1);team.score=Math.max(0,team.score-1);m.events=m.events.filter(e=>e.goal!==goalId);
    saveState();rerender(origin);showToast(t('Gol de {team} deshecho.',{team:team.name}));
  }
  function rerender(origin) { if(origin==='sheet')renderLiveSheet();else renderDashboard(); }
  /* Jugadores de la ficha del torneo para un equipo del partido (vacío si no está vinculado). */
  function rosterFor(team) {return TN.sortPlayers(state.tournament?.teams.find(x=>x.id===team?.tid)?.players||[]);}
  /* Lista para elegir quién dio el pase / hizo el gol; "Otro" deja escribir un nombre a mano. */
  function personPicker(key,label,roster,goal,autofocus) {
    const known=roster.some(p=>p.id===goal[key+'Id']),other=!known&&!!goal[key];
    return `<div class="field"><label for="${key}-pick">${esc(label)}</label><select id="${key}-pick" name="${key}-pick" data-person="${key}" ${autofocus?'autofocus':''}><option value="">${esc(t('Sin dato'))}</option>${roster.map(p=>`<option value="${esc(p.id)}" ${known&&p.id===goal[key+'Id']?'selected':''}>${esc(TN.playerLabel(p))}</option>`).join('')}<option value="__other" ${other?'selected':''}>${esc(t('Otro (escribir)'))}</option></select><input id="${key}" name="${key}" autocomplete="off" maxlength="40" value="${esc(other?goal[key]:'')}" placeholder="${esc(t('Escribí el nombre'))}" ${other?'':'hidden'}></div>`;
  }
  /* Lee los campos de pase y gol del cuadro de gol, con o sin ficha de jugadores. */
  function readPerson(data,key,roster) {
    const pick=data.get(key+'-pick');
    if(pick===null)return {name:String(data.get(key)||'').trim(),id:''};
    const player=roster.find(p=>p.id===pick);
    if(player)return {name:TN.playerLabel(player),id:player.id};
    return {name:pick==='__other'?String(data.get(key)||'').trim():'',id:''};
  }
  /* fresh: opened right after the goal, so it also offers to undo it. */
  function openGoal(teamIndex,goalId,origin='dashboard',fresh=false) {
    const team = activeMatch().teams[teamIndex],goal=team?.goals.find(g=>g.id===goalId);
    if(!goal)return;
    const roster=rosterFor(team);
    const field=(key,label,hint)=>roster.length?personPicker(key,label,roster,goal,key==='assist'):`<div class="field"><label for="${key}">${esc(label)}</label><input id="${key}" name="${key}" autocomplete="off" value="${esc(goal[key])}" placeholder="${esc(hint)}" ${key==='assist'?'autofocus':''}></div>`;
    openModal(t("Detalle del gol"), `<p class="goal-note">${t('Gol de <strong>{team}</strong> a los {time}. Los dos campos son opcionales.',{team:esc(team.name),time:fmt(goal.elapsed)})}</p><form data-form="goal" data-team="${teamIndex}" data-goal="${esc(goalId)}" data-origin="${esc(origin)}">${field('assist',t('Pase'),t('Quién dio el pase gol'))}${field('scorer',t('Gol'),t('Quién recibió y anotó'))}<div class="modal-actions">${fresh?`<button class="button button-danger" type="button" data-action="undo-goal" data-team="${teamIndex}" data-goal="${esc(goalId)}" data-origin="${esc(origin)}">${esc(t('DESHACER GOL'))}</button>`:''}<button class="button" type="button" data-action="close-modal">${esc(t(fresh?'OMITIR':'Cancelar'))}</button><button class="button button-primary" type="submit">${esc(t('Guardar detalle'))}</button></div></form>`);
  }

  function openMinus(teamIndex) {
    const team = activeMatch().teams[teamIndex];
    openModal(t("Corregir puntaje"), `<p>${t('¿Querés restar un punto a <strong>{team}</strong>? La corrección queda registrada como ajuste manual.',{team:esc(team.name)})}</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-danger" type="button" data-action="confirm-minus" data-team="${teamIndex}">${esc(t('Restar punto'))}</button></div>`);
  }

  /* Every new game asks for both teams' names and colors, prefilled with the previous ones. */
  const TEAM_PRESETS=['#1b47e2','#f59e0b','#16a34a','#c62525','#16171b','#ffffff'];
  function openTeamsSetup() {
    if(hasStarted()||isLocked())return;
    const teams=activeMatch().teams;
    openModal(t('Equipos del partido'),`<form data-form="teams" class="teams-setup"><p>${esc(t('Escribí el nombre y elegí el color de cada equipo.'))}</p>${teamSetupMarkup(teams)}<div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('OMITIR'))}</button><button class="button button-primary" type="submit">${esc(t('LISTO'))}</button></div></form>`);
  }
  function setSetupColor(index,color) {
    const fieldset=document.querySelectorAll('.team-setup')[index],input=fieldset?.querySelector(`[name="color-${index}"]`);if(!input)return;
    input.value=color;fieldset.style.setProperty('--team-color',color);fieldset.style.setProperty('--team-ink',contrastColor(color));
    fieldset.querySelectorAll('.color-preset').forEach(b=>{const on=b.dataset.color===color.toLowerCase();b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
  }
  function openTeamEditor(teamIndex) {
    const team = activeMatch().teams[teamIndex];
    const ink = contrastColor(team.color);
    openModal(t('Equipo {n}',{n:teamIndex + 1}), `<form data-form="team" data-team="${teamIndex}">${state.tournament?.teams.length?`<div class="field"><label>${esc(t('Equipo del torneo'))}</label>${tournamentPicker(team,'edit').replace('data-pick-team','name="tid" data-pick-team')}</div>`:''}<div class="field"><label for="team-name">${esc(t('Nombre del equipo'))}</label><input id="team-name" name="name" value="${esc(team.name)}" maxlength="30" autocomplete="off"></div><div class="team-color-options">${['#1b47e2','#f59e0b','#16a34a','#c62525','#16171b','#ffffff'].map(c=>`<button type="button" class="color-preset" style="background:${c};color:${E.ink(c)}" data-action="team-color" data-color="${c}" aria-label="${esc(t('Elegir color {color}',{color:c}))}">●</button>`).join('')}</div><button class="button more-colors" type="button" data-action="more-colors">${esc(t('MÁS COLORES'))}</button><div class="field extended-colors" id="extendedColors" hidden><label for="team-color">${esc(t('Elegí cualquier color'))}</label><input id="team-color" name="color" type="color" value="${esc(team.color)}"></div><div class="color-preview" id="colorPreview" style="background:${esc(team.color)};color:${ink}">${esc(t('Vista previa del equipo'))}</div><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-primary" type="submit">${esc(t('Guardar equipo'))}</button></div></form>`);
  }

  function openChangelog() {
    const {VERSION,ENTRIES}=UCChangelog,date=new Intl.DateTimeFormat(lang==='en'?'en-US':'es-AR',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
    openModal(t('Novedades'),`<p class="changelog-current">${esc(t('Estás usando la versión {v}.',{v:VERSION}))}</p><ol class="changelog">${ENTRIES.map(e=>`<li><div class="changelog-head">${e.version?`<strong>v${e.version}</strong>`:''}<time datetime="${e.date}">${esc(date.format(new Date(e.date)))}</time></div><ul>${(e[lang]||e.es).map(item=>`<li>${esc(item)}</li>`).join('')}</ul></li>`).join('')}</ol>`);
  }
  function openReset() {
    openModal(t("Reiniciar contadores"), `<p>${esc(t('¿Reiniciar todos los contadores? Se reinician tiempos, puntajes y eventos sin guardar del partido actual. El historial guardado y los perfiles no se borrarán.'))}</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-danger" type="button" data-action="confirm-reset">${esc(t('Reiniciar contadores'))}</button></div>`);
  }

  function openSheet(match) {
    const events=match.events.map(e=>`<li><time>${dateLabel(e.at)}<br>${fmt(e.elapsed||0)}</time><span>${esc(SheetExport.describeEvent(match,e,t))}</span></li>`).join('');
    openModal(t('Planilla guardada'),`<p>${dateLabel(match.savedAt)} · ${esc(rulesetLabel(match.ruleset,match))} · ${esc(t(match.themeName||'Claro'))}</p><h3 class="sheet-title">${esc(match.teams[0].name)} ${match.teams[0].score} — ${match.teams[1].score} ${esc(match.teams[1].name)}</h3><div class="sheet-grid"><div class="sheet-stat"><b>${fmt(match.clock.elapsed)}</b><span>${esc(t('Duración'))}</span></div><div class="sheet-stat"><b>${match.events.filter(e=>e.type==='timeout').length}</b><span>${esc(t('Time-outs'))}</span></div><div class="sheet-stat"><b>${match.events.length}</b><span>${esc(t('Eventos'))}</span></div></div><p>${esc(t('Colores:'))} ${match.teams.map(t=>`<span class="sheet-team" style="background:${esc(t.color)};color:${E.ink(t.color)}">${esc(t.name)} · ${esc(t.color)}</span>`).join(' ')}</p><details><summary>${esc(t('Configuración del partido'))}</summary><pre>${esc(JSON.stringify(match.config,null,2))}</pre></details><ul class="event-list">${events||`<li>${esc(t('Sin eventos'))}</li>`}</ul><h3 class="section-kicker">${esc(t('EXPORTAR'))}</h3>${exportButtons(match,t('Exportar esta planilla'))}`);
  }

  function saveMatch() {
    const m=activeMatch();if(m.status==='saved'){showToast(t('Este partido ya está guardado.'));renderLiveSheet();return true;}
    if(Object.values(m.timers).some(t=>t.running)||m.breakTimer.running){closeModal();showToast(t('Esperá a que terminen las cuentas activas antes de guardar.'));return false;}
    updateClock();for(const t of [...Object.values(m.timers),m.breakTimer]){updateRunningValue(t);t.running=false;t.startedAt=null;}
    m.clock.running=false;m.clock.startedAt=null;m.clock.status='Finalizado';logEvent('saved');m.status='saved';m.savedAt=nowIso();m.themeName=themeName(state.settings.theme);m.themeSnapshot=currentThemeVars();
    state.savedMatches.unshift(clone(m));
    const persisted=saveState();showToast(t(persisted?'Planilla guardada. Partido cerrado.':'Planilla en memoria. Descargá un respaldo para conservarla.'));renderLiveSheet();
    return true;
  }

  function resetMatch() {
    const teams=state.activeMatch?.teams.map(({name,color})=>({name,color}));
    state.activeMatch = makeMatch(state.settings.ruleset);
    if(teams)state.activeMatch.teams.forEach((team,i)=>Object.assign(team,teams[i]));
    state.pendingAlerts=[];ClockAlerts.clear();
    saveState();
    closeModal();
    renderDashboard();
    showToast(t("Contadores reiniciados."));
  }

  function profileFromForm(form,base) {
    const data=new FormData(form),name=String(data.get('name')||'').trim();
    const value=key=>{const raw=String(data.get(key)??'').trim();return /^\d+$/.test(raw)?Number(raw):NaN;};
    const fields=['gameCap','halfCap','halftime','call','timeout','timeoutsPerTeam'];
    if(!name||fields.some(key=>!Number.isInteger(value(key))||value(key)<1)){showToast(t('Completá el nombre y todos los tiempos con números enteros positivos.'));return null;}
    const config=clone(base);config.label=name;config.gameCap=Math.round(value('gameCap')*60);config.halfCap=Math.round(value('halfCap')*60);config.halftime=Math.round(value('halftime')*60);config.call.restart=value('call');config.timeoutDuration=value('timeout');config.timeoutLimit=value('timeout');config.timeoutsPerTeam=value('timeoutsPerTeam');config.interruption='continue';
    const error=E.validate(config);if(error){showToast(t(error));return null;}
    return {name,config};
  }
  function saveRulesetProfile(form) {
    const active=hasStarted()||isLocked();
    if(active&&form.dataset.profile){showToast(t('Prepará un nuevo partido para cambiar los tiempos.'));return;}
    const made=profileFromForm(form,getRuleset());if(!made)return;
    const {name,config}=made;
    let profile=state.customRulesets.find(p=>p.id===form.dataset.profile);
    if(profile){profile.name=name;profile.config=clone(config);}else{profile={id:uid('profile'),name,config:clone(config)};state.customRulesets.push(profile);}
    if(!active){state.settings.ruleset=profile.id;state.settings.baseRuleset='wfdf';state.settings.overrides=clone(config);activeMatch().ruleset=profile.id;updateTimerConfig(activeMatch());}
    draftRuleset=false;saveState();renderDashboard();showToast(t(active?'Perfil {name} guardado para el próximo partido.':'Perfil {name} guardado.',{name}));
  }
  function saveWelcomeProfile(form) {
    if(hasStarted()||isLocked()){closeModal();return;}
    const made=profileFromForm(form,profileConfig(selectedProfileId));if(!made)return;
    const profile={id:uid('profile'),name:made.name,config:clone(made.config)};
    state.customRulesets.push(profile);selectedProfileId=profile.id;
    startWithProfile(profile.id);showToast(t('Perfil {name} guardado.',{name:made.name}));
  }

  /* ---- Modo torneo: equipos con jugadores cargados de antemano, guardados en este dispositivo ---- */
  const tournamentTeam=id=>state.tournament?.teams.find(x=>x.id===id);
  function renderTournament() {
    const tour=state.tournament;
    if(!tour){
      app.innerHTML=`<section class="tournament-screen"><div class="screen-head"><button class="back-button" data-action="back-dashboard">← ${esc(t('Tablero'))}</button><div><span class="screen-eyebrow">${esc(t('MODO TORNEO'))}</span><h1>${esc(t('Torneo'))}</h1></div></div>
        <section class="settings-section"><p>${esc(t('Cargá los equipos y sus jugadores una sola vez. Al empezar un partido elegís los equipos de la lista y, al anotar un gol, elegís quién dio el pase y quién lo hizo. El número de camiseta es opcional.'))}</p>
        <form data-form="t-create"><div class="field"><label for="t-name">${esc(t('Nombre del torneo'))}</label><input id="t-name" name="name" maxlength="${TN.LIMITS.name}" autocomplete="off" placeholder="${esc(t('Ej.: Copa Otoño'))}" required></div><button class="button button-primary" type="submit">${esc(t('CREAR TORNEO'))}</button></form>
        ${storageNote(t('El torneo se guarda solo en este navegador. Exportalo para llevarlo a otro dispositivo o conservarlo.'))}</section>
        <section class="settings-section"><div class="section-heading"><h2>${esc(t('¿Ya tenés un torneo?'))}</h2></div><button class="button" type="button" data-action="t-import">${esc(t('IMPORTAR ARCHIVO DE TORNEO'))}</button></section><input type="file" id="tournamentFile" accept=".json,application/json" hidden></section>`;
      return;
    }
    const played=TN.tournamentMatches(tour,state.savedMatches).length,rows=TN.stats(tour,state.savedMatches);
    const teamRows=tour.teams.map(team=>`<button class="tournament-team" type="button" data-action="t-open-team" data-team="${esc(team.id)}" style="${teamStyle(team)}"><strong>${esc(team.name)}</strong><span>${team.players.length} ${esc(t(team.players.length===1?'jugador':'jugadores'))}</span></button>`).join('');
    app.innerHTML=`<section class="tournament-screen"><div class="screen-head"><button class="back-button" data-action="back-dashboard">← ${esc(t('Tablero'))}</button><div><span class="screen-eyebrow">${esc(t('MODO TORNEO'))}</span><h1>${esc(tour.name)}</h1></div></div>
      <section class="settings-section"><div class="section-heading"><h2>${esc(t('Equipos'))}</h2><span>${tour.teams.length}</span></div>
        ${teamRows?`<div class="tournament-teams">${teamRows}</div>`:`<p>${esc(t('Todavía no hay equipos. Agregá el primero.'))}</p>`}
        <form data-form="t-addteam" class="tournament-add"><div class="field"><label for="t-team-name">${esc(t('Nombre del equipo'))}</label><input id="t-team-name" name="name" maxlength="${TN.LIMITS.name}" autocomplete="off" required></div><div class="field"><label for="t-team-color">${esc(t('Color'))}</label><input id="t-team-color" name="color" type="color" value="${TEAM_PRESETS[tour.teams.length%TEAM_PRESETS.length]}"></div><button class="button button-primary" type="submit">＋ ${esc(t('AGREGAR EQUIPO'))}</button></form></section>
      <section class="settings-section"><div class="section-heading"><h2>${esc(t('Goleadores y pases'))}</h2><span>${played} ${esc(t(played===1?'PARTIDO GUARDADO':'PARTIDOS GUARDADOS'))}</span></div>
        ${rows.length?`<table class="tournament-stats"><thead><tr><th>${esc(t('Jugador'))}</th><th>${esc(t('Goles'))}</th><th>${esc(t('Pases'))}</th></tr></thead><tbody>${rows.slice(0,20).map(r=>`<tr><td><span class="dot" style="background:${esc(r.team.color)}"></span>${esc(TN.playerLabel(r.player))} <small>${esc(r.team.name)}</small></td><td>${r.goals}</td><td>${r.assists}</td></tr>`).join('')}</tbody></table>`:`<p>${esc(t('Todavía no hay goles de jugadores de la lista. Aparecen al guardar partidos donde elegiste jugadores.'))}</p>`}</section>
      <section class="settings-section"><div class="section-heading"><h2>${esc(t('Archivo del torneo'))}</h2><span>JSON · CSV</span></div><p>${esc(t('El archivo incluye equipos, jugadores y los partidos guardados del torneo.'))}</p>
        <div class="export-actions"><button class="button button-primary" type="button" data-action="t-export">${esc(t('EXPORTAR TORNEO'))}</button><button class="button" type="button" data-action="t-export-csv">CSV</button><button class="button" type="button" data-action="t-import">${esc(t('IMPORTAR'))}</button></div><input type="file" id="tournamentFile" accept=".json,application/json" hidden>
        <div class="tournament-danger"><button class="button" type="button" data-action="t-rename">${esc(t('CAMBIAR NOMBRE'))}</button><button class="button button-danger" type="button" data-action="t-delete">${esc(t('ELIMINAR TORNEO'))}</button></div>${storageNote(t('El torneo se guarda solo en este navegador. Exportalo para llevarlo a otro dispositivo o conservarlo.'))}</section></section>`;
  }
  /* Ficha de un equipo: datos, jugadores y formularios para agregarlos uno a uno o pegando una lista. */
  function openTournamentTeam(teamId,focus) {
    const team=tournamentTeam(teamId);if(!team)return;
    const players=TN.sortPlayers(team.players);
    openModal(t('Ficha del equipo'),`<form data-form="t-editteam" data-team="${esc(team.id)}" class="tournament-add"><div class="field"><label for="t-edit-name">${esc(t('Nombre del equipo'))}</label><input id="t-edit-name" name="name" maxlength="${TN.LIMITS.name}" value="${esc(team.name)}" autocomplete="off" required></div><div class="field"><label for="t-edit-color">${esc(t('Color'))}</label><input id="t-edit-color" name="color" type="color" value="${esc(team.color)}"></div><button class="button" type="submit">${esc(t('GUARDAR EQUIPO'))}</button></form>
      <h3 class="section-kicker">${esc(t('JUGADORES'))} · ${players.length}/${TN.LIMITS.players}</h3>
      ${players.length?`<ul class="tournament-players">${players.map(p=>`<li><button type="button" class="player-edit" data-action="t-edit-player" data-team="${esc(team.id)}" data-player="${esc(p.id)}" aria-label="${esc(t('Editar a {name}',{name:p.name}))}"><b>${p.number!==''?esc(p.number):'–'}</b><span>${esc(p.name)}</span></button><button type="button" class="player-remove" data-action="t-del-player" data-team="${esc(team.id)}" data-player="${esc(p.id)}" aria-label="${esc(t('Quitar a {name}',{name:p.name}))}">×</button></li>`).join('')}</ul>`:`<p>${esc(t('Todavía no hay jugadores.'))}</p>`}
      <form data-form="t-player" data-team="${esc(team.id)}" class="tournament-player-form"><input type="hidden" name="player" value=""><div class="field"><label for="t-player-name">${esc(t('Nombre del jugador'))}</label><input id="t-player-name" name="name" maxlength="${TN.LIMITS.name}" autocomplete="off" required ${focus==='player'?'autofocus':''}></div><div class="field"><label for="t-player-number">${esc(t('Número (opcional)'))}</label><input id="t-player-number" name="number" inputmode="numeric" maxlength="${TN.LIMITS.number}" autocomplete="off" data-numeric="1"></div><button class="button button-primary" type="submit">＋ ${esc(t('AGREGAR JUGADOR'))}</button></form>
      <details class="tournament-paste"><summary>${esc(t('Pegar una lista de jugadores'))}</summary><form data-form="t-paste" data-team="${esc(team.id)}"><p>${esc(t('Uno por línea: "7 Ana", "Ana 7" o solo "Ana".'))}</p><textarea name="list" rows="6" aria-label="${esc(t('Lista de jugadores'))}"></textarea><button class="button" type="submit">${esc(t('AGREGAR LISTA'))}</button></form></details>
      <div class="modal-actions"><button class="button button-danger" type="button" data-action="t-del-team" data-team="${esc(team.id)}">${esc(t('ELIMINAR EQUIPO'))}</button><button class="button" type="button" data-action="close-modal">${esc(t('CERRAR'))}</button></div>`);
  }
  function afterTournamentChange(teamId,focus) {saveState();renderTournament();if(teamId)openTournamentTeam(teamId,focus);}
  let pendingTournamentImport=null;
  function tournamentAction(action,el) {
    if(!action.startsWith('t-'))return false;
    const tour=state.tournament,team=tournamentTeam(el.dataset.team);
    if(action==='t-open-team')openTournamentTeam(el.dataset.team);
    else if(action==='t-edit-player'){
      const p=team?.players.find(x=>x.id===el.dataset.player),form=modalRoot.querySelector('[data-form="t-player"]');if(!p||!form)return true;
      form.elements.player.value=p.id;form.elements.name.value=p.name;form.elements.number.value=p.number;form.querySelector('button[type="submit"]').textContent=t('GUARDAR JUGADOR');form.elements.name.focus();
    }
    else if(action==='t-del-player'&&team){team.players=team.players.filter(x=>x.id!==el.dataset.player);afterTournamentChange(team.id);}
    else if(action==='t-del-team'&&team)openModal(t('Eliminar equipo'),`<p>${esc(t('¿Eliminar {name} y sus jugadores? Los partidos guardados no se borran.',{name:team.name}))}</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-danger" type="button" data-action="t-confirm-del-team" data-team="${esc(team.id)}">${esc(t('ELIMINAR EQUIPO'))}</button></div>`);
    else if(action==='t-confirm-del-team'&&team){tour.teams=tour.teams.filter(x=>x.id!==team.id);closeModal();afterTournamentChange();}
    else if(action==='t-rename'&&tour)openModal(t('Cambiar nombre'),`<form data-form="t-rename"><div class="field"><label for="t-rename-name">${esc(t('Nombre del torneo'))}</label><input id="t-rename-name" name="name" maxlength="${TN.LIMITS.name}" value="${esc(tour.name)}" autocomplete="off" required autofocus></div><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-primary" type="submit">${esc(t('Guardar'))}</button></div></form>`);
    else if(action==='t-delete'&&tour)openModal(t('Eliminar torneo'),`<p>${esc(t('¿Eliminar el torneo {name}, sus equipos y jugadores? Las planillas guardadas no se borran. Exportá el torneo antes si querés conservarlo.',{name:tour.name}))}</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-danger" type="button" data-action="t-confirm-delete">${esc(t('ELIMINAR TORNEO'))}</button></div>`);
    else if(action==='t-confirm-delete'){state.tournament=null;closeModal();saveState();renderTournament();showToast(t('Torneo eliminado.'));}
    else if(action==='t-export'&&tour)exportData(TN.exportPayload(tour,state.savedMatches),`${exportSlug(tour.name)}.json`);
    else if(action==='t-export-csv'&&tour)download(TN.statsCSV(tour,state.savedMatches,{team:t('equipo'),number:t('numero'),player:t('jugador'),goals:t('goles'),assists:t('pases')}),'text/csv;charset=utf-8',`${exportSlug(tour.name)}-${t('jugadores')}.csv`);
    else if(action==='t-import')document.getElementById('tournamentFile')?.click();
    else if(action==='t-confirm-import'){applyTournamentImport();closeModal();}
    else return false;
    return true;
  }
  const exportSlug=name=>String(name).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'torneo';
  function applyTournamentImport() {
    const file=pendingTournamentImport;pendingTournamentImport=null;if(!file)return;
    state.tournament=file.tournament;
    const known=new Set(state.savedMatches.map(m=>m.id));let added=0;
    for(const match of file.matches)if(!known.has(match.id)){state.savedMatches.push(match);added++;}
    state.savedMatches.sort((a,b)=>String(b.savedAt).localeCompare(String(a.savedAt)));
    saveState();renderTournament();showToast(t('Torneo {name} importado: {n} equipos y {m} partidos nuevos.',{name:file.tournament.name,n:file.tournament.teams.length,m:added}));
  }
  /* Lee el archivo elegido; si ya hay un torneo, pide confirmar antes de reemplazarlo. */
  async function importTournamentFile(file) {
    let parsed=null;
    try{if(file.size<=5e6)parsed=TN.parseFile(await file.text());}catch{}
    if(!parsed){showToast(t('Ese archivo no es un torneo de Ultimate Clock.'));return;}
    pendingTournamentImport=parsed;
    if(!state.tournament){applyTournamentImport();return;}
    openModal(t('Reemplazar torneo'),`<p>${esc(t('Ya tenés el torneo {name}. ¿Reemplazarlo por {other}? Las planillas guardadas se conservan.',{name:state.tournament.name,other:parsed.tournament.name}))}</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-primary" type="button" data-action="t-confirm-import">${esc(t('REEMPLAZAR'))}</button></div>`);
  }
  function tournamentSubmit(form,data,type) {
    if(!type.startsWith('t-'))return false;
    const tour=state.tournament,team=tournamentTeam(form.dataset.team);
    if(type==='t-create'){const created=TN.makeTournament(data.get('name'));if(created){state.tournament=created;saveState();renderTournament();showToast(t('Torneo creado. Agregá los equipos.'));document.getElementById('t-team-name')?.focus();}}
    else if(type==='t-rename'&&tour){const name=String(data.get('name')||'').trim();if(name){tour.name=name.slice(0,TN.LIMITS.name);closeModal();saveState();renderTournament();}}
    else if(type==='t-addteam'&&tour){
      if(tour.teams.length>=TN.LIMITS.teams){showToast(t('Llegaste al máximo de equipos.'));return true;}
      const created=TN.makeTeam(data.get('name'),data.get('color'));if(!created)return true;
      tour.teams.push(created);saveState();renderTournament();document.getElementById('t-team-name')?.focus();showToast(t('Equipo agregado. Tocalo para cargar los jugadores.'));
    }
    else if(type==='t-editteam'&&team){const name=String(data.get('name')||'').trim().slice(0,TN.LIMITS.name),color=String(data.get('color'));if(name)team.name=name;if(isHexColor(color))team.color=color;afterTournamentChange(team.id);}
    else if(type==='t-player'&&team){
      const number=TN.cleanNumber(data.get('number')),editing=team.players.find(p=>p.id===data.get('player')),name=String(data.get('name')||'').replace(/\s+/g,' ').trim().slice(0,TN.LIMITS.name);
      if(!name)return true;
      const clash=number!==''&&team.players.find(p=>p.number===number&&p!==editing);
      if(clash){showToast(t('El número {n} ya lo tiene {name}.',{n:number,name:clash.name}));return true;}
      if(editing)Object.assign(editing,{name,number});
      else if(team.players.length>=TN.LIMITS.players){showToast(t('Llegaste al máximo de jugadores.'));return true;}
      else team.players.push(TN.makePlayer(name,number));
      afterTournamentChange(team.id,'player');
    }
    else if(type==='t-paste'&&team){
      const room=TN.LIMITS.players-team.players.length,found=TN.parsePlayers(data.get('list')),added=found.slice(0,Math.max(0,room));
      team.players.push(...added);afterTournamentChange(team.id);
      showToast(added.length<found.length?t('Se agregaron {n} jugadores; el resto no entró (máximo {max}).',{n:added.length,max:TN.LIMITS.players}):t('Se agregaron {n} jugadores.',{n:added.length}));
    }
    else return false;
    return true;
  }
  /* Cambios en selectores/archivo del modo torneo; devuelve true si el evento era suyo. */
  function tournamentChange(el) {
    if(el.id==='tournamentFile'){const file=el.files?.[0];el.value='';if(file)importTournamentFile(file);return true;}
    if(el.dataset.person){const input=el.closest('.field').querySelector('input');const other=el.value==='__other';input.hidden=!other;if(other)input.focus();return true;}
    if(el.dataset.pickTeam!==undefined){
      const picked=tournamentTeam(el.value);if(!picked)return true;
      if(el.dataset.pickTeam==='edit'){const name=document.getElementById('team-name'),color=document.getElementById('team-color');if(name)name.value=picked.name;if(color){color.value=picked.color;color.dispatchEvent(new Event('input',{bubbles:true}));}}
      else{const i=Number(el.dataset.pickTeam),name=el.closest('form')?.querySelector(`[name="name-${i}"]`);if(name)name.value=picked.name;setSetupColor(i,picked.color);}
      return true;
    }
    return false;
  }

  function extraAction(action,element) {
    const m=activeMatch();
    if(tournamentAction(action,element))return true;
    if(action==='changelog')openChangelog();
    else if(action==='sheet'){renderLiveSheet();}
    else if(action==='tournament'){closeModal();renderTournament();}
    else if(action==='goal-picker')openGoalPicker();
    else if(action==='timeout-picker')openTimeoutPicker();
    else if(action==='quick-call')openCallPicker();
    else if(action==='pick-call-team')openCall(Number(element.dataset.team));
    else if(action==='incident')openIncident();
    else if(action==='quick-theme'){const view=app.firstElementChild?.className||'';applyTheme(element.dataset.theme);if(view.includes('settings-screen'))renderSettings();else if(view.includes('tournament-screen'))renderTournament();else if(view.includes('sheet-screen'))renderLiveSheet();else renderDashboard();}
    else if(action==='enable-audio'){
      if(ClockAlerts.ready){state.settings.sound=false;ClockAlerts.setSound(false);saveState();updateAudioControls();showToast(t('Sonido desactivado.'));}
      else ClockAlerts.unlock().then(ok=>{state.settings.sound=ok;ClockAlerts.setSound(ok);saveState();updateAudioControls();showToast(t(ok?'Sonido activado.':'No se pudo activar el sonido en este navegador.'));});
    }
    else if(action==='test-audio'){
      ClockAlerts.unlock().then(ok=>{
        state.settings.sound=ok;ClockAlerts.setSound(ok);saveState();updateAudioControls();
        const played=ok&&ClockAlerts.test();
        showToast(t(played?'Sonido de prueba: cinco alarmas. Revisá el volumen del dispositivo.':'No se pudo reproducir el sonido de prueba.'));
      });
    }
    else if(action==='fullscreen'){enterFullscreen();updateFullscreenControl();}
    else if(action==='setup-color')setSetupColor(Number(element.dataset.team),element.dataset.color);
    else if(action==='team-color'){const input=document.getElementById('team-color');input.value=element.dataset.color;input.dispatchEvent(new Event('input',{bubbles:true}));}
    else if(action==='more-colors'){const field=document.getElementById('extendedColors');field.hidden=false;document.getElementById('team-color').click();}
    else if(action==='start-break'){
      if(m.half!==1||!m.clock.halfAlerted||m.breakTimer.running||m.breakTimer.completed){showToast(t('El medio tiempo todavía no está disponible.'));return true;}
      m.breakTimer=makeTimer('break','Medio tiempo',m.config.halftime,[{at:m.config.halftime,label:'Tiempo cumplido'}]);setRunning(m.breakTimer,true);logEvent('half',{label:'Inicio del medio tiempo'});unlockAudio();closeModal();saveState();renderDashboard();
    }
    else if(action==='second-half'){
      if(m.half===2){showToast(t('La segunda mitad ya está activa.'));return true;}
      updateRunningValue(m.breakTimer);if(!m.breakTimer.completed){showToast(t('El medio tiempo todavía está en curso.'));return true;}
      m.half=2;m.timeoutState.usages=[0,0];m.timeoutState.activeTeam=null;m.timers.timeout=makeTimer('timeout','Time out',m.config.timeoutDuration,[{at:m.config.timeoutDuration,label:'Tiempo cumplido'}]);m.clock.running=true;m.clock.startedAt=Date.now();m.clock.status='Corriendo';logEvent('half',{label:'Inicio de segunda mitad; time outs de la nueva mitad disponibles'});closeModal();saveState();renderDashboard();
    }
    else if(action==='save-and-new'){if(saveMatch()){resetMatch();openTeamsSetup();}}
    else if(action==='export-sheet'){const sheet=state.savedMatches.find(x=>x.id===element.dataset.match)||(m.id===element.dataset.match?m:null),format=element.dataset.format,name=sheet&&exportName(sheet);if(!sheet);else if(format==='pdf')download(SheetExport.toPDF(sheet,{rulesetLabel:rulesetLabel(sheet.ruleset,sheet),t,locale:lang==='en'?'en-US':'es-AR'}),'application/pdf',`${name}.pdf`);else if(format==='csv')download(SheetExport.toCSV(sheet,{t}),'text/csv;charset=utf-8',`${name}.csv`);else if(format==='whatsapp')shareWhatsApp(SheetExport.toWhatsApp(sheet,{rulesetLabel:rulesetLabel(sheet.ruleset,sheet),t,locale:lang==='en'?'en-US':'es-AR'}));else exportData(sheet,`${name}.json`);}
    else if(action==='export-backup')exportData(storageRaw&&storageBlocked?{original:storageRaw,current:state}:state,`ultimate-clock-${t('respaldo')}.json`);
    else if(action==='retry-storage'){
      if(storageInvalid){showToast(t('Descargá primero el respaldo. El formato anterior se conserva sin sobrescribir.'));return true;}
      storageBlocked=false;if(saveState()){document.getElementById('storageWarning')?.remove();showToast(t('Guardado local restablecido.'));}
    }
    else return false;
    return true;
  }
  function extraSubmit(form) {
    const data=new FormData(form),m=activeMatch(),type=form.dataset.form;
    if(tournamentSubmit(form,data,type))return true;
    if(type==='incident'){logEvent('incident',{label:String(data.get('type')),note:String(data.get('note')||'').trim()});closeModal();saveState();renderLiveSheet();showToast(t('Incidencia anotada.'));return true;}
    if(type==='ruleset-profile'){saveRulesetProfile(form);return true;}
    if(type==='welcome-teams'){if(!hasStarted()&&!isLocked()){applyTeamsForm(form);openWelcome('profile');}else closeModal();return true;}
    if(type==='welcome-profile'){saveWelcomeProfile(form);return true;}
    if(type==='teams'){if(!hasStarted()&&!isLocked())m.teams.forEach((team,i)=>{team.name=String(data.get(`name-${i}`)||'').trim()||t('Equipo {n}',{n:i+1});const color=String(data.get(`color-${i}`)||'');if(isHexColor(color))team.color=color;linkTournamentTeam(team,String(data.get(`tid-${i}`)||''));});closeModal();saveState();renderDashboard();showToast(t('Equipos listos.'));return true;}
    if(!['call','timeout'].includes(type))return false;
    if(isLocked()){closeModal();return true;}
    unlockAudio();
    if(type==='call'){const index=Number(form.dataset.team);if(![0,1].includes(index)||pendingCall!==index)return true;pendingCall=null;registerCall(index,String(data.get('type')));closeModal();return true;}
    else {const index=Number(form.dataset.team),timer=m.timers.timeout;if(timer.running||m.timeoutState.usages[index]>=m.config.timeoutsPerTeam){showToast(t('Ese time out no está disponible.'));return true;}m.timeoutState.activeTeam=index;m.timeoutState.mode='';m.timeoutState.usages[index]++;timer.elapsed=0;timer.alerted=[];timer.completed=false;configureTimeout(m,'');setRunning(timer,true);logEvent('timeout',{team:index});}
    closeModal();saveState();renderDashboard();return true;
  }

  function handleAction(actionElement) {
    const action = actionElement.dataset.action;
    if(action!=='toggle-menu'){document.querySelector('.header-actions').classList.remove('is-open');document.querySelector('.menu-button').setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');}
    if(action==='start-tutorial'){startTutorial();return;}
    if(action==='tour-close'){closeTutorial();return;}
    if(action==='tour-prev'){showTutorialStep(tutorialIndex-1);return;}
    if(action==='tour-next'){showTutorialStep(tutorialIndex+1);return;}
    if(action==='reload'){location.reload();return;}
    if(action==='donation-info'){if(DONATION_URL){window.open(DONATION_URL,'_blank','noopener');return;}openModal(t('APOYÁ ESTE PROYECTO'), `<p>${esc(t('El enlace para donar todavía no está disponible. Gracias por querer apoyar el desarrollo de Ultimate Clock.'))}</p>`);return;}
    if(action==='set-lang'){setLang(actionElement.dataset.lang);return;}
    if(isLocked()&&['goal','goal-details','undo-goal','minus','confirm-minus','edit-team','toggle-clock','toggle-timer','timeout','start-break','second-half'].includes(action)){showToast(t('Partido cerrado. Elegí Nuevo partido.'));return;}
    if(extraAction(action,actionElement))return;
    if (action === "toggle-menu") {
      const menu = document.querySelector(".header-actions");
      const open = menu.classList.toggle("is-open");
      actionElement.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle('menu-open',open);
    }
    if(action==='select-profile'){
      const id=actionElement.dataset.profile;
      if(!profileChoices().some(p=>p.id===id))return;
      selectedProfileId=id;
      modalRoot.querySelectorAll('.profile-choice').forEach(button=>{const active=button.dataset.profile===id;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));button.querySelector('span').textContent=t(active?'SELECCIONADO':'ELEGIR');});
      return;
    }
    if(action==='use-profile'){if(!hasStarted()&&!isLocked())startWithProfile(selectedProfileId);else closeModal();return;}
    if(action==='cancel-call'){const index=Number(actionElement.dataset.team);if(pendingCall===index){pendingCall=null;cancelCall(index);}closeModal();return;}
    if(action==='new-profile'){openWelcome('custom');return;}
    if(action==='delete-profile'){
      const id=actionElement.dataset.profile,inWelcome=!!actionElement.closest('.welcome-flow');
      if(inWelcome){
        /* Dos toques: el primero pide confirmación en el mismo botón. */
        if(!actionElement.classList.contains('confirm')){modalRoot.querySelectorAll('.profile-delete.confirm').forEach(b=>{b.classList.remove('confirm');b.textContent=t('ELIMINAR');});actionElement.classList.add('confirm');actionElement.textContent=t('¿ELIMINAR?');return;}
        if(deleteProfile(id))openWelcome('profile');
        return;
      }
      const profile=state.customRulesets.find(p=>p.id===id);if(!profile)return;
      openModal(t('Eliminar perfil'),`<p>${esc(t('¿Eliminar el perfil {name}? Las planillas guardadas no se borran.',{name:profile.name}))}</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-danger" type="button" data-action="confirm-delete-profile" data-profile="${esc(id)}">${esc(t('ELIMINAR PERFIL'))}</button></div>`);
      return;
    }
    if(action==='confirm-delete-profile'){const ok=deleteProfile(actionElement.dataset.profile);closeModal();if(ok){draftRuleset=false;renderSettings();}return;}
    if(action==='welcome-back'){openWelcome(welcomeStep==='custom'?'profile':'teams');return;}
    if (action === "settings") { closeModal(); renderSettings(); }
    if (action === "info") openInfo();
    if (action === "reset") openReset();
    if (action === "save") saveMatch();
    if (action === "history") renderLiveSheet();
    if (action === "back-dashboard") { renderDashboard(); }
    if(action==='new-match'){if(!isLocked()&&hasStarted()){openModal(t('Preparar un nuevo partido'),`<p>${esc(t('El partido actual aún no está en el historial. Guardalo antes de continuar.'))}</p><div class="modal-actions"><button class="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-primary" data-action="save-and-new">${esc(t('Guardar y crear nuevo'))}</button></div>`);}else {resetMatch();openTeamsSetup();}}
    if (action === "close-modal") closeModal();
    if (action === "confirm-reset") resetMatch();
    if (action === "confirm-minus") {
      const index = Number(actionElement.dataset.team); const team = activeMatch().teams[index];
      if (team.score > 0) { team.score -= 1; team.adjustments.push({ at: nowIso(), delta: -1 }); logEvent('adjustment', { team: index }); }
      closeModal(); saveState(); renderDashboard(); showToast(t("Puntaje corregido."));
    }
    if (action === "goal") addGoal(Number(actionElement.dataset.team),actionElement.dataset.origin||'dashboard');
    if (action === "goal-details") { hideToast(); openGoal(Number(actionElement.dataset.team),actionElement.dataset.goal,actionElement.dataset.origin); }
    if (action === "undo-goal") { hideToast(); closeModal(); undoGoal(Number(actionElement.dataset.team),actionElement.dataset.goal,actionElement.dataset.origin); }
    if (action === "minus") openMinus(Number(actionElement.dataset.team));
    if (action === "edit-team") openTeamEditor(Number(actionElement.dataset.team));
    if (action === "toggle-clock") toggleTimer("clock");
    if (action === "toggle-timer") toggleTimer(actionElement.dataset.timer);
    if (action === "timeout") startTimeout(Number(actionElement.dataset.team));
  }

  document.addEventListener("click", event => {
    if(!event.target.closest('.topbar')){document.querySelector('.header-actions').classList.remove('is-open');document.querySelector('.menu-button').setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');}
    const historyItem = event.target.closest("[data-history]");
    if (historyItem) { const match = state.savedMatches.find(item => item.id === historyItem.dataset.history); if (match) openSheet(match); return; }
    const action = event.target.closest("[data-action]");
    if (action) { event.preventDefault(); const attrs={...action.dataset};handleAction(action);if(!document.querySelector('dialog[open]')&&!action.isConnected){const replacement=[...document.querySelectorAll('[data-action]')].find(el=>Object.entries(attrs).every(([k,v])=>el.dataset[k]===v));if(replacement)replacement.focus({preventScroll:true});else app.focus({preventScroll:true});}return; }
    const timerCard = event.target.closest('[data-action="toggle-timer"], [data-action="toggle-clock"]');
    if (timerCard && !event.target.closest("button")) { toggleTimer(timerCard.dataset.timer || "clock", true); }
  });

  document.addEventListener("keydown", event => {
    if (event.key === " " && !event.repeat && tutorialIndex<0 && !modalRoot.innerHTML && !event.target.closest("button,input,select,textarea,a,[contenteditable]") && app.querySelector(".dashboard-screen")) { event.preventDefault(); toggleTimer("clock"); return; }
    if (event.key === "Escape" && tutorialIndex>=0){event.preventDefault();closeTutorial();}
    else if (event.key === "Escape" && modalRoot.innerHTML) closeModal();
    else if(event.key === "Escape"){document.querySelector('.header-actions').classList.remove('is-open');document.querySelector('.menu-button').setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');document.querySelector('.menu-button').focus();}
  });

  document.addEventListener("submit", event => {
    const form = event.target;
    event.preventDefault();
    if(extraSubmit(form))return;
    if(isLocked()&&['goal','team'].includes(form.dataset.form)){closeModal();return;}
    if (form.dataset.form === "goal") {
      const m = activeMatch(), team = m.teams[Number(form.dataset.team)], goal = team?.goals.find(g => g.id === form.dataset.goal);
      if (!goal) { closeModal(); return; }
      const data = new FormData(form);
      const roster = rosterFor(team), assist = readPerson(data,'assist',roster), scorer = readPerson(data,'scorer',roster);
      Object.assign(goal, { assist: assist.name, assistId: assist.id, scorer: scorer.name, scorerId: scorer.id });
      const event = m.events.find(e => e.goal === goal.id); if (event) Object.assign(event, { assist: goal.assist, assistId: goal.assistId, scorer: goal.scorer, scorerId: goal.scorerId });
      closeModal(); saveState(); rerender(form.dataset.origin); showToast(t("Detalle del gol guardado."));
    }
    if (form.dataset.form === "team") {
      const index = Number(form.dataset.team); const data = new FormData(form); const team = activeMatch().teams[index];
      team.name = String(data.get("name") || "").trim() || t('Equipo {n}',{n:index + 1}); team.color = String(data.get("color") || team.color);if(data.has("tid"))linkTournamentTeam(team,String(data.get("tid")||''));
      closeModal(); saveState(); renderDashboard(); showToast(t("Datos del equipo guardados."));
    }
  });

  /* Tapping a team name selects it, so typing replaces "Equipo 1". */
  document.addEventListener("focusin", event => { if (event.target.matches?.('.team-setup input[name^="name-"]')) event.target.select(); });
  document.addEventListener("input", event => {
    if (event.target.dataset.numeric) {
      const el=event.target,v=el.value.replace(/\D/g,'');
      if(v!==el.value)el.value=v;
    }
    if (event.target.dataset.setupTeam) setSetupColor(Number(event.target.dataset.setupTeam), event.target.value);
    if (event.target.id === "team-color") {
      const preview = document.getElementById("colorPreview");
      if (preview) { preview.style.background = event.target.value; preview.style.color = contrastColor(event.target.value); preview.textContent=t('Vista previa del equipo'); }
    }
  });

  document.addEventListener("change", event => {
    if(tournamentChange(event.target))return;
    if(event.target.name==='type'&&event.target.closest('[data-form="call"]')){const guidance=document.getElementById('call-guidance');if(guidance)guidance.textContent=t(CALL_GUIDANCE[event.target.value]||'');}
    if (event.target.dataset.setting === "ruleset") {
      if(hasStarted()||isLocked())return;
      const id=event.target.value;
      if(id==='create'){draftRuleset=true;renderSettings();document.getElementById('profile-name')?.focus();return;}
      draftRuleset=false;
      const profile=state.customRulesets.find(p=>p.id===id);
      if(!profile&&!['wfdf','usau'].includes(id))return;
      state.settings.ruleset=id;state.settings.baseRuleset=profile?'wfdf':id;state.settings.overrides=profile?clone(profile.config):{};
      const match=activeMatch();match.ruleset=id;updateTimerConfig(match);saveState();renderSettings();showToast(t('Perfil {name} activo.',{name:rulesetLabel(id)}));
    }
    if (event.target.dataset.setting === "sound") {
      state.settings.sound=event.target.value==='on';
      if(state.settings.sound)unlockAudio().then(ok=>{if(!ok)showToast(t('No se pudo activar el sonido en este navegador.'));else showToast(t('Alertas sonoras activas.'));});
      else {ClockAlerts.setSound(false);updateAudioControls();showToast(t('Alertas sonoras desactivadas.'));}
      saveState();
    }
  });

  /* Textos fijos del HTML: data-i18n (texto) y data-i18n-label (aria-label) guardan la clave en español. */
  function applyStaticText() {
    root.lang=lang;
    document.title=t('Ultimate Clock — Reloj y planilla para partidos de Ultimate Frisbee');
    document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n);});
    document.querySelectorAll('[data-i18n-label]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.i18nLabel)));
    document.querySelectorAll('.header-actions [data-action="set-lang"]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.lang===lang)));
    updateAudioControls();updateFullscreenControl();
  }
  /* Los equipos con el nombre por defecto ("Equipo 1" / "Team 1") siguen al idioma; los nombres propios no se tocan. */
  function relabelDefaultTeams() {
    state.activeMatch?.teams.forEach((team,i)=>{if(UCI18N.languages.some(l=>team.name===UCI18N.t(l,'Equipo {n}',{n:i+1})))team.name=t('Equipo {n}',{n:i+1});});
  }
  function setLang(next) {
    if(!UCI18N.languages.includes(next)||next===lang)return;
    const teamsForm=modalRoot.querySelector('[data-form="welcome-teams"]');if(teamsForm)applyTeamsForm(teamsForm);
    lang=next;state.settings.lang=next;relabelDefaultTeams();saveState();applyStaticText();
    const profileOpen=!!modalRoot.querySelector('.welcome-flow');
    const view=app.firstElementChild?.className||'';
    if(view.includes('settings-screen'))renderSettings();else if(view.includes('tournament-screen'))renderTournament();else if(view.includes('sheet-screen'))renderLiveSheet();else renderDashboard();
    if(profileOpen)openWelcome();else closeModal();
    if(tutorialIndex>=0)showTutorialStep(tutorialIndex);
    announce(t('Idioma: español'));
  }

  ClockAlerts.onAudioFailure=()=>{
    state.settings.sound=false;
    saveState();
    const field=document.getElementById('sound');
    if(field)field.value='off';
    updateAudioControls();
    showToast(t('Falló la reproducción. Revisá el navegador y probá el sonido desde MENU.'));
  };
  ClockAlerts.setSound(false);
  document.addEventListener('visibilitychange',()=>{updateAudioControls();if(!document.hidden&&wakeWanted){wakeWanted=false;wakeLock=null;}});
  document.addEventListener('fullscreenchange',updateFullscreenControl);
  window.addEventListener('resize',()=>{if(tutorialIndex>=0)requestAnimationFrame(positionTutorial);});
  (state.pendingAlerts||[]).forEach(dispatchAlert);
  applyTheme(state.settings.theme,false);
  if(state.activeMatch?.status==='active')relabelDefaultTeams();
  applyStaticText();
  document.querySelector('.footer-version').textContent=`v${UCChangelog.VERSION}`;
  updateAudioControls();
  updateFullscreenControl();
  renderDashboard();
  if(!hasStarted()&&!isLocked())openWelcome('teams');
  document.getElementById('bootFallback')?.remove();
  if(storageBlocked)showStorageError();
  let otherTabLocked=false;
  window.addEventListener('storage',e=>{
    if(otherTabLocked||e.key!==STORAGE_KEY||!e.newValue)return;
    let writer;try{writer=JSON.parse(e.newValue).writerId;}catch{return;}
    if(writer===writerId)return;
    otherTabLocked=storageBlocked=true;showToast(t('Otra pestaña cambió el partido. Recargá esta pestaña antes de continuar.'));app.inert=true;document.querySelector('.topbar').inert=true;
    const warning=document.createElement('div');warning.className='storage-warning';warning.innerHTML=`${esc(t('Partido abierto en otra pestaña.'))} <button type="button" data-action="reload">${esc(t('Recargar estado actual'))}</button>`;document.body.prepend(warning);
  });
  /* Ask the browser not to evict saved games under storage pressure; silently ignored where unsupported. */
  navigator.storage?.persist?.().catch(()=>{});
  if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>showToast(t('La instalación sin conexión no está disponible en este navegador.')));

})();
