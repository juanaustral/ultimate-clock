/* Ultimate Clock · idiomas. El texto en español funciona como clave; acá está su versión en inglés.
   Los datos guardados (eventos, categorías, estados) quedan en español y se traducen al mostrarlos. */
(function (root) {
  'use strict';
  const EN = {
    /* Tablero y relojes */
    '1º TIEMPO':'1ST HALF','2º TIEMPO':'2ND HALF','RESTA':'LEFT','AL DESCANSO':'TO HALFTIME','JUGADO':'PLAYED',
    'Ⅱ PAUSAR':'Ⅱ PAUSE','▶ REANUDAR':'▶ RESUME','▶ INICIAR':'▶ START','FINALIZADO':'FINISHED',
    'MEDIO TIEMPO':'HALFTIME','Medio tiempo':'Halftime','Descanso en curso':'Halftime running','Descanso cumplido':'Halftime over',
    '▶ SEGUNDO TIEMPO':'▶ SECOND HALF','▶ INICIAR DESCANSO':'▶ START HALFTIME','Progreso del medio tiempo':'Halftime progress',
    'Tiempo jugado del partido: iniciar, pausar o reanudar':'Game time played: start, pause or resume',
    'Finalizado':'Finished','Tiempo cumplido':'Time up','Listo':'Ready','En curso':'Running','Tiempo total cumplido':'Game time over',
    'Primer tiempo cumplido':'First half over','Corriendo':'Running','Pausado':'Paused','Preparado':'Ready',
    'LLAMADO':'CALL','PULL':'PULL','Pull':'Pull','Lanzamiento':'Throw-off','REINICIAR':'RESET','INICIAR':'START',
    'Progreso de {timer}':'{timer} progress','EN CURSO':'RUNNING','SIN CUPO':'NONE LEFT','{n} por tiempo':'{n} per half',
    'Disponible':'Available','Progreso del time out':'Time out progress','Time out':'Time out','Time-out':'Timeout','Time-outs':'Timeouts',
    'Iniciar time out de {team}. {left} de {n} disponibles':'Start time out for {team}. {left} of {n} left',
    'Llamado':'Call','Llamado {team}':'Call {team}','Llamado de {team}':'Call by {team}',
    'Editar nombre y color de {team}':'Edit name and color of {team}','{n} goles de {team}':'{n} goals for {team}',
    'Restar un punto a {team}':'Take a point from {team}','Sumar un gol a {team}':'Add a goal for {team}','+ GOL':'+ GOAL',
    'Equipo {n}':'Team {n}','Equipo 1':'Team 1','Equipo 2':'Team 2',
    /* Avisos de tiempo */
    'PRIMER TIEMPO CUMPLIDO':'FIRST HALF OVER','El reloj del partido se detuvo al llegar al primer tiempo.':'The game clock stopped at the end of the first half.',
    'INICIAR MEDIO TIEMPO':'START HALFTIME','MEDIO TIEMPO CUMPLIDO':'HALFTIME OVER',
    'El descanso terminó. El reloj del partido se reanudará al comenzar la segunda mitad.':'Halftime is over. The game clock resumes when the second half starts.',
    'INICIAR SEGUNDO TIEMPO':'START SECOND HALF',
    'El tiempo total ya se cumplió.':'Game time is already over.','Iniciá el medio tiempo para continuar.':'Start halftime to continue.',
    'Este tiempo corre hasta el final.':'This timer runs to the end.','El llamado sigue en curso.':'The call is still running.','El llamado corre hasta el final.':'The call runs to the end.',
    'El medio tiempo todavía no está disponible.':'Halftime is not available yet.','La segunda mitad ya está activa.':'The second half is already on.',
    'El medio tiempo todavía está en curso.':'Halftime is still running.',
    /* Llamados */
    'Categoría de llamado':'Call type','Falta':'Foul','Violación':'Violation','Pick':'Pick','Travel':'Travel','Conteo':'Stall','Stall':'Stall',
    'Gol discutido':'Disputed goal','Lesión':'Injury','Tiempo de Espíritu':'Spirit timeout',
    'Contacto antirreglamentario entre jugadores. La resolución depende de si el llamado se acepta o se disputa.':'Illegal contact between players. How play restarts depends on whether the call is accepted or contested.',
    'Incumplimiento de una regla distinto de una falta; el reglamento define cómo reanudar el juego.':'A rule infraction other than a foul; the rules define how play restarts.',
    'Un defensor queda impedido de seguir a quien marca por la posición o movimiento de otra persona.':'A defender is blocked from following their mark by another player’s position or movement.',
    'Desplazamiento o pivote incorrecto de quien tiene el disco; puede tratarse como infracción o violación según el caso.':'Illegal movement or pivot by the thrower; it may be an infraction or a violation depending on the case.',
    'Conteo agotado antes del lanzamiento. Registrá el llamado; la posesión se resuelve según el reglamento.':'The stall count ran out before the throw. Log the call; possession is settled by the rules.',
    'Disputa sobre si hubo gol. Al resolverse, el reinicio puede requerir un check.':'A dispute over whether a goal was scored. Once settled, play may restart with a check.',
    'Detención por seguridad. Las sustituciones y los time outs asociados dependen del reglamento.':'A stoppage for safety. Substitutions and related time outs depend on the rules.',
    'Detención para tratar problemas de Espíritu de Juego; tiene condiciones propias y no equivale a una falta común.':'A stoppage to address Spirit of the Game issues; it has its own conditions and is not a regular foul.',
    'El reloj registra el llamado; no aplica sanciones ni reemplaza las reglas.':'The clock logs the call; it does not apply penalties or replace the rules.',
    'Consultar reglamento ↗':'Read the rules ↗','Cancelar':'Cancel','INICIAR LLAMADO':'START CALL','CANCELAR LLAMADO':'CANCEL CALL','REGISTRAR':'RECORD',
    /* Time out */
    'Terminá el time-out activo antes de registrar otro.':'Finish the current time out before logging another.',
    'Este equipo no tiene time-outs disponibles.':'This team has no time outs left.','Iniciar time out':'Start time out',
    '<strong>{team}</strong> usará uno de sus {n} time outs de este tiempo. La cuenta de {time} no se puede pausar y el reloj del partido se detiene.':'<strong>{team}</strong> will use one of its {n} time outs for this half. The {time} countdown cannot be paused and the game clock stops.',
    'INICIAR TIME OUT':'START TIME OUT','Ese time out no está disponible.':'That time out is not available.',
    /* Planilla y eventos */
    'Gol':'Goal','Ajuste manual':'Manual adjustment','Ajuste manual −1':'Manual adjustment −1','Pausa':'Pause','Inicio / reanudación':'Start / resume',
    'Límite superado':'Limit reached','Inicio':'Start','Descanso / mitad':'Halftime / half','Mitad':'Half','Incidencia':'Incident','Guardado':'Saved',
    'Partido finalizado':'Game finished','Reloj de partido':'Game clock','Descanso':'Halftime',
    'Inicio del medio tiempo':'Halftime started','Inicio de segunda mitad; time outs de la nueva mitad disponibles':'Second half started; time outs for the new half available',
    'pase':'assist','gol: {name}':'goal: {name}','pase: {name}':'assist: {name}','Llamado equipo {n}':'Call team {n}',
    'planilla':'scoresheet','respaldo':'backup','Planilla {a} vs {b}':'Scoresheet {a} vs {b}',
    'Planillas guardadas':'Saved scoresheets','DATOS LOCALES':'LOCAL DATA',
    'Al tocar Guardar, la planilla del partido queda acá para abrirla y exportarla.':'When you tap Save, the game scoresheet is kept here to open and export.',
    'Tablero':'Board','PARTIDO CERRADO':'GAME CLOSED','PARTIDO ACTUAL':'CURRENT GAME','Planilla':'Scoresheet',
    'CERRADO':'CLOSED','PAUSADO':'PAUSED','PREPARADO':'READY','TIME OUTS':'TIME OUTS',
    'Registro rápido':'Quick log','ESTE DISPOSITIVO':'THIS DEVICE','Eventos':'Events','REGISTRO':'ENTRY','REGISTROS':'ENTRIES',
    'Todavía no hay eventos. Usá el registro rápido para comenzar.':'No events yet. Use the quick log to begin.',
    'Exportar este partido':'Export this game','Exportar la planilla de este partido':'Export this game’s scoresheet',
    'Nuevo partido':'New game','Guardar planilla':'Save scoresheet','Volver al tablero':'Back to the board',
    'Registrar gol':'Log a goal','Elegí qué equipo anotó.':'Pick the team that scored.',
    'Pedir time-out':'Call a time out','Elegí el equipo que pide tiempo.':'Pick the team calling time.',
    'Registrar llamado':'Log a call','Elegí el equipo que hizo el llamado.':'Pick the team that made the call.',
    'Anotar incidencia':'Log an incident','Tipo':'Type','Otra':'Other','Nota opcional':'Optional note',
    'Registro descriptivo. No aplica sanciones ni certifica decisiones.':'A descriptive log. It does not apply penalties or certify decisions.',
    'Anotar':'Log','Incidencia anotada.':'Incident logged.',
    'Planilla guardada':'Saved scoresheet','Duración':'Duration','Colores:':'Colors:','Configuración del partido':'Game settings',
    'Sin eventos':'No events','EXPORTAR':'EXPORT','Exportar esta planilla':'Export this scoresheet',
    'Duración: {time}    Time-outs: {timeouts}    Eventos: {events}':'Duration: {time}    Timeouts: {timeouts}    Events: {events}',
    'Página {n} de {total}':'Page {n} of {total}',
    'fecha_hora':'date_time','tiempo_juego':'game_time','evento':'event','equipo':'team','cronometro':'timer','detalle':'detail',
    'nota':'note','gol':'goal','modo':'mode',
    'Este partido ya está guardado.':'This game is already saved.',
    'Esperá a que terminen las cuentas activas antes de guardar.':'Wait for the running timers to finish before saving.',
    'Planilla guardada. Partido cerrado.':'Scoresheet saved. Game closed.',
    'Planilla en memoria. Descargá un respaldo para conservarla.':'Scoresheet kept in memory. Download a backup to keep it.',
    /* Goles y equipos */
    'Gol de {team}. {a} a {b}':'Goal for {team}. {a} to {b}','Gol de {team}.':'Goal for {team}.','PASE Y GOL':'ASSIST & GOAL','DESHACER':'UNDO',
    'Ese gol ya no se puede deshacer.':'That goal can no longer be undone.','Gol de {team} deshecho.':'Goal for {team} undone.',
    'Detalle del gol':'Goal details','Gol de <strong>{team}</strong> a los {time}. Los dos campos son opcionales.':'Goal for <strong>{team}</strong> at {time}. Both fields are optional.',
    'Pase':'Assist','Quién dio el pase gol':'Who threw the assist','Quién recibió y anotó':'Who caught it and scored',
    'Guardar detalle':'Save details','Detalle del gol guardado.':'Goal details saved.',
    'Corregir puntaje':'Correct the score','¿Querés restar un punto a <strong>{team}</strong>? La corrección queda registrada como ajuste manual.':'Take a point away from <strong>{team}</strong>? The correction is logged as a manual adjustment.',
    'Restar punto':'Take a point','Puntaje corregido.':'Score corrected.',
    'Nombre del equipo':'Team name','Elegir color {color}':'Choose color {color}','MÁS COLORES':'MORE COLORS','Elegí cualquier color':'Pick any color',
    'Vista previa del equipo':'Team preview','Guardar equipo':'Save team','Datos del equipo guardados.':'Team saved.',
    'Reiniciar contadores':'Reset counters','Contadores reiniciados.':'Counters reset.',
    '¿Reiniciar todos los contadores? Se reinician tiempos, puntajes y eventos sin guardar del partido actual. El historial guardado y los perfiles no se borrarán.':'Reset all counters? Times, scores and unsaved events of the current game are reset. Saved scoresheets and profiles are kept.',
    'Preparar un nuevo partido':'Set up a new game','El partido actual aún no está en el historial. Guardalo antes de continuar.':'The current game is not saved yet. Save it before you continue.',
    'Guardar y crear nuevo':'Save and start new','Partido cerrado. Elegí Nuevo partido.':'Game closed. Choose New game.',
    /* Configuración y perfiles */
    'Personalizado':'Custom','PERSONALIZADO · Crear perfil':'CUSTOM · Create profile','Tiempo total del partido':'Total game time',
    'Primer tiempo':'First half','Time outs por equipo y por tiempo':'Time outs per team per half',
    'CONFIGURACIÓN':'SETTINGS','Preparar partido':'Game setup','Reglamento':'Rules','Perfil':'Profile','Avisos':'Alerts',
    'Sonido y aviso visual':'Sound and visual alert','Solo aviso visual':'Visual alert only',
    'WFDF y USA Ultimate cargan sus tiempos de referencia. Los límites de duración del partido pueden depender del torneo: confirmalos antes de jugar.':'WFDF and USA Ultimate load their reference times. Game time limits may depend on the tournament: confirm them before playing.',
    'Tiempos totales':'Timer lengths','PERFIL PERSONALIZADO':'CUSTOM PROFILE','PERFIL DE REFERENCIA':'REFERENCE PROFILE',
    'Un valor por reloj. Cada cuenta de Pull, Llamado, Time out y Medio tiempo corre hasta cero y termina con cinco alarmas.':'One value per clock. Each Pull, Call, Time out and Halftime countdown runs to zero and ends with five alarms.',
    'Nombre del perfil':'Profile name','Ej.: Torneo local':'E.g.: Local tournament','GUARDAR PERFIL PERSONALIZADO':'SAVE CUSTOM PROFILE','GUARDAR CAMBIOS':'SAVE CHANGES',
    'Elegí “PERSONALIZADO · Crear perfil” para cambiar los valores y guardarlos en el desplegable.':'Choose “CUSTOM · Create profile” to change the values and save them to the list.',
    'El partido ya comenzó. Prepará un nuevo partido para cambiar el reglamento o sus tiempos.':'The game has started. Set up a new game to change the rules or their times.',
    'Referencias:':'References:','Prepará un nuevo partido para cambiar los tiempos.':'Set up a new game to change the times.',
    'Completá el nombre y todos los tiempos con números positivos.':'Fill in the name and every time with positive numbers.',
    'Perfil {name} guardado.':'Profile {name} saved.','Perfil {name} guardado para el próximo partido.':'Profile {name} saved for the next game.',
    'Perfil {name} activo.':'Profile {name} active.','El perfil del partido actual no se puede cambiar.':'The current game’s profile cannot be changed.',
    'Ingresá números enteros entre 1 y 86400.':'Enter whole numbers between 1 and 86400.','Se permiten hasta 20 time-outs por equipo.':'Up to 20 time outs per team are allowed.',
    'El half-time cap debe ser menor que el time cap.':'The half-time cap must be shorter than the time cap.',
    'PERFIL DE TIEMPO':'TIME PROFILE','El partido actual ya comenzó. Su perfil queda fijo hasta preparar otro partido.':'The current game has started. Its profile is fixed until you set up another game.',
    'Elegí los tiempos para este partido antes de empezar.':'Choose the times for this game before you start.',
    'SELECCIONADO':'SELECTED','ELEGIR':'CHOOSE','USAR ESTE PERFIL':'USE THIS PROFILE','CREAR NUEVO PERFIL':'CREATE NEW PROFILE','CÓMO USAR LA APP':'HOW TO USE THE APP',
    'Claro':'Light','Oscuro':'Dark',
    /* Tutorial */
    'PASO {n} DE {total}':'STEP {n} OF {total}','Cerrar tutorial':'Close tutorial','ANTERIOR':'BACK','TERMINAR':'FINISH','SIGUIENTE →':'NEXT →','Cerrar':'Close',
    'Tiempo del partido':'Game time','Iniciá el reloj principal cuando empieza el juego. Es el único que podés pausar. Al cumplirse el primer tiempo aparecerá el aviso para iniciar el descanso.':'Start the main clock when the game begins. It is the only one you can pause. When the first half ends, a prompt appears to start halftime.',
    'Equipos y goles':'Teams and goals','Tocá el nombre para cambiarlo o elegir un color. Con + el gol se suma al instante y se abre un cuadro para anotar quién dio el pase y quién hizo el gol, o deshacerlo. El botón − corrige el puntaje y deja registro del ajuste.':'Tap the name to change it or pick a color. + adds a goal right away and opens a box to log who made the assist and who scored, or to undo it. The − button corrects the score and logs the adjustment.',
    'Llamados por equipo':'Calls per team','Cada equipo tiene su propio Llamado. Tocá INICIAR, elegí la categoría y se registrará qué equipo hizo el llamado. La cuenta sigue hasta el final.':'Each team has its own Call timer. Tap START, choose the type, and the app logs which team made the call. The countdown runs to the end.',
    'Tocá INICIAR al preparar el lanzamiento. Dura 90 s y no se pausa: avisa con 1, 2 y 3 silbatos a los 45, 60 y 75 s y con 4 al terminar. REINICIAR la devuelve a LISTO sin arrancarla.':'Tap START when the pull is being set up. It lasts 90 s and cannot be paused: it signals with 1, 2 and 3 whistles at 45, 60 and 75 s and with 4 at the end. RESET puts it back to READY without starting it.',
    'Primer aviso':'First warning','Segundo aviso':'Second warning','Tercer aviso':'Third warning','{n}º AVISO':'WARNING {n}',
    'Time Out':'Time Out','Tocá INICIAR en el botón del equipo que pide el tiempo. Cada botón muestra cuántos le quedan; el contador es único y no se puede pausar.':'Tap START on the button of the team calling time. Each button shows how many they have left; there is a single countdown and it cannot be paused.',
    'Menú y planilla':'Menu and scoresheet','Desde MENU empezás un partido nuevo, abrís la planilla (con las guardadas y los botones para exportar) y la configuración. Ahí también activás y probás el sonido antes del partido.':'From MENU you start a new game, open the scoresheet (with saved ones and export buttons) and the settings. That is also where you turn on and test the sound before the game.',
    /* Información y apoyo */
    'Sobre Ultimate Clock':'About Ultimate Clock','Un tablero para llevar los tiempos y la planilla del partido desde la línea de juego.':'A board to keep the game times and scoresheet from the sideline.',
    'Desarrollado por Juan Martínez García.':'Made by Juan Martínez García.','Esta app es gratuita para la comunidad del Ultimate Frisbee.':'This app is free for the Ultimate Frisbee community.',
    'Los datos se guardan en este dispositivo.':'Data is stored on this device.','VISITÁ MI SITIO WEB ↗':'VISIT MY WEBSITE ↗',
    'DONÁ PARA APOYAR EL PROYECTO':'DONATE TO SUPPORT THE PROJECT','CONOCÉ ULTIMATE FRISBEE MENDOZA ↗':'MEET ULTIMATE FRISBEE MENDOZA ↗',
    'APOYÁ ESTE PROYECTO':'SUPPORT THIS PROJECT','El enlace para donar todavía no está disponible. Gracias por querer apoyar el desarrollo de Ultimate Clock.':'The donation link is not available yet. Thanks for wanting to support Ultimate Clock.',
    /* Sonido, pantalla y almacenamiento */
    'ACTIVAR SONIDO':'TURN SOUND ON','DESACTIVAR SONIDO':'TURN SOUND OFF','PANTALLA COMPLETA':'FULL SCREEN','SALIR DE PANTALLA COMPLETA':'EXIT FULL SCREEN',
    'El navegador no habilitó el sonido. Usá PROBAR SONIDO en MENU.':'The browser did not allow sound. Use TEST SOUND in MENU.',
    'Sonido desactivado.':'Sound off.','Sonido activado.':'Sound on.','No se pudo activar el sonido en este navegador.':'Sound could not be turned on in this browser.',
    'Sonido de prueba: cinco alarmas. Revisá el volumen del dispositivo.':'Test sound: five alarms. Check the device volume.','No se pudo reproducir el sonido de prueba.':'The test sound could not be played.',
    'Alertas sonoras activas.':'Sound alerts on.','Alertas sonoras desactivadas.':'Sound alerts off.',
    'Falló la reproducción. Revisá el navegador y probá el sonido desde MENU.':'Playback failed. Check the browser and test the sound from MENU.',
    'El almacenamiento local no está disponible o contiene un formato no compatible. Tus datos anteriores se conservan.':'Local storage is unavailable or holds an incompatible format. Your previous data is kept.',
    'Descargar respaldo':'Download backup','Reintentar guardado':'Retry saving',
    'Descargá primero el respaldo. El formato anterior se conserva sin sobrescribir.':'Download the backup first. The previous format is kept without overwriting it.',
    'Guardado local restablecido.':'Local saving restored.','Otra pestaña cambió el partido. Recargá esta pestaña antes de continuar.':'Another tab changed the game. Reload this tab before you continue.',
    'Partido abierto en otra pestaña.':'Game open in another tab.','Recargar estado actual':'Reload current state',
    'La instalación sin conexión no está disponible en este navegador.':'Offline install is not available in this browser.',
    'Idioma: español':'Language: English',
    /* Textos fijos del HTML */
    'Ultimate Clock — Reloj y planilla para partidos de Ultimate Frisbee':'Ultimate Clock — Game clock and scoresheet for Ultimate Frisbee',
    'ULTIMATE CLOCK, tablero':'ULTIMATE CLOCK, board','Opciones del partido':'Game options','Modo visual':'Display mode',
    'MODO CLARO':'LIGHT MODE','MODO OSCURO':'DARK MODE','IDIOMA':'LANGUAGE','PARTIDO':'GAME','＋ NUEVO PARTIDO':'＋ NEW GAME','PLANILLA':'SCORESHEET',
    'Guardar partido':'Save game','GUARDAR':'SAVE','SONIDO Y PANTALLA':'SOUND AND SCREEN','PROBAR SONIDO':'TEST SOUND',
    'Abrir configuración':'Open settings','CONFIGURAR':'SETTINGS','EDITAR TIEMPOS':'EDIT TIMES','Editar tiempos':'Edit times','AYUDA':'HELP','Información de la app':'App information','INFO':'INFO',
    'REINICIAR CONTADORES':'RESET COUNTERS','Créditos y apoyo':'Credits and support','UN PROYECTO DE':'A PROJECT BY','PARA':'FOR',
    'Apoyá este proyecto':'Support this project',
    'Si el tablero no aparece:':'If the board does not appear:',
    /* Bienvenida y guardado */
    'Completá el nombre y todos los tiempos con números enteros positivos.':'Fill in the name and every time with positive whole numbers.','ELIMINAR':'DELETE','¿ELIMINAR?':'DELETE?','ELIMINAR PERFIL':'DELETE PROFILE','Eliminar perfil':'Delete profile','Eliminar el perfil {name}':'Delete the {name} profile','Perfil {name} eliminado.':'Profile {name} deleted.','¿Eliminar el perfil {name}? Las planillas guardadas no se borran.':'Delete the {name} profile? Saved scoresheets are kept.','Este perfil se usa en el partido actual. Prepará otro partido para eliminarlo.':'This profile is used by the current game. Set up another game to delete it.',
    'PASO {n} DE {total}':'STEP {n} OF {total}','SIGUIENTE':'NEXT','ATRÁS':'BACK','Perfil de tiempo':'Time profile','EMPEZAR':'START','TIEMPOS PERSONALIZADOS':'CUSTOM TIMES','Tiempos personalizados':'Custom times','GUARDAR PERFIL Y EMPEZAR':'SAVE PROFILE AND START',
    'Este perfil se guarda en la sesión de este navegador y quedará disponible en la lista de perfiles. Si borrás sus datos, usás modo incógnito o cambiás de equipo, se pierde.':'This profile is saved in this browser session and will be available in the profile list. Clearing its data, using private mode or switching devices loses it.',
    'Te damos la bienvenida':'Welcome',
    'Reloj, goles, llamados, pull, time outs y planilla de tu partido. Gratis y sin internet.':'Game clock, goals, calls, pull, time outs and scoresheet for your game. Free and offline.',
    'Perfiles y planillas se guardan solo en este navegador. Si borrás sus datos, usás modo incógnito o cambiás de equipo, se pierden. En iPhone, agregá la app a la pantalla de inicio. Exportá lo que quieras conservar.':'Profiles and scoresheets are stored only in this browser. Clearing its data, using private mode or switching devices loses them. On iPhone, add the app to your Home Screen. Export what you want to keep.',
    /* WhatsApp */
    'ENVIAR POR WHATSAPP':'SEND BY WHATSAPP','Empate':'Draw','Ganó {team}':'{team} won','Resumen':'Summary','Goles':'Goals','Llamados':'Calls',
    'pase de {name}':'assist by {name}','Gol de {team}':'Goal by {team}','Punto descontado a {team}':'Point taken from {team}','Time-out de {team}':'Timeout by {team}',
    'Novedades':'What’s new','Novedades de la versión':'What’s new in this version','Estás usando la versión {v}.':'You are using version {v}.',
    'Segundo tiempo':'Second half',
    'DESHACER GOL':'UNDO GOAL','OMITIR':'SKIP','LISTO':'DONE','Equipos del partido':'Teams for this game','Escribí el nombre y elegí el color de cada equipo.':'Type each team’s name and pick its color.',
    'Nombre del equipo {n}':'Team {n} name','Equipos listos.':'Teams ready.','Final':'Final','Momentos':'Key moments','Hecho con Ultimate Clock':'Made with Ultimate Clock'
  };
  const languages=['es','en'];
  function t(lang,text,vars){
    let out=lang==='en'&&Object.prototype.hasOwnProperty.call(EN,text)?EN[text]:String(text??'');
    if(vars)out=out.replace(/\{(\w+)\}/g,(m,k)=>k in vars?String(vars[k]):m);
    return out;
  }
  /* Orden: ?lang= en la URL, preferencia guardada, idioma del navegador. Por defecto, español. */
  function initial(saved){
    try{const q=new URLSearchParams(root.location?.search||'').get('lang');if(languages.includes(q))return q;}catch{}
    if(languages.includes(saved))return saved;
    const nav=String(root.navigator?.language||'es').toLowerCase();
    return nav.startsWith('es')||!nav?'es':'en';
  }
  const api={EN,languages,t,initial};
  if(typeof module!=='undefined')module.exports=api;else root.UCI18N=api;
})(typeof globalThis!=='undefined'?globalThis:this);
