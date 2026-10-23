#!/usr/bin/env python3
"""Genera manual/index.html (español e inglés) a partir del contenido de abajo.
Las capturas salen de `node qa/manual-capturas.cjs` (manual/img/<idioma>-<nn>-<nombre>.webp).
Uso: python3 scripts/generar-manual.py"""
import html
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# El manual lleva la versión de la app (changelog.js): tests/manual.test.cjs falla si no coincide, para no olvidarse de regenerarlo.
_CL = open(os.path.join(ROOT, 'changelog.js'), encoding='utf-8').read()
VERSION = re.search(r'VERSION = (\d+)', _CL).group(1)
K = lambda s: f'<span class="k">{s}</span>'  # botón o texto de la app


def shot(img, alt, cap, body):
    return ('shot', img, alt, cap, body)


def wide(img, alt, cap):
    return ('wide', img, alt, cap)


def text(body):
    return ('text', body)


COLORES = [('Azul', 'Blue', '#1b47e2'), ('Naranja', 'Orange', '#f59e0b'), ('Verde', 'Green', '#16a34a'), ('Rojo', 'Red', '#c62525'),
           ('Negro', 'Black', '#16171b'), ('Blanco', 'White', '#ffffff'), ('Amarillo', 'Yellow', '#facc15'), ('Violeta', 'Purple', '#7c3aed'),
           ('Rosa', 'Pink', '#ec4899'), ('Celeste', 'Light blue', '#38bdf8'), ('Gris', 'Grey', '#6b7280'), ('Bordó', 'Maroon', '#7f1d1d'),
           ('Azul marino', 'Navy', '#1e3a8a'), ('Turquesa', 'Teal', '#14b8a6'), ('Verde oscuro', 'Dark green', '#14532d'), ('Verde lima', 'Lime', '#84cc16'),
           ('Menta', 'Mint', '#86efac'), ('Dorado', 'Gold', '#ca8a04'), ('Marrón', 'Brown', '#78350f'), ('Beige', 'Beige', '#d6c7a1'),
           ('Salmón', 'Salmon', '#fda4af'), ('Fucsia', 'Fuchsia', '#c026d3'), ('Lila', 'Lilac', '#a78bfa'), ('Gris claro', 'Light grey', '#d1d5db')]
SWATCHES_ES = ' '.join(f'<span class="sw"><i style="background:{h}"></i>{es}</span>' for es, _, h in COLORES)
SWATCHES_EN = ' '.join(f'<span class="sw"><i style="background:{h}"></i>{en}</span>' for _, en, h in COLORES)

# Cada sección: (id, {es, en} título, [bloques]); cada texto es un par (es, en).
SECTIONS = [
    ('inicio', ('Antes de empezar', 'Before you start'), [
        text((
            f'''<p><strong>Ultimate Clock</strong> es una app gratis para llevar partidos y torneos de Ultimate Frisbee desde el celular o la tablet: reloj del partido, goles, llamados, pull, time outs, planilla, fixture y tabla de posiciones.</p>
<ul>
<li><strong>Abrila</strong> en <a href="https://iona.ar/ultimateclock/">iona.ar/ultimateclock</a>.</li>
<li><strong>Instalala como app.</strong> iPhone: botón Compartir → {K('Agregar a inicio')}. Android: menú ⋮ → {K('Instalar app')}.</li>
<li><strong>Funciona sin internet.</strong> Abrila una vez con señal; después anda en la cancha aunque no haya.</li>
</ul>''',
            f'''<p><strong>Ultimate Clock</strong> is a free app to run Ultimate Frisbee games and tournaments from a phone or tablet: game clock, goals, calls, pull, time outs, scoresheet, fixture and standings.</p>
<ul>
<li><strong>Open it</strong> at <a href="https://iona.ar/ultimateclock/">iona.ar/ultimateclock</a>.</li>
<li><strong>Install it as an app.</strong> iPhone: Share button → {K('Add to Home Screen')}. Android: ⋮ menu → {K('Install app')}.</li>
<li><strong>Works offline.</strong> Open it once with signal; after that it works at the field without internet.</li>
</ul>''')),
        shot('01-entrada', ('Pantalla de bienvenida con UTILIZAR MODO GRATIS y UTILIZAR MODO PRO', 'Welcome screen with USE FREE MODE and USE PRO MODE'), ('Entrar o usar sin cuenta', 'Sign in or use without an account'), (
            f'''<h3>¿Con cuenta o sin cuenta?</h3>
<p>Al abrir la app elegís:</p>
<ul>
<li>{K('UTILIZAR MODO PRO')} → {K('INGRESAR CON MI USUARIO')} (Modo Pro): todo se guarda <strong>en el servidor</strong> al instante. Podés usar varios teléfonos a la vez, seguir un partido en otro dispositivo si el tuyo falla y <strong>compartir el fixture en vivo</strong>.</li>
<li>{K('UTILIZAR MODO GRATIS')}: solo <strong>MODO PARTIDO</strong>, sin torneo ni sincronización; todo queda <strong>solo en ese teléfono</strong>. Para conservarlo o pasarlo a otro, exportalo.</li>
</ul>
<p><strong>Modo gratis y Modo Pro.</strong> En gratis, {K("MODO TORNEO")} y {K("SINCRONIZADO")} aparecen en gris en el MENU; si los tocás, un aviso cuenta qué incluye el Modo Pro. Ahí mismo, o en {K("UTILIZAR MODO PRO")}, tocá {K("SOLICITÁ TU MODO PRO")}: completás un formulario (nombre, equipo, torneo, mensaje y e-mail) y te respondemos con tu usuario y contraseña. Si ya tenés usuario, {K("MENU")} → {K("INGRESAR AL MODO PRO")}.</p>
<p>Si hay una versión nueva de la app, se recarga sola cuando no hay un partido en curso; con un partido en curso avisa y esperás a tocar {K("RECARGAR")}.</p>''',
            f'''<h3>With or without an account?</h3>
<p>When the app opens you choose:</p>
<ul>
<li>{K('USE PRO MODE')} → {K('SIGN IN WITH MY USER')} with username and password: everything is saved <strong>on the server</strong> instantly. You can use several phones at once, continue a game on another device if yours fails and <strong>share the fixture live</strong>.</li>
<li>{K('USE FREE MODE')}: everything stays <strong>only on that phone</strong>. Export it to keep it or move it to another device.</li>
</ul>
<p><strong>Free mode and Pro Mode.</strong> In free mode, {K("TOURNAMENT MODE")} and {K("SYNCED")} appear greyed out in the MENU; if you tap them, a notice explains what Pro Mode includes. There, or under {K("USE PRO MODE")}, tap {K("REQUEST YOUR PRO MODE")}: you fill in a form (name, team, tournament, message and e-mail) and we reply with your username and password. If you already have a user, {K("MENU")} → {K("ENTER PRO MODE")}.</p>
<p>When there is a new version of the app, it reloads by itself if no game is in progress; during a game it tells you and you tap {K("RELOAD")} when ready.</p>''')),
        text((f'<div class="tip"><strong>Consejo:</strong> antes del partido subí el volumen y tocá {K("MENU")} → {K("PROBAR SONIDO")}.</div>',
              f'<div class="tip"><strong>Tip:</strong> before the game turn the volume up and tap {K("MENU")} → {K("TEST SOUND")}.</div>')),
    ]),
    ('modos', ('Los dos modos', 'The two modes'), [
        shot('02-bienvenida', ('Bienvenida con MODO PARTIDO y MODO TORNEO', 'Welcome with MATCH MODE and TOURNAMENT MODE'), ('Elegir el modo', 'Choosing the mode'), (
            f'''<p>La app tiene dos modos. Elegís uno en la bienvenida y lo cambiás cuando quieras desde {K('MENU')}.</p>
<table class="cmp"><thead><tr><th></th><th>Modo partido</th><th>Modo torneo</th></tr></thead><tbody>
<tr><th>Para qué</th><td>Un partido suelto, un amistoso, un entrenamiento.</td><td>Un torneo o una liga con varios equipos.</td></tr>
<tr><th>Equipos</th><td>Escribís los nombres en cada partido.</td><td>Los cargás una vez (a mano o desde Excel) y los elegís de una lista.</td></tr>
<tr><th>Jugadores</th><td>Opcional, por partido.</td><td>Una lista por equipo, con número de camiseta.</td></tr>
<tr><th>Qué arma solo</th><td>La planilla del partido.</td><td>Fixture, tabla de posiciones, goleadores y pases, historial de cada equipo.</td></tr>
<tr><th>Compartir</th><td>Planilla en PDF, CSV o WhatsApp.</td><td>Además, el fixture en vivo con un link.</td></tr>
</tbody></table>
<p>Si no sabés cuál, empezá con <strong>modo partido</strong>.</p>''',
            f'''<p>The app has two modes. You pick one on the welcome screen and change it whenever you want from {K('MENU')}.</p>
<table class="cmp"><thead><tr><th></th><th>Match mode</th><th>Tournament mode</th></tr></thead><tbody>
<tr><th>Use it for</th><td>A single game, a friendly, a practice.</td><td>A tournament or league with several teams.</td></tr>
<tr><th>Teams</th><td>You type the names for each game.</td><td>You load them once (by hand or from Excel) and pick them from a list.</td></tr>
<tr><th>Players</th><td>Optional, per game.</td><td>One list per team, with jersey number.</td></tr>
<tr><th>Built for you</th><td>The game scoresheet.</td><td>Fixture, standings, scorers and assists, each team's history.</td></tr>
<tr><th>Sharing</th><td>Scoresheet as PDF, CSV or WhatsApp.</td><td>Plus the live fixture with a link.</td></tr>
</tbody></table>
<p>If you are not sure, start with <strong>match mode</strong>.</p>''')),
    ]),
    ('partido', ('Modo partido: empezar', 'Match mode: getting started'), [
        shot('03-equipos', ('Paso 1: nombre y color de cada equipo', 'Step 1: name and color of each team'), ('Paso 1: equipos', 'Step 1: teams'), (
            f'<h3>Paso 1 · Equipos</h3><p>Escribí el nombre de cada equipo y tocá un color (el {K("+")} abre más). Tocá {K("SIGUIENTE →")}.</p>',
            f'<h3>Step 1 · Teams</h3><p>Type each team name and tap a color ({K("+")} opens more). Tap {K("NEXT →")}.</p>')),
        shot('04-jugadores', ('Paso 2: jugadores de cada equipo, uno por renglón', 'Step 2: players of each team, one per line'), ('Paso 2: jugadores (opcional)', 'Step 2: players (optional)'), (
            f'<h3>Paso 2 · Jugadores (opcional)</h3><p>Si querés saber quién hizo cada gol, escribí un jugador por renglón. El número va adelante y es opcional: {K("7 Ana")} {K("Beto")}. Si no te interesa, dejalo vacío.</p>',
            f'<h3>Step 2 · Players (optional)</h3><p>If you want to know who scored each goal, type one player per line. The number goes first and is optional: {K("7 Ana")} {K("Beto")}. Otherwise leave it empty.</p>')),
        shot('05-tiempos', ('Paso 3: elegir WFDF, USA Ultimate o tiempos personalizados', 'Step 3: choose WFDF, USA Ultimate or custom times'), ('Paso 3: tiempos', 'Step 3: times'), (
            f'<h3>Paso 3 · Tiempos</h3><p>Elegí el reglamento: <strong>WFDF</strong> o <strong>USA Ultimate</strong>. Si tu torneo usa otros tiempos, tocá {K("TIEMPOS PERSONALIZADOS")}. Después {K("EMPEZAR")}.</p><div class="tip">Para el próximo partido: {K("MENU")} → {K("＋ NUEVO PARTIDO")}.</div>',
            f'<h3>Step 3 · Times</h3><p>Choose the rules: <strong>WFDF</strong> or <strong>USA Ultimate</strong>. If your event uses other times, tap {K("CUSTOM TIMES")}. Then {K("START")}.</p><div class="tip">For the next game: {K("MENU")} → {K("＋ NEW GAME")}.</div>')),
    ]),
    ('tablero', ('El tablero', 'The board'), [
        shot('06-tablero', ('Tablero con reloj, equipos, llamados, pull y time out', 'Board with clock, teams, calls, pull and time out'), ('El tablero', 'The board'), (
            f'''<p>Todo entra en una pantalla, de arriba hacia abajo:</p>
<ol>
<li><strong>Reloj del partido.</strong> {K("▶ INICIAR")} / {K("Ⅱ PAUSAR")}. Debajo: cuánto <strong>RESTA</strong> y cuánto falta <strong>AL DESCANSO</strong>.</li>
<li><strong>Equipos</strong> con el tanteador. {K("+ GOL")} suma, {K("−")} corrige (pide confirmar). Tocando el nombre cambiás nombre y color.</li>
<li><strong>Llamado</strong> de cada equipo: el tiempo para reanudar.</li>
<li><strong>Pull</strong>: 90 segundos con silbatos de aviso.</li>
<li><strong>Time out</strong>: un botón por equipo con los que le quedan (por ejemplo <strong>2/2</strong>).</li>
</ol>
<p>Arriba: el cartel del modo (en torneo dice {K("VER TORNEO")} y te lleva al torneo), el indicador de sincronización (flechas verdes o rojas) y {K("MENU")}.</p>''',
            f'''<p>Everything fits on one screen, top to bottom:</p>
<ol>
<li><strong>Game clock.</strong> {K("▶ START")} / {K("Ⅱ PAUSE")}. Below: time <strong>LEFT</strong> and time <strong>TO HALF</strong>.</li>
<li><strong>Teams</strong> with the score. {K("+ GOAL")} adds, {K("−")} corrects (asks to confirm). Tap the name to change name and color.</li>
<li><strong>Call</strong> timer for each team: time to restart play.</li>
<li><strong>Pull</strong>: 90 seconds with whistle warnings.</li>
<li><strong>Time out</strong>: one button per team with the ones left (for example <strong>2/2</strong>).</li>
</ol>
<p>At the top: the mode badge (in tournament mode it says {K("VIEW TOURNAMENT")} and takes you there), the sync indicator (green or red arrows) and {K("MENU")}.</p>''')),
        text(('<div class="tip">El único reloj que se pausa es el del partido. Pull, llamado, time out y medio tiempo corren hasta terminar.</div>',
              '<div class="tip">Only the game clock can be paused. Pull, call, time out and halftime run until they finish.</div>')),
    ]),
    ('durante', ('Durante el partido', 'During the game'), [
        shot('07-gol', ('Detalle del gol: pase y gol', 'Goal detail: assist and goal'), ('Detalle del gol', 'Goal detail'), (
            f'''<h3>Anotar un gol</h3><ol>
<li>Tocá {K("+ GOL")} del equipo que anotó. El gol se suma al instante.</li>
<li>Se abre el detalle: elegí (o escribí) quién dio el <strong>pase</strong> y quién hizo el <strong>gol</strong>.</li>
<li>{K("GUARDAR DETALLE")} lo registra; {K("OMITIR")} deja el gol sin nombres; {K("DESHACER GOL")} lo borra si fue un error.</li></ol>''',
            f'''<h3>Scoring a goal</h3><ol>
<li>Tap {K("+ GOAL")} for the team that scored. The goal counts right away.</li>
<li>The detail opens: pick (or type) who made the <strong>assist</strong> and who scored the <strong>goal</strong>.</li>
<li>{K("SAVE DETAILS")} logs it; {K("SKIP")} leaves the goal without names; {K("UNDO GOAL")} removes it if it was a mistake.</li></ol>''')),
        shot('08-llamado', ('Elegir la categoría del llamado', 'Choosing the call category'), ('Tipo de llamado', 'Call type'), (
            f'''<h3>Registrar un llamado</h3><ol>
<li>Tocá {K("INICIAR")} en el llamado del equipo que lo hizo: empieza a correr el tiempo.</li>
<li>Elegí qué fue (Falta, Violación, Pick, Travel, Conteo, Gol discutido, Lesión, Tiempo de Espíritu). Cada uno tiene una explicación corta.</li>
<li>{K("REGISTRAR")}. Si fue un error, {K("CANCELAR LLAMADO")}.</li></ol>
<p>La app solo anota: <strong>no decide sanciones</strong>.</p>''',
            f'''<h3>Logging a call</h3><ol>
<li>Tap {K("START")} on the call timer of the team that made it: the time starts.</li>
<li>Pick what it was (Foul, Violation, Pick, Travel, Count, Disputed goal, Injury, Spirit timeout). Each has a short explanation.</li>
<li>{K("RECORD")}. If it was a mistake, {K("CANCEL CALL")}.</li></ol>
<p>The app only records: <strong>it does not decide penalties</strong>.</p>''')),
        shot('09-contadores', ('Tablero con pull, llamado y time out corriendo', 'Board with pull, call and time out running'), ('Contadores en marcha', 'Timers running'), (
            f'''<h3>Pull</h3><p>{K("INICIAR")} en Pull cuando los equipos se preparan. Silbatos a los 45 s (1), 60 s (2), 75 s (3) y 90 s (4, tiempo cumplido).</p>
<h3>Time out</h3><p>Tocá el botón del equipo que lo pide y confirmá. Se descuenta de su cupo; en el segundo tiempo el cupo se renueva.</p>
<h3>Medio tiempo</h3><p>Al cumplirse el primer tiempo el reloj se detiene y aparece un aviso: {K("INICIAR MEDIO TIEMPO")} y después {K("INICIAR SEGUNDO TIEMPO")}.</p>''',
            f'''<h3>Pull</h3><p>{K("START")} on Pull when teams get ready. Whistles at 45 s (1), 60 s (2), 75 s (3) and 90 s (4, time is up).</p>
<h3>Time out</h3><p>Tap the button of the team asking for it and confirm. It comes off their allowance; it resets in the second half.</p>
<h3>Halftime</h3><p>When the first half ends the clock stops and a notice appears: {K("START HALFTIME")} and then {K("START SECOND HALF")}.</p>''')),
        text(('<div class="warn"><strong>Importante:</strong> si bloqueás el teléfono o cambiás de app, los avisos suenan recién al volver. Dejá la app abierta durante el partido; mientras un reloj corre, la pantalla no se apaga sola.</div>',
              '<div class="warn"><strong>Important:</strong> if you lock the phone or switch apps, alerts only sound when you come back. Keep the app open during the game; while a timer runs the screen stays on.</div>')),
    ]),
    ('planilla', ('Planilla y exportar', 'Scoresheet and export'), [
        shot('11-planilla', ('Planilla con tanteador, registro rápido y eventos', 'Scoresheet with score, quick log and events'), ('Planilla', 'Scoresheet'), (
            f'''<p>{K("MENU")} → {K("PLANILLA")} muestra el tanteador, los time outs que quedan y cada <strong>evento</strong> con su minuto. Desde <strong>Registro rápido</strong> también anotás goles, llamados, time outs e <strong>incidencias</strong>.</p>
<h3>Exportar</h3><ul>
<li>{K("PDF")} para imprimir o mandar a la organización · {K("CSV")} para Excel · {K("JSON")} copia completa · {K("ENVIAR POR WHATSAPP")} resumen del partido.</li></ul>
<h3>Guardar el partido</h3><p>Al terminar, {K("MENU")} → {K("GUARDAR")}. El partido se cierra y aparece en <strong>Planillas guardadas</strong>, donde lo abrís, exportás o borrás. En modo torneo, recién al guardar suma en la tabla.</p>''',
            f'''<p>{K("MENU")} → {K("SCORESHEET")} shows the score, time outs left and every <strong>event</strong> with its minute. From <strong>Quick log</strong> you can also log goals, calls, time outs and <strong>incidents</strong>.</p>
<h3>Export</h3><ul>
<li>{K("PDF")} to print or send to the organizers · {K("CSV")} for Excel · {K("JSON")} full copy · {K("SEND BY WHATSAPP")} game summary.</li></ul>
<h3>Saving the game</h3><p>When it ends, {K("MENU")} → {K("SAVE")}. The game closes and shows up in <strong>Saved scoresheets</strong>, where you open, export or delete it. In tournament mode it only counts in the standings once saved.</p>''')),
    ]),
    ('menu', ('El menú', 'The menu'), [
        shot('10-menu', ('Menú abierto', 'Open menu'), ('MENU', 'MENU'), (
            f'''<dl>
<dt>MODO CLARO / OSCURO · ESPAÑOL / ENGLISH</dt><dd>Claro para el sol, oscuro para la noche. Idioma de la app.</dd>
<dt>＋ NUEVO PARTIDO · PLANILLA · GUARDAR</dt><dd>Empezar otro partido, ver la planilla y cerrar el partido.</dd>
<dt>ENTRAR AL MODO TORNEO / VER TORNEO · SALIR DEL MODO TORNEO</dt><dd>Pasar de un modo al otro; en torneo, {K("VER TORNEO")} abre el fixture.</dd>
<dt>Cuenta</dt><dd>{K("INGRESAR AL MODO PRO")} o el estado de la sincronización: {K("✓ SINCRONIZADO")}, {K("SINCRONIZANDO…")} o, si no hay internet, {K("SIN CONEXIÓN · SINCRONIZAR AHORA")}. {K("SALIR DE ESTE USUARIO")} vuelve al modo sin usuario.</dd>
<dt>Sonido y pantalla</dt><dd>Activar y probar el sonido, pantalla completa y {K("⚙ EDITAR TIEMPOS")}.</dd>
<dt>Ayuda</dt><dd>{K("CÓMO USAR LA APP")} (recorrido guiado), {K("MANUAL DE USUARIO")} (este manual) e {K("INFO")}.</dd>
<dt>REINICIAR CONTADORES</dt><dd>Pone el partido actual en cero (pide confirmar). No borra planillas guardadas.</dd>
</dl>''',
            f'''<dl>
<dt>LIGHT / DARK MODE · ESPAÑOL / ENGLISH</dt><dd>Light for sunshine, dark for night. App language.</dd>
<dt>＋ NEW GAME · SCORESHEET · SAVE</dt><dd>Start another game, see the scoresheet and close the game.</dd>
<dt>ENTER TOURNAMENT MODE / VIEW TOURNAMENT · EXIT TOURNAMENT MODE</dt><dd>Switch modes; in tournament mode, {K("VIEW TOURNAMENT")} opens the fixture.</dd>
<dt>Account</dt><dd>{K("ENTER PRO MODE")} or the sync status: {K("✓ SYNCED")}, {K("SYNCING…")} or, with no internet, {K("OFFLINE · SYNC NOW")}. {K("LOG OUT OF THIS USER")} goes back to no-user mode.</dd>
<dt>Sound and screen</dt><dd>Turn on and test sound, full screen and {K("⚙ EDIT TIMES")}.</dd>
<dt>Help</dt><dd>{K("HOW TO USE THE APP")} (guided tour), {K("USER MANUAL")} (this manual) and {K("INFO")}.</dd>
<dt>RESET COUNTERS</dt><dd>Sets the current game to zero (asks to confirm). Saved scoresheets are kept.</dd>
</dl>''')),
    ]),
    ('cuenta', ('Cuenta y sincronización', 'Account and sync'), [
        text((
            f'''<p>Con sesión iniciada, <strong>cada gol, llamado o cambio se guarda en el servidor al instante</strong>. No hay que hacer nada: la app sincroniza sola todo el tiempo.</p>
<ul>
<li><strong>Indicador</strong> arriba (dos flechas): <strong>verde</strong> = todo guardado; <strong>rojo</strong> = hay cambios por subir o no hay conexión.</li>
<li><strong>Sin internet en la cancha</strong> la app sigue funcionando y sube todo cuando vuelve la señal. Si querés forzarlo, {K("MENU")} → {K("SIN CONEXIÓN · SINCRONIZAR AHORA")}.</li>
<li>Si dos teléfonos cambiaron lo mismo, aparece un cartel para elegir <strong>cuál es el oficial</strong>.</li>
</ul>''',
            f'''<p>When signed in, <strong>every goal, call or change is saved on the server instantly</strong>. You do not need to do anything: the app syncs by itself all the time.</p>
<ul>
<li><strong>Indicator</strong> at the top (two arrows): <strong>green</strong> = everything saved; <strong>red</strong> = changes waiting or no connection.</li>
<li><strong>No internet at the field?</strong> The app keeps working and uploads everything when signal returns. To force it, {K("MENU")} → {K("OFFLINE · SYNC NOW")}.</li>
<li>If two phones changed the same thing, a notice lets you choose <strong>which one is official</strong>.</li>
</ul>''')),
        text((
            f'''<h3>Salir de este usuario</h3>
<p>Si prestaste el teléfono o te equivocaste de cuenta: {K("MENU")} → {K("SALIR DE ESTE USUARIO")}. La app se vacía de los datos de esa cuenta (siguen en el servidor) y vuelve al <strong>modo sin usuario</strong>, sin pedirte nada. Si había cambios sin subir, te avisa antes. Para volver: {K("MENU")} → {K("INGRESAR AL MODO PRO")}.</p>''',
            f'''<h3>Log out of this user</h3>
<p>If you lent the phone or used the wrong account: {K("MENU")} → {K("LOG OUT OF THIS USER")}. The app clears that account's data from the device (it stays on the server) and goes back to <strong>no-user mode</strong> without asking for anything. If there were changes not uploaded yet, it warns you first. To come back: {K("MENU")} → {K("ENTER PRO MODE")}.</p>''')),
        shot('28-retomar', ('Aviso para retomar un partido en curso de otro dispositivo', 'Notice to resume a game in progress from another device'), ('Retomar en otro dispositivo', 'Resume on another device'), (
            f'''<h3>Si el teléfono falla</h3><p>Entrá con la misma cuenta en otro teléfono o tablet. La app avisa que hay un <strong>partido en curso en otro dispositivo</strong> y muestra el marcador. Tocá {K("RETOMAR AQUÍ")}: seguís desde el último evento, con el reloj pausado en ese momento. Revisalo antes de seguir.</p>''',
            f'''<h3>If the phone fails</h3><p>Sign in with the same account on another phone or tablet. The app says there is a <strong>game in progress on another device</strong> and shows the score. Tap {K("RESUME HERE")}: you continue from the last event, with the clock paused at that moment. Check it before going on.</p>''')),
    ]),
    ('torneo', ('Modo torneo: crear el torneo', 'Tournament mode: create the tournament'), [
        shot('12-torneo-crear', ('Pantalla para crear un torneo', 'Screen to create a tournament'), ('Crear el torneo', 'Create the tournament'), (
            f'''<ol>
<li>En la bienvenida elegí {K("MODO TORNEO")}, o {K("MENU")} → {K("ENTRAR AL MODO TORNEO")}.</li>
<li>Escribí el nombre (por ejemplo "Copa Mendoza 2026") y tocá {K("CREAR TORNEO")}. Después cargás los equipos uno por uno…</li>
<li>…o, más rápido, <strong>cargá todos los equipos desde un Excel</strong> (ver la sección siguiente).</li>
</ol>
<p>Una vez en modo torneo, el cartel de arriba dice {K("VER TORNEO")}: tocándolo volvés al torneo desde cualquier pantalla.</p>''',
            f'''<ol>
<li>On the welcome screen choose {K("TOURNAMENT MODE")}, or {K("MENU")} → {K("ENTER TOURNAMENT MODE")}.</li>
<li>Type the name (for example "Mendoza Cup 2026") and tap {K("CREATE TOURNAMENT")}. Then add the teams one by one…</li>
<li>…or, faster, <strong>load every team from an Excel file</strong> (see the next section).</li>
</ol>
<p>Once in tournament mode, the top badge says {K("VIEW TOURNAMENT")}: tap it to go back to the tournament from any screen.</p>''')),
    ]),
    ('excel', ('Cargar equipos desde Excel', 'Load teams from Excel'), [
        shot('13-excel', ('Bloque Cargar equipos desde Excel con DESCARGAR PLANTILLA e IMPORTAR EXCEL', 'Load teams from Excel block with DOWNLOAD TEMPLATE and IMPORT EXCEL'), ('Plantilla de Excel', 'Excel template'), (
            f'''<ol>
<li>Tocá {K("DESCARGAR PLANTILLA")}. Se baja un archivo <strong>.xlsx</strong>.</li>
<li>Abrilo en Excel, Google Sheets, Numbers o LibreOffice y completalo (ver abajo).</li>
<li>Guardalo como <strong>.xlsx</strong>. En Google Sheets: Archivo → Descargar → Microsoft Excel.</li>
<li>En la app tocá {K("IMPORTAR EXCEL")} y elegí el archivo.</li>
</ol>
<p>El bloque está al crear el torneo y en la pestaña {K("EQUIPOS")}. Si ya cargaste equipos, la plantilla viene con ellos, para completarlos o corregirlos.</p>''',
            f'''<ol>
<li>Tap {K("DOWNLOAD TEMPLATE")}. An <strong>.xlsx</strong> file is downloaded.</li>
<li>Open it in Excel, Google Sheets, Numbers or LibreOffice and fill it in (see below).</li>
<li>Save it as <strong>.xlsx</strong>. In Google Sheets: File → Download → Microsoft Excel.</li>
<li>In the app tap {K("IMPORT EXCEL")} and pick the file.</li>
</ol>
<p>The block is on the create-tournament screen and on the {K("TEAMS")} tab. If you already loaded teams, the template includes them so you can complete or fix them.</p>''')),
        text((
            '''<h3>Cómo es la plantilla</h3>
<table class="xl"><thead><tr><th>Hoja</th><th>Qué se completa</th></tr></thead><tbody>
<tr><td><b>INSTRUCCIONES</b></td><td>Nada: explica los pasos, los tipos de fixture y los colores.</td></tr>
<tr><td><b>COLORES</b></td><td>Nada: muestra los 24 colores, cada uno con su muestra pintada.</td></tr>
<tr><td><b>TORNEO</b></td><td><span class="cell">Nombre del torneo</span> y <span class="cell">Tipo de fixture</span> (lista: Todos contra todos / Eliminación simple).</td></tr>
<tr><td><b>EQUIPO 1 … EQUIPO 8</b></td><td>Una hoja por equipo: <span class="cell">Equipo</span> (nombre), <span class="cell">Color</span> (lista o un código como #1B47E2) y debajo los jugadores, uno por fila: <span class="cell">N.º camiseta</span> (opcional) y <span class="cell">Nombre y apellido</span>.</td></tr>
</tbody></table>
<ul>
<li>Completá solo las <strong>celdas amarillas</strong>; no cambies los títulos grises. A la derecha de cada una hay una indicación con una flecha (←) que dice qué poner, y al tocar la celda aparece un recuadro con la misma ayuda.</li>
<li><strong>El color se elige de una lista:</strong> tocá la celda <span class="cell">Color</span>, abrí la lista con la flecha ▼ y elegí. <strong>La celda se pinta del color elegido</strong>, así ves cuál es. También podés escribir un código como #1B47E2.</li>
<li><strong>¿Más de 8 equipos?</strong> Copiá una hoja de equipo: clic derecho en la pestaña → Mover o copiar → Crear una copia. Las hojas de equipo vacías se ignoran.</li>
<li>También sirve <strong>una sola hoja</strong> con columnas <span class="cell">Equipo</span> · <span class="cell">Número</span> · <span class="cell">Jugador</span> (por ejemplo, la que exporta un formulario).</li>
<li>Hasta 64 equipos y 60 jugadores por equipo.</li>
</ul>''',
            '''<h3>What the template looks like</h3>
<table class="xl"><thead><tr><th>Sheet</th><th>What you fill in</th></tr></thead><tbody>
<tr><td><b>INSTRUCTIONS</b></td><td>Nothing: it explains the steps, fixture types and colors.</td></tr>
<tr><td><b>COLORS</b></td><td>Nothing: it shows the 24 colors, each with a painted swatch.</td></tr>
<tr><td><b>TOURNAMENT</b></td><td><span class="cell">Tournament name</span> and <span class="cell">Fixture type</span> (list: Round robin / Knockout).</td></tr>
<tr><td><b>TEAM 1 … TEAM 8</b></td><td>One sheet per team: <span class="cell">Team</span> (name), <span class="cell">Color</span> (list or a code like #1B47E2) and below, the players, one per row: <span class="cell">Jersey number</span> (optional) and <span class="cell">Player full name</span>.</td></tr>
</tbody></table>
<ul>
<li>Fill in only the <strong>yellow cells</strong>; do not change the grey titles. To the right of each one there is a hint with an arrow (←) saying what to enter, and clicking the cell shows a small box with the same help.</li>
<li><strong>Pick the color from a list:</strong> click the <span class="cell">Color</span> cell, open the list with the ▼ arrow and choose. <strong>The cell turns the color you chose</strong>, so you can see it. You can also type a code like #1B47E2.</li>
<li><strong>More than 8 teams?</strong> Copy a team sheet: right-click the tab → Move or Copy → Create a copy. Empty team sheets are ignored.</li>
<li><strong>A single sheet</strong> with columns <span class="cell">Team</span> · <span class="cell">Number</span> · <span class="cell">Player</span> also works (for example, a form export).</li>
<li>Up to 64 teams and 60 players per team.</li>
</ul>''')),
        text((
            f'''<h3>Los 24 colores</h3><p>{SWATCHES_ES}</p>''',
            f'''<h3>The 24 colors</h3><p>{SWATCHES_EN}</p>''')),
        shot('14-importar-excel', ('Vista previa de la importación con la lista de equipos', 'Import preview with the list of teams'), ('Antes de importar', 'Before importing'), (
            f'''<h3>Revisar e importar</h3><p>Antes de cargar nada, la app muestra lo que encontró: equipos, cantidad de jugadores, el nombre y el tipo de fixture, y <strong>avisos</strong> si algo no cierra (un número sin nombre, un color desconocido, un equipo repetido).</p>
<ul><li>{K("CREAR TORNEO")} / {K("CREAR TORNEO NUEVO")}: arma un torneo con esos equipos.</li>
<li>{K("AGREGAR A …")}: suma los equipos al torneo abierto. Los que tienen el mismo nombre se actualizan; los jugadores con goles registrados no se quitan.</li></ul>''',
            f'''<h3>Review and import</h3><p>Before loading anything, the app shows what it found: teams, number of players, tournament name and fixture type, and <strong>warnings</strong> if something is off (a number without a name, an unknown color, a repeated team).</p>
<ul><li>{K("CREATE TOURNAMENT")} / {K("CREATE NEW TOURNAMENT")}: builds a tournament with those teams.</li>
<li>{K("ADD TO …")}: adds the teams to the open tournament. Teams with the same name are updated; players with recorded goals are not removed.</li></ul>''')),
    ]),
    ('pantalla', ('La pantalla del torneo', 'The tournament screen'), [
        shot('16-equipos', ('Pestaña EQUIPOS con las fichas de los equipos', 'TEAMS tab with the team cards'), ('Pestaña EQUIPOS', 'TEAMS tab'), (
            f'''<p>El torneo tiene cuatro pestañas:</p>
<dl>
<dt>{K("FIXTURE")}</dt><dd>El cuadro o las fechas, para jugar y cargar resultados.</dd>
<dt>{K("EQUIPOS")}</dt><dd>Los equipos y sus jugadores, {K("＋ AGREGAR EQUIPO")}, {K("▶ EMPEZAR PARTIDO DEL TORNEO")}, la carga desde Excel y el <strong>orden y siembra</strong>.</dd>
<dt>{K("TABLA")}</dt><dd>Posiciones, resultados, goleadores y pases.</dd>
<dt>{K("AJUSTES")}</dt><dd>Tiempos, puntos y desempates, archivo del torneo, cambiar nombre, eliminar y torneo nuevo.</dd>
</dl>
<p>Si tenés más de un torneo, arriba aparece <strong>Mis torneos</strong> para pasar de uno a otro.</p>''',
            f'''<p>The tournament has four tabs:</p>
<dl>
<dt>{K("FIXTURE")}</dt><dd>The bracket or the rounds, to play and enter results.</dd>
<dt>{K("TEAMS")}</dt><dd>Teams and their players, {K("＋ ADD TEAM")}, {K("▶ START TOURNAMENT MATCH")}, loading from Excel and the <strong>order and seeding</strong>.</dd>
<dt>{K("STANDINGS")}</dt><dd>Standings, results, scorers and assists.</dd>
<dt>{K("SETTINGS")}</dt><dd>Times, points and tiebreakers, tournament file, rename, delete and new tournament.</dd>
</dl>
<p>If you have more than one tournament, <strong>My tournaments</strong> appears at the top to switch between them.</p>''')),
        shot('17-ficha-equipo', ('Ficha de equipo con nombre, color y jugadores', 'Team card with name, color and players'), ('Ficha del equipo', 'Team card'), (
            f'''<h3>Cargar o corregir un equipo a mano</h3><ol>
<li>{K("＋ AGREGAR EQUIPO")}, o tocá un equipo para editarlo.</li>
<li>Nombre y color.</li>
<li>Jugadores: número (opcional) y nombre en cada fila. ¿Tenés la lista en un mensaje? Pegala en <strong>Pegar una lista de jugadores</strong>.</li>
<li>{K("GUARDAR EQUIPO")}.</li></ol>
<h3>Orden y siembra</h3><p>En {K("EQUIPOS")}, con ▲ ▼ ordenás los equipos. En eliminación, el orden define los cruces: el 1 juega con el último, y el 1 y el 2 solo se pueden cruzar en la final. Después de cambiarlo, en {K("FIXTURE")} tocá {K("REARMAR CRUCES PENDIENTES")}. {K("HISTORIAL")} muestra los partidos y goleadores de cada equipo.</p>''',
            f'''<h3>Adding or fixing a team by hand</h3><ol>
<li>{K("＋ ADD TEAM")}, or tap a team to edit it.</li>
<li>Name and color.</li>
<li>Players: number (optional) and name on each row. Have the list in a message? Paste it in <strong>Paste a list of players</strong>.</li>
<li>{K("SAVE TEAM")}.</li></ol>
<h3>Order and seeding</h3><p>In {K("TEAMS")}, use ▲ ▼ to order teams. In knockout the order sets the matchups: #1 plays the last one, and #1 and #2 can only meet in the final. After changing it, tap {K("REBUILD PENDING MATCHES")} in {K("FIXTURE")}. {K("HISTORY")} shows each team's games and scorers.</p>''')),
    ]),
    ('fixture', ('El fixture', 'The fixture'), [
        shot('15-fixture-tipos', ('Elegir el tipo de fixture y GENERAR FIXTURE', 'Choosing the fixture type and CREATE FIXTURE'), ('Elegir el tipo', 'Choosing the type'), (
            f'''<p>En la pestaña {K("FIXTURE")} elegís el tipo tocando una de las dos tarjetas:</p>
<ul>
<li><strong>Todos contra todos</strong> (liga): cada equipo juega una vez con cada uno. Gana el que suma más puntos.</li>
<li><strong>Eliminación</strong> (llaves): el que pierde queda afuera, hasta la final. Si los equipos no son 4, 8, 16…, algunos <strong>pasan directo</strong> a la ronda siguiente.</li>
</ul>
<p>Tocá {K("GENERAR FIXTURE")}. <strong>Mientras no haya partidos jugados podés cambiar el tipo cuando quieras</strong>, desde las mismas tarjetas: el fixture se rearma al instante. Con partidos jugados el tipo queda fijo y la app te explica por qué.</p>''',
            f'''<p>On the {K("FIXTURE")} tab you choose the type by tapping one of the two cards:</p>
<ul>
<li><strong>Round robin</strong> (league): every team plays each other once. Most points wins.</li>
<li><strong>Knockout</strong> (bracket): the loser is out, all the way to the final. If there are not 4, 8, 16… teams, some get a <strong>bye</strong> to the next round.</li>
</ul>
<p>Tap {K("CREATE FIXTURE")}. <strong>Until a match is played you can change the type whenever you want</strong> from the same cards: the fixture is rebuilt instantly. Once matches are played the type is locked and the app tells you why.</p>''')),
        shot('18-llaves', ('Cuadro de llaves en el teléfono', 'Bracket on the phone'), ('Eliminación en el teléfono', 'Knockout on the phone'), (
            f'''<h3>Eliminación: el cuadro de llaves</h3>
<p>Cada columna es una fase (cuartos, semifinal, final) y las líneas muestran por dónde avanza cada ganador. Arriba de la final está el <strong>campeón</strong>. En el teléfono el cuadro se desliza de costado con el dedo.</p>
<ul>
<li><strong>Verde</strong>: el equipo que ganó ese cruce; el que perdió queda gris.</li>
<li><span class="tag done">FINALIZADO</span> partido terminado · <span class="tag live">● EN JUEGO</span> se está jugando, con el marcador al momento · borde punteado: todavía no se sabe quién juega.</li>
<li>La barra de arriba dice cuántos partidos se jugaron y cuántos están en juego.</li>
</ul>''',
            f'''<h3>Knockout: the bracket</h3>
<p>Each column is a stage (quarterfinals, semifinal, final) and the lines show where each winner moves on. The <strong>champion</strong> sits above the final. On the phone, swipe the bracket sideways.</p>
<ul>
<li><strong>Green</strong>: the team that won that match; the loser turns grey.</li>
<li><span class="tag done">FINISHED</span> match over · <span class="tag live">● IN PLAY</span> being played, with the live score · dashed border: teams not known yet.</li>
<li>The bar at the top shows how many matches were played and how many are in play.</li>
</ul>''')),
        wide('27-llaves-ancho', ('Cuadro de llaves espejado en una pantalla ancha', 'Mirrored bracket on a wide screen'), ('En tablet o computadora el cuadro se abre a los dos lados, con la final en el centro.', 'On a tablet or computer the bracket opens to both sides, with the final in the middle.')),
        shot('29-liga', ('Fechas del todos contra todos', 'Round robin rounds'), ('Todos contra todos: fechas', 'Round robin: rounds'), (
            f'''<h3>Todos contra todos: fechas y tabla cruzada</h3>
<p>Cada columna es una <strong>fecha</strong>, con sus partidos y cuántos se jugaron (por ejemplo 3/3). Si los equipos son impares, en cada fecha uno queda <strong>libre</strong>. Las fechas se deslizan de costado.</p>''',
            f'''<h3>Round robin: rounds and results grid</h3>
<p>Each column is a <strong>round</strong>, with its matches and how many were played (for example 3/3). With an odd number of teams, one has a <strong>bye</strong> each round. Swipe the rounds sideways.</p>''')),
        shot('30-tabla-cruzada', ('Tabla cruzada con ganados, empates y perdidos', 'Results grid with wins, draws and losses'), ('Tabla cruzada', 'Results grid'), (
            '''<p>La <strong>tabla cruzada</strong> muestra cada resultado desde el equipo de la fila: <span class="tag w">verde</span> ganó, <span class="tag l">rojo</span> perdió, <span class="tag d">gris</span> empató, · por jugar. Tocá una celda para abrir ese partido.</p>''',
            '''<p>The <strong>results grid</strong> shows each result from the row team's point of view: <span class="tag w">green</span> won, <span class="tag l">red</span> lost, <span class="tag d">grey</span> draw, · to play. Tap a cell to open that match.</p>''')),
    ]),
    ('resultados', ('Jugar y cargar resultados', 'Playing and entering results'), [
        shot('19-partido-fixture', ('Partido del fixture con JUGAR ESTE PARTIDO y cargar el resultado', 'Fixture match with PLAY THIS MATCH and enter the result'), ('Tocar un partido', 'Tapping a match'), (
            f'''<p><strong>Tocá cualquier partido del fixture.</strong> Según cómo esté, podés:</p>
<ul>
<li>{K("▶ JUGAR ESTE PARTIDO")}: abre el tablero con los dos equipos ya elegidos y el partido queda ligado a ese cruce.</li>
<li><strong>¿Ya se jugó?</strong> Si se jugó sin la app (o en un papel), escribí el resultado y {K("GUARDAR RESULTADO")}. Cuenta en el fixture y en la tabla.</li>
</ul>
<p>También podés empezar un partido desde {K("EQUIPOS")} → {K("▶ EMPEZAR PARTIDO DEL TORNEO")} eligiendo los dos equipos.</p>''',
            f'''<p><strong>Tap any match in the fixture.</strong> Depending on its state you can:</p>
<ul>
<li>{K("▶ PLAY THIS MATCH")}: opens the board with both teams already picked, and the game is linked to that matchup.</li>
<li><strong>Already played?</strong> If it was played without the app (or on paper), type the result and {K("SAVE RESULT")}. It counts in the fixture and standings.</li>
</ul>
<p>You can also start a game from {K("TEAMS")} → {K("▶ START TOURNAMENT MATCH")} by picking both teams.</p>''')),
        shot('21-gol-torneo', ('Detalle del gol con la lista de jugadores del equipo', 'Goal detail with the team player list'), ('Gol en un partido del torneo', 'Goal in a tournament game'), (
            f'''<h3>Durante el partido del torneo</h3><p>El tablero funciona igual. En cada gol elegís de la lista quién dio el <strong>pase</strong> y quién hizo el <strong>gol</strong>: así se arman los goleadores. Al terminar, {K("MENU")} → {K("GUARDAR")}.</p>''',
            f'''<h3>During a tournament game</h3><p>The board works the same. For each goal pick from the list who made the <strong>assist</strong> and who scored the <strong>goal</strong>: that builds the scorers table. When it ends, {K("MENU")} → {K("SAVE")}.</p>''')),
        shot('23-en-juego', ('Fixture con un partido EN JUEGO y su marcador', 'Fixture with a match IN PLAY and its score'), ('Partido en juego en el fixture', 'Match in play on the fixture'), (
            f'''<p>Tocá {K("VER TORNEO")} (arriba) en cualquier momento: el partido que se está jugando aparece <span class="tag live">● EN JUEGO</span> con el marcador al instante, también si se juega en otro teléfono de la misma cuenta.</p>''',
            f'''<p>Tap {K("VIEW TOURNAMENT")} (top) at any time: the match being played shows <span class="tag live">● IN PLAY</span> with the live score, even if it is played on another phone with the same account.</p>''')),
        shot('20-corregir', ('Corregir el resultado de un partido terminado', 'Correcting the result of a finished match'), ('Corregir un resultado', 'Correcting a result'), (
            f'''<h3>Corregir un resultado</h3><p>¿Quedó mal un resultado o no se sincronizó bien? Tocá el partido, cambiá los números y {K("GUARDAR CORRECCIÓN")}. El fixture, el ganador que avanza y la tabla se actualizan solos, y la corrección queda anotada en la planilla del partido ({K("VER PLANILLA")}).</p>
<div class="warn">En eliminación no puede haber empate. Si un partido terminó empatado, aparece {K("JUGAR DESEMPATE")}, o corregí el resultado.</div>''',
            f'''<h3>Correcting a result</h3><p>Is a result wrong or did it not sync properly? Tap the match, change the numbers and {K("SAVE CORRECTION")}. The fixture, the winner moving on and the standings update by themselves, and the correction is logged in the game scoresheet ({K("VIEW SCORESHEET")}).</p>
<div class="warn">Knockout matches cannot end in a draw. If one did, {K("PLAY TIEBREAK")} appears, or correct the result.</div>''')),
    ]),
    ('varios', ('Varios dispositivos a la vez', 'Several devices at once'), [
        shot('34-pregunta-entrada', ('Pregunta al entrar: MODO PARTIDO o MODO TORNEO, con el torneo en marcha', 'Question on entering: MATCH MODE or TOURNAMENT MODE, with the tournament under way'), ('Al entrar con un torneo en marcha', 'Entering with a tournament under way'), (
            f'''<p>En un torneo grande hay varias canchas y varias personas. <strong>Entrá con la misma cuenta en cada teléfono o tablet</strong>: cada dispositivo puede llevar <strong>su propio partido</strong> al mismo tiempo, y todos ven el avance de los demás.</p>
<p>Si ya hay un torneo en marcha, al entrar la app pregunta cómo seguir:</p>
<ul>
<li>{K("MODO PARTIDO")}: un partido suelto, como siempre.</li>
<li>{K("MODO TORNEO")}: vas al torneo y elegís uno de sus partidos.</li>
</ul>''',
            f'''<p>A big tournament has several fields and several people. <strong>Sign in with the same account on every phone or tablet</strong>: each device can run <strong>its own match</strong> at the same time, and everyone sees how the others are going.</p>
<p>If a tournament is already under way, the app asks how to continue when you sign in:</p>
<ul>
<li>{K("MATCH MODE")}: a single match, as always.</li>
<li>{K("TOURNAMENT MODE")}: you go to the tournament and pick one of its matches.</li>
</ul>''')),
        shot('35-elegir-torneo', ('Lista de torneos con equipos, partidos en juego y jugados', 'List of tournaments with teams, matches in play and played'), ('Elegir el torneo', 'Choosing the tournament'), (
            f'''<p>Con {K("MODO TORNEO")} primero <strong>elegís el torneo</strong> (cada uno muestra cuántos equipos tiene, cuántos partidos se están jugando y cuántos terminaron). Después ves el fixture con todos los partidos y tocás el que querés controlar.</p>''',
            f'''<p>With {K("TOURNAMENT MODE")} you first <strong>choose the tournament</strong> (each shows how many teams it has, how many matches are in play and how many are finished). Then you see the fixture with all the matches and tap the one you want to control.</p>''')),
        shot('36-unirse-partido', ('Partido que se juega en otro dispositivo, con CONTROLAR TAMBIÉN DESDE ACÁ y TOMAR EL CONTROL', 'Match played on another device, with CONTROL IT FROM HERE TOO and TAKE CONTROL'), ('Un partido que ya se está controlando', 'A match that is already being controlled'), (
            f'''<p>Si tocás un partido <span class="tag live">● EN JUEGO</span> que lleva otro dispositivo, elegís:</p>
<ul>
<li>{K("CONTROLAR TAMBIÉN DESDE ACÁ")}: <strong>los dos dispositivos operan el mismo partido</strong>. Por ejemplo, uno lleva el reloj y otro anota los goles. Los goles, llamados y time outs de ambos se <strong>juntan en pocos segundos</strong>, y el reloj queda como lo dejó <strong>quien lo tocó último</strong>. Arriba aparece <b>⇄</b> mientras el partido es compartido.</li>
<li>{K("TOMAR EL CONTROL EN ESTE DISPOSITIVO")}: <strong>el control pasa a este dispositivo</strong> y el otro deja de controlar el partido (le avisa). Usalo si el otro se apagó o se quedó sin batería. El reloj queda pausado en el último evento: revisalo antes de seguir.</li>
</ul>
<div class="warn"><strong>Ojo:</strong> si dos personas anotan el mismo gol, se cuentan dos. Repártanse el trabajo; para sacar uno repetido usá {K("DESHACER GOL")} o el botón − del marcador.</div>
<div class="tip"><strong>Sin internet:</strong> cada dispositivo sigue anotando y, cuando vuelve la señal, se juntan los datos de los dos sin perder nada. Cuando alguien guarda la planilla, el partido queda cerrado en todos.</div>''',
            f'''<p>If you tap an <span class="tag live">● IN PLAY</span> match that another device is running, you choose:</p>
<ul>
<li>{K("CONTROL IT FROM HERE TOO")}: <strong>both devices run the same match</strong>. For example, one runs the clock and another records goals. The goals, calls and time outs from both are <strong>combined within seconds</strong>, and the clock stays as left by <strong>whoever touched it last</strong>. A <b>⇄</b> shows at the top while the match is shared.</li>
<li>{K("TAKE CONTROL ON THIS DEVICE")}: <strong>control moves to this device</strong> and the other one stops controlling the match (it is told). Use it if the other one switched off or ran out of battery. The clock is paused at the last event: check it before going on.</li>
</ul>
<div class="warn"><strong>Careful:</strong> if two people record the same goal, it counts twice. Split the work; to remove a repeated one use {K("UNDO GOAL")} or the − button on the score.</div>
<div class="tip"><strong>No internet:</strong> each device keeps recording and, when signal returns, the data from both is combined without losing anything. When someone saves the scoresheet, the match is closed on all devices.</div>''')),
    ]),
    ('tabla', ('Tabla y estadísticas', 'Standings and stats'), [
        shot('31-posiciones', ('Tabla de posiciones y resultados', 'Standings and results'), ('Pestaña TABLA', 'STANDINGS tab'), (
            f'''<ul>
<li><strong>Posiciones</strong>: <strong>PJ</strong> partidos jugados, <strong>DG</strong> diferencia de goles, <strong>PTS</strong> puntos. Debajo de cada equipo: <strong>G</strong> ganados, <strong>E</strong> empatados, <strong>P</strong> perdidos y goles a favor y en contra.</li>
<li><strong>Resultados</strong>: los últimos partidos guardados.</li>
<li><strong>Goleadores y pases</strong>: cuenta los goles donde se eligió al jugador de la lista.</li>
</ul>
<p>Los puntos (por defecto victoria 3, empate 1, derrota 0) y el orden de los desempates (diferencia de gol, goles a favor, cabeza a cabeza) se cambian en {K("AJUSTES")}.</p>''',
            f'''<ul>
<li><strong>Standings</strong>: <strong>P</strong> played, <strong>GD</strong> goal difference, <strong>PTS</strong> points. Under each team: <strong>W</strong> won, <strong>D</strong> drawn, <strong>L</strong> lost and goals for and against.</li>
<li><strong>Results</strong>: the latest saved games.</li>
<li><strong>Scorers and assists</strong>: counts goals where the player was picked from the list.</li>
</ul>
<p>Points (by default win 3, draw 1, loss 0) and the tiebreaker order (goal difference, goals for, head to head) are changed in {K("SETTINGS")}.</p>''')),
    ]),
    ('vivo', ('Compartir el fixture en vivo', 'Share the fixture live'), [
        shot('24-compartir', ('Sección Compartir en vivo con el link', 'Share live section with the link'), ('Compartir en vivo', 'Share live'), (
            f'''<p>Para que familias, equipos o cualquiera en otro lugar siga el torneo <strong>en tiempo real</strong>:</p>
<ol>
<li>Iniciá sesión (hace falta cuenta).</li>
<li>En {K("FIXTURE")}, abajo, tocá {K("COMPARTIR FIXTURE EN VIVO")}.</li>
<li>Aparece el link: {K("COPIAR")}, {K("ENVIAR POR WHATSAPP")} o {K("ABRIR")}.</li>
</ol>
<p>El link tiene este formato: <code>iona.ar/ultimateclock/vivo.html?u=<b>usuario</b>&amp;t=<b>torneo</b></code>.</p>
<ul>
<li>Muestra los partidos en juego con reloj y marcador, el fixture con los logos, la tabla y un <strong>feed en vivo</strong> que va contando los goles (con quién hizo el gol y quién dio el pase), el medio tiempo, los time outs y las incidencias.</li>
<li>Al tocar un partido o un equipo se abren sus <strong>estadísticas</strong>: goles, goleadores, asistencias, time outs y llamados. <strong>Se publican los nombres de goleadores y asistentes</strong>, pero no la lista completa de jugadores, y <strong>nadie puede cambiar nada</strong>.</li>
<li>Se actualiza solo cada pocos segundos; no hace falta recargar.</li>
<li>{K("DEJAR DE COMPARTIR")} apaga el link. Si lo volvés a compartir, es el mismo link.</li>
</ul>''',
            f'''<p>So families, teams or anyone elsewhere can follow the tournament <strong>in real time</strong>:</p>
<ol>
<li>Sign in (an account is required).</li>
<li>In {K("FIXTURE")}, at the bottom, tap {K("SHARE LIVE FIXTURE")}.</li>
<li>The link appears: {K("COPY")}, {K("SEND BY WHATSAPP")} or {K("OPEN")}.</li>
</ol>
<p>The link looks like this: <code>iona.ar/ultimateclock/vivo.html?u=<b>username</b>&amp;t=<b>tournament</b></code>.</p>
<ul>
<li>It shows matches in play with clock and score, the fixture with logos, the standings and a <strong>live feed</strong> that tells goals (with who scored and who assisted), half time, time outs and incidents.</li>
<li>Tapping a match or a team opens its <strong>stats</strong>: goals, scorers, assists, time outs and calls. <strong>Scorer and assist names are published</strong>, but not the full player list, and <strong>nobody can change anything</strong>.</li>
<li>It updates by itself every few seconds; no need to reload.</li>
<li>{K("STOP SHARING")} turns the link off. If you share again, it is the same link.</li>
</ul>''')),
        shot('25-vivo', ('Página pública en vivo en el teléfono', 'Public live page on the phone'), ('Lo que ve quien abre el link', 'What people see when they open the link'), (
            '''<p>Quien abre el link ve el nombre del torneo, la etiqueta <span class="tag live">● EN VIVO</span>, los partidos en juego, el fixture, el feed y, en ligas, la tabla de posiciones. Abajo dice hace cuánto se actualizó.</p>
<p><strong>Logo del equipo:</strong> en la ficha del equipo, {K("SUBIR LOGO")}. También se puede insertar una imagen en la celda LOGO de la hoja de cada equipo de la plantilla de Excel y, al importar, el logo se carga solo. Se achica a 128 px y aparece en el tablero, el fixture y este link.</p>''',
            '''<p>Whoever opens the link sees the tournament name, the <span class="tag live">● LIVE</span> label, the matches in play, the fixture, the feed and, in leagues, the standings. At the bottom it says how long ago it was updated.</p>
<p><strong>Team logo:</strong> in the team sheet, {K("UPLOAD LOGO")}. You can also insert an image in the LOGO cell of each team sheet in the Excel template and the logo loads by itself on import. It is resized to 128 px and shows on the board, the fixture and this link.</p>''')),
        wide('26-vivo-ancho', ('Página en vivo en una pantalla grande', 'Live page on a large screen'), ('En una computadora o un televisor se ve el cuadro completo: ideal para proyectarlo en la sede.', 'On a computer or a TV the whole bracket fits: great to project at the venue.')),
    ]),
    ('ajustes', ('Ajustes, archivo y varias canchas', 'Settings, file and several fields'), [
        shot('32-ajustes', ('Pestaña AJUSTES con tiempos y puntos', 'SETTINGS tab with times and points'), ('Pestaña AJUSTES', 'SETTINGS tab'), (
            f'''<dl>
<dt>Tiempos del torneo</dt><dd>Todos los partidos del torneo usan este perfil (WFDF, USA Ultimate o uno propio con {K("＋ NUEVO PERFIL DE TIEMPOS")}).</dd>
<dt>Puntos y desempates</dt><dd>Cuántos puntos da ganar, empatar y perder, y en qué orden se desempata. {K("GUARDAR REGLAS")}.</dd>
</dl>''',
            f'''<dl>
<dt>Tournament times</dt><dd>Every game in the tournament uses this profile (WFDF, USA Ultimate or your own with {K("＋ NEW TIME PROFILE")}).</dd>
<dt>Points and tiebreakers</dt><dd>How many points a win, draw and loss give, and the tiebreaker order. {K("SAVE RULES")}.</dd>
</dl>''')),
        shot('33-archivo', ('Archivo del torneo: exportar, CSV, Excel e importar', 'Tournament file: export, CSV, Excel and import'), ('Archivo del torneo', 'Tournament file'), (
            f'''<h3>Archivo del torneo</h3><ul>
<li>{K("EXPORTAR TORNEO")}: un archivo <strong>.json</strong> con equipos, jugadores, fixture y partidos guardados. Sirve de copia o para pasarlo a otro teléfono.</li>
<li>{K("CSV")}: cada jugador con su equipo, goles y pases, para Excel.</li>
<li>{K("EXCEL")}: la plantilla con los equipos actuales.</li>
<li>{K("IMPORTAR")}: carga un .json de torneo o un Excel.</li>
<li>{K("CAMBIAR NOMBRE")}, {K("ELIMINAR TORNEO")} y {K("＋ NUEVO TORNEO")}.</li></ul>''',
            f'''<h3>Tournament file</h3><ul>
<li>{K("EXPORT TOURNAMENT")}: a <strong>.json</strong> file with teams, players, fixture and saved games. Use it as a backup or to move it to another phone.</li>
<li>{K("CSV")}: each player with team, goals and assists, for Excel.</li>
<li>{K("EXCEL")}: the template with the current teams.</li>
<li>{K("IMPORT")}: loads a tournament .json or an Excel file.</li>
<li>{K("RENAME")}, {K("DELETE TOURNAMENT")} and {K("＋ NEW TOURNAMENT")}.</li></ul>''')),
        text((
            '''<h3>Varias canchas al mismo tiempo</h3>
<p><strong>Con cuenta</strong> (lo más simple): cada mesa entra con la misma cuenta. Cada partido que se juega se ve en todos los teléfonos y en el link en vivo, sin pasar archivos.</p>
<p><strong>Sin cuenta</strong>: la organización arma el torneo, lo exporta y manda el archivo a cada mesa. Cada mesa lo importa, juega y guarda sus partidos. Al final, cada mesa exporta y manda su archivo, y la organización los importa uno por uno: los partidos se juntan sin repetirse.</p>
<div class="warn">Al importar un torneo que ya tenías, los equipos y jugadores pasan a ser los del archivo. Los partidos guardados nunca se pierden.</div>''',
            '''<h3>Several fields at the same time</h3>
<p><strong>With an account</strong> (simplest): every table signs in with the same account. Every game played shows on every phone and on the live link, with no files to pass around.</p>
<p><strong>Without an account</strong>: the organizers build the tournament, export it and send the file to each table. Each table imports it, plays and saves its games. At the end, each table exports and sends its file, and the organizers import them one by one: games are merged without duplicates.</p>
<div class="warn">When importing a tournament you already had, teams and players become the ones in the file. Saved games are never lost.</div>''')),
    ]),
    ('problemas', ('Si algo no funciona', 'Troubleshooting'), [
        text((
            f'''<dl>
<dt>No suena.</dt><dd>Subí el volumen, sacá el modo silencio y tocá {K("MENU")} → {K("ACTIVAR SONIDO")} y {K("PROBAR SONIDO")}. En iPhone, el botón lateral de silencio también apaga la app.</dd>
<dt>Las flechas de arriba están en rojo.</dt><dd>Hay cambios por subir o no hay internet. La app sigue funcionando; sube todo al volver la señal. Si dice que hay un conflicto, elegí qué dispositivo es el oficial.</dd>
<dt>No puedo cambiar el tipo de fixture.</dt><dd>Ya hay partidos jugados o en juego. Si necesitás otro formato, creá un torneo nuevo con los mismos equipos (podés usar la plantilla de Excel).</dd>
<dt>"No pude leer ese Excel".</dt><dd>Guardalo como <strong>.xlsx</strong> (no .xls, .csv ni .numbers) y usá la plantilla.</dd>
<dt>El Excel dice que no encontró equipos.</dt><dd>Completá en cada hoja de equipo la celda <span class="cell">Equipo</span> y los jugadores debajo de <span class="cell">Nombre y apellido</span>, sin cambiar los títulos.</dd>
<dt>El link en vivo dice que no existe.</dt><dd>Se dejó de compartir o el torneo se borró. Volvé a tocar {K("COMPARTIR FIXTURE EN VIVO")}.</dd>
<dt>No aparecen mis partidos o torneos.</dt><dd>Sin cuenta, los datos son de cada teléfono y navegador: importá el archivo exportado. Con cuenta, revisá que entraste con el mismo usuario.</dd>
<dt>Dice "Partido abierto en otra pestaña".</dt><dd>La app está abierta dos veces. Cerrá una y recargá.</dd>
</dl>''',
            f'''<dl>
<dt>No sound.</dt><dd>Turn the volume up, disable silent mode and tap {K("MENU")} → {K("TURN SOUND ON")} and {K("TEST SOUND")}. On iPhone, the side silent switch also mutes the app.</dd>
<dt>The arrows at the top are red.</dt><dd>Changes are waiting or there is no internet. The app keeps working and uploads everything when signal returns. If it reports a conflict, choose which device is official.</dd>
<dt>I cannot change the fixture type.</dt><dd>Matches were already played or are in play. For another format, create a new tournament with the same teams (you can use the Excel template).</dd>
<dt>"Could not read that Excel file".</dt><dd>Save it as <strong>.xlsx</strong> (not .xls, .csv or .numbers) and use the template.</dd>
<dt>The Excel import found no teams.</dt><dd>On each team sheet fill in the <span class="cell">Team</span> cell and the players below <span class="cell">Player full name</span>, without changing the titles.</dd>
<dt>The live link says it does not exist.</dt><dd>Sharing was turned off or the tournament was deleted. Tap {K("SHARE LIVE FIXTURE")} again.</dd>
<dt>My games or tournaments are missing.</dt><dd>Without an account, data belongs to each phone and browser: import the exported file. With an account, check you signed in with the same username.</dd>
<dt>It says "Game open in another tab".</dt><dd>The app is open twice. Close one and reload.</dd>
</dl>''')),
    ]),
    ('glosario', ('Palabras clave', 'Key words'), [
        text((
            '''<dl>
<dt>Pull</dt><dd>El lanzamiento que inicia cada punto.</dd>
<dt>Llamado</dt><dd>Cuando un jugador para el juego por una falta, violación u otra situación.</dd>
<dt>Time out</dt><dd>Pausa que pide un equipo; hay un cupo por tiempo.</dd>
<dt>Time cap</dt><dd>Tiempo máximo del partido.</dd>
<dt>Perfil de tiempos</dt><dd>Las duraciones: partido, primer tiempo, descanso, time out y llamados.</dd>
<dt>Planilla</dt><dd>El registro de todo lo que pasó en el partido.</dd>
<dt>Fixture</dt><dd>El calendario de cruces del torneo.</dd>
<dt>Siembra</dt><dd>El orden de los equipos que define los cruces en eliminación.</dd>
<dt>Libre / pasa directo</dt><dd>Cuando a un equipo no le toca rival en esa ronda.</dd>
<dt>Sincronizar</dt><dd>Subir y bajar los cambios del servidor para que todos los dispositivos vean lo mismo.</dd>
</dl>''',
            '''<dl>
<dt>Pull</dt><dd>The throw that starts each point.</dd>
<dt>Call</dt><dd>When a player stops play for a foul, violation or other situation.</dd>
<dt>Time out</dt><dd>A break asked for by a team; there is an allowance per half.</dd>
<dt>Time cap</dt><dd>Maximum game time.</dd>
<dt>Time profile</dt><dd>The durations: game, first half, halftime, time out and calls.</dd>
<dt>Scoresheet</dt><dd>The record of everything that happened in the game.</dd>
<dt>Fixture</dt><dd>The tournament schedule of matchups.</dd>
<dt>Seeding</dt><dd>The team order that sets the knockout matchups.</dd>
<dt>Bye</dt><dd>When a team has no opponent in that round.</dd>
<dt>Sync</dt><dd>Uploading and downloading changes so every device sees the same thing.</dd>
</dl>''')),
    ]),
]

CSS = '''*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.55 var(--font-body)}
a{color:var(--accent)}
.bar{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:8px;padding:10px 16px;background:var(--panel);border-bottom:var(--rule)}
.bar .back{display:inline-flex;align-items:center;min-height:var(--touch);padding:0 16px;border-radius:var(--radius-sm);background:var(--accent);color:var(--accent-ink);font-weight:800;letter-spacing:.04em;text-decoration:none}
.bar strong{flex:1;font-size:15px;letter-spacing:.06em;text-transform:uppercase}
.lang{display:flex;gap:4px}
.lang button{min-height:40px;min-width:48px;border:2px solid var(--line);border-radius:var(--radius-sm);background:var(--panel);color:var(--ink);font:800 14px var(--font-body);cursor:pointer}
.lang button[aria-pressed="true"]{background:var(--ink);color:var(--panel);border-color:var(--ink)}
main{max-width:920px;margin:0 auto;padding:16px}
article[hidden]{display:none}
h1{font-size:32px;line-height:1.15;margin:8px 0 4px}
h2{font-size:23px;line-height:1.2;margin:0 0 10px;text-transform:uppercase;letter-spacing:.03em}
h2 .n{display:inline-grid;place-items:center;width:34px;height:34px;margin-right:8px;border-radius:50%;background:var(--accent);color:var(--accent-ink);font-size:17px;vertical-align:middle}
h3{font-size:18px;margin:16px 0 4px}
.shot>div>h3:first-child{margin-top:0}
.lead{color:var(--muted);margin:0 0 16px}
section{background:var(--panel);border-radius:var(--radius);padding:18px 16px;margin:0 0 14px;box-shadow:var(--shadow);scroll-margin-top:72px}
.toc{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px;padding:0;margin:0;list-style:none;counter-reset:toc}
.toc a{display:flex;align-items:center;gap:10px;min-height:var(--touch);padding:8px 12px;border-radius:var(--radius-sm);background:var(--bg-2);color:var(--ink);font-weight:700;text-decoration:none}
.toc a::before{counter-increment:toc;content:counter(toc);display:inline-grid;place-items:center;flex:none;width:28px;height:28px;border-radius:50%;background:var(--accent);color:var(--accent-ink);font-size:14px}
.shot{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;align-items:start;margin:14px 0}
.shot+.shot{padding-top:14px;border-top:var(--rule)}
@media (min-width:680px){.shot{grid-template-columns:250px minmax(0,1fr)}}
figure{margin:0}
figure img{display:block;width:100%;max-width:270px;height:auto;margin:0 auto;border-radius:18px;border:1px solid var(--line);background:var(--bg-2)}
figure.wide{margin:14px 0}
figure.wide img{max-width:100%;border-radius:12px}
figcaption{font-size:13px;color:var(--muted);text-align:center;margin-top:6px}
ol,ul{padding-left:22px;margin:6px 0}
li{margin:4px 0}
.tip,.warn{border-radius:var(--radius-sm);padding:10px 12px;margin:12px 0;font-size:16px}
.tip{background:color-mix(in srgb,var(--signal) 12%,var(--panel));border-left:4px solid var(--signal)}
.warn{background:color-mix(in srgb,var(--warning) 14%,var(--panel));border-left:4px solid var(--warning)}
.k{display:inline-block;padding:0 6px;border-radius:6px;background:var(--bg-2);border:1px solid var(--line);font-weight:800;font-size:.84em;letter-spacing:.03em}
.ver{margin:-6px 0 14px;font-size:.85em;opacity:.7}
.sw{display:inline-flex;align-items:center;gap:6px;margin:3px 4px 3px 0;padding:2px 10px 2px 3px;border:1px solid var(--line,#c4c9d2);border-radius:999px;font-size:.9em;white-space:nowrap}
.sw i{width:18px;height:18px;border-radius:50%;border:1px solid #0004;display:inline-block}
.cell{display:inline-block;padding:0 6px;border-radius:4px;background:#fff7d6;color:#0f1115;border:1px solid #c4c9d2;font-size:.9em}
.tag{display:inline-block;padding:1px 8px;border-radius:99px;font:800 12px/1.6 var(--font-body);letter-spacing:.05em}
.tag.done{background:var(--ink);color:var(--panel)}.tag.live{background:var(--danger);color:#fff}
.tag.w{background:color-mix(in srgb,var(--signal) 22%,var(--panel))}.tag.l{background:color-mix(in srgb,var(--danger) 16%,var(--panel))}.tag.d{background:color-mix(in srgb,var(--muted) 22%,var(--panel))}
table.cmp,table.xl{width:100%;border-collapse:collapse;margin:10px 0;font-size:15px}
.cmp th,.cmp td,.xl th,.xl td{padding:8px;border:var(--rule);text-align:left;vertical-align:top}
.cmp thead th,.xl thead th{background:var(--ink);color:var(--panel)}
.cmp tbody th{background:var(--bg-2)}
@media (max-width:480px){table.cmp,table.xl{font-size:13.5px}.cmp th,.cmp td,.xl th,.xl td{padding:6px 5px;overflow-wrap:break-word}.xl td:first-child{width:28%;font-size:12px}}
code{font:600 .9em var(--font-mono);background:var(--bg-2);padding:1px 4px;border-radius:4px;word-break:break-all}
dl{margin:0}dt{font-weight:800;margin-top:10px}dd{margin:2px 0 0}
.top{display:inline-block;margin-top:10px;font-size:14px}
footer{max-width:920px;margin:0 auto;padding:8px 16px 32px;color:var(--muted);font-size:14px;text-align:center}'''

INTRO = {
    'es': ('Manual de Ultimate Clock', 'Cómo llevar un partido o un torneo de Ultimate desde el celular: los dos modos, el tablero, la planilla, el fixture, la carga desde Excel, los resultados y el link en vivo. Seguí los pasos; no hace falta saber de tecnología.', 'Índice', '↑ Volver al índice'),
    'en': ('Ultimate Clock manual', 'How to run an Ultimate game or tournament from your phone: both modes, the board, the scoresheet, the fixture, loading from Excel, results and the live link. Follow the steps; no tech skills needed.', 'Contents', '↑ Back to contents'),
}


def article(lang):
    i = 0 if lang == 'es' else 1
    title, lead, toc_title, back = INTRO[lang]
    out = [f'<article lang="{lang}" data-lang="{lang}">', f'  <h1 id="{lang}-top">{title}</h1>', f'  <p class="lead">{lead}</p>', f'  <p class="ver" data-version="{VERSION}">{"Manual de la versión" if lang == "es" else "Manual for version"} v{VERSION}</p>',
           f'  <section aria-labelledby="{lang}-indice">', f'    <h2 id="{lang}-indice">{toc_title}</h2>', '    <ol class="toc">']
    for sid, names, _ in SECTIONS:
        out.append(f'      <li><a href="#{lang}-{sid}">{names[i]}</a></li>')
    out += ['    </ol>', '  </section>']
    for n, (sid, names, blocks) in enumerate(SECTIONS, 1):
        out.append(f'  <section id="{lang}-{sid}">')
        out.append(f'    <h2><span class="n">{n}</span>{names[i]}</h2>')
        for b in blocks:
            if b[0] == 'text':
                out.append('    ' + b[1][i])
            elif b[0] == 'wide':
                _, img, alt, cap = b
                out.append(f'    <figure class="wide"><img src="img/{lang}-{img}.webp" alt="{html.escape(alt[i])}" width="1280" height="800" loading="lazy"><figcaption>{cap[i]}</figcaption></figure>')
            else:
                _, img, alt, cap, body = b
                out.append(f'    <div class="shot">\n      <figure><img src="img/{lang}-{img}.webp" alt="{html.escape(alt[i])}" width="390" height="844" loading="lazy"><figcaption>{cap[i]}</figcaption></figure>\n      <div>\n{body[i]}\n      </div>\n    </div>')
        out.append(f'    <a class="top" href="#{lang}-top">{back}</a>')
        out.append('  </section>')
    out.append('</article>')
    return '\n'.join(out)


PAGE = '''<!doctype html>
<html lang="es" data-theme="light">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>Manual de usuario · Ultimate Clock</title>
    <meta name="description" content="Manual de usuario de Ultimate Clock: modo partido y modo torneo, tablero, planilla, fixture, plantilla de Excel, resultados y fixture en vivo. User manual in English.">
    <link rel="canonical" href="https://iona.ar/ultimateclock/manual/">
    <meta property="og:title" content="Manual de usuario · Ultimate Clock">
    <meta property="og:description" content="Cómo llevar partidos y torneos de Ultimate Frisbee con Ultimate Clock, paso a paso y con imágenes.">
    <meta property="og:image" content="https://iona.ar/ultimateclock/og-image.png">
    <link rel="icon" href="../icon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="../tokens.css">
    <style>
%CSS%
    </style>
  </head>
  <body>
    <div class="bar">
      <a class="back" href="../" id="backLink">← APP</a>
      <strong id="barTitle">Manual de usuario</strong>
      <div class="lang" role="group" aria-label="Idioma / Language">
        <button type="button" data-lang="es" aria-pressed="true">ES</button>
        <button type="button" data-lang="en" aria-pressed="false">EN</button>
      </div>
    </div>
    <main>
<!-- Generado por scripts/generar-manual.py: no editar a mano. -->
%ES%

%EN%
    </main>
    <footer>Ultimate Clock · <a href="https://iona.ar/">IONA.AR</a> · Ultimate Frisbee Mendoza</footer>
    <script src="manual.js"></script>
  </body>
</html>
'''

MANUAL_JS = '''/* Idioma y tema: los de la app (si hay), ?lang= en la dirección o el del navegador. */
(function () {
  var settings = {};
  try { settings = (JSON.parse(localStorage.getItem('ultimate-clock-v2') || 'null') || {}).settings || {}; } catch (e) {}
  var query = new URLSearchParams(location.search).get('lang');
  var lang = query === 'en' || query === 'es' ? query : settings.lang === 'en' || settings.lang === 'es' ? settings.lang : /^en/i.test(navigator.language || '') ? 'en' : 'es';
  if (settings.theme === 'dark') document.documentElement.dataset.theme = 'dark';
  function apply(next) {
    lang = next;
    document.documentElement.lang = lang;
    document.querySelectorAll('article[data-lang]').forEach(function (a) { a.hidden = a.dataset.lang !== lang; });
    document.querySelectorAll('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    document.getElementById('barTitle').textContent = lang === 'en' ? 'User manual' : 'Manual de usuario';
    document.getElementById('backLink').href = lang === 'en' ? '../?lang=en' : '../';
    document.title = (lang === 'en' ? 'User manual' : 'Manual de usuario') + ' · Ultimate Clock';
  }
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { apply(b.dataset.lang); history.replaceState(null, '', '?lang=' + lang + location.hash); });
  });
  apply(lang);
})();
'''

if __name__ == '__main__':
    page = PAGE.replace('%CSS%', CSS).replace('%ES%', article('es')).replace('%EN%', article('en'))
    with open(os.path.join(ROOT, 'manual', 'index.html'), 'w', encoding='utf-8') as f:
        f.write(page)
    # El sitio no permite scripts dentro del HTML (CSP script-src 'self'): el cambio de idioma va en un archivo aparte.
    with open(os.path.join(ROOT, 'manual', 'manual.js'), 'w', encoding='utf-8') as f:
        f.write(MANUAL_JS)
    print('manual/index.html:', len(page), 'bytes')
