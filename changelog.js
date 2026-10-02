/* Ultimate Clock · versión y novedades. Cada publicación sube VERSION (igual al número de caché de sw.js)
   y agrega arriba una entrada breve en español e inglés. */
(function (root) {
  'use strict';
  const VERSION = 34;
  const ENTRIES = [
    {version:34,date:'2026-10-02',es:['En el inicio solo se marca el perfil elegido.','Al guardar los tiempos en Configuración se vuelve al tablero.'],en:['Only the chosen profile is highlighted at the start.','Saving times in Settings returns to the board.']},
    {version:33,date:'2026-10-02',es:['El inicio ahora tiene tres pantallas: equipos, perfil de tiempo y tiempos personalizados.','Los tiempos personalizados se guardan como perfil y quedan en la lista.'],en:['The start screen now has three steps: teams, time profile and custom times.','Custom times are saved as a profile and stay in the list.']},
    {version:32,date:'2026-10-02',es:['Corregidos los títulos de equipo en el cuadro de equipos.'],en:['Fixed the team titles in the teams box.']},
    {version:31,date:'2026-10-02',es:['Al anotar un gol se abre el cuadro para escribir quién hizo el gol y el pase.','Cada partido nuevo pide el nombre y el color de los dos equipos.'],en:['Scoring a goal opens a box to type the scorer and the assist.','Every new game asks for both teams’ names and colors.']},
    {version:30,date:'2026-10-02',es:['El pull dura 90 s y avisa con 1, 2 y 3 silbatos a los 45, 60 y 75 s, y con 4 al final.','Marcas de los avisos en la línea del pull.'],en:['The pull lasts 90 s and signals with 1, 2 and 3 whistles at 45, 60 and 75 s, and 4 at the end.','Warning marks on the pull countdown line.']},
    {version:29,date:'2026-10-02',es:['Cada tipo de llamado tiene su emoji en WhatsApp.','En horizontal, Pull y Time Out van bajo el reloj y cada equipo tiene su llamado debajo.','Número de versión y novedades en el pie.'],en:['Each call type has its own emoji in WhatsApp.','In landscape, Pull and Time Out sit under the clock and each team has its call below.','Version number and what’s new in the footer.']},
    {version:28,date:'2026-10-02',es:['Bienvenida al abrir la app y aviso de cómo se guardan los datos.','Enviar la planilla por WhatsApp.'],en:['Welcome screen and a note on how data is stored.','Send the scoresheet by WhatsApp.']},
    {version:27,date:'2026-10-02',es:['«Llamado» en toda la app.'],en:['Consistent wording for calls.']},
    {version:26,date:'2026-10-02',es:['Tarjetas más prolijas en pantallas chicas.'],en:['Tidier cards on small screens.']},
    {version:25,date:'2026-10-02',es:['App en inglés con selector de idioma.'],en:['English version with a language switch.']},
    {version:24,date:'2026-10-02',es:['Mejor vista al compartir el enlace e instalar la app.'],en:['Better previews when sharing the link and installing the app.']},
    {version:23,date:'2026-10-02',es:['Botón para apoyar el proyecto.'],en:['Button to support the project.']},
    {date:'2026-10-02',es:['Tablero nuevo, sin scroll en celular y tablet.','Gol con un toque, pantalla encendida y correcciones.','Exportar planillas en PDF y CSV.'],en:['New board with no scrolling on phone and tablet.','One-tap goals, screen kept on and fixes.','Export scoresheets as PDF and CSV.']},
    {date:'2026-09-30',es:['Perfiles de tiempo, tutorial, pantalla completa y alarmas.'],en:['Time profiles, tutorial, full screen and alarms.']},
    {date:'2026-09-29',es:['Llamados por equipo con categorías y Time Out unificado.'],en:['Per-team calls with categories and a single Time Out.']},
    {date:'2026-09-27',es:['Primera versión: reloj, goles, pull, llamados, time outs y planilla.'],en:['First version: clock, goals, pull, calls, time outs and scoresheet.']}
  ];
  const api={VERSION,ENTRIES};
  if(typeof module!=='undefined')module.exports=api;else root.UCChangelog=api;
})(typeof globalThis!=='undefined'?globalThis:this);
