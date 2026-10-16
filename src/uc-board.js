
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
    state.settings.theme=id; if(persist)persistMatch();updateThemeMeta();
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
    if(!ready){state.settings.sound=false;persistMatch();const field=document.getElementById('sound');if(field)field.value='off';showToast(t('El navegador no habilitó el sonido. Usá PROBAR SONIDO en MENU.'));}
    updateAudioControls();
    return ready;
  }
  function dispatchAlert(item) {ClockAlerts.enqueue(item.kind,()=>{alertVisual(item.kind,item.timer,item.count);announce(item.message);state.pendingAlerts=(state.pendingAlerts||[]).filter(a=>a.id!==item.id);persistMatch();});}
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
    persistMatch();
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
      logEvent('limit',{timer:'clock',label:'Primer tiempo cumplido',limit:clock.halfCap});queueAlert('complete','clock',t('Primer tiempo cumplido'));persistMatch();
    }else if(match.half===2&&!clock.capAlerted&&clock.elapsed>=clock.gameCap){
      clock.elapsed=clock.gameCap;clock.running=false;clock.startedAt=null;clock.capAlerted=true;clock.status='Tiempo total cumplido';
      logEvent('limit',{timer:'clock',label:'Tiempo total cumplido',limit:clock.gameCap});queueAlert('complete','clock',t('Tiempo total cumplido'));persistMatch();
    }
    return true;
  }

  function showPendingTimePrompt() {
    const match=state.activeMatch;if(!match||modalRoot.querySelector('dialog[open]'))return;
    if(match.pendingHalfPrompt){match.pendingHalfPrompt=false;persistMatch();openModal(t('PRIMER TIEMPO CUMPLIDO'),`<div class="milestone-modal"><div class="milestone-clock">${fmt(match.clock.elapsed)}</div><p>${esc(t('El reloj del partido se detuvo al llegar al primer tiempo.'))}</p><button class="button button-primary" data-action="start-break">${esc(t('INICIAR MEDIO TIEMPO'))}</button></div>`);}
    else if(match.pendingSecondHalfPrompt){match.pendingSecondHalfPrompt=false;persistMatch();openModal(t('MEDIO TIEMPO CUMPLIDO'),`<div class="milestone-modal"><div class="milestone-clock">00:00</div><p>${esc(t('El descanso terminó. El reloj del partido se reanudará al comenzar la segunda mitad.'))}</p><button class="button button-primary" data-action="second-half">${esc(t('INICIAR SEGUNDO TIEMPO'))}</button></div>`);}
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
    } finally {
      const match=state.activeMatch;
      const hasRunning = match?.status==='active' && [match.clock,...Object.values(match.timers),match.breakTimer].some(t=>t && t.running);
      if (hasRunning) window.requestAnimationFrame(tick); else window.setTimeout(tick,1000);
    }
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

  /* En modo torneo, antes de empezar los dos equipos tienen que venir de la lista; si no, se ofrece elegirlos. */
  function tournamentReady() {
    if(!isTournamentMode()||hasStarted())return true;
    if(activeMatch().teams.every(x=>tournamentTeam(x.tid)))return true;
    if(state.tournament&&state.tournament.teams.length>=2)openTournamentMatchSetup();
    else showToast(t('Agregá al menos dos equipos al torneo para empezar.'));
    return false;
  }
  function toggleTimer(id,fromCard=false) {
    if(isLocked())return;
    if(id==='clock'&&!tournamentReady())return;
    unlockAudio();const m=activeMatch();
    if(id==='clock'){
      if(m.clock.capAlerted){showToast(t('El tiempo total ya se cumplió.'));return;}
      if(m.half===1&&m.clock.halfAlerted){showToast(t('Iniciá el medio tiempo para continuar.'));return;}
      updateClock();if(m.clock.capAlerted||(m.half===1&&m.clock.halfAlerted)){persistMatch();renderDashboard();return;}
      m.clock.running=!m.clock.running;m.clock.startedAt=m.clock.running?Date.now():null;m.clock.status=m.clock.running?'Corriendo':'Pausado';
      logEvent(m.clock.running?'resume':'pause',{timer:'clock'});
    }else{
      if(!['pull','call-0','call-1'].includes(id))return;
      const index=id==='call-1'?1:0,timer=id==='pull'?m.timers.pull:index===0?m.timers.call:m.timers.call2;
      /* Pull y Llamado: mientras corren, el botón es REINICIAR (vuelve a cero). Tocar la tarjeta no reinicia. */
      if(timer.running){if(fromCard)return;Object.assign(timer,{elapsed:0,running:false,startedAt:null,completed:false,alerted:[]});persistMatch();renderDashboard();return;}
      if(timer.completed){Object.assign(timer,{elapsed:0,running:false,startedAt:null,completed:false,alerted:[]});persistMatch();renderDashboard();return;}
      if(id!=='pull'){openCall(index);return;}
      setRunning(timer,true);logEvent('start',{timer:id});
    }
    persistMatch();renderDashboard();
  }
  /* El llamado arranca al tocarlo; mientras corre se elige la categoría. Cerrar el cuadro lo registra con la categoría marcada. */
  let pendingCall=null;
  const callTimer=(m,index)=>index===0?m.timers.call:m.timers.call2;
  function openCall(teamIndex) {
    const m=activeMatch(),timer=callTimer(m,teamIndex);
    if(timer.running){showToast(t('El llamado corre hasta el final.'));return;}
    if(timer.completed)Object.assign(timer,{elapsed:0,completed:false,alerted:[],startedAt:null});
    unlockAudio();m.callTypes[teamIndex]='';setRunning(timer,true);persistMatch();renderDashboard();
    openModal(t('Llamado de {team}',{team:m.teams[teamIndex].name}),`<form data-form="call" data-team="${teamIndex}"><fieldset class="call-types"><legend>${esc(t('Categoría de llamado'))}</legend>${CALL_CATEGORIES.map((x,i)=>`<label class="call-type"><input type="radio" name="type" value="${esc(x)}" ${i===0?'checked':''}><span>${esc(t(x))}</span></label>`).join('')}</fieldset><p class="call-guidance" id="call-guidance">${esc(t(CALL_GUIDANCE.Falta))}</p><p>${esc(t('El reloj registra el llamado; no aplica sanciones ni reemplaza las reglas.'))} <a href="${m.ruleset==='usau'?'https://usaultimate.org/rules/':'https://rules.wfdf.sport/'}" target="_blank" rel="noopener noreferrer">${esc(t('Consultar reglamento ↗'))}</a></p><div class="modal-actions"><button class="button" type="button" data-action="cancel-call" data-team="${teamIndex}">${esc(t('CANCELAR LLAMADO'))}</button><button class="button button-primary">${esc(t('REGISTRAR'))}</button></div></form>`);
    pendingCall=teamIndex;
  }
  function registerCall(index,category) {
    const m=activeMatch(),timer=callTimer(m,index);
    if(!CALL_CATEGORIES.includes(category))category=CALL_CATEGORIES[0];
    m.callTypes[index]=category;logEvent('call',{team:index,timer:timer.id,label:category});persistMatch();renderDashboard();
  }
  function cancelCall(index) {
    const m=activeMatch(),timer=callTimer(m,index);
    Object.assign(timer,{elapsed:0,running:false,startedAt:null,completed:false,alerted:[]});m.callTypes[index]='';persistMatch();renderDashboard();
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

  /* Cartel del encabezado: MODO PARTIDO o MODO TORNEO según el partido actual. */
  function updateModeBadge() {
    const badge=document.getElementById('modeBadge');if(!badge)return;
    const tournament=isTournamentMode();
    badge.textContent=t(tournament?'TORNEO':'PARTIDO');badge.title=t(tournament?'MODO TORNEO':'MODO PARTIDO');badge.setAttribute('aria-label',t(tournament?'MODO TORNEO':'MODO PARTIDO'));badge.classList.toggle('is-tournament',tournament);
    const enter=document.getElementById('menuTournament'),exit=document.getElementById('menuExitTournament');
    if(enter)enter.textContent=t(tournament?'EQUIPOS DEL TORNEO':'ENTRAR AL MODO TORNEO');
    if(exit){exit.hidden=!tournament;exit.textContent=t('SALIR DEL MODO TORNEO');}
  }
  function renderDashboard() {
    const match=activeMatch();updateModeBadge();updateTimerConfig(match);
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
