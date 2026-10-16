
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
    draftRuleset=false;persistMatch();renderDashboard();showToast(t(active?'Perfil {name} guardado para el próximo partido.':'Perfil {name} guardado.',{name}));
  }
  function saveWelcomeProfile(form) {
    if(hasStarted()||isLocked()){closeModal();return;}
    const made=profileFromForm(form,profileConfig(selectedProfileId));if(!made)return;
    const profile={id:uid('profile'),name:made.name,config:clone(made.config)};
    state.customRulesets.push(profile);selectedProfileId=profile.id;
    startWithProfile(profile.id);showToast(t('Perfil {name} guardado.',{name:made.name}));
  }

  /* ---- Modo torneo: equipos con jugadores cargados de antemano, guardados en este dispositivo ---- */
  const allTournaments=()=>[state.tournament,...state.otherTournaments].filter(Boolean);
  /* Un partido en curso conserva sus equipos aunque se cambie de torneo: se busca en todos. */
  const tournamentTeam=id=>{for(const tour of allTournaments()){const team=tour.teams.find(x=>x.id===id);if(team)return team;}return null;};
  let creatingTournament=false;
  /* Tiempos del torneo: se eligen una vez y valen para todos sus partidos. */
  function timingName(tour) {
    const id=tour?.timing?.id||'wfdf';
    return profileChoices().find(p=>p.id===id)?.name||tour?.timing?.name||'WFDF 2025–2028';
  }
  function setTournamentTiming(tour,id) {
    const profile=state.customRulesets.find(p=>p.id===id);
    tour.timing=profile?{id:profile.id,name:profile.name,config:clone(profile.config)}:{id:['wfdf','usau'].includes(id)?id:'wfdf',name:'',config:null};
  }
  /* Devuelve el perfil a usar en un partido del torneo. Si el perfil propio ya no está en este navegador (otro dispositivo, o se borró), se recrea desde la copia del torneo. */
  function ensureTimingProfile(tour) {
    const timing=tour?.timing||{id:'wfdf'};
    if(['wfdf','usau'].includes(timing.id))return timing.id;
    const local=state.customRulesets.find(p=>p.id===timing.id);
    if(local){tour.timing={id:local.id,name:local.name,config:clone(local.config)};return local.id;}
    if(timing.config&&!E.validate(timing.config)){state.customRulesets.push({id:timing.id,name:timing.name||t('Personalizado'),config:clone(timing.config)});return timing.id;}
    tour.timing={id:'wfdf',name:'',config:null};return 'wfdf';
  }
  const SHEET_MIN_ROWS=14;
  /* Ficha abierta (equipo nuevo o existente). Mientras se edita, los datos viven en los campos de la pantalla. */
  let teamSheet=null;
  function newSheetRow(player) {return {pid:player?.id||'',name:player?.name||'',number:player?.number||''};}
  function openTeamSheet(teamId) {
    const team=teamId?tournamentTeam(teamId):null;
    teamSheet=team?{id:team.id,name:team.name,color:team.color,rows:team.players.map(newSheetRow)}:{id:'',name:'',color:TEAM_PRESETS[(state.tournament?.teams.length||0)%TEAM_PRESETS.length],rows:[]};
    while(teamSheet.rows.length<SHEET_MIN_ROWS)teamSheet.rows.push(newSheetRow());
    renderTournament();app.scrollTop=0;
    if(!team)app.querySelector('.ts-team-name')?.focus({preventScroll:true});
  }
  function closeTeamSheet() {teamSheet=null;renderTournament();app.scrollTop=0;}
  /* Lee la ficha desde la pantalla (si está dibujada) y la guarda en teamSheet. */
  function captureTeamSheet() {
    const form=app.querySelector('[data-form="t-team"]');if(!form||!teamSheet)return teamSheet;
    teamSheet.name=form.elements.name.value;teamSheet.color=form.elements.color.value;
    teamSheet.rows=[...form.querySelectorAll('.sheet-row')].map(row=>({pid:row.dataset.player||'',name:row.querySelector('.ts-name').value,number:row.querySelector('.ts-number').value}));
    return teamSheet;
  }
  function sheetRowMarkup(row,i) {
    return `<div class="sheet-row" data-player="${esc(row.pid)}"><span class="sheet-index" aria-hidden="true">${i+1}</span><input class="ts-number" inputmode="numeric" maxlength="${TN.LIMITS.number}" autocomplete="off" data-numeric="1" value="${esc(row.number)}" placeholder="${esc(t('N.º'))}" aria-label="${esc(t('Número del jugador {n} (opcional)',{n:i+1}))}"><input class="ts-name" maxlength="${TN.LIMITS.name}" autocomplete="off" value="${esc(row.name)}" placeholder="${esc(t('Nombre del jugador'))}" aria-label="${esc(t('Nombre del jugador {n}',{n:i+1}))}"><button type="button" class="player-remove" data-action="t-clear-row" aria-label="${esc(t('Borrar la fila {n}',{n:i+1}))}">×</button></div>`;
  }
  function renderTeamSheet() {
    const s=teamSheet,editing=!!s.id;
    app.innerHTML=`<section class="tournament-screen team-sheet"><div class="screen-head"><button class="back-button" type="button" data-action="t-cancel-sheet">← ${esc(t('Torneo'))}</button><div><span class="screen-eyebrow">${esc(state.tournament.name)}</span><h1>${esc(t(editing?'Ficha del equipo':'Nuevo equipo'))}</h1></div></div>
      <form data-form="t-team" data-team="${esc(s.id)}" class="sheet-form" novalidate>
        <section class="settings-section sheet-top" style="${teamStyle(s)}"><div class="field"><label for="ts-team-name">${esc(t('Nombre del equipo'))}</label><input id="ts-team-name" class="ts-team-name" name="name" maxlength="${TN.LIMITS.name}" autocomplete="off" value="${esc(s.name)}" placeholder="${esc(t('Ej.: Ñandúes'))}" ${editing?'':'autofocus'}></div>
          <div class="field"><label>${esc(t('Color'))}</label><div class="sheet-colors">${TEAM_PRESETS.map(c=>`<button type="button" class="color-preset${c.toLowerCase()===s.color.toLowerCase()?' active':''}" style="background:${c};color:${E.ink(c)}" data-action="t-color" data-color="${c}" aria-label="${esc(t('Elegir color {color}',{color:c}))}" aria-pressed="${c.toLowerCase()===s.color.toLowerCase()}"></button>`).join('')}<label class="color-custom" title="${esc(t('Elegí cualquier color'))}"><span aria-hidden="true">＋</span><input type="color" name="color" value="${esc(s.color)}" aria-label="${esc(t('Elegí cualquier color'))}"></label></div></div></section>
        <section class="settings-section"><div class="section-heading"><h2>${esc(t('Jugadores'))}</h2></div><p class="sheet-hint">${esc(t('El nombre es obligatorio; el número de camiseta es opcional.'))}</p>
          <div class="sheet-rows">${s.rows.map(sheetRowMarkup).join('')}</div>
          <button class="button sheet-add-row" type="button" data-action="t-add-row">＋ ${esc(t('AGREGAR JUGADOR'))}</button>
          <details class="tournament-paste"><summary>${esc(t('Pegar una lista de jugadores'))}</summary><p>${esc(t('Uno por línea: "7 Ana", "Ana 7" o solo "Ana". Se completan las filas libres.'))}</p><textarea class="ts-paste" rows="5" aria-label="${esc(t('Lista de jugadores'))}"></textarea><button class="button" type="button" data-action="t-load-list">${esc(t('CARGAR LISTA'))}</button></details></section>
        <div class="sheet-bar"><button class="button button-primary sheet-save" type="submit">${esc(t(editing?'GUARDAR EQUIPO':'AGREGAR EQUIPO'))}</button><button class="button" type="button" data-action="t-cancel-sheet">${esc(t('Cancelar'))}</button>${editing?`<button class="button button-danger" type="button" data-action="t-del-team" data-team="${esc(s.id)}">${esc(t('ELIMINAR EQUIPO'))}</button>`:''}</div>
      </form></section>`;
  }
  function renderTournament() {
    const tour=state.tournament;updateModeBadge();
    captureTeamSheet();
    if(!tour){teamSheet=null;}
    else if(teamSheet){renderTeamSheet();return;}
    if(!tour||creatingTournament){
      app.innerHTML=`<section class="tournament-screen"><div class="screen-head"><button class="back-button" data-action="${tour?'t-cancel-new-tournament':'t-back'}">← ${esc(t(tour?'Torneo':'Tablero'))}</button><div><span class="screen-eyebrow">${esc(t('MODO TORNEO'))}</span><h1>${esc(t(tour?'Nuevo torneo':'Torneo'))}</h1></div></div>
        <section class="settings-section"><p>${esc(t('Cargá los equipos y sus jugadores una sola vez. Al empezar un partido elegís los equipos de la lista y, al anotar un gol, elegís quién dio el pase y quién lo hizo. El número de camiseta es opcional.'))}</p>
        <ol class="tournament-steps"><li>${esc(t('Poné el nombre del torneo.'))}</li><li>${esc(t('Completá la ficha de cada equipo: nombre, color y jugadores.'))}</li><li>${esc(t('Al empezar un partido, elegí los equipos de la lista.'))}</li></ol>
        <form data-form="t-create"><div class="field"><label for="t-name">${esc(t('Nombre del torneo'))}</label><input id="t-name" name="name" maxlength="${TN.LIMITS.name}" autocomplete="off" placeholder="${esc(t('Ej.: Copa Otoño'))}" required></div><button class="button button-primary" type="submit">${esc(t('CREAR TORNEO'))}</button></form>
        ${storageNote(t('El torneo se guarda solo en este navegador. Exportalo para llevarlo a otro dispositivo o conservarlo.'))}</section>
        ${tour?'':`<section class="settings-section"><div class="section-heading"><h2>${esc(t('¿Ya tenés un torneo?'))}</h2></div><button class="button" type="button" data-action="t-import">${esc(t('IMPORTAR ARCHIVO DE TORNEO'))}</button></section><input type="file" id="tournamentFile" accept=".json,application/json" hidden>`}</section>`;
      return;
    }
    const played=TN.tournamentMatches(tour,state.savedMatches).length,rows=TN.stats(tour,state.savedMatches),table=TN.standings(tour,state.savedMatches),results=TN.results(tour,state.savedMatches);
    const picker=state.otherTournaments.length?`<section class="settings-section"><div class="section-heading"><h2>${esc(t('Mis torneos'))}</h2><span>${allTournaments().length}</span></div><div class="tournament-switch" role="group" aria-label="${esc(t('Mis torneos'))}"><button type="button" class="chip chip-active" aria-pressed="true" disabled>✓ ${esc(tour.name)}</button>${state.otherTournaments.map(x=>`<button type="button" class="chip" aria-pressed="false" data-action="t-switch" data-id="${esc(x.id)}">${esc(x.name)}</button>`).join('')}</div></section>`:'';
    const standingsHtml=table.some(r=>r.played)?`<section class="settings-section"><div class="section-heading"><h2>${esc(t('Posiciones'))}</h2><span>${esc(t('VICTORIA 3 · EMPATE 1'))}</span></div><table class="tournament-stats standings"><thead><tr><th>${esc(t('Equipo'))}</th><th title="${esc(t('Partidos jugados'))}">${esc(t('J'))}</th><th title="${esc(t('Diferencia de goles'))}">${esc(t('DIF'))}</th><th title="${esc(t('Puntos'))}">${esc(t('PTS'))}</th></tr></thead><tbody>${table.map(r=>`<tr><td><span class="dot" style="background:${esc(r.team.color)}"></span>${esc(r.team.name)} <small>${esc(t('{w} gan · {d} emp · {l} per · {gf}-{ga}',{w:r.won,d:r.drawn,l:r.lost,gf:r.gf,ga:r.ga}))}</small></td><td>${r.played}</td><td>${r.gf-r.ga>0?'+':''}${r.gf-r.ga}</td><td><b>${r.points}</b></td></tr>`).join('')}</tbody></table></section>`:'';
    const resultsHtml=results.length?`<section class="settings-section"><div class="section-heading"><h2>${esc(t('Resultados'))}</h2><span>${results.length}</span></div><ol class="tournament-results">${results.slice(0,15).map(m=>`<li><span class="res-team">${esc(m.teams[0].name)}</span><b class="res-score">${m.teams[0].score} — ${m.teams[1].score}</b><span class="res-team">${esc(m.teams[1].name)}</span></li>`).join('')}</ol></section>`:'';
    const teamRows=tour.teams.map(team=>`<button class="tournament-team" type="button" data-action="t-open-team" data-team="${esc(team.id)}" style="${teamStyle(team)}"><strong>${esc(team.name)}</strong><span>${team.players.length} ${esc(t(team.players.length===1?'jugador':'jugadores'))} · ${esc(t('EDITAR'))}</span></button>`).join('');
    app.innerHTML=`<section class="tournament-screen"><div class="screen-head"><button class="back-button" data-action="t-back">← ${esc(t('Tablero'))}</button><div><span class="screen-eyebrow">${esc(t('MODO TORNEO'))}</span><h1>${esc(tour.name)}</h1></div></div>
      ${picker}<section class="settings-section"><div class="section-heading"><h2>${esc(t('Equipos'))}</h2><span>${tour.teams.length}</span></div>
        ${teamRows?`<div class="tournament-teams">${teamRows}</div>`:`<p>${esc(t('Todavía no hay equipos. Tocá el botón para completar la ficha del primero.'))}</p>`}
        <button class="button ${tour.teams.length>=2?'':'button-primary '}tournament-new" type="button" data-action="t-new-team">＋ ${esc(t('AGREGAR EQUIPO'))}</button>
        ${tour.teams.length>=2?`<button class="button button-primary tournament-new tournament-start" type="button" data-action="t-start-match">▶ ${esc(t('EMPEZAR PARTIDO DEL TORNEO'))}</button>`:`<p class="sheet-hint">${esc(t('Agregá al menos dos equipos para empezar un partido del torneo.'))}</p>`}</section>
      <section class="settings-section"><div class="section-heading"><h2>${esc(t('Tiempos del torneo'))}</h2></div><p>${esc(t('Todos los partidos de este torneo usan este perfil de tiempos.'))}</p><div class="field"><label for="t-timing">${esc(t('Perfil de tiempo'))}</label><select id="t-timing" data-tsetting="timing">${profileChoices().map(p=>`<option value="${esc(p.id)}" ${p.id===(tour.timing?.id||'wfdf')?'selected':''}>${esc(p.name)}</option>`).join('')}${profileChoices().some(p=>p.id===tour.timing?.id)?'':`<option value="${esc(tour.timing?.id||'')}" selected>${esc(timingName(tour))}</option>`}</select></div><button class="button tournament-new" type="button" data-action="t-new-timing">＋ ${esc(t('NUEVO PERFIL DE TIEMPOS'))}</button></section>
      ${standingsHtml}${resultsHtml}
      <section class="settings-section"><div class="section-heading"><h2>${esc(t('Goleadores y pases'))}</h2><span>${played} ${esc(t(played===1?'PARTIDO GUARDADO':'PARTIDOS GUARDADOS'))}</span></div>
        ${rows.length?`<table class="tournament-stats"><thead><tr><th>${esc(t('Jugador'))}</th><th>${esc(t('Goles'))}</th><th>${esc(t('Pases'))}</th></tr></thead><tbody>${rows.slice(0,20).map(r=>`<tr><td><span class="dot" style="background:${esc(r.team.color)}"></span>${esc(TN.playerLabel(r.player))} <small>${esc(r.team.name)}</small></td><td>${r.goals}</td><td>${r.assists}</td></tr>`).join('')}</tbody></table>`:`<p>${esc(t('Todavía no hay goles de jugadores de la lista. Aparecen al guardar partidos donde elegiste jugadores.'))}</p>`}</section>
      <section class="settings-section"><div class="section-heading"><h2>${esc(t('Archivo del torneo'))}</h2><span>JSON · CSV</span></div><p>${esc(t('El archivo incluye equipos, jugadores y los partidos guardados del torneo.'))}</p>
        <div class="export-actions"><button class="button button-primary" type="button" data-action="t-export">${esc(t('EXPORTAR TORNEO'))}</button><button class="button" type="button" data-action="t-export-csv">CSV</button><button class="button" type="button" data-action="t-import">${esc(t('IMPORTAR'))}</button></div><input type="file" id="tournamentFile" accept=".json,application/json" hidden>
        <div class="tournament-danger"><button class="button" type="button" data-action="t-rename">${esc(t('CAMBIAR NOMBRE'))}</button><button class="button button-danger" type="button" data-action="t-delete">${esc(t('ELIMINAR TORNEO'))}</button></div><button class="button tournament-new" type="button" data-action="t-new-tournament">＋ ${esc(t('NUEVO TORNEO'))}</button>${storageNote(t('El torneo se guarda solo en este navegador. Exportalo para llevarlo a otro dispositivo o conservarlo.'))}</section></section>`;
  }
  /* Crear un perfil de tiempos propio sin salir del torneo; queda elegido para todo el torneo. */
  function openTournamentProfileForm() {
    const base=profileConfig(state.tournament?.timing?.id||'wfdf');
    openModal(t('Nuevo perfil de tiempos'),`<form data-form="t-profile" class="welcome-flow" novalidate><div class="field"><label for="profile-name">${esc(t('Nombre del perfil'))}</label><input id="profile-name" name="name" maxlength="40" autocomplete="off" placeholder="${esc(t('Ej.: Torneo local'))}" required autofocus></div><div class="duration-grid">${durationRows(base).map(([key,label,value,unit])=>durationField(key,label,value,unit,false,true)).join('')}</div><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-primary" type="submit">${esc(t('GUARDAR PERFIL'))}</button></div></form>`);
  }
  /* Empezar un partido del torneo: se eligen los dos equipos de la lista y el perfil de tiempo. */
  function openTournamentMatchSetup() {
    const tour=state.tournament;if(!tour||tour.teams.length<2)return;
    if(hasStarted()&&!isLocked()){showToast(t('Hay un partido en curso. Guardalo o prepará uno nuevo desde MENU antes de empezar otro.'));return;}
    const m=activeMatch(),ids=[isTournamentMode()&&tournamentTeam(m.teams[0].tid)?m.teams[0].tid:tour.teams[0].id,isTournamentMode()&&tournamentTeam(m.teams[1].tid)&&m.teams[1].tid!==m.teams[0].tid?m.teams[1].tid:tour.teams.find(x=>x.id!==tour.teams[0].id).id];
    if(ids[0]===ids[1])ids[1]=tour.teams.find(x=>x.id!==ids[0]).id;
    openModal(t('Partido del torneo'),`<form data-form="t-match" class="welcome-flow"><div class="field"><label>${esc(t('Equipo {n}',{n:1}))}</label>${tournamentSelect('tid-0',ids[0])}</div><div class="field"><label>${esc(t('Equipo {n}',{n:2}))}</label>${tournamentSelect('tid-1',ids[1])}</div><p class="sheet-hint">${esc(t('Tiempos: {name} (se cambian en TIEMPOS DEL TORNEO).',{name:timingName(tour)}))}</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-primary" type="submit">${esc(t('EMPEZAR PARTIDO'))}</button></div></form>`);
  }
  function startTournamentMatch(data) {
    const a=tournamentTeam(String(data.get('tid-0'))),b=tournamentTeam(String(data.get('tid-1')));
    if(!a||!b)return;
    if(a.id===b.id){showToast(t('Elegí dos equipos distintos.'));return;}
    if(hasStarted()&&!isLocked())return;
    state.pendingAlerts=[];ClockAlerts.clear();
    state.activeMatch=makeMatch(state.settings.ruleset);
    const m=state.activeMatch;m.mode='tournament';
    [a,b].forEach((team,i)=>Object.assign(m.teams[i],{name:team.name,color:team.color,tid:team.id}));
    startWithProfile(ensureTimingProfile(state.tournament));
  }
  /* En modo torneo los equipos del tablero se cambian eligiendo de la lista, y solo antes de empezar. */
  function openTournamentTeamSwap(index) {
    const m=activeMatch();
    if(hasStarted()||isLocked()){showToast(t('En modo torneo los equipos no se pueden cambiar con el partido empezado.'));return;}
    const other=m.teams[1-index].tid;
    openModal(t('Equipo {n}',{n:index+1}),`<form data-form="t-swap" data-team="${index}"><div class="field"><label>${esc(t('Equipo del torneo'))}</label>${tournamentSelect('tid',m.teams[index].tid,other)}</div><p class="sheet-hint">${esc(t('Para sumar o cambiar jugadores y equipos, usá MENU → MODO TORNEO.'))}</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-primary" type="submit">${esc(t('Guardar equipo'))}</button></div></form>`);
  }
  let pendingTournamentImport=null;
  function addSheetRow(focus=true) {
    const box=app.querySelector('.sheet-rows');if(!box)return;
    const count=box.children.length;
    if(count>=TN.LIMITS.players){showToast(t('Llegaste al máximo de jugadores.'));return;}
    box.insertAdjacentHTML('beforeend',sheetRowMarkup(newSheetRow(),count));
    if(focus)box.lastElementChild.querySelector('.ts-name').focus();
  }
  /* Pasar de una fila a la siguiente con Enter (y crear una nueva al final) en lugar de enviar la ficha. */
  document.addEventListener('keydown',event=>{
    if(event.key!=='Enter'||!event.target.matches?.('.sheet-row input'))return;
    event.preventDefault();
    const row=event.target.closest('.sheet-row');
    if(event.target.matches('.ts-number')){row.querySelector('.ts-name').focus();return;}
    if(!row.nextElementSibling)addSheetRow();else row.nextElementSibling.querySelector('.ts-name').focus();
  });
  function tournamentAction(action,el) {
    if(!action.startsWith('t-'))return false;
    const tour=state.tournament,team=tournamentTeam(el.dataset.team);
    if(action==='t-new-team'&&tour){if(tour.teams.length>=TN.LIMITS.teams)showToast(t('Llegaste al máximo de equipos.'));else openTeamSheet('');}
    else if(action==='t-open-team'&&team)openTeamSheet(team.id);
    else if(action==='t-cancel-sheet')closeTeamSheet();
    else if(action==='t-start-match'&&tour)openTournamentMatchSetup();
    else if(action==='t-add-row')addSheetRow();
    else if(action==='t-clear-row'){const row=el.closest('.sheet-row');row.querySelectorAll('input').forEach(i=>{i.value='';});row.dataset.player='';row.querySelector('.ts-number').focus();}
    else if(action==='t-color'){
      const form=el.closest('form');form.elements.color.value=el.dataset.color;syncSheetColor(form);
    }
    else if(action==='t-load-list'){
      const box=app.querySelector('.ts-paste'),found=TN.parsePlayers(box.value);
      if(!found.length){showToast(t('No encontré jugadores en la lista.'));return true;}
      const rows=app.querySelector('.sheet-rows');let added=0;
      for(const p of found){
        let row=[...rows.children].find(r=>!r.querySelector('.ts-name').value.trim()&&!r.querySelector('.ts-number').value.trim());
        if(!row){if(rows.children.length>=TN.LIMITS.players)break;addSheetRow(false);row=rows.lastElementChild;}
        row.querySelector('.ts-name').value=p.name;row.querySelector('.ts-number').value=p.number;added++;
      }
      box.value='';showToast(added<found.length?t('Se agregaron {n} jugadores; el resto no entró (máximo {max}).',{n:added,max:TN.LIMITS.players}):t('Se agregaron {n} jugadores.',{n:added}));
    }
    else if(action==='t-del-team'&&team)openModal(t('Eliminar equipo'),`<p>${esc(t('¿Eliminar {name} y sus jugadores? Los partidos guardados no se borran.',{name:team.name}))}</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-danger" type="button" data-action="t-confirm-del-team" data-team="${esc(team.id)}">${esc(t('ELIMINAR EQUIPO'))}</button></div>`);
    else if(action==='t-confirm-del-team'&&team){tour.teams=tour.teams.filter(x=>x.id!==team.id);teamSheet=null;closeModal();persistTournaments();renderTournament();showToast(t('Equipo eliminado.'));}
    else if(action==='t-rename'&&tour)openModal(t('Cambiar nombre'),`<form data-form="t-rename"><div class="field"><label for="t-rename-name">${esc(t('Nombre del torneo'))}</label><input id="t-rename-name" name="name" maxlength="${TN.LIMITS.name}" value="${esc(tour.name)}" autocomplete="off" required autofocus></div><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-primary" type="submit">${esc(t('Guardar'))}</button></div></form>`);
    else if(action==='t-delete'&&tour)openModal(t('Eliminar torneo'),`<p>${esc(t('¿Eliminar el torneo {name}, sus equipos y jugadores? Las planillas guardadas no se borran. Exportá el torneo antes si querés conservarlo.',{name:tour.name}))}</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-danger" type="button" data-action="t-confirm-delete">${esc(t('ELIMINAR TORNEO'))}</button></div>`);
    else if(action==='t-confirm-delete'){state.tournament=state.otherTournaments.shift()||null;teamSheet=null;creatingTournament=false;closeModal();persistTournaments();renderTournament();showToast(t('Torneo eliminado.'));}
    else if(action==='t-new-timing'&&tour)openTournamentProfileForm();
    else if(action==='t-new-tournament'){creatingTournament=true;renderTournament();app.scrollTop=0;document.getElementById('t-name')?.focus({preventScroll:true});}
    else if(action==='t-cancel-new-tournament'){creatingTournament=false;renderTournament();}
    else if(action==='t-switch'){const next=state.otherTournaments.find(x=>x.id===el.dataset.id);if(next){state.otherTournaments=state.otherTournaments.filter(x=>x!==next);if(state.tournament)state.otherTournaments.unshift(state.tournament);state.tournament=next;persistTournaments();renderTournament();app.scrollTop=0;}}
    else if(action==='t-export'&&tour)exportData(TN.exportPayload(tour,state.savedMatches),`${exportSlug(tour.name)}.json`);
    else if(action==='t-export-csv'&&tour)download(TN.statsCSV(tour,state.savedMatches,{team:t('equipo'),number:t('numero'),player:t('jugador'),goals:t('goles'),assists:t('pases')}),'text/csv;charset=utf-8',`${exportSlug(tour.name)}-${t('jugadores')}.csv`);
    else if(action==='t-import')document.getElementById('tournamentFile')?.click();
    else if(action==='t-confirm-import'){applyTournamentImport();closeModal();}
    else return false;
    return true;
  }
  /* El encabezado de la ficha toma el color elegido. */
  function syncSheetColor(form) {
    const color=form.elements.color.value,top=form.querySelector('.sheet-top');
    top.style.setProperty('--team-color',color);top.style.setProperty('--team-ink',contrastColor(color));
    form.querySelectorAll('.sheet-colors .color-preset').forEach(b=>{const on=b.dataset.color.toLowerCase()===color.toLowerCase();b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
  }
  /* Valida y guarda la ficha: nombre del equipo obligatorio; filas con número deben tener nombre; sin números repetidos. */
  function saveTeamSheet() {
    const tour=state.tournament,s=captureTeamSheet();if(!tour||!s)return;
    const form=app.querySelector('[data-form="t-team"]'),rowEls=[...form.querySelectorAll('.sheet-row')];
    const problem=(message,el)=>{showToast(message);el?.focus();el?.scrollIntoView({block:'center'});};
    const name=s.name.replace(/\s+/g,' ').trim().slice(0,TN.LIMITS.name);
    if(!name)return problem(t('Escribí el nombre del equipo.'),form.elements.name);
    const entries=[],seen=new Map();
    for(let i=0;i<s.rows.length;i++){
      const r=s.rows[i],playerName=r.name.replace(/\s+/g,' ').trim(),number=TN.cleanNumber(r.number);
      if(!playerName&&!r.number.trim())continue;
      if(!playerName)return problem(t('Falta el nombre del jugador de la fila {n}.',{n:i+1}),rowEls[i].querySelector('.ts-name'));
      if(number!==''&&seen.has(number))return problem(t('El número {n} está repetido: {a} y {b}.',{n:number,a:seen.get(number),b:playerName}),rowEls[i].querySelector('.ts-number'));
      if(number!=='')seen.set(number,playerName);
      entries.push({pid:r.pid,name:playerName.slice(0,TN.LIMITS.name),number});
    }
    const color=isHexColor(s.color)?s.color:'#1b47e2';
    let team=s.id?tournamentTeam(s.id):null;
    if(!team){team=TN.makeTeam(name,color);tour.teams.push(team);}
    const old=new Map(team.players.map(p=>[p.id,p]));
    team.name=name;team.color=color;
    team.players=entries.map(e=>{const p=old.get(e.pid);if(p){p.name=e.name;p.number=e.number;return p;}return TN.makePlayer(e.name,e.number);});
    const added=!s.id;teamSheet=null;persistTournaments();renderTournament();app.scrollTop=0;
    showToast(t(added?'Equipo {name} agregado con {n} jugadores.':'Equipo {name} guardado con {n} jugadores.',{name,n:team.players.length}));
  }
  const exportSlug=name=>String(name).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'torneo';
  function applyTournamentImport() {
    const file=pendingTournamentImport;pendingTournamentImport=null;if(!file)return;
    const incoming=file.tournament;
    ensureTimingProfile(incoming);
    if(state.tournament?.id===incoming.id)state.tournament=incoming;
    else if(state.otherTournaments.some(x=>x.id===incoming.id)){state.otherTournaments=state.otherTournaments.filter(x=>x.id!==incoming.id);if(state.tournament)state.otherTournaments.unshift(state.tournament);state.tournament=incoming;}
    else{if(state.tournament)state.otherTournaments.unshift(state.tournament);state.tournament=incoming;state.otherTournaments=state.otherTournaments.slice(0,TN.LIMITS.tournaments-1);}
    creatingTournament=false;
    const known=new Set(state.savedMatches.map(m=>m.id));let added=0;
    for(const match of file.matches)if(!known.has(match.id)){state.savedMatches.push(match);added++;}
    state.savedMatches.sort((a,b)=>String(b.savedAt).localeCompare(String(a.savedAt)));
    saveState();renderTournament();showToast(t('Torneo {name} importado: {n} equipos y {m} partidos nuevos.',{name:incoming.name,n:incoming.teams.length,m:added}));
  }
  async function importTournamentFile(file) {
    let parsed=null;
    try{if(file.size<=5e6)parsed=TN.parseFile(await file.text());}catch{}
    if(!parsed){showToast(t('Ese archivo no es un torneo de Ultimate Clock.'));return;}
    pendingTournamentImport=parsed;
    const same=allTournaments().find(x=>x.id===parsed.tournament.id);
    if(!same){applyTournamentImport();return;}
    openModal(t('Reemplazar torneo'),`<p>${esc(t('Ya tenés el torneo {name}. ¿Reemplazarlo por {other}? Las planillas guardadas se conservan.',{name:same.name,other:parsed.tournament.name}))}</p><div class="modal-actions"><button class="button" type="button" data-action="close-modal">${esc(t('Cancelar'))}</button><button class="button button-primary" type="button" data-action="t-confirm-import">${esc(t('REEMPLAZAR'))}</button></div>`);
  }
  function tournamentSubmit(form,data,type) {
    if(!type.startsWith('t-'))return false;
    const tour=state.tournament;
    if(type==='t-create'){
      const created=TN.makeTournament(data.get('name'));if(!created)return true;
      if(allTournaments().length>=TN.LIMITS.tournaments){showToast(t('Llegaste al máximo de torneos.'));return true;}
      if(state.tournament)state.otherTournaments.unshift(state.tournament);
      setTournamentTiming(created,state.settings.ruleset);
      state.tournament=created;creatingTournament=false;persistTournaments();showToast(t('Torneo creado. Completá la ficha del primer equipo.'));openTeamSheet('');
    }
    else if(type==='t-rename'&&tour){const name=String(data.get('name')||'').trim();if(name){tour.name=name.slice(0,TN.LIMITS.name);closeModal();persistTournaments();renderTournament();}}
    else if(type==='t-team')saveTeamSheet();
    else if(type==='t-profile'&&tour){const made=profileFromForm(form,profileConfig(tour.timing?.id||'wfdf'));if(!made)return true;const profile={id:uid('profile'),name:made.name,config:clone(made.config)};state.customRulesets.push(profile);setTournamentTiming(tour,profile.id);closeModal();saveState();renderTournament();showToast(t('Tiempos del torneo: {name}.',{name:profile.name}));}
    else if(type==='t-match')startTournamentMatch(data);
    else if(type==='t-swap'){const team=tournamentTeam(String(data.get('tid'))),index=Number(form.dataset.team),m=activeMatch();if(team&&!hasStarted()&&team.id!==m.teams[1-index].tid){Object.assign(m.teams[index],{name:team.name,color:team.color,tid:team.id});closeModal();persistMatch();renderDashboard();}else closeModal();}
    else return false;
    return true;
  }
  /* Cambios en selectores/archivo del modo torneo; devuelve true si el evento era suyo. */
  function tournamentChange(el) {
    if(el.dataset.tsetting==='timing'&&state.tournament){setTournamentTiming(state.tournament,el.value);persistTournaments();showToast(t('Tiempos del torneo: {name}.',{name:timingName(state.tournament)}));renderTournament();return true;}
    if(el.id==='tournamentFile'){const file=el.files?.[0];el.value='';if(file)importTournamentFile(file);return true;}
    if(el.type==='color'&&el.closest('.sheet-top')){syncSheetColor(el.closest('form'));return true;}
    if(el.dataset.person){const input=el.closest('.field').querySelector('input');if(!input)return true;const other=el.value==='__other';input.hidden=!other;if(other)input.focus();return true;}
    return false;
  }
