
  function extraAction(action,element) {
    const m=activeMatch();
    if(tournamentAction(action,element))return true;
    if(action==='changelog')openChangelog();
    else if(action==='sheet'){renderLiveSheet();}
    else if(action==='tournament'){if(isTournamentMode()){closeModal();teamSheet=null;renderTournament();}else enterTournamentMode();}
    else if(action==='exit-tournament')exitTournamentMode();
    else if(action==='save-and-enter-tournament'){if(saveMatch()){enterTournamentMode();}}
    else if(action==='save-and-exit-tournament'){if(saveMatch()){exitTournamentMode();}}
    else if(action==='t-back')leaveTournamentScreen();
    else if(action==='goal-picker')openGoalPicker();
    else if(action==='timeout-picker')openTimeoutPicker();
    else if(action==='quick-call')openCallPicker();
    else if(action==='pick-call-team')openCall(Number(element.dataset.team));
    else if(action==='incident')openIncident();
    else if(action==='quick-theme'){const view=app.firstElementChild?.className||'';applyTheme(element.dataset.theme);if(view.includes('settings-screen'))renderSettings();else if(view.includes('tournament-screen'))renderTournament();else if(view.includes('sheet-screen'))renderLiveSheet();else renderDashboard();}
    else if(action==='enable-audio'){
      if(ClockAlerts.ready){state.settings.sound=false;ClockAlerts.setSound(false);persistMatch();updateAudioControls();showToast(t('Sonido desactivado.'));}
      else ClockAlerts.unlock().then(ok=>{state.settings.sound=ok;ClockAlerts.setSound(ok);persistMatch();updateAudioControls();showToast(t(ok?'Sonido activado.':'No se pudo activar el sonido en este navegador.'));});
    }
    else if(action==='test-audio'){
      ClockAlerts.unlock().then(ok=>{
        state.settings.sound=ok;ClockAlerts.setSound(ok);persistMatch();updateAudioControls();
        const played=ok&&ClockAlerts.test();
        showToast(t(played?'Sonido de prueba: cinco alarmas. Revisá el volumen del dispositivo.':'No se pudo reproducir el sonido de prueba.'));
      });
    }
    else if(action==='fullscreen'){
      if(document.fullscreenElement) { document.exitFullscreen?.().catch(()=>{}); }
      else enterFullscreen();
      updateFullscreenControl();
    }
    else if(action==='setup-color')setSetupColor(Number(element.dataset.team),element.dataset.color);
    else if(action==='team-color'){const input=document.getElementById('team-color');input.value=element.dataset.color;input.dispatchEvent(new Event('input',{bubbles:true}));}
    else if(action==='more-colors'){const field=document.getElementById('extendedColors');field.hidden=false;document.getElementById('team-color').click();}
    else if(action==='start-break'){
      if(m.half!==1||!m.clock.halfAlerted||m.breakTimer.running||m.breakTimer.completed){showToast(t('El medio tiempo todavía no está disponible.'));return true;}
      m.breakTimer=makeTimer('break','Medio tiempo',m.config.halftime,[{at:m.config.halftime,label:'Tiempo cumplido'}]);setRunning(m.breakTimer,true);logEvent('half',{label:'Inicio del medio tiempo'});unlockAudio();closeModal();persistMatch();renderDashboard();
    }
    else if(action==='second-half'){
      if(m.half===2){showToast(t('La segunda mitad ya está activa.'));return true;}
      updateRunningValue(m.breakTimer);if(!m.breakTimer.completed){showToast(t('El medio tiempo todavía está en curso.'));return true;}
      m.half=2;m.timeoutState.usages=[0,0];m.timeoutState.activeTeam=null;m.timers.timeout=makeTimer('timeout','Time out',m.config.timeoutDuration,[{at:m.config.timeoutDuration,label:'Tiempo cumplido'}]);m.clock.running=true;m.clock.startedAt=Date.now();m.clock.status='Corriendo';logEvent('half',{label:'Inicio de segunda mitad; time outs de la nueva mitad disponibles'});closeModal();persistMatch();renderDashboard();
    }
    else if(action==='delete-sheet'){const sheet=state.savedMatches.find(x=>x.id===element.dataset.match);if(sheet)openModal(t('Eliminar planilla'),`<p>${esc(t('¿Eliminar la planilla {a} vs {b}? No se puede deshacer. Exportala antes si querés conservarla.',{a:sheet.teams[0].name,b:sheet.teams[1].name}))}</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-danger" type="button" data-action="confirm-delete-sheet" data-match="${esc(sheet.id)}">${esc(t('ELIMINAR PLANILLA'))}</button></div>`);}
    else if(action==='confirm-delete-sheet'){state.savedMatches=state.savedMatches.filter(x=>x.id!==element.dataset.match);closeModal();persistSheets();if(app.querySelector('.sheet-screen'))renderLiveSheet();showToast(t('Planilla eliminada.'));}
    else if(action==='save-and-new'){if(saveMatch())startNextMatch();}
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
    if(type==='incident'){logEvent('incident',{label:String(data.get('type')),note:String(data.get('note')||'').trim()});closeModal();persistMatch();renderLiveSheet();showToast(t('Incidencia anotada.'));return true;}
    if(type==='ruleset-profile'){saveRulesetProfile(form);return true;}
    if(type==='welcome-teams'){if(!hasStarted()&&!isLocked()){applyTeamsForm(form);openWelcome('players');}else closeModal();return true;}
    if(type==='welcome-players'){if(!hasStarted()&&!isLocked()){applyPlayersForm(form);openWelcome('profile');}else closeModal();return true;}
    if(type==='players'){applyPlayersForm(form);closeModal();persistMatch();renderDashboard();showToast(t('Equipos listos.'));return true;}
    if(type==='welcome-profile'){saveWelcomeProfile(form);return true;}
    if(type==='teams'){if(!hasStarted()&&!isLocked())m.teams.forEach((team,i)=>{team.name=String(data.get(`name-${i}`)||'').trim()||t('Equipo {n}',{n:i+1});const color=String(data.get(`color-${i}`)||'');if(isHexColor(color))team.color=color;});closeModal();persistMatch();renderDashboard();openPlayersSetup();return true;}
    if(!['call','timeout'].includes(type))return false;
    if(isLocked()){closeModal();return true;}
    unlockAudio();
    if(type==='call'){const index=Number(form.dataset.team);if(![0,1].includes(index)||pendingCall!==index)return true;pendingCall=null;registerCall(index,String(data.get('type')));closeModal();return true;}
    else {const index=Number(form.dataset.team),timer=m.timers.timeout;if(timer.running||m.timeoutState.usages[index]>=m.config.timeoutsPerTeam){showToast(t('Ese time out no está disponible.'));return true;}m.timeoutState.activeTeam=index;m.timeoutState.mode='';m.timeoutState.usages[index]++;timer.elapsed=0;timer.alerted=[];timer.completed=false;configureTimeout(m,'');setRunning(timer,true);logEvent('timeout',{team:index});}
    closeModal();persistMatch();renderDashboard();return true;
  }

  function handleAction(actionElement) {
    const action = actionElement.dataset.action;
    if(action!=='toggle-menu'){document.querySelector('.header-actions').classList.remove('is-open');document.querySelector('.menu-button').setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');}
    if(action==='start-tutorial'){startTutorial();return;}
    if(action==='help-board'||action==='help-sheet'||action==='help-settings'||action==='help-tournament'){openHelp(action);return;}
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
    if(action==='welcome-back'){openWelcome(welcomeStep==='custom'?'profile':welcomeStep==='profile'?'players':welcomeStep==='players'?'teams':'mode');return;}
    if (action === "settings") { closeModal(); renderSettings(); }
    if (action === "info") openInfo();
    if (action === "reset") openReset();
    if (action === "save") {
      const m=activeMatch();
      if(m.status==='saved'){renderLiveSheet();return;}
      if(Object.values(m.timers).some(t=>t.running)||m.breakTimer.running){closeModal();showToast(t('Esperá a que terminen las cuentas activas antes de guardar.'));return;}
      openModal(t('¿Terminó el partido?'),`<p>${esc(t('{a} {sa} – {sb} {b}',{a:m.teams[0].name,sa:m.teams[0].score,sb:m.teams[1].score,b:m.teams[1].name}))}</p><div class=\"modal-actions\"><button class=\"button\" type=\"button\" data-action=\"close-modal\">${esc(t('Cancelar'))}</button><button class=\"button button-primary\" type=\"button\" data-action=\"confirm-save\">${esc(t('GUARDAR'))}</button></div>`);
      return;
    }
    if (action === "history") renderLiveSheet();
    if (action === "back-dashboard") { teamSheet=null; renderDashboard(); }
    if(action==='new-match'){if(!isLocked()&&hasStarted()){openModal(t('Preparar un nuevo partido'),`<p>${esc(t('El partido actual aún no está en el historial. Guardalo antes de continuar.'))}</p><div class="modal-actions"><button class="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-primary" data-action="save-and-new">${esc(t('Guardar y crear nuevo'))}</button></div>`);}else {startNextMatch();}}
    if(action==='choose-mode'){chooseMode(actionElement.dataset.mode);return;}
    if (action === "close-modal") closeModal();
    if(action==='confirm-reset') resetMatch();
    if(action==='confirm-save'){closeModal();saveMatch();}
    if (action === "confirm-minus") {
      const index = Number(actionElement.dataset.team); const team = activeMatch().teams[index];
      if (team.score > 0) { team.score -= 1; team.adjustments.push({ at: nowIso(), delta: -1 }); logEvent('adjustment', { team: index }); }
      closeModal(); persistMatch(); renderDashboard(); showToast(t("Puntaje corregido."));
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
      const tournament = isTournamentMode(), roster = rosterFor(team);
      if (!(tournament && !roster.length)) {
      const assist = readPerson(data,'assist',roster,tournament), scorer = readPerson(data,'scorer',roster,tournament);
      const same = assist.name && scorer.name && ((assist.id && assist.id === scorer.id) || assist.name.toLowerCase() === scorer.name.toLowerCase());
      if (same) { showToast(t('El pase y el gol no pueden ser de la misma persona.')); return; }
      Object.assign(goal, { assist: assist.name, assistId: assist.id, scorer: scorer.name, scorerId: scorer.id });
      }
      const event = m.events.find(e => e.goal === goal.id); if (event) Object.assign(event, { assist: goal.assist, assistId: goal.assistId, scorer: goal.scorer, scorerId: goal.scorerId });
      closeModal(); persistMatch(); rerender(form.dataset.origin); showToast(t("Detalle del gol guardado."));
    }
    if (form.dataset.form === "team") {
      const index = Number(form.dataset.team); const data = new FormData(form); const team = activeMatch().teams[index];
      team.name = String(data.get("name") || "").trim() || t('Equipo {n}',{n:index + 1}); team.color = String(data.get("color") || team.color);if(data.has("players"))team.roster = TN.rosterFromText(data.get("players"),team.roster);
      closeModal(); persistMatch(); renderDashboard(); showToast(t("Datos del equipo guardados."));
    }
  });

  /* Tapping a team name selects it, so typing replaces "Equipo 1". */
  document.addEventListener("focusin", event => { if (event.target.matches?.('.team-setup input[name^="name-"]')) event.target.select(); });
  document.addEventListener("input", event => {
    if (event.target.dataset.numeric) {
      const el=event.target,v=el.value.replace(/\D/g,'');
      if(v!==el.value)el.value=v;
    }
    if (event.target.type==='color'&&event.target.closest('.sheet-top')) syncSheetColor(event.target.closest('form'));
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
      const match=activeMatch();match.ruleset=id;updateTimerConfig(match);persistMatch();renderSettings();showToast(t('Perfil {name} activo.',{name:rulesetLabel(id)}));
    }
    if (event.target.dataset.setting === "sound") {
      state.settings.sound=event.target.value==='on';
      if(state.settings.sound)unlockAudio().then(ok=>{if(!ok)showToast(t('No se pudo activar el sonido en este navegador.'));else showToast(t('Alertas sonoras activas.'));});
      else {ClockAlerts.setSound(false);updateAudioControls();showToast(t('Alertas sonoras desactivadas.'));}
      persistMatch();
    }
  });

  /* Textos fijos del HTML: data-i18n (texto) y data-i18n-label (aria-label) guardan la clave en español. */
  function applyStaticText() {
    root.lang=lang;
    document.title=t('Ultimate Clock — Reloj y planilla para partidos de Ultimate Frisbee');
    document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n);});
    document.querySelectorAll('[data-i18n-label]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.i18nLabel)));
    document.querySelectorAll('.header-actions [data-action="set-lang"]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.lang===lang)));
    updateAudioControls();updateFullscreenControl();updateModeBadge();
  }
  /* Los equipos con el nombre por defecto ("Equipo 1" / "Team 1") siguen al idioma; los nombres propios no se tocan. */
  function relabelDefaultTeams() {
    state.activeMatch?.teams.forEach((team,i)=>{if(UCI18N.languages.some(l=>team.name===UCI18N.t(l,'Equipo {n}',{n:i+1})))team.name=t('Equipo {n}',{n:i+1});});
  }
  function setLang(next) {
    if(!UCI18N.languages.includes(next)||next===lang)return;
    const teamsForm=modalRoot.querySelector('[data-form="welcome-teams"]');if(teamsForm)applyTeamsForm(teamsForm);
    lang=next;state.settings.lang=next;relabelDefaultTeams();persistMatch();applyStaticText();
    const profileOpen=!!modalRoot.querySelector('.welcome-flow');
    const view=app.firstElementChild?.className||'';
    if(view.includes('settings-screen'))renderSettings();else if(view.includes('tournament-screen'))renderTournament();else if(view.includes('sheet-screen'))renderLiveSheet();else renderDashboard();
    if(profileOpen)openWelcome();else closeModal();
    if(tutorialIndex>=0)showTutorialStep(tutorialIndex);
    announce(t('Idioma: español'));
  }

  ClockAlerts.onAudioFailure=()=>{
    state.settings.sound=false;
    persistMatch();
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
  if(isLocked()){
    /* El partido de la sesión anterior ya está guardado en Planilla: la app arranca con uno nuevo y vacío. */
    const mode=state.activeMatch.mode;state.activeMatch=makeMatch(state.settings.ruleset);state.activeMatch.mode=mode;persistMatch();renderDashboard();
  }
  if(!hasStarted()&&!isLocked()){if(isTournamentMode()){if(state.tournament&&state.tournament.teams.length>=2)openTournamentMatchSetup();else{renderTournament();}}else openWelcome('mode');}
  document.getElementById('bootFallback')?.remove();
  if(storageBlocked)showStorageError();
  let otherTabLocked=false;
  window.addEventListener('storage',e=>{
    if(otherTabLocked||(e.key!==KEY_MATCH&&e.key!==STORAGE_KEY)||!e.newValue)return;
    let writer;try{writer=JSON.parse(e.newValue).writerId;}catch{return;}
    if(writer===writerId)return;
    otherTabLocked=storageBlocked=true;showToast(t('Otra pestaña cambió el partido. Recargá esta pestaña antes de continuar.'));app.inert=true;document.querySelector('.topbar').inert=true;
    const warning=document.createElement('div');warning.className='storage-warning';warning.innerHTML=`${esc(t('Partido abierto en otra pestaña.'))} <button type="button" data-action="reload">${esc(t('Recargar estado actual'))}</button>`;document.body.prepend(warning);
  });
  /* Ask the browser not to evict saved games under storage pressure; silently ignored where unsupported. */
  navigator.storage?.persist?.().catch(()=>{});
  if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>showToast(t('La instalación sin conexión no está disponible en este navegador.')));

})();
