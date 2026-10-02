/* Ultimate Clock · versión y novedades. Cada publicación sube VERSION (igual al número de caché de sw.js)
   y agrega arriba una entrada breve en español e inglés. */
(function (root) {
  'use strict';
  const VERSION = 29;
  const ENTRIES = [
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
