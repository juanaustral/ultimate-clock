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
  const RULESETS = E.defaults;

  const BUILT_IN_THEMES = [
    { id: "light", name: "Claro", swatch: "#1b47e2" },
    { id: "dark", name: "Oscuro", swatch: "#1b47e2" }
  ];

  const TUTORIAL_STEPS = [
    {target:'.team-card.team-1',title:'Equipos y goles',text:'Tocá el nombre para cambiarlo o elegir un color. Con + el gol se suma al instante; desde el aviso podés anotar pase y gol o deshacerlo. El botón − corrige el puntaje y deja registro del ajuste.'},
    {target:'.clock-card',title:'Tiempo del partido',text:'Iniciá el reloj principal cuando empieza el juego. Es el único que podés pausar. Al cumplirse el primer tiempo aparecerá el aviso para iniciar el descanso.'},
    {target:'.timer-pull',title:'Pull',text:'Tocá INICIAR al preparar el lanzamiento. Esta cuenta no se pausa y suena cinco veces al terminar. REINICIAR la devuelve a LISTO sin arrancarla.'},
    {target:'.timer-call-0',title:'Llamadas por equipo',text:'Cada equipo tiene su propia Llamada. Tocá INICIAR, elegí la categoría y se registrará qué equipo hizo el llamado. La cuenta sigue hasta el final.'},
    {target:'.timeout-card',title:'Time Out',text:'Elegí el botón del equipo que pide el tiempo. Cada botón muestra cuántos le quedan; el contador es único y no se puede pausar.'},
    {target:'.menu-button',title:'Menú y planilla',text:'Desde MENU abrís la planilla, el historial y la configuración. Ahí también activás y probás el sonido antes del partido.'}
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

  const TEAM_DEFAULTS = [
    { name: "Equipo 1", color: "#1b47e2" },
    { name: "Equipo 2", color: "#f59e0b" }
  ];
  const CALL_CATEGORIES = ['Falta','Violación','Pick','Travel','Stall','Gol discutido','Lesión','Tiempo de Espíritu'];
  const CALL_GUIDANCE = {
    'Falta':'Contacto antirreglamentario entre jugadores. La resolución depende de si el llamado se acepta o se disputa.',
    'Violación':'Incumplimiento de una regla distinto de una falta; el reglamento define cómo reanudar el juego.',
    'Pick':'Un defensor queda impedido de seguir a quien marca por la posición o movimiento de otra persona.',
    'Travel':'Desplazamiento o pivote incorrecto de quien tiene el disco; puede tratarse como infracción o violación según el caso.',
    'Stall':'Conteo agotado antes del lanzamiento. Registrá el llamado; la posesión se resuelve según el reglamento.',
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
  const dateLabel = value => new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  const nowIso = () => new Date().toISOString();

  const contrastColor = hex => E.ink(hex);
  const isHexColor = value => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(value));

  function getRuleset() { return E.configuration(state.settings); }
  function rulesetLabel(id) {return state?.customRulesets?.find(profile=>profile.id===id)?.name||RULESETS[id]?.label||'Personalizado';}

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
      teams: TEAM_DEFAULTS.map(team => ({ ...team, score: 0, goals: [], adjustments: [] })),
      clock: { elapsed: 0, running: false, startedAt: null, halfAlerted: false, capAlerted: false, status: "Preparado", gameCap: config.gameCap, halfCap: config.halfCap, halftime: config.halftime },
      timers: {
        pull: makeTimer("pull", "Pull", config.pull.release, [{at:config.pull.release,label:'Tiempo cumplido'}]),
        call: makeTimer("call-0", "Llamada equipo 1", config.call.restart, [{at:config.call.restart,label:'Tiempo cumplido'}]),
        call2: makeTimer("call-1", "Llamada equipo 2", config.call.restart, [{at:config.call.restart,label:'Tiempo cumplido'}]),
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
    if(!['light','dark'].includes(stored.settings.theme))stored.settings.theme='light';
    m.timers.call.id='call-0';m.timers.call.label=`Llamada ${m.teams[0].name}`;
    m.timers.call2 ||= makeTimer('call-1',`Llamada ${m.teams[1].name}`,m.config.call.restart,[{at:m.config.call.restart,label:'Tiempo cumplido'}]);
    if(!Array.isArray(m.timers.call2.thresholds)||!Array.isArray(m.timers.call2.alerted)||!Number.isFinite(m.timers.call2.elapsed)||m.timers.call2.elapsed<0||!Number.isFinite(m.timers.call2.duration))throw new Error('Contador de llamada inválido');
    m.callTypes=Array.isArray(m.callTypes)&&m.callTypes.length===2?m.callTypes:[m.callType||'Falta','Falta'];
    for(const timer of [m.timers.pull,m.timers.call,m.timers.call2,m.timers.timeout,m.breakTimer])timer.thresholds=[{at:timer.duration,label:'Tiempo cumplido'}];
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
    banner.innerHTML='El almacenamiento local no está disponible o contiene un formato no compatible. Tus datos anteriores se conservan. <button data-action="export-backup">Descargar respaldo</button> <button data-action="retry-storage">Reintentar guardado</button>';
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
    const active=ClockAlerts.ready,label=active?'DESACTIVAR SONIDO':'ACTIVAR SONIDO';
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
    button.textContent=active?'SALIR DE PANTALLA COMPLETA':'PANTALLA COMPLETA';
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
    if(!ready){state.settings.sound=false;saveState();const field=document.getElementById('sound');if(field)field.value='off';showToast('El navegador no habilitó el sonido. Usá PROBAR SONIDO en MENU.');}
    updateAudioControls();
    return ready;
  }
  function dispatchAlert(item) {ClockAlerts.enqueue(item.kind,()=>{alertVisual(item.kind,item.timer);announce(item.message);state.pendingAlerts=(state.pendingAlerts||[]).filter(a=>a.id!==item.id);saveState();});}
  function queueAlert(kind,id,message) {const item={id:uid('alert'),kind,timer:id,message};state.pendingAlerts||=[];state.pendingAlerts.push(item);dispatchAlert(item);}

  function alertVisual(kind, timerId) {
    document.body.classList.remove("flash-threshold", "flash-complete");
    void document.body.offsetWidth;
    document.body.classList.add(kind === "complete" ? "flash-complete" : "flash-threshold");
    if (kind === "complete") try { navigator.vibrate?.([220, 120, 220, 120, 420]); } catch {}
    const card = document.querySelector(`[data-timer-card="${timerId}"]`);
    if (card) {
      card.classList.remove("alert");
      void card.offsetWidth;
      card.classList.add("alert");
    }
  }

  function triggerTimerAlert(timer, threshold, kind = "threshold") {
    logEvent('limit',{timer:timer.id,label:threshold.label,limit:threshold.at});
    queueAlert(kind,timer.id,`${timer.label}: ${threshold.label}`);
    saveState();
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
      logEvent('limit',{timer:'clock',label:'Primer tiempo cumplido',limit:clock.halfCap});queueAlert('complete','clock','Primer tiempo cumplido');saveState();
    }else if(match.half===2&&!clock.capAlerted&&clock.elapsed>=clock.gameCap){
      clock.elapsed=clock.gameCap;clock.running=false;clock.startedAt=null;clock.capAlerted=true;clock.status='Tiempo total cumplido';
      logEvent('limit',{timer:'clock',label:'Tiempo total cumplido',limit:clock.gameCap});queueAlert('complete','clock','Tiempo total cumplido');saveState();
    }
    return true;
  }

  function showPendingTimePrompt() {
    const match=state.activeMatch;if(!match||modalRoot.querySelector('dialog[open]'))return;
    if(match.pendingHalfPrompt){match.pendingHalfPrompt=false;saveState();openModal('PRIMER TIEMPO CUMPLIDO',`<div class="milestone-modal"><div class="milestone-clock">${fmt(match.clock.elapsed)}</div><p>El reloj del partido se detuvo al llegar al primer tiempo.</p><button class="button button-primary" data-action="start-break">INICIAR MEDIO TIEMPO</button></div>`);}
    else if(match.pendingSecondHalfPrompt){match.pendingSecondHalfPrompt=false;saveState();openModal('MEDIO TIEMPO CUMPLIDO',`<div class="milestone-modal"><div class="milestone-clock">00:00</div><p>El descanso terminó. El reloj del partido se reanudará al comenzar la segunda mitad.</p><button class="button button-primary" data-action="second-half">INICIAR SEGUNDO TIEMPO</button></div>`);}
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
    const p=match.timers.pull;p.duration=c.pull.release;p.thresholds=[{at:p.duration,label:'Tiempo cumplido'}];
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

  function toggleTimer(id) {
    if(isLocked())return;
    unlockAudio();const m=activeMatch();
    if(id==='clock'){
      if(m.clock.capAlerted){showToast('El tiempo total ya se cumplió.');return;}
      if(m.half===1&&m.clock.halfAlerted){showToast('Iniciá el medio tiempo para continuar.');return;}
      updateClock();if(m.clock.capAlerted||(m.half===1&&m.clock.halfAlerted)){saveState();renderDashboard();return;}
      m.clock.running=!m.clock.running;m.clock.startedAt=m.clock.running?Date.now():null;m.clock.status=m.clock.running?'Corriendo':'Pausado';
      logEvent(m.clock.running?'resume':'pause',{timer:'clock'});
    }else{
      if(!['pull','call-0','call-1'].includes(id))return;
      const index=id==='call-1'?1:0,t=id==='pull'?m.timers.pull:index===0?m.timers.call:m.timers.call2;
      if(t.running){showToast('Este tiempo corre hasta el final.');return;}
      if(t.completed){Object.assign(t,{elapsed:0,running:false,startedAt:null,completed:false,alerted:[]});saveState();renderDashboard();return;}
      if(id!=='pull'){openCall(index);return;}
      setRunning(t,true);logEvent('start',{timer:id});
    }
    saveState();renderDashboard();
  }
  function openCall(teamIndex) {const m=activeMatch();if((teamIndex===0?m.timers.call:m.timers.call2).running){showToast('La llamada corre hasta el final.');return;}openModal(`Llamada de ${m.teams[teamIndex].name}`,`<form data-form="call" data-team="${teamIndex}"><div class="field"><label for="call-type">Categoría de llamada</label><select id="call-type" name="type">${CALL_CATEGORIES.map(x=>`<option>${x}</option>`).join('')}</select></div><p class="call-guidance" id="call-guidance">${esc(CALL_GUIDANCE.Falta)}</p><p>El reloj registra la llamada; no aplica sanciones ni reemplaza las reglas. <a href="${m.ruleset==='usau'?'https://usaultimate.org/rules/':'https://rules.wfdf.sport/'}" target="_blank" rel="noopener noreferrer">Consultar reglamento ↗</a></p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">Cancelar</button><button class="button button-primary">INICIAR LLAMADA</button></div></form>`);}
  function startTimeout(teamIndex) {
    const m=activeMatch(),t=m.timers.timeout;
    if((t.running||t.elapsed>0)&&!t.completed){showToast('Terminá el time-out activo antes de registrar otro.');return;}
    if(m.timeoutState.usages[teamIndex]>=m.config.timeoutsPerTeam){showToast('Este equipo no tiene time-outs disponibles.');return;}
    openModal('Iniciar time out',`<form data-form="timeout" data-team="${teamIndex}"><p><strong>${esc(m.teams[teamIndex].name)}</strong> usará uno de sus ${m.config.timeoutsPerTeam} time outs de este tiempo. La cuenta de ${fmt(m.config.timeoutDuration)} no se puede pausar.</p><div class="modal-actions"><button type="button" class="button" data-action="close-modal">Cancelar</button><button class="button button-primary">INICIAR TIME OUT</button></div></form>`);
  }

  function timerState(timer) {
    if(isLocked())return {label:'Finalizado',className:'complete'};
    if(timer.completed)return {label:'Tiempo cumplido',className:'complete'};
    if(!timer.running)return {label:'Listo',className:''};
    return {label:'En curso',className:'running'};
  }

  function clockState(clock) {
    if(isLocked())return {label:'Finalizado',className:'complete'};
    if(clock.capAlerted)return {label:'Tiempo total cumplido',className:'complete'};
    if(clock.halfAlerted&&activeMatch().half===1)return {label:'Primer tiempo cumplido',className:'complete'};
    if(clock.running)return {label:'Corriendo',className:'running'};
    return {label:clock.elapsed>0?'Pausado':'Preparado',className:clock.elapsed>0?'paused':''};
  }
  function statusMarkup(status) {
    return `<span class="status-line ${status.className}">${esc(status.label)}</span>`;
  }

  function teamStyle(team) {
    return `--team-color:${esc(team.color)};--team-ink:${contrastColor(team.color)};`;
  }

  function teamMarkup(team,index) {
    return `<article class="instrument team-card team-${index+1}" data-team-card="${index}" style="${teamStyle(team)}">
      <div class="team-top"><div><span class="team-role">GOLES</span><button class="team-name-button" type="button" data-action="edit-team" data-team="${index}" aria-label="Editar nombre y color de ${esc(team.name)}"><strong class="team-name">${esc(team.name)}</strong><span aria-hidden="true">✎</span></button></div></div>
      <div class="score-display" aria-label="Puntaje de ${esc(team.name)}">${team.score}</div>
      <div class="team-bottom"><div class="score-actions"><button class="score-button minus" data-action="minus" data-team="${index}" aria-label="Restar un punto a ${esc(team.name)}">−</button><button class="score-button plus" data-action="goal" data-team="${index}" aria-label="Sumar un gol a ${esc(team.name)}">+</button></div></div>
    </article>`;
  }

  function clockMarkup(match) {
    const status=clockState(match.clock);
    return `<article class="instrument clock-card ${status.className==='running'?'is-running':status.className==='paused'?'is-paused':status.className==='complete'?'is-complete':''}" data-timer-card="clock">
      <div class="clock-head"><span class="status-line ${status.className}" data-display="clock-status">${esc(status.label)}</span><span class="half-badge">${match.half}º TIEMPO</span></div>
      <div class="clock-center"><button type="button" class="clock-display" data-action="toggle-clock" aria-label="Tiempo total del partido: iniciar, pausar o reanudar" data-display="clock">${fmt(match.clock.elapsed)}</button><span>TIEMPO TOTAL DEL PARTIDO</span></div>
      <div class="clock-bottom"><div class="clock-details"><div class="clock-detail"><span>RESTANTE TOTAL</span><b data-display="game-remaining">${fmt(match.clock.gameCap-match.clock.elapsed)}</b></div><div class="clock-detail"><span>${match.half===1?'HASTA MEDIO TIEMPO':'SEGUNDO TIEMPO'}</span><b data-display="half-remaining">${match.half===1?fmt(match.clock.halfCap-match.clock.elapsed):fmt(match.clock.gameCap-match.clock.elapsed)}</b></div></div>
      <div class="clock-actions"><button class="button button-primary" type="button" data-action="toggle-clock">${match.clock.running?'Ⅱ PAUSAR':match.clock.elapsed>0?'▶ REANUDAR':'▶ INICIAR'}</button></div></div>
    </article>`;
  }

  function timerMarkup(match,id,title,teamIndex=null) {
    const timer=id==='call-0'?match.timers.call:id==='call-1'?match.timers.call2:match.timers.pull,status=timerState(timer),team=teamIndex===null?null:match.teams[teamIndex];
    return `<article class="instrument timer-card ${team?'timer-call team-timer':''} timer-${id} ${status.className==='complete'?'is-complete':''}" data-timer-card="${id}" ${team?`style="${teamStyle(team)}"`:''}>
      <div class="timer-head"><h2 class="timer-title">${esc(title)}${team?`<span>· ${esc(team.name)}</span>`:''}</h2><span class="timer-badge" data-display="${id}-phase">${timer.completed?'CUMPLIDO':timer.running?'EN CURSO':'LISTO'}</span></div>
      <div class="timer-core"><strong class="timer-display" data-display="${id}">${fmt(timer.duration-timer.elapsed)}</strong><button class="timer-main-action" type="button" data-action="toggle-timer" data-timer="${id}" ${timer.running||isLocked()?'disabled':''}>${timer.completed?'REINICIAR':'INICIAR'}</button></div>
      <div class="progress-track" role="progressbar" aria-label="Progreso de ${esc(title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(100*timer.elapsed/timer.duration)}"><span class="progress-fill" style="--progress:${Math.min(100,100*timer.elapsed/timer.duration)}%"></span></div>
      <div class="timer-bottom"><span class="status-line ${status.className}">${esc(status.label)}</span></div>
      ${team?`<p class="timer-context">${esc(match.callTypes[teamIndex])}</p>`:''}
    </article>`;
  }

  function timeoutMarkup(match) {
    const timer=match.timers.timeout,status=timerState(timer),active=match.timeoutState.activeTeam,c=match.config;
    return `<article class="instrument timeout-card ${timer.running?'is-active':''}" data-timer-card="timeout">
      <div class="timeout-summary"><h2 class="timer-title">TIME OUT</h2><strong class="timeout-display" data-display="timeout">${fmt(timer.duration-timer.elapsed)}</strong><span class="timeout-phase status-line ${status.className}" data-display="timeout-phase">${active===null?'DISPONIBLE':esc(status.label)}</span></div>
      <div class="progress-track" role="progressbar" aria-label="Progreso del time out" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(100*timer.elapsed/timer.duration)}"><span class="progress-fill" style="--progress:${Math.min(100,100*timer.elapsed/timer.duration)}%"></span></div>
      <div class="timeout-actions">${match.teams.map((team,index)=>`<button class="timeout-team-button ${active===index?'is-current':''}" type="button" data-action="timeout" data-team="${index}" style="${teamStyle(team)}" aria-label="Iniciar time out de ${esc(team.name)}. ${Math.max(0,c.timeoutsPerTeam-match.timeoutState.usages[index])} de ${c.timeoutsPerTeam} disponibles" ${isLocked()||timer.running||match.timeoutState.usages[index]>=c.timeoutsPerTeam?'disabled':''}><span>${esc(team.name)}</span><strong data-timeout-remaining="${index}">${Math.max(0,c.timeoutsPerTeam-match.timeoutState.usages[index])}/${c.timeoutsPerTeam}</strong></button>`).join('')}</div>
    </article>`;
  }

  function renderDashboard() {
    const match=activeMatch();updateTimerConfig(match);const b=match.breakTimer;
    const breakPanel=match.half===1&&match.clock.halfAlerted?`<section class="break-panel" data-timer-card="break"><div><span class="screen-eyebrow">MEDIO TIEMPO</span><h2>${b.running?'DESCANSO EN CURSO':b.completed?'MEDIO TIEMPO CUMPLIDO':'PRIMER TIEMPO CUMPLIDO'}</h2></div><strong data-display="break">${fmt(b.duration-b.elapsed)}</strong><div class="progress-track" role="progressbar" aria-label="Progreso del medio tiempo" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(100*b.elapsed/b.duration)}"><span class="progress-fill" style="--progress:${Math.min(100,100*b.elapsed/b.duration)}%"></span></div>${!b.running&&!isLocked()?`<button class="button button-primary" data-action="${b.completed?'second-half':'start-break'}">${b.completed?'INICIAR SEGUNDO TIEMPO':'INICIAR MEDIO TIEMPO'}</button>`:''}</section>`:'';
    app.innerHTML=`<section id="tablero" class="dashboard-screen">${breakPanel}<div class="main-grid">${teamMarkup(match.teams[0],0)}${clockMarkup(match)}${teamMarkup(match.teams[1],1)}</div><div class="timer-grid">${timerMarkup(match,'call-0','LLAMADA',0)}${timerMarkup(match,'pull','PULL')}${timerMarkup(match,'call-1','LLAMADA',1)}${timeoutMarkup(match)}</div></section>`;
    updateDisplays();if(isLocked())app.querySelectorAll('[data-action="goal"],[data-action="minus"],[data-action="edit-team"],[data-action="toggle-clock"],[data-action="toggle-timer"],[data-action="timeout"]').forEach(el=>el.disabled=true);
    updateThemeMeta();
  }

  function updateDisplays() {
    const match=state.activeMatch;if(!match)return;const clock=match.clock;
    const set=(selector,value)=>document.querySelectorAll(`[data-display="${selector}"]`).forEach(el=>{if(el.textContent!==value)el.textContent=value;});
    set('clock',fmt(Math.floor(clock.elapsed)));set('game-remaining',fmt(clock.gameCap-clock.elapsed));set('half-remaining',match.half===1?fmt(clock.halfCap-clock.elapsed):fmt(clock.gameCap-clock.elapsed));
    const clockCard=document.querySelector('[data-timer-card="clock"]'),cs=clockState(clock),clockStatus=document.querySelector('[data-display="clock-status"]');
    if(clockStatus){clockStatus.textContent=cs.label;clockStatus.className=`status-line ${cs.className}`;}
    if(clockCard){clockCard.classList.toggle('is-running',clock.running);clockCard.classList.toggle('is-paused',!clock.running&&clock.elapsed>0);clockCard.classList.toggle('is-complete',cs.className==='complete');const button=clockCard.querySelector('.clock-actions [data-action="toggle-clock"]');if(button){button.textContent=isLocked()?'FINALIZADO':clock.running?'Ⅱ PAUSAR':clock.elapsed>0?'▶ REANUDAR':'▶ INICIAR';button.disabled=isLocked()||clock.capAlerted||(match.half===1&&clock.halfAlerted);}}
    for(const id of ['pull','call-0','call-1']){const timer=id==='call-0'?match.timers.call:id==='call-1'?match.timers.call2:match.timers.pull,card=document.querySelector(`[data-timer-card="${id}"]`);if(!card)continue;set(id,fmt(timer.duration-timer.elapsed));set(`${id}-phase`,timer.completed?'CUMPLIDO':timer.running?'EN CURSO':'LISTO');const status=card.querySelector('.status-line'),ts=timerState(timer);status.textContent=ts.label;status.className=`status-line ${ts.className}`;card.classList.toggle('is-complete',timer.completed);card.classList.toggle('is-ending',isEnding(timer));const button=card.querySelector('[data-action="toggle-timer"]');button.textContent=timer.completed?'REINICIAR':'INICIAR';button.disabled=timer.running||isLocked();setProgress(card,timer.elapsed,timer.duration);}
    const timeout=match.timers.timeout,timeoutCard=document.querySelector('[data-timer-card="timeout"]');
    if(timeoutCard){
      const active=match.timeoutState.activeTeam,ts=timerState(timeout),phase=timeoutCard.querySelector('[data-display="timeout-phase"]');
      set('timeout',fmt(timeout.duration-timeout.elapsed));
      phase.textContent=active===null?'DISPONIBLE':ts.label;
      phase.className=`timeout-phase status-line ${active===null?'':ts.className}`;
      timeoutCard.classList.toggle('is-active',timeout.running);
      timeoutCard.classList.toggle('is-ending',isEnding(timeout));
      setProgress(timeoutCard,timeout.elapsed,timeout.duration);
      timeoutCard.querySelectorAll('[data-action="timeout"]').forEach((button,index)=>{
        const remaining=Math.max(0,match.config.timeoutsPerTeam-match.timeoutState.usages[index]);
        button.querySelector('[data-timeout-remaining]').textContent=`${remaining}/${match.config.timeoutsPerTeam}`;
        button.setAttribute('aria-label',`Iniciar time out de ${match.teams[index].name}. ${remaining} de ${match.config.timeoutsPerTeam} disponibles`);
        button.classList.toggle('is-current',active===index);
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
    const names=event.type==='goal'?`${event.scorer?` · ${esc(event.scorer)}`:''}${event.assist?` · pase ${esc(event.assist)}`:''}`:'';
    const kind={goal:'Gol',timeout:'Time-out',call:'Llamada',adjustment:'Ajuste manual',pause:'Pausa',resume:'Inicio / reanudación',limit:'Límite superado',start:'Inicio',half:'Descanso / mitad',incident:'Incidencia',saved:'Guardado'}[event.type]||esc(event.type);
    return `${kind}${team}${event.label?` · ${esc(event.label)}`:''}${names}${event.mode?` · ${esc(event.mode)}`:''}${event.note?` · ${esc(event.note)}`:''}`;
  }
  function renderLiveSheet() {
    const m=activeMatch(),events=[...m.events].reverse();
    app.innerHTML=`<section class="sheet-screen"><div class="screen-head"><button class="back-button" data-action="back-dashboard">← <span>Tablero</span></button><div><span class="screen-eyebrow">PARTIDO ACTUAL</span><h1>Planilla en vivo</h1></div><button class="screen-utility" data-action="history">Historial</button></div>
      <div class="sheet-live-strip"><span>${m.status==='saved'?'CERRADO':m.clock.running?'EN CURSO':m.clock.elapsed>0?'PAUSADO':'PREPARADO'} · ${m.half}º TIEMPO</span><strong class="sheet-live-clock">${fmt(Math.floor(m.clock.elapsed))}</strong><small>${esc(rulesetLabel(m.ruleset))}</small></div>
      <div class="sheet-score-grid">${m.teams.map((team,index)=>`<div class="sheet-score-team sheet-score-${index+1}"><strong>${esc(team.name)}</strong><b>${team.score}</b><small>TIME OUTS RESTANTES ${Math.max(0,m.config.timeoutsPerTeam-m.timeoutState.usages[index])}/${m.config.timeoutsPerTeam}</small></div>`).join('')}</div>
      ${m.status==='active'?`<section class="quick-entry"><div class="section-heading"><h2>Registro rápido</h2><span>ESTE DISPOSITIVO</span></div><div class="quick-grid"><button class="quick-primary" data-action="goal-picker">＋ Gol</button><button data-action="quick-call">⚠ Llamada</button><button data-action="timeout-picker">◷ Time-out</button><button data-action="incident">△ Incidencia</button></div></section>`:''}
      <section class="event-section"><div class="section-heading"><h2>Historial de planilla</h2><span>${events.length} ${events.length===1?'REGISTRO':'REGISTROS'}</span></div>${events.length?`<ol class="event-feed">${events.map(e=>`<li><time>${fmt(e.elapsed||0)}</time><span>${eventDescription(e,m)}</span></li>`).join('')}</ol>`:'<p class="empty-events">Todavía no hay eventos. Usá el registro rápido para comenzar.</p>'}</section>
      <div class="sheet-actions"><button class="button button-primary" data-action="save">${m.status==='saved'?'Ver historial':'Guardar planilla'}</button><button class="button" data-action="back-dashboard">Volver al tablero</button></div></section>`;
    updateDisplays();
  }
  function openGoalPicker() {openModal('Registrar gol',`<p>Elegí qué equipo anotó.</p><div class="picker-options">${activeMatch().teams.map((team,index)=>`<button class="button" data-action="goal" data-team="${index}" data-origin="sheet">${esc(team.name)}</button>`).join('')}</div>`);}
  function openTimeoutPicker() {openModal('Pedir time-out',`<p>Elegí el equipo que pide tiempo.</p><div class="picker-options">${activeMatch().teams.map((team,index)=>`<button class="button" data-action="timeout" data-team="${index}">${esc(team.name)}</button>`).join('')}</div>`);}
  function openCallPicker() {openModal('Registrar llamada',`<p>Elegí el equipo que hizo el llamado.</p><div class="picker-options">${activeMatch().teams.map((team,index)=>`<button class="button" data-action="pick-call-team" data-team="${index}">${esc(team.name)}</button>`).join('')}</div>`);}
  function openIncident() {openModal('Anotar incidencia','<form data-form="incident"><div class="field"><label for="incident-type">Tipo</label><select id="incident-type" name="type"><option>TFR</option><option>PMF</option><option>Otra</option></select></div><div class="field"><label for="incident-note">Nota opcional</label><input id="incident-note" name="note" maxlength="160"></div><p>Registro descriptivo. No aplica sanciones ni certifica decisiones.</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">Cancelar</button><button class="button button-primary">Anotar</button></div></form>');}

  function openThemes() {
    openModal('Modos de lectura',`<p>Elegí el contraste más cómodo para el entorno de juego.</p><div class="mode-options">${[...BUILT_IN_THEMES,...state.customThemes].map(theme=>`<button class="mode-option ${state.settings.theme===theme.id?'active':''}" type="button" data-action="apply-theme" data-theme="${esc(theme.id)}" style="--mode-swatch:${esc(theme.swatch||theme.vars?.accent||'#2448dc')}"><strong>${esc(theme.name)}</strong><small>${state.settings.theme===theme.id?'Activo':'Aplicar'}</small></button>`).join('')}</div>`);
  }

  function renderSettings() {
    const config=getRuleset(),locked=hasStarted()||isLocked();
    const currentProfile=state.customRulesets.find(p=>p.id===state.settings.ruleset);
    const editing=draftRuleset||!!currentProfile;
    const editLocked=locked&&!draftRuleset;
    const options=`<option value="wfdf" ${!draftRuleset&&state.settings.ruleset==='wfdf'?'selected':''}>WFDF 2025–2028</option><option value="usau" ${!draftRuleset&&state.settings.ruleset==='usau'?'selected':''}>USA Ultimate 2026–2027</option><option value="create" ${draftRuleset?'selected':''}>PERSONALIZADO · Crear perfil</option>${state.customRulesets.map(p=>`<option value="${esc(p.id)}" ${!draftRuleset&&state.settings.ruleset===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}`;
    const durations=[['gameCap','Tiempo total del partido',Math.round(config.gameCap/6)/10,'min'],['halfCap','Primer tiempo',Math.round(config.halfCap/6)/10,'min'],['halftime','Medio tiempo',Math.round(config.halftime/6)/10,'min'],['pull','Pull',config.pull.release,'s'],['call','Llamada',config.call.restart,'s'],['timeout','Time out',config.timeoutDuration,'s'],['timeoutsPerTeam','Time outs por equipo y por tiempo',config.timeoutsPerTeam,'']];
    app.innerHTML=`<section class="settings-screen"><div class="screen-head"><button class="back-button" data-action="back-dashboard">← Tablero</button><div><span class="screen-eyebrow">CONFIGURACIÓN</span><h1>Preparar partido</h1></div></div>
      <section class="settings-section"><div class="section-heading"><h2>Reglamento</h2></div><div class="settings-row"><div class="field"><label for="ruleset">Perfil</label><select id="ruleset" data-setting="ruleset" ${locked?'disabled':''}>${options}</select></div><div class="field"><label for="sound">Avisos</label><select id="sound" data-setting="sound"><option value="on" ${state.settings.sound?'selected':''}>Sonido y aviso visual</option><option value="off" ${!state.settings.sound?'selected':''}>Solo aviso visual</option></select></div></div><p>WFDF y USA Ultimate cargan sus tiempos de referencia. Los límites de duración del partido pueden depender del torneo: confirmalos antes de jugar.</p></section>
      <section class="settings-section"><div class="section-heading"><h2>Tiempos totales</h2><span>${editing?'PERFIL PERSONALIZADO':'PERFIL DE REFERENCIA'}</span></div><p>Un valor por reloj. Cada cuenta de Pull, Llamada, Time out y Medio tiempo corre hasta cero y termina con cinco alarmas.</p>${editing?`<form data-form="ruleset-profile" data-profile="${esc(draftRuleset?'':currentProfile?.id||'')}"><div class="field"><label for="profile-name">Nombre del perfil</label><input id="profile-name" name="name" maxlength="40" value="${esc(draftRuleset?'':currentProfile?.name||'')}" placeholder="Ej.: Torneo local" required ${editLocked?'disabled':''}></div><div class="duration-grid">${durations.map(([key,label,value,unit])=>durationField(key,label,value,unit,editLocked)).join('')}</div><button class="button button-primary settings-save" ${editLocked?'disabled':''}>${draftRuleset?'GUARDAR PERFIL PERSONALIZADO':currentProfile?'GUARDAR CAMBIOS':'GUARDAR PERFIL PERSONALIZADO'}</button></form>`:`<div class="duration-grid">${durations.map(([key,label,value,unit])=>`<div class="duration-readout"><span>${esc(label)}</span><strong>${value}${unit?` <small>${unit}</small>`:''}</strong></div>`).join('')}</div><p>Elegí “PERSONALIZADO · Crear perfil” para cambiar los valores y guardarlos en el desplegable.</p>`}</section>
      ${locked?'<p class="settings-locked">El partido ya comenzó. Prepará un nuevo partido para cambiar el reglamento o sus tiempos.</p>':''}
      <p class="settings-source">Referencias: <a href="https://rules.wfdf.sport/" target="_blank" rel="noreferrer">WFDF</a> · <a href="https://usaultimate.org/rules/" target="_blank" rel="noreferrer">USA Ultimate</a>.</p>
    </section>`;
  }
  function durationField(key,label,value,unit,locked){return `<div class="field duration-field"><label for="duration-${key}">${esc(label)}${unit?` · ${unit}`:''}</label><input id="duration-${key}" name="${key}" type="number" inputmode="${unit==='min'?'decimal':'numeric'}" min="${unit==='min'?0.1:1}" max="${key==='timeoutsPerTeam'?20:1440}" step="${unit==='min'?0.1:1}" value="${value}" required ${locked?'disabled':''}></div>`;}

  function openProfileSelector() {
    const locked=hasStarted()||isLocked(),current=state.settings.ruleset;
    selectedProfileId=current;
    const profiles=[{id:'wfdf',name:'WFDF 2025–2028'},{id:'usau',name:'USA Ultimate 2026–2027'},...state.customRulesets.map(p=>({id:p.id,name:p.name}))];
    openModal('PERFIL DE TIEMPO',`<p>${locked?'El partido actual ya comenzó. Su perfil queda fijo hasta preparar otro partido.':'Elegí los tiempos para este partido antes de empezar.'}</p><div class="profile-choices">${profiles.map(p=>`<button class="profile-choice ${p.id===current?'active':''}" type="button" data-action="select-profile" data-profile="${esc(p.id)}" aria-pressed="${p.id===current}" ${locked&&p.id!==current?'disabled':''}><strong>${esc(p.name)}</strong><span>${p.id===current?'SELECCIONADO':'ELEGIR'}</span></button>`).join('')}</div><div class="profile-actions"><button class="button profile-continue" type="button" data-action="use-profile" autofocus>USAR ESTE PERFIL</button><button class="button profile-new" type="button" data-action="new-profile">CREAR NUEVO PERFIL</button><button class="button profile-guide" type="button" data-action="start-tutorial">CÓMO USAR LA APP</button></div>`);
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
    tutorialRoot.innerHTML=`<div class="tour-layer"><div class="tour-shade" data-tour-shade="top"></div><div class="tour-shade" data-tour-shade="bottom"></div><div class="tour-shade" data-tour-shade="left"></div><div class="tour-shade" data-tour-shade="right"></div><div class="tour-highlight" aria-hidden="true"></div><section class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tourTitle" aria-describedby="tourDescription"><div class="tour-card-top"><span>PASO ${tutorialIndex+1} DE ${TUTORIAL_STEPS.length}</span><button type="button" data-action="tour-close" aria-label="Cerrar tutorial">×</button></div><h2 id="tourTitle">${esc(step.title)}</h2><p id="tourDescription">${esc(step.text)}</p><div class="tour-actions"><button type="button" data-action="tour-prev" ${tutorialIndex===0?'disabled':''}>ANTERIOR</button><button type="button" data-action="tour-next">${last?'TERMINAR':'SIGUIENTE →'}</button></div></section></div>`;
    requestAnimationFrame(()=>{positionTutorial();tutorialRoot.querySelector('[data-action="tour-next"]')?.focus({preventScroll:true});});
  }

  function startTutorial(){
    closeModal();
    if(!app.querySelector('.dashboard-screen'))renderDashboard();
    document.querySelector('.app-shell').inert=true;
    showTutorialStep(0);
  }

  function renderHistory() {
    const items = state.savedMatches;
    app.innerHTML = `<section class="history-screen"><div class="screen-head"><button class="back-button" data-action="back-dashboard">← <span>Tablero</span></button><div><span class="screen-eyebrow">PLANILLAS GUARDADAS</span><h1>Historial</h1></div><span class="screen-context">DATOS LOCALES</span></div>${items.length ? `<div class="history-list">${items.map(match => `<button class="history-item" type="button" data-history="${esc(match.id)}"><span><span class="history-teams">${esc(match.teams[0].name)} <small>vs</small> ${esc(match.teams[1].name)}</span><span class="history-date">${dateLabel(match.savedAt || match.createdAt)} · ${esc(rulesetLabel(match.ruleset))}</span></span><strong class="history-score">${match.teams[0].score} — ${match.teams[1].score}</strong></button>`).join("")}</div>` : `<div class="history-empty"><p class="section-kicker">Todavía no hay partidos guardados.</p><h2 class="page-title">La planilla aparece acá al tocar guardar.</h2><div class="form-actions"><button class="button button-primary" type="button" data-action="back-dashboard">Comenzar un partido</button></div></div>`}</section>`;
  }

  function openModal(title,body) {
    if(tutorialIndex>=0)closeTutorial();
    const previous=document.activeElement;closeModal();modalRoot._returnFocus=previous;
    modalRoot.innerHTML=`<dialog class="modal" aria-labelledby="modalTitle"><header class="modal-header"><h2 class="modal-title" id="modalTitle">${esc(title)}</h2><button class="modal-close" data-action="close-modal" aria-label="Cerrar">×</button></header><div class="modal-body">${body}</div></dialog>`;
    const dialog=modalRoot.querySelector('dialog');dialog.showModal();dialog.addEventListener('cancel',e=>{e.preventDefault();closeModal();});
    if(!dialog.querySelector('[autofocus]'))(dialog.querySelector('.modal-body .button-primary')||dialog.querySelector('.modal-body button'))?.focus({preventScroll:true});
  }

  function closeModal() {modalRoot.querySelector('dialog')?.close();modalRoot.innerHTML='';if(modalRoot._returnFocus?.isConnected)modalRoot._returnFocus.focus();}

  function openInfo() {
    openModal("Sobre Ultimate Clock", `<div class="info-hero"><span class="info-mark">UC</span><p>Un tablero para llevar los tiempos y la planilla del partido desde la línea de juego.</p></div><div class="info-copy"><p><strong>Desarrollado por Juan Martínez García.</strong> Esta app es gratuita para la comunidad del Ultimate Frisbee.</p><p>Los datos se guardan en este dispositivo.</p></div><div class="info-links"><a class="info-primary" href="https://www.instagram.com/ultimatefrisbeemza/" target="_blank" rel="noopener noreferrer">CONOCÉ ULTIMATE FRISBEE MENDOZA ↗</a><a href="https://iona.ar/" target="_blank" rel="noopener noreferrer">Conocé más proyectos ↗</a></div>`);
  }

  function addGoal(teamIndex,origin='dashboard') {
    const m=activeMatch(),team=m.teams[teamIndex];if(!team)return;
    const goal={id:uid('goal'),elapsed:m.clock.elapsed,at:nowIso(),assist:'',scorer:''};
    team.score+=1;team.goals.push(goal);logEvent('goal',{team:teamIndex,goal:goal.id,assist:'',scorer:''});
    closeModal();saveState();rerender(origin);announce(`Gol de ${team.name}. ${m.teams[0].score} a ${m.teams[1].score}`);
    showToast(`Gol de ${team.name}.`,[{label:'PASE Y GOL',action:'goal-details',data:{team:teamIndex,goal:goal.id,origin}},{label:'DESHACER',action:'undo-goal',data:{team:teamIndex,goal:goal.id,origin}}]);
  }
  function undoGoal(teamIndex,goalId,origin) {
    const m=activeMatch(),team=m.teams[teamIndex],at=team?.goals.findIndex(g=>g.id===goalId);
    if(!team||at<0){showToast('Ese gol ya no se puede deshacer.');return;}
    team.goals.splice(at,1);team.score=Math.max(0,team.score-1);m.events=m.events.filter(e=>e.goal!==goalId);
    saveState();rerender(origin);showToast(`Gol de ${team.name} deshecho.`);
  }
  function rerender(origin) { if(origin==='sheet')renderLiveSheet();else renderDashboard(); }
  function openGoal(teamIndex,goalId,origin='dashboard') {
    const team = activeMatch().teams[teamIndex],goal=team?.goals.find(g=>g.id===goalId);
    if(!goal)return;
    openModal("Detalle del gol", `<p class="goal-note">Gol de <strong>${esc(team.name)}</strong> a los ${fmt(goal.elapsed)}. Los dos campos son opcionales.</p><form data-form="goal" data-team="${teamIndex}" data-goal="${esc(goalId)}" data-origin="${esc(origin)}"><div class="field"><label for="assist">Pase</label><input id="assist" name="assist" autocomplete="off" value="${esc(goal.assist)}" placeholder="Quién dio el pase gol" autofocus></div><div class="field"><label for="scorer">Gol</label><input id="scorer" name="scorer" autocomplete="off" value="${esc(goal.scorer)}" placeholder="Quién recibió y anotó"></div><div class="modal-actions"><button class="button" type="button" data-action="close-modal">Cancelar</button><button class="button button-primary" type="submit">Guardar detalle</button></div></form>`);
  }

  function openMinus(teamIndex) {
    const team = activeMatch().teams[teamIndex];
    openModal("Corregir puntaje", `<p>¿Querés restar un punto a <strong>${esc(team.name)}</strong>? La corrección queda registrada como ajuste manual.</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">Cancelar</button><button class="button button-danger" type="button" data-action="confirm-minus" data-team="${teamIndex}">Restar punto</button></div>`);
  }

  function openTeamEditor(teamIndex) {
    const team = activeMatch().teams[teamIndex];
    const ink = contrastColor(team.color);
    openModal(`Equipo ${teamIndex + 1}`, `<form data-form="team" data-team="${teamIndex}"><div class="field"><label for="team-name">Nombre del equipo</label><input id="team-name" name="name" value="${esc(team.name)}" maxlength="30" autocomplete="off"></div><div class="team-color-options">${['#1b47e2','#f59e0b','#16a34a','#c62525','#16171b','#ffffff'].map(c=>`<button type="button" class="color-preset" style="background:${c};color:${E.ink(c)}" data-action="team-color" data-color="${c}" aria-label="Elegir color ${c}">●</button>`).join('')}</div><button class="button more-colors" type="button" data-action="more-colors">MÁS COLORES</button><div class="field extended-colors" id="extendedColors" hidden><label for="team-color">Elegí cualquier color</label><input id="team-color" name="color" type="color" value="${esc(team.color)}"></div><div class="color-preview" id="colorPreview" style="background:${esc(team.color)};color:${ink}">Vista previa del equipo</div><div class="modal-actions"><button class="button" type="button" data-action="close-modal">Cancelar</button><button class="button button-primary" type="submit">Guardar equipo</button></div></form>`);
  }

  function openReset() {
    openModal("Reiniciar contadores", `<p>¿Reiniciar todos los contadores? Se reinician tiempos, puntajes y eventos sin guardar del partido actual. El historial guardado y los perfiles no se borrarán.</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">Cancelar</button><button class="button button-danger" type="button" data-action="confirm-reset">Reiniciar contadores</button></div>`);
  }

  function openNewTheme() {
    openModal("Nuevo modo", `<form data-form="theme"><div class="field"><label for="theme-name">Nombre del modo</label><input id="theme-name" name="name" maxlength="28" placeholder="Ej.: Verde cancha" required autocomplete="off"></div><div class="modal-actions"><button class="button" type="button" data-action="close-modal">Cancelar</button><button class="button button-primary" type="submit">Crear y personalizar</button></div></form>`);
  }

  function openSheet(match) {
    const events=match.events.map(e=>`<li><time>${dateLabel(e.at)}<br>${fmt(e.elapsed||0)}</time><span>${esc(SheetExport.describeEvent(match,e))}</span></li>`).join('');
    openModal('Planilla guardada',`<p>${dateLabel(match.savedAt)} · ${esc(rulesetLabel(match.ruleset))} · ${esc(match.themeName||'Claro')}</p><h3 class="sheet-title">${esc(match.teams[0].name)} ${match.teams[0].score} — ${match.teams[1].score} ${esc(match.teams[1].name)}</h3><div class="sheet-grid"><div class="sheet-stat"><b>${fmt(match.clock.elapsed)}</b><span>Duración</span></div><div class="sheet-stat"><b>${match.events.filter(e=>e.type==='timeout').length}</b><span>Time-outs</span></div><div class="sheet-stat"><b>${match.events.length}</b><span>Eventos</span></div></div><p>Colores: ${match.teams.map(t=>`<span class="sheet-team" style="background:${esc(t.color)};color:${E.ink(t.color)}">${esc(t.name)} · ${esc(t.color)}</span>`).join(' ')}</p><details><summary>Configuración del partido</summary><pre>${esc(JSON.stringify(match.config,null,2))}</pre></details><ul class="event-list">${events||'<li>Sin eventos</li>'}</ul><div class="modal-actions"><button class="button" data-action="export-sheet" data-format="pdf" data-match="${esc(match.id)}">Descargar PDF</button><button class="button" data-action="export-sheet" data-format="csv" data-match="${esc(match.id)}">Descargar CSV</button><button class="button" data-action="export-sheet" data-format="json" data-match="${esc(match.id)}">Descargar JSON</button><button class="button button-primary" data-action="new-match">Nuevo partido</button></div>`);
  }

  function saveMatch() {
    const m=activeMatch();if(m.status==='saved'){showToast('Este partido ya está guardado.');renderHistory();return true;}
    if(Object.values(m.timers).some(t=>t.running)||m.breakTimer.running){closeModal();showToast('Esperá a que terminen las cuentas activas antes de guardar.');return false;}
    updateClock();for(const t of [...Object.values(m.timers),m.breakTimer]){updateRunningValue(t);t.running=false;t.startedAt=null;}
    m.clock.running=false;m.clock.startedAt=null;m.clock.status='Finalizado';logEvent('saved');m.status='saved';m.savedAt=nowIso();m.themeName=themeName(state.settings.theme);m.themeSnapshot=currentThemeVars();
    state.savedMatches.unshift(clone(m));
    const persisted=saveState();showToast(persisted?'Planilla guardada. Partido cerrado.':'Planilla en memoria. Descargá un respaldo para conservarla.');renderHistory();
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
    showToast("Contadores reiniciados.");
  }

  function saveRulesetProfile(form) {
    const active=hasStarted()||isLocked();
    if(active&&form.dataset.profile){showToast('Prepará un nuevo partido para cambiar los tiempos.');return;}
    const data=new FormData(form),name=String(data.get('name')||'').trim();
    const value=key=>Number(data.get(key));
    const fields=['gameCap','halfCap','halftime','pull','call','timeout','timeoutsPerTeam'];
    if(!name||fields.some(key=>!Number.isFinite(value(key))||value(key)<(key==='gameCap'||key==='halfCap'||key==='halftime'?0.1:1))||['pull','call','timeout','timeoutsPerTeam'].some(key=>!Number.isInteger(value(key)))){showToast('Completá el nombre y todos los tiempos con números positivos.');return;}
    const config=clone(getRuleset());config.label=name;config.gameCap=Math.round(value('gameCap')*60);config.halfCap=Math.round(value('halfCap')*60);config.halftime=Math.round(value('halftime')*60);config.pull.release=value('pull');config.call.restart=value('call');config.timeoutDuration=value('timeout');config.timeoutLimit=value('timeout');config.timeoutsPerTeam=value('timeoutsPerTeam');config.interruption='continue';
    const error=E.validate(config);if(error){showToast(error);return;}
    let profile=state.customRulesets.find(p=>p.id===form.dataset.profile);
    if(profile){profile.name=name;profile.config=clone(config);}else{profile={id:uid('profile'),name,config:clone(config)};state.customRulesets.push(profile);}
    if(!active){state.settings.ruleset=profile.id;state.settings.baseRuleset='wfdf';state.settings.overrides=clone(config);activeMatch().ruleset=profile.id;updateTimerConfig(activeMatch());}
    draftRuleset=false;saveState();renderSettings();showToast(`Perfil ${name} guardado${active?' para el próximo partido':''}.`);
  }

  function extraAction(action,element) {
    const m=activeMatch();
    if(action==='sheet'){renderLiveSheet();}
    else if(action==='goal-picker')openGoalPicker();
    else if(action==='timeout-picker')openTimeoutPicker();
    else if(action==='quick-call')openCallPicker();
    else if(action==='pick-call-team')openCall(Number(element.dataset.team));
    else if(action==='incident')openIncident();
    else if(action==='quick-theme'){const view=app.firstElementChild?.className||'';applyTheme(element.dataset.theme);if(view.includes('settings-screen'))renderSettings();else if(view.includes('sheet-screen'))renderLiveSheet();else if(view.includes('history-screen'))renderHistory();else renderDashboard();}
    else if(action==='enable-audio'){
      if(ClockAlerts.ready){state.settings.sound=false;ClockAlerts.setSound(false);saveState();updateAudioControls();showToast('Sonido desactivado.');}
      else ClockAlerts.unlock().then(ok=>{state.settings.sound=ok;ClockAlerts.setSound(ok);saveState();updateAudioControls();showToast(ok?'Sonido activado.':'No se pudo activar el sonido en este navegador.');});
    }
    else if(action==='test-audio'){
      ClockAlerts.unlock().then(ok=>{
        state.settings.sound=ok;ClockAlerts.setSound(ok);saveState();updateAudioControls();
        const played=ok&&ClockAlerts.test();
        showToast(played?'Sonido de prueba: cinco alarmas. Revisá el volumen del dispositivo.':'No se pudo reproducir el sonido de prueba.');
      });
    }
    else if(action==='fullscreen'){enterFullscreen();updateFullscreenControl();}
    else if(action==='team-color'){const input=document.getElementById('team-color');input.value=element.dataset.color;input.dispatchEvent(new Event('input',{bubbles:true}));}
    else if(action==='more-colors'){const field=document.getElementById('extendedColors');field.hidden=false;document.getElementById('team-color').click();}
    else if(action==='start-break'){
      if(m.half!==1||!m.clock.halfAlerted||m.breakTimer.running||m.breakTimer.completed){showToast('El medio tiempo todavía no está disponible.');return true;}
      m.breakTimer=makeTimer('break','Medio tiempo',m.config.halftime,[{at:m.config.halftime,label:'Tiempo cumplido'}]);setRunning(m.breakTimer,true);logEvent('half',{label:'Inicio del medio tiempo'});unlockAudio();closeModal();saveState();renderDashboard();
    }
    else if(action==='second-half'){
      if(m.half===2){showToast('La segunda mitad ya está activa.');return true;}
      updateRunningValue(m.breakTimer);if(!m.breakTimer.completed){showToast('El medio tiempo todavía está en curso.');return true;}
      m.half=2;m.timeoutState.usages=[0,0];m.timeoutState.activeTeam=null;m.timers.timeout=makeTimer('timeout','Time out',m.config.timeoutDuration,[{at:m.config.timeoutDuration,label:'Tiempo cumplido'}]);m.clock.running=true;m.clock.startedAt=Date.now();m.clock.status='Corriendo';logEvent('half',{label:'Inicio de segunda mitad; time outs de la nueva mitad disponibles'});closeModal();saveState();renderDashboard();
    }
    else if(action==='save-and-new'){if(saveMatch())resetMatch();}
    else if(action==='export-sheet'){const sheet=state.savedMatches.find(x=>x.id===element.dataset.match),format=element.dataset.format,name=`ultimate-clock-${sheet?.id}`;if(!sheet);else if(format==='pdf')download(SheetExport.toPDF(sheet,{rulesetLabel:rulesetLabel(sheet.ruleset)}),'application/pdf',`${name}.pdf`);else if(format==='csv')download(SheetExport.toCSV(sheet),'text/csv;charset=utf-8',`${name}.csv`);else exportData(sheet,`${name}.json`);}
    else if(action==='export-backup')exportData(storageRaw&&storageBlocked?{original:storageRaw,current:state}:state,'ultimate-clock-respaldo.json');
    else if(action==='retry-storage'){
      if(storageInvalid){showToast('Descargá primero el respaldo. El formato anterior se conserva sin sobrescribir.');return true;}
      storageBlocked=false;if(saveState()){document.getElementById('storageWarning')?.remove();showToast('Guardado local restablecido.');}
    }
    else return false;
    return true;
  }
  function extraSubmit(form) {
    const data=new FormData(form),m=activeMatch(),type=form.dataset.form;
    if(type==='incident'){logEvent('incident',{label:String(data.get('type')),note:String(data.get('note')||'').trim()});closeModal();saveState();renderLiveSheet();showToast('Incidencia anotada.');return true;}
    if(type==='ruleset-profile'){saveRulesetProfile(form);return true;}
    if(!['call','timeout'].includes(type))return false;
    if(isLocked()){closeModal();return true;}
    unlockAudio();
    if(type==='call'){const index=Number(form.dataset.team),category=String(data.get('type'));if(![0,1].includes(index)||!CALL_CATEGORIES.includes(category))return true;const t=index===0?m.timers.call:m.timers.call2;if(t.running){showToast('La llamada sigue en curso.');return true;}if(t.completed)Object.assign(t,{elapsed:0,completed:false,alerted:[],startedAt:null});m.callTypes[index]=category;setRunning(t,true);logEvent('call',{team:index,timer:t.id,label:category});}
    else {const index=Number(form.dataset.team),t=m.timers.timeout;if(t.running||m.timeoutState.usages[index]>=m.config.timeoutsPerTeam){showToast('Ese time out no está disponible.');return true;}m.timeoutState.activeTeam=index;m.timeoutState.mode='';m.timeoutState.usages[index]++;t.elapsed=0;t.alerted=[];t.completed=false;configureTimeout(m,'');setRunning(t,true);logEvent('timeout',{team:index});}
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
    if(action==='donation-info'){openModal('APOYÁ ESTE PROYECTO', '<p>El enlace para donar todavía no está disponible. Gracias por querer apoyar el desarrollo de Ultimate Clock.</p>');return;}
    if(isLocked()&&['goal','goal-details','undo-goal','minus','confirm-minus','edit-team','toggle-clock','toggle-timer','timeout','start-break','second-half'].includes(action)){showToast('Partido cerrado. Elegí Nuevo partido.');return;}
    if(extraAction(action,actionElement))return;
    if (action === "toggle-menu") {
      const menu = document.querySelector(".header-actions");
      const open = menu.classList.toggle("is-open");
      actionElement.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle('menu-open',open);
    }
    if(action==='select-profile'){
      const id=actionElement.dataset.profile,profile=state.customRulesets.find(p=>p.id===id);
      if(!profile&&!['wfdf','usau'].includes(id))return;
      if((hasStarted()||isLocked())&&id!==state.settings.ruleset){showToast('El perfil del partido actual no se puede cambiar.');return;}
      selectedProfileId=id;
      modalRoot.querySelectorAll('.profile-choice').forEach(button=>{const active=button.dataset.profile===id;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));button.querySelector('span').textContent=active?'SELECCIONADO':'ELEGIR';});
      return;
    }
    if(action==='use-profile'){
      const id=selectedProfileId,profile=state.customRulesets.find(p=>p.id===id);
      if(!profile&&!['wfdf','usau'].includes(id))return;
      if(!hasStarted()&&!isLocked()){state.settings.ruleset=id;state.settings.baseRuleset=profile?'wfdf':id;state.settings.overrides=profile?clone(profile.config):{};activeMatch().ruleset=id;updateTimerConfig(activeMatch());saveState();renderDashboard();enterFullscreen();}
      closeModal();return;
    }
    if(action==='new-profile'){draftRuleset=true;closeModal();renderSettings();document.getElementById('profile-name')?.focus();return;}
    if (action === "settings") { closeModal(); renderSettings(); }
    if (action === "info") openInfo();
    if (action === "reset") openReset();
    if (action === "save") saveMatch();
    if (action === "history") renderHistory();
    if (action === "back-dashboard") { renderDashboard(); }
    if(action==='new-match'){if(!isLocked()&&hasStarted()){openModal('Preparar un nuevo partido','<p>El partido actual aún no está en el historial. Guardalo antes de continuar.</p><div class="modal-actions"><button class="button" data-action="close-modal">Cancelar</button><button class="button button-primary" data-action="save-and-new">Guardar y crear nuevo</button></div>');}else {resetMatch();}}
    if (action === "close-modal") closeModal();
    if (action === "confirm-reset") resetMatch();
    if (action === "confirm-minus") {
      const index = Number(actionElement.dataset.team); const team = activeMatch().teams[index];
      if (team.score > 0) { team.score -= 1; team.adjustments.push({ at: nowIso(), delta: -1 }); logEvent('adjustment', { team: index }); }
      closeModal(); saveState(); renderDashboard(); showToast("Puntaje corregido.");
    }
    if (action === "goal") addGoal(Number(actionElement.dataset.team),actionElement.dataset.origin||'dashboard');
    if (action === "goal-details") { hideToast(); openGoal(Number(actionElement.dataset.team),actionElement.dataset.goal,actionElement.dataset.origin); }
    if (action === "undo-goal") { hideToast(); undoGoal(Number(actionElement.dataset.team),actionElement.dataset.goal,actionElement.dataset.origin); }
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
    if (timerCard && !event.target.closest("button")) { toggleTimer(timerCard.dataset.timer || "clock"); }
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
      goal.assist = String(data.get("assist") || "").trim(); goal.scorer = String(data.get("scorer") || "").trim();
      const event = m.events.find(e => e.goal === goal.id); if (event) Object.assign(event, { assist: goal.assist, scorer: goal.scorer });
      closeModal(); saveState(); rerender(form.dataset.origin); showToast("Detalle del gol guardado.");
    }
    if (form.dataset.form === "team") {
      const index = Number(form.dataset.team); const data = new FormData(form); const team = activeMatch().teams[index];
      team.name = String(data.get("name") || `Equipo ${index + 1}`).trim() || `Equipo ${index + 1}`; team.color = String(data.get("color") || team.color);
      closeModal(); saveState(); renderDashboard(); showToast("Datos del equipo guardados.");
    }
  });

  document.addEventListener("input", event => {
    if (event.target.id === "team-color") {
      const preview = document.getElementById("colorPreview");
      if (preview) { preview.style.background = event.target.value; preview.style.color = contrastColor(event.target.value); preview.textContent='Vista previa del equipo'; }
    }
  });

  document.addEventListener("change", event => {
    if(event.target.id==='call-type'){const guidance=document.getElementById('call-guidance');if(guidance)guidance.textContent=CALL_GUIDANCE[event.target.value]||'';}
    if (event.target.dataset.setting === "ruleset") {
      if(hasStarted()||isLocked())return;
      const id=event.target.value;
      if(id==='create'){draftRuleset=true;renderSettings();document.getElementById('profile-name')?.focus();return;}
      draftRuleset=false;
      const profile=state.customRulesets.find(p=>p.id===id);
      if(!profile&&!['wfdf','usau'].includes(id))return;
      state.settings.ruleset=id;state.settings.baseRuleset=profile?'wfdf':id;state.settings.overrides=profile?clone(profile.config):{};
      const match=activeMatch();match.ruleset=id;updateTimerConfig(match);saveState();renderSettings();showToast(`Perfil ${rulesetLabel(id)} activo.`);
    }
    if (event.target.dataset.setting === "sound") {
      state.settings.sound=event.target.value==='on';
      if(state.settings.sound)unlockAudio().then(ok=>{if(!ok)showToast('No se pudo activar el sonido en este navegador.');else showToast('Alertas sonoras activas.');});
      else {ClockAlerts.setSound(false);updateAudioControls();showToast('Alertas sonoras desactivadas.');}
      saveState();
    }
  });

  ClockAlerts.onAudioFailure=()=>{
    state.settings.sound=false;
    saveState();
    const field=document.getElementById('sound');
    if(field)field.value='off';
    updateAudioControls();
    showToast('Falló la reproducción. Revisá el navegador y probá el sonido desde MENU.');
  };
  ClockAlerts.setSound(false);
  document.addEventListener('visibilitychange',()=>{updateAudioControls();if(!document.hidden&&wakeWanted){wakeWanted=false;wakeLock=null;}});
  document.addEventListener('fullscreenchange',updateFullscreenControl);
  window.addEventListener('resize',()=>{if(tutorialIndex>=0)requestAnimationFrame(positionTutorial);});
  (state.pendingAlerts||[]).forEach(dispatchAlert);
  applyTheme(state.settings.theme,false);
  updateAudioControls();
  updateFullscreenControl();
  renderDashboard();
  if(!hasStarted()&&!isLocked())openProfileSelector();
  document.getElementById('bootFallback')?.remove();
  if(storageBlocked)showStorageError();
  let otherTabLocked=false;
  window.addEventListener('storage',e=>{
    if(otherTabLocked||e.key!==STORAGE_KEY||!e.newValue)return;
    let writer;try{writer=JSON.parse(e.newValue).writerId;}catch{return;}
    if(writer===writerId)return;
    otherTabLocked=storageBlocked=true;showToast('Otra pestaña cambió el partido. Recargá esta pestaña antes de continuar.');app.inert=true;document.querySelector('.topbar').inert=true;
    const warning=document.createElement('div');warning.className='storage-warning';warning.innerHTML='Partido abierto en otra pestaña. <button type="button" data-action="reload">Recargar estado actual</button>';document.body.prepend(warning);
  });
  if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>showToast('La instalación sin conexión no está disponible en este navegador.'));

})();
