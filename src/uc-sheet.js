
  function eventDescription(event,match) {
    const team=event.team===undefined?'':` · ${esc(match.teams[event.team].name)}`;
    const names=event.type==='goal'?`${event.scorer?` · ${esc(event.scorer)}`:''}${event.assist?` · ${esc(t('pase'))} ${esc(event.assist)}`:''}`:'';
    const kind={goal:'Gol',timeout:'Time-out',call:'Llamado',adjustment:'Ajuste manual',pause:'Pausa',resume:'Inicio / reanudación',limit:'Pull iniciado',start:'Inicio',half:'Descanso / mitad',incident:'Incidencia',saved:'Guardado'}[event.type];
    return `${kind?esc(t(kind)):esc(event.type)}${team}${event.label?` · ${esc(t(event.label))}`:''}${names}${event.mode?` · ${esc(t(event.mode))}`:''}${event.note?` · ${esc(event.note)}`:''}`;
  }
  /* planilla-equipo-1-vs-equipo-2-2026-10-02 */
  function exportName(match) {
    const slug=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'equipo';
    return `${t('planilla')}-${slug(match.teams[0].name)}-vs-${slug(match.teams[1].name)}-${String(match.savedAt||match.createdAt||nowIso()).slice(0,10)}`;
  }
  /* wa.me opens the WhatsApp app on phones and WhatsApp Web on computers, with the message ready to pick a chat. */
  function shareWhatsApp(text) {
    if(navigator.share){navigator.share({title:'Ultimate Clock',text}).catch(()=>{window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank','noopener');});return;}
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
    updateModeBadge();const m=activeMatch(),events=[...m.events].reverse();
    app.innerHTML=`<section class="sheet-screen"><div class="screen-head"><button class="back-button" data-action="back-dashboard">← <span>${esc(t('Tablero'))}</span></button><div><span class="screen-eyebrow">${esc(t(m.status==='saved'?'PARTIDO CERRADO':'PARTIDO ACTUAL'))}</span><h1>${esc(t('Planilla'))}</h1></div></div>
      <div class="sheet-live-strip"><span>${esc(t(m.status==='saved'?'CERRADO':m.clock.running?'EN CURSO':m.clock.elapsed>0?'PAUSADO':'PREPARADO'))} · ${esc(t(m.half===1?'1º TIEMPO':'2º TIEMPO'))}</span><strong class="sheet-live-clock">${fmt(Math.floor(m.clock.elapsed))}</strong><small>${esc(rulesetLabel(m.ruleset))}</small></div>
      <div class="sheet-score-grid">${m.teams.map((team,index)=>`<div class="sheet-score-team sheet-score-${index+1}" style="${teamStyle(team)}"><strong>${esc(team.name)}</strong><b>${team.score}</b><small>${esc(t('TIME OUTS'))} ${Math.max(0,m.config.timeoutsPerTeam-m.timeoutState.usages[index])}/${m.config.timeoutsPerTeam}</small></div>`).join('')}</div>
      ${m.status==='active'?`<section class="quick-entry"><div class="section-heading"><h2>${esc(t('Registro rápido'))}</h2><span>${esc(t('ESTE DISPOSITIVO'))}</span></div><div class="quick-grid"><button class="quick-primary" data-action="goal-picker">＋ ${esc(t('Gol'))}</button><button data-action="quick-call">⚠ ${esc(t('Llamado'))}</button><button data-action="timeout-picker">◷ ${esc(t('Time-out'))}</button><button data-action="incident">△ ${esc(t('Incidencia'))}</button></div></section>`:''}
      <section class="event-section"><div class="section-heading"><h2>${esc(t('Eventos'))}</h2><span>${events.length} ${esc(t(events.length===1?'REGISTRO':'REGISTROS'))}</span></div>${events.length?`<ol class="event-feed">${events.map(e=>`<li><time>${fmt(e.elapsed||0)}</time><span>${eventDescription(e,m)}</span></li>`).join('')}</ol>`:`<p class="empty-events">${esc(t('Todavía no hay eventos. Usá el registro rápido para comenzar.'))}</p>`}</section>
      <section class="event-section"><div class="section-heading"><h2>${esc(t('Exportar este partido'))}</h2><span>PDF · Excel · Copia de seguridad · WHATSAPP</span></div>${exportButtons(m,t('Exportar la planilla de este partido'))}</section>
      <div class="sheet-actions">${m.status==='saved'?`<button class="button button-primary" data-action="new-match">${esc(t('Nuevo partido'))}</button>`:`<button class="button button-primary" data-action="save">${esc(t('Guardar planilla'))}</button>`}<button class="button" data-action="back-dashboard">${esc(t('Volver al tablero'))}</button></div>
      ${savedSheetsMarkup()}</section>`;
    updateDisplays();
  }
  function openGoalPicker() {openModal(t('Registrar gol'),`<p>${esc(t('Elegí qué equipo anotó.'))}</p><div class="picker-options">${activeMatch().teams.map((team,index)=>`<button class="button" data-action="goal" data-team="${index}" data-origin="sheet">${esc(team.name)}</button>`).join('')}</div>`);}
  function openTimeoutPicker() {openModal(t('Pedir time-out'),`<p>${esc(t('Elegí el equipo que pide tiempo.'))}</p><div class="picker-options">${activeMatch().teams.map((team,index)=>`<button class="button" data-action="timeout" data-team="${index}">${esc(team.name)}</button>`).join('')}</div>`);}
  function openCallPicker() {openModal(t('Registrar llamado'),`<p>${esc(t('Elegí el equipo que hizo el llamado.'))}</p><div class="picker-options">${activeMatch().teams.map((team,index)=>`<button class="button" data-action="pick-call-team" data-team="${index}">${esc(team.name)}</button>`).join('')}</div>`);}
  function openIncident() {openModal(t('Anotar incidencia'),`<form data-form="incident"><div class="field"><label for="incident-type">${esc(t('Tipo'))}</label><select id="incident-type" name="type"><option>TFR</option><option>PMF</option><option value="Otra">${esc(t('Otra'))}</option></select></div><div class="field"><label for="incident-note">${esc(t('Nota opcional'))}</label><input id="incident-note" name="note" maxlength="160"></div><p>${esc(t('Registro descriptivo. No aplica sanciones ni certifica decisiones.'))}</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-primary">${esc(t('Anotar'))}</button></div></form>`);}

  function renderSettings() {
    updateModeBadge();
    const tournamentTimes=isTournamentMode(),config=getRuleset(),locked=hasStarted()||isLocked()||tournamentTimes;
    const currentProfile=state.customRulesets.find(p=>p.id===state.settings.ruleset);
    const editing=draftRuleset||!!currentProfile;
    const editLocked=locked&&!draftRuleset;
    const options=`<option value="wfdf" ${!draftRuleset&&state.settings.ruleset==='wfdf'?'selected':''}>WFDF 2025–2028</option><option value="usau" ${!draftRuleset&&state.settings.ruleset==='usau'?'selected':''}>USA Ultimate 2026–2027</option><option value="create" ${draftRuleset?'selected':''}>${esc(t('PERSONALIZADO · Crear perfil'))}</option>${state.customRulesets.map(p=>`<option value="${esc(p.id)}" ${!draftRuleset&&state.settings.ruleset===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}`;
    const durations=durationRows(config);
    app.innerHTML=`<section class="settings-screen"><div class="screen-head"><button class="back-button" data-action="back-dashboard">← ${esc(t('Tablero'))}</button><div><span class="screen-eyebrow">${esc(t('CONFIGURACIÓN'))}</span><h1>${esc(t('Editar tiempos'))}</h1></div></div>
      <section class="settings-section"><div class="section-heading"><h2>${esc(t('Reglamento'))}</h2></div><div class="settings-row"><div class="field"><label for="ruleset">${esc(t('Perfil'))}</label><select id="ruleset" data-setting="ruleset" ${locked?'disabled':''}>${options}</select></div><div class="field"><label for="sound">${esc(t('Avisos'))}</label><select id="sound" data-setting="sound"><option value="on" ${state.settings.sound?'selected':''}>${esc(t('Sonido y aviso visual'))}</option><option value="off" ${!state.settings.sound?'selected':''}>${esc(t('Solo aviso visual'))}</option></select></div></div><p>${esc(t('WFDF y USA Ultimate cargan sus tiempos de referencia. Los límites de duración del partido pueden depender del torneo: confirmalos antes de jugar.'))}</p></section>
      <section class="settings-section"><div class="section-heading"><h2>${esc(t('Tiempos totales'))}</h2><span>${esc(t(editing?'PERFIL PERSONALIZADO':'PERFIL DE REFERENCIA'))}</span></div><p>${esc(t('Un valor por reloj. Cada cuenta de Pull, Llamado, Time out y Medio tiempo corre hasta cero y termina con cinco alarmas.'))}</p>${editing?`<form data-form="ruleset-profile" data-profile="${esc(draftRuleset?'':currentProfile?.id||'')}"><div class="field"><label for="profile-name">${esc(t('Nombre del perfil'))}</label><input id="profile-name" name="name" maxlength="40" value="${esc(draftRuleset?'':currentProfile?.name||'')}" placeholder="${esc(t('Ej.: Torneo local'))}" required ${editLocked?'disabled':''}></div><div class="duration-grid">${durations.map(([key,label,value,unit])=>durationField(key,label,value,unit,editLocked)).join('')}</div><button class="button button-primary settings-save" ${editLocked?'disabled':''}>${esc(t(draftRuleset?'GUARDAR PERFIL PERSONALIZADO':currentProfile?'GUARDAR CAMBIOS':'GUARDAR PERFIL PERSONALIZADO'))}</button>${!draftRuleset&&currentProfile?`<button class="button button-danger settings-delete" type="button" data-action="delete-profile" data-profile="${esc(currentProfile.id)}" ${locked?'disabled':''}>${esc(t('ELIMINAR PERFIL'))}</button>`:''}</form>`:`<div class="duration-grid">${durations.map(([key,label,value,unit])=>`<div class="duration-readout"><span>${esc(label)}</span><strong>${value}${unit?` <small>${unit}</small>`:''}</strong></div>`).join('')}</div><p>${esc(t('Elegí “PERSONALIZADO · Crear perfil” para cambiar los valores y guardarlos en el desplegable.'))}</p>`}</section>
      ${tournamentTimes?`<p class="settings-locked">${esc(t('En modo torneo los tiempos los define el torneo: {name}. Cambialos en MENU → TIEMPOS DEL TORNEO.',{name:timingName(state.tournament)}))}</p>`:locked?`<p class="settings-locked">${esc(t('El partido ya comenzó. Prepará un nuevo partido para cambiar el reglamento o sus tiempos.'))}</p>`:''}
      <p class="settings-source">${esc(t('Referencias:'))} <a href="https://rules.wfdf.sport/" target="_blank" rel="noreferrer">WFDF</a> · <a href="https://usaultimate.org/rules/" target="_blank" rel="noreferrer">USA Ultimate</a>.</p>
    </section>`;
  }
  function durationField(key,label,value,unit,locked,plain=false){return `<div class="field duration-field"><label for="duration-${key}">${esc(label)}${unit?` · ${unit}`:''}</label><input id="duration-${key}" name="${key}" ${plain?'type="text" autocomplete="off"':`type="number" min="1" max="${key==='timeoutsPerTeam'?20:1440}" step="1"`} inputmode="numeric" pattern="[0-9]*" data-numeric="int" value="${value}" required ${locked?'disabled':''}></div>`;}
  function durationRows(config){return [['gameCap',t('Tiempo total del partido'),Math.round(config.gameCap/60),'min'],['halfCap',t('Primer tiempo'),Math.round(config.halfCap/60),'min'],['halftime',t('Medio tiempo'),Math.round(config.halftime/60),'min'],['call','Llamado',config.call.restart,'s'],['timeout','Time out',config.timeoutDuration,'s'],['timeoutsPerTeam',t('Time outs por equipo y por tiempo'),config.timeoutsPerTeam,'']];}

  function langSwitch() {
    return `<div class="mode-switch lang-switch" role="group" aria-label="Idioma / Language">${[['es','ESPAÑOL'],['en','ENGLISH']].map(([id,label])=>`<button type="button" data-action="set-lang" data-lang="${id}" lang="${id}" aria-pressed="${lang===id}">${label}</button>`).join('')}</div>`;
  }
  /* Pop up de inicio en tres pantallas: 1 equipos, 2 perfil de tiempo, 3 tiempos personalizados. */
  const WELCOME_STEPS=['teams','players','profile','custom'];
  let welcomeStep='teams';
  function profileChoices() {return [{id:'wfdf',name:'WFDF 2025–2028'},{id:'usau',name:'USA Ultimate 2026–2027'},...state.customRulesets.map(p=>({id:p.id,name:p.name}))];}
  function profileConfig(id) {const profile=state.customRulesets.find(p=>p.id===id);return clone(profile?profile.config:E.defaults[id]||E.defaults.wfdf);}
  const isTournamentMode=match=>(match||activeMatch()).mode==='tournament';
  /* Selector de equipos del torneo (solo en modo torneo). Los equipos se eligen de la lista, no se escriben. */
  function tournamentSelect(name,selected,exclude='') {
    const teams=(state.tournament?.teams||[]).filter(x=>x.id!==exclude||x.id===selected);
    return `<select class="tournament-pick" name="${name}" aria-label="${esc(t('Equipo del torneo'))}">${teams.map(x=>`<option value="${esc(x.id)}" ${x.id===selected?'selected':''}>${esc(x.name)}</option>`).join('')}</select>`;
  }
  function teamSetupMarkup(teams) {
    return teams.map((team,i)=>`<div class="team-setup" role="group" aria-labelledby="team-setup-${i}" style="${teamStyle(team)}"><span class="team-setup-label" id="team-setup-${i}">${esc(t('Equipo {n}',{n:i+1}))}</span><input name="name-${i}" value="${esc(team.name)}" maxlength="30" autocomplete="off" aria-label="${esc(t('Nombre del equipo {n}',{n:i+1}))}" ${i===0?'autofocus':''}><div class="team-setup-colors">${TEAM_PRESETS.map(c=>`<button type="button" class="color-preset${c===team.color?' active':''}" style="background:${c};color:${E.ink(c)}" data-action="setup-color" data-team="${i}" data-color="${c}" aria-label="${esc(t('Elegir color {color}',{color:c}))}" aria-pressed="${c===team.color}"></button>`).join('')}<label class="color-custom" title="${esc(t('Elegí cualquier color'))}"><span aria-hidden="true">＋</span><input type="color" name="color-${i}" value="${esc(team.color)}" data-setup-team="${i}" aria-label="${esc(t('Elegí cualquier color'))}"></label></div></div>`).join('');
  }
  function applyTeamsForm(form) {
    const data=new FormData(form);
    activeMatch().teams.forEach((team,i)=>{team.name=String(data.get(`name-${i}`)||'').trim()||t('Equipo {n}',{n:i+1});const color=String(data.get(`color-${i}`)||'');if(isHexColor(color))team.color=color;});
    persistMatch();
  }
  function openWelcome(step=welcomeStep) {
    if(hasStarted()||isLocked())return;
    welcomeStep=step==='mode'||WELCOME_STEPS.includes(step)?step:'mode';
    const index=WELCOME_STEPS.indexOf(welcomeStep),m=activeMatch();
    const steps=`<p class="welcome-step" aria-hidden="true">${esc(t('PASO {n} DE {total}',{n:index+1,total:WELCOME_STEPS.length}))}</p>`;
    const back=`<button class="button welcome-back" type="button" data-action="welcome-back">← ${esc(t('ATRÁS'))}</button>`;
    let title,body;
    if(welcomeStep==='mode'){
      title=t('Te damos la bienvenida');
      body=`<div class="welcome-hero">${LOGO_SVG}<div><strong class="info-name">ULTIMATE CLOCK</strong><p>${esc(t('Reloj, goles, llamados, pull, time outs y planilla de tu partido. Gratis y sin internet.'))}</p></div></div>${langSwitch()}<div class="welcome-flow"><p>${esc(t('¿Cómo vas a usar la app?'))}</p>${modeChoices()}</div>`;
    } else if(welcomeStep==='teams'){
      title=t('Te damos la bienvenida');
      body=`<div class="welcome-hero">${LOGO_SVG}<div><strong class="info-name">ULTIMATE CLOCK</strong><p>${esc(t('Reloj, goles, llamados, pull, time outs y planilla de tu partido. Gratis y sin internet.'))}</p></div></div>${langSwitch()}${steps}<form data-form="welcome-teams" class="teams-setup welcome-flow"><p>${esc(t('Escribí el nombre y elegí el color de cada equipo.'))}</p>${teamSetupMarkup(m.teams)}<div class="modal-actions">${back}<button class="button button-primary" type="submit">${esc(t('SIGUIENTE'))} →</button></div></form>`;
    } else if(welcomeStep==='players') {
      title=t('Jugadores (opcional)');
      body=`<form data-form="welcome-players" class="teams-setup welcome-flow">${steps}<p>${esc(t('Si querés, cargá los jugadores de cada equipo: después elegís de la lista quién dio el pase y quién hizo el gol. Podés dejarlo vacío.'))}</p>${playersSetupMarkup(m.teams)}<div class="modal-actions">${back}<button class="button button-primary" type="submit">${esc(t('SIGUIENTE'))} →</button></div></form>`;
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
  /* Las dos opciones del inicio y de ＋ NUEVO PARTIDO: partido suelto (se escribe todo) o torneo (se elige de listas). */
  function modeChoices() {
    return `<div class="mode-choices"><button class="mode-choice" type="button" data-action="choose-mode" data-mode="match"><strong>${esc(t('MODO PARTIDO'))}</strong><span>${esc(t('Un partido suelto. Escribís el nombre de los equipos y, si querés, de quienes hacen el pase y el gol.'))}</span></button><button class="mode-choice mode-choice-tournament" type="button" data-action="choose-mode" data-mode="tournament"><strong>${esc(t('MODO TORNEO'))}</strong><span>${esc(t('Cargás los equipos y sus jugadores una sola vez y los elegís de listas al empezar y al anotar goles.'))}</span></button></div>`;
  }
  /* Un partido nuevo y vacío en el modo indicado: no arrastra nombres, colores ni jugadores del anterior. */
  function freshMatch(mode) {
    state.pendingAlerts=[];ClockAlerts.clear();
    state.activeMatch=makeMatch(state.settings.ruleset);state.activeMatch.mode=mode;
    persistMatch();renderDashboard();
  }
  /* Un partido nuevo sin salir del modo actual: partido → nombres en blanco; torneo → equipos de la lista. */
  function startNextMatch() {
    if(isTournamentMode()){
      freshMatch('tournament');
      if(state.tournament&&state.tournament.teams.length>=2)openTournamentMatchSetup();
      else{teamSheet=null;renderTournament();showToast(t('Agregá al menos dos equipos al torneo para empezar.'));}
    }else{freshMatch('match');openTeamsSetup();}
  }
  /* Entrar al modo torneo lleva al creador de equipos. Con un partido sin guardar pide guardarlo antes. */
  function enterTournamentMode() {
    if(hasStarted()&&!isLocked()){openModal(t('Pasar al modo torneo'),`<p>${esc(t('El partido actual todavía no está guardado. Guardalo para pasar al modo torneo.'))}</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-primary" type="button" data-action="save-and-enter-tournament">${esc(t('Guardar y pasar'))}</button></div>`);return;}
    closeModal();freshMatch('tournament');teamSheet=null;renderTournament();app.scrollTop=0;
  }
  /* Salir del modo torneo vuelve al modo partido, con nombres en blanco. Los equipos del torneo quedan guardados. */
  function exitTournamentMode() {
    if(hasStarted()&&!isLocked()){openModal(t('Salir del modo torneo'),`<p>${esc(t('El partido actual todavía no está guardado. Guardalo para salir del modo torneo.'))}</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-primary" type="button" data-action="save-and-exit-tournament">${esc(t('Guardar y salir'))}</button></div>`);return;}
    closeModal();freshMatch('match');showToast(t('Saliste del modo torneo.'));openTeamsSetup();
  }
  /* Desde la pantalla del torneo, volver al tablero; si el partido de torneo no tiene equipos asignados, ofrece elegirlos. */
  function leaveTournamentScreen() {
    teamSheet=null;renderDashboard();
    if(isTournamentMode()&&!hasStarted()&&!isLocked()&&!activeMatch().teams.every(x=>tournamentTeam(x.tid))){
      if(state.tournament&&state.tournament.teams.length>=2)openTournamentMatchSetup();
      else showToast(t('Agregá al menos dos equipos al torneo para empezar.'));
    }
  }
  /* MODO PARTIDO sigue con los equipos; MODO TORNEO va al creador de equipos. */
  function chooseMode(mode) {
    if(hasStarted()&&!isLocked()){closeModal();return;}
    closeModal();
    if(mode==='tournament'){enterTournamentMode();return;}
    activeMatch().mode='match';persistMatch();openWelcome('teams');
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
    activeMatch().ruleset=id;updateTimerConfig(activeMatch());persistMatch();renderDashboard();enterFullscreen();closeModal();
  }
  function storageNote(text=t('Perfiles, planillas y el torneo se guardan solo en este navegador. Si borrás sus datos, usás modo incógnito o cambiás de equipo, se pierden. En iPhone, agregá la app a la pantalla de inicio. Exportá lo que quieras conservar.')) {
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
    if(!tournamentReady())return;
    const m=activeMatch(),team=m.teams[teamIndex];if(!team)return;
    const goal={id:uid('goal'),elapsed:m.clock.elapsed,at:nowIso(),assist:'',scorer:''};
    team.score+=1;team.goals.push(goal);logEvent('goal',{team:teamIndex,goal:goal.id,assist:'',scorer:''});
    closeModal();persistMatch();rerender(origin);announce(t('Gol de {team}. {a} a {b}',{team:team.name,a:m.teams[0].score,b:m.teams[1].score}));
    openGoal(teamIndex,goal.id,origin,true);
  }
  function undoGoal(teamIndex,goalId,origin) {
    const m=activeMatch(),team=m.teams[teamIndex],at=team?.goals.findIndex(g=>g.id===goalId);
    if(!team||at<0){showToast(t('Ese gol ya no se puede deshacer.'));return;}
    team.goals.splice(at,1);team.score=Math.max(0,team.score-1);m.events=m.events.filter(e=>e.goal!==goalId);
    persistMatch();rerender(origin);showToast(t('Gol de {team} deshecho.',{team:team.name}));
  }
  function rerender(origin) { if(origin==='sheet')renderLiveSheet();else renderDashboard(); }
  /* Jugadores de la ficha del torneo para un equipo del partido (vacío si no está vinculado). */
  /* Jugadores para elegir en el gol: la ficha del torneo (modo torneo) o los que se cargaron al armar el partido (modo partido). */
  function rosterFor(team) {return TN.sortPlayers(isTournamentMode()?tournamentTeam(team?.tid)?.players||[]:team?.roster||[]);}
  /* Lista de jugadores para pase y gol. En modo partido deja además escribir otro nombre; en modo torneo no. */
  function personPicker(key,label,roster,goal,autofocus,allowOther) {
    const known=roster.some(p=>p.id===goal[key+'Id']),other=allowOther&&!known&&!!goal[key];
    return `<div class="field"><label for="${key}-pick">${esc(label)}</label><select id="${key}-pick" name="${key}-pick" data-person="${key}" ${autofocus?'autofocus':''}><option value="">${esc(t('Sin dato'))}</option>${roster.map(p=>`<option value="${esc(p.id)}" ${known&&p.id===goal[key+'Id']?'selected':''}>${esc(TN.playerLabel(p))}</option>`).join('')}${allowOther?`<option value="__other" ${other?'selected':''}>${esc(t('Otro (escribir)'))}</option>`:''}</select>${allowOther?`<input id="${key}" name="${key}" autocomplete="off" maxlength="40" value="${esc(other?goal[key]:'')}" placeholder="${esc(t('Escribí el nombre'))}" ${other?'':'hidden'}>`:''}</div>`;
  }
  /* Lee pase y gol del cuadro: con lista elige un jugador (o «Otro» en modo partido); sin lista, texto libre. */
  function readPerson(data,key,roster,tournament) {
    const pick=data.get(key+'-pick');
    if(pick===null)return {name:String(data.get(key)||'').trim(),id:''};
    const player=roster.find(p=>p.id===pick);
    if(player)return {name:TN.playerLabel(player),id:player.id};
    return {name:!tournament&&pick==='__other'?String(data.get(key)||'').trim():'',id:''};
  }
  /* fresh: opened right after the goal, so it also offers to undo it. */
  function openGoal(teamIndex,goalId,origin='dashboard',fresh=false) {
    const team = activeMatch().teams[teamIndex],goal=team?.goals.find(g=>g.id===goalId);
    if(!goal)return;
    const tournament=isTournamentMode(),roster=rosterFor(team),listed=roster.length>0,vars={team:esc(team.name),time:fmt(goal.elapsed)};
    const field=(key,label,hint)=>listed?personPicker(key,label,roster,goal,key==='assist',!tournament):tournament?'':`<div class="field"><label for="${key}">${esc(label)}</label><input id="${key}" name="${key}" autocomplete="off" value="${esc(goal[key])}" placeholder="${esc(hint)}" ${key==='assist'?'autofocus':''}></div>`;
    const note=tournament?t(listed?'Gol de <strong>{team}</strong> a los {time}. Elegí los jugadores de la lista; los dos campos son opcionales.':'Gol de <strong>{team}</strong> a los {time}. Este equipo no tiene jugadores cargados: sumalos en MENU → TIEMPOS DEL TORNEO.',vars):t(listed?'Gol de <strong>{team}</strong> a los {time}. Elegí de la lista o escribí otro nombre; los dos campos son opcionales.':'Gol de <strong>{team}</strong> a los {time}. Los dos campos son opcionales.',vars);
    openModal(t("Detalle del gol"), `<p class="goal-note">${note}</p><form data-form="goal" data-team="${teamIndex}" data-goal="${esc(goalId)}" data-origin="${esc(origin)}">${field('assist',t('Pase'),t('Quién dio el pase gol'))}${field('scorer',t('Gol'),t('Quién recibió y anotó'))}<div class="modal-actions">${fresh?`<button class="button button-danger" type="button" data-action="undo-goal" data-team="${teamIndex}" data-goal="${esc(goalId)}" data-origin="${esc(origin)}">${esc(t('DESHACER GOL'))}</button>`:''}<button class="button" type="button" data-action="close-modal">${esc(t(fresh?'OMITIR':'Cancelar'))}</button><button class="button button-primary" type="submit">${esc(t('Guardar detalle'))}</button></div></form>`);
  }

  function openMinus(teamIndex) {
    const team = activeMatch().teams[teamIndex];
    openModal(t("Corregir puntaje"), `<p>${t('¿Querés restar un punto a <strong>{team}</strong>? La corrección queda registrada como ajuste manual.',{team:esc(team.name)})}</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-danger" type="button" data-action="confirm-minus" data-team="${teamIndex}">${esc(t('Restar punto'))}</button></div>`);
  }

  /* Every new game asks for both teams' names and colors, prefilled with the previous ones. */
  const TEAM_PRESETS=['#1b47e2','#f59e0b','#16a34a','#c62525','#16171b','#ffffff'];
  /* Jugadores del partido (modo partido): un texto por equipo, una persona por línea. Solo viven en este partido. */
  function playersSetupMarkup(teams) {
    return teams.map((team,i)=>`<div class="team-setup" role="group" aria-labelledby="players-label-${i}" style="${teamStyle(team)}"><span class="team-setup-label" id="players-label-${i}">${esc(team.name)}</span><textarea name="players-${i}" rows="5" maxlength="2400" autocomplete="off" placeholder="${esc('7 Ana\nBeto\n9 Cris')}" aria-label="${esc(t('Jugadores de {team}',{team:team.name}))}">${esc(TN.rosterToText(team.roster))}</textarea></div>`).join('');
  }
  function applyPlayersForm(form) {
    const data=new FormData(form);
    activeMatch().teams.forEach((team,i)=>{team.roster=TN.rosterFromText(data.get(`players-${i}`),team.roster);});
    persistMatch();
  }
  function openPlayersSetup() {
    if(isLocked())return;
    openModal(t('Jugadores (opcional)'),`<form data-form="players" class="teams-setup"><p>${esc(t('Si querés, cargá los jugadores de cada equipo: después elegís de la lista quién dio el pase y quién hizo el gol. Podés dejarlo vacío.'))}</p>${playersSetupMarkup(activeMatch().teams)}<div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('OMITIR'))}</button><button class="button button-primary" type="submit">${esc(t('LISTO'))}</button></div></form>`);
  }
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
    if(isTournamentMode()){openTournamentTeamSwap(teamIndex);return;}
    const team = activeMatch().teams[teamIndex];
    const ink = contrastColor(team.color);
    openModal(t('Equipo {n}',{n:teamIndex + 1}), `<form data-form="team" data-team="${teamIndex}"><div class="field"><label for="team-name">${esc(t('Nombre del equipo'))}</label><input id="team-name" name="name" value="${esc(team.name)}" maxlength="30" autocomplete="off"></div><div class="team-color-options">${['#1b47e2','#f59e0b','#16a34a','#c62525','#16171b','#ffffff'].map(c=>`<button type="button" class="color-preset" style="background:${c};color:${E.ink(c)}" data-action="team-color" data-color="${c}" aria-label="${esc(t('Elegir color {color}',{color:c}))}">●</button>`).join('')}</div><button class="button more-colors" type="button" data-action="more-colors">${esc(t('MÁS COLORES'))}</button><div class="field extended-colors" id="extendedColors" hidden><label for="team-color">${esc(t('Elegí cualquier color'))}</label><input id="team-color" name="color" type="color" value="${esc(team.color)}"></div><div class="color-preview" id="colorPreview" style="background:${esc(team.color)};color:${ink}">${esc(t('Vista previa del equipo'))}</div><div class="field"><label for="team-players">${esc(t('Jugadores (opcional)'))}</label><textarea id="team-players" name="players" rows="5" maxlength="2400" autocomplete="off" placeholder="${esc('7 Ana\nBeto\n9 Cris')}">${esc(TN.rosterToText(team.roster))}</textarea></div><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-primary" type="submit">${esc(t('Guardar equipo'))}</button></div></form>`);
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
    openModal(t('Planilla guardada'),`<p>${dateLabel(match.savedAt)} · ${esc(rulesetLabel(match.ruleset,match))} · ${esc(t(match.themeName||'Claro'))}</p><h3 class="sheet-title">${esc(match.teams[0].name)} ${match.teams[0].score} — ${match.teams[1].score} ${esc(match.teams[1].name)}</h3><div class="sheet-grid"><div class="sheet-stat"><b>${fmt(match.clock.elapsed)}</b><span>${esc(t('Duración'))}</span></div><div class="sheet-stat"><b>${match.events.filter(e=>e.type==='timeout').length}</b><span>${esc(t('Time-outs'))}</span></div><div class="sheet-stat"><b>${match.events.length}</b><span>${esc(t('Eventos'))}</span></div></div><p>${esc(t('Colores:'))} ${match.teams.map(t=>`<span class="sheet-team" style="background:${esc(t.color)};color:${E.ink(t.color)}">${esc(t.name)} · ${esc(t.color)}</span>`).join(' ')}</p><details><summary>${esc(t('Configuración del partido'))}</summary><pre>${esc(JSON.stringify(match.config,null,2))}</pre></details><ul class="event-list">${events||`<li>${esc(t('Sin eventos'))}</li>`}</ul><h3 class="section-kicker">${esc(t('EXPORTAR'))}</h3>${exportButtons(match,t('Exportar esta planilla'))}<button class="button button-danger sheet-delete" type="button" data-action="delete-sheet" data-match="${esc(match.id)}">${esc(t('ELIMINAR PLANILLA'))}</button>`);
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
    const teams=state.activeMatch?.teams.map(({name,color,tid,roster})=>({name,color,tid:tid||'',roster:roster||[]})),mode=state.activeMatch?.mode;
    state.activeMatch = makeMatch(state.settings.ruleset);
    if(teams)state.activeMatch.teams.forEach((team,i)=>Object.assign(team,teams[i]));
    if(mode)state.activeMatch.mode=mode;
    state.pendingAlerts=[];ClockAlerts.clear();
    persistMatch();
    closeModal();
    renderDashboard();
    showToast(t("Contadores reiniciados."));
  }
