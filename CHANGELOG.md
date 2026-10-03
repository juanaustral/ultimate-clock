# Historial de cambios

## 2026-10-03 · v39 · Ficha de equipo más intuitiva

- Cada equipo del torneo se completa en una sola ficha: nombre, color y una lista de 14 casilleros (número opcional + nombre). AGREGAR JUGADOR suma una fila; AGREGAR EQUIPO al final guarda la ficha y vuelve a la lista, desde donde se agrega el siguiente.
- Tocar un equipo de la lista abre la misma ficha para editarlo; ✕ vacía una fila (al guardar, ese jugador se quita).
- Enter pasa al nombre y a la fila siguiente (crea una al final). Pegar una lista completa las filas libres.
- Validaciones al guardar: falta el nombre del equipo, número sin nombre y número repetido, con foco en el campo.
- Al crear el torneo se abre directamente la ficha del primer equipo. El borrador de la ficha se conserva al cambiar idioma o tema.

## 2026-10-03 · v38 · Modo torneo

- Nuevo MENU → MODO TORNEO: se crea un torneo con sus equipos y, en la ficha de cada uno, los jugadores (nombre obligatorio, número de camiseta opcional). Se agregan de a uno, editando o pegando una lista ("7 Ana", "Ana 7" o solo "Ana").
- Al empezar un partido (y desde el editor de equipo) cada equipo se puede elegir de la lista del torneo: carga nombre y color y vincula los jugadores.
- En el cuadro de gol, pase y anotador se eligen de la lista del equipo; "Otro" permite escribir un nombre a mano. Sin torneo cargado, el cuadro sigue siendo de texto libre.
- Estadísticas de goles y pases por jugador a partir de las planillas guardadas.
- Archivo de torneo `.json` (equipos, jugadores y partidos guardados) para exportar e importar entre dispositivos, y CSV de jugadores con sus goles y pases.
- Todo se guarda en el navegador (`ultimate-clock-v2`, campo `tournament`); no hay cuentas ni servidor. Lo premium queda para más adelante.
- Lógica en `tournament.js`, con `tests/tournament.test.cjs`. Caché offline v38.

## 2026-10-02 · v32

- Los títulos EQUIPO 1 y EQUIPO 2 del cuadro de equipos ya no se superponen con el borde (se reemplazó `legend` por una etiqueta común).

## 2026-10-02 · v31 · Gol con pase y equipos al empezar

- Cada gol abre el cuadro de pase y gol; ahí también están DESHACER GOL y OMITIR.
- Al empezar un partido (después de elegir el perfil, en ＋ NUEVO PARTIDO y en Guardar y crear nuevo) se piden nombre y color de los dos equipos en un solo cuadro, con los anteriores ya cargados.

## 2026-10-02 · v30 · Pull de 90 s con avisos

- El pull dura siempre 90 s en todos los perfiles (se quitó del formulario de perfiles).
- Avisos visuales y sonoros: 1 silbato a los 45 s, 2 a los 60 s, 3 a los 75 s y 4 al final. La tarjeta muestra 1º, 2º y 3º AVISO y el teléfono vibra la misma cantidad de veces.
- Marcas de 45, 60 y 75 s sobre la línea de cuenta regresiva del pull.

## 2026-10-02 · v29 · Emojis por categoría, orden horizontal y versión

- WhatsApp: cada categoría de llamado e incidencia tiene su emoji (🤼 Falta, ⛔ Violación, 🚧 Pick, 👣 Travel, ⏳ Stall, ❓ Gol discutido, 🩹 Lesión, 🤝 Tiempo de Espíritu, 🧘 TFR, 🟨 PMF, 📝 Otra).
- Solo en horizontal: Pull y Time Out debajo del reloj; a la derecha, cada equipo con su Llamado debajo.
- Número de versión en el pie (`changelog.js`, igual al número de caché); al tocarlo se abre Novedades con un resumen corto por versión.
- Para publicar: subir `VERSION` en `changelog.js`, la caché de `sw.js` y agregar arriba una entrada en español e inglés (un test lo verifica).

## 2026-10-02 · Bienvenida, aviso de datos y WhatsApp

- El pop-up de inicio da la bienvenida y explica la app en una línea, con logo, antes de elegir el perfil de tiempo.
- Pie con aviso de cómo se guardan perfiles y planillas (solo en este navegador) y cómo no perderlos; el mismo aviso está en Info.
- La app le pide al navegador guardado persistente para que no borre los datos por falta de espacio.
- ENVIAR POR WHATSAPP en Exportar: abre WhatsApp con un mensaje con emojis, negritas y cursivas: resultado, ganador, resumen por equipo y momentos con el marcador parcial.
- Caché v28.

## 2026-10-02 · Rediseño "Línea de banda"

- Reloj del partido primero y arriba; Llamadas debajo del reloj y Pull y Time Out al final.
- Botones de Time Out con INICIAR (EN CURSO o SIN CUPO según el caso) y nombre del equipo más grande en las Llamadas.
- VISITÁ MI SITIO WEB lleva a juanmartinezgarcia.com; Ultimate Frisbee Mendoza en violeta en Info y en el pie. El enlace de donación sigue pendiente.

- Logo nuevo (disco y cronómetro) en encabezado, menú, Info e ícono.
- PLANILLA reúne el partido actual, los botones EXPORTAR y las planillas guardadas; se quitó Historial.
- Menú con ＋ NUEVO PARTIDO primero y en color, y MODO CLARO / MODO OSCURO.
- Info con VISITÁ MI SITIO WEB y DONÁ PARA APOYAR EL PROYECTO.
- Archivos exportados con nombre legible: `planilla-equipo-a-vs-equipo-b-AAAA-MM-DD`.
- Tablero nuevo que entra sin scroll ni recortes en teléfono y tablet, vertical y horizontal: equipos lado a lado y cuentas secundarias en una grilla 2×2 (en horizontal, todo en dos filas).
- Las cuentas se llenan de color mientras corren; los números escalan con su tarjeta.
- Descanso dentro de la tarjeta del reloj, Llamada con categorías a la vista y aviso de gol arriba.
- CSS reescrito: de 50 KB a 29 KB. Detalle en `docs/DISENO-2026-10.md`.

## 2026-10-02 · Revisión de código y UX

- Gol con un toque: el aviso ofrece PASE Y GOL y DESHACER.
- Pantalla encendida mientras corre un reloj, vibración al finalizar y aviso visual en los últimos 10 s.
- Menú agrupado (Partido, Sonido y pantalla, Ayuda) con REINICIAR CONTADORES separado.
- Corregido: cuenta congelada en 00:01 al terminar, pérdida del partido en Guardar y crear nuevo, avisos repetidos con dos pestañas, selector de perfil al recargar a mitad de partido y ajuste −1 sin tiempo de juego.
- Más liviano: sin guardado continuo, CSS sin reglas muertas, `tokens.css` sin `@import` y service worker que abre desde la caché (v20).
- Detalle en `docs/REVISION-2026-10-02.md`.

## 2026-10-02

- Se adoptó la licencia PolyForm Noncommercial 1.0.0 (`LICENSE.md`).
- Las planillas guardadas en Historial se exportan también como **PDF** (imprimible, A4, varias páginas) y **CSV** (un evento por fila, apto para Excel y Google Sheets), junto al JSON existente. Sin dependencias nuevas.
- Las llamadas por equipo aparecen como **Llamada** y el nombre del equipo en la planilla, el PDF y el CSV, en lugar del identificador interno.

## 2026-09-30

- Se cambiaron los subtítulos de los marcadores a **GOLES**.
- Se igualó la altura de Equipo 1, reloj principal y Equipo 2 en orientación vertical.
- Se agregaron perfiles oficiales, perfiles personalizados y tutorial guiado.
- Se unificó el menú y se añadió pantalla completa.
- Se implementaron cinco alarmas agudas por finalización y PROBAR SONIDO.
- Se quitaron la franja roja del header y el texto COMUNIDAD del pie.
- DONÁ pasó a **APOYÁ ESTE PROYECTO**.

## 2026-09-29

- Se separaron las llamadas por equipo y se unificó Time Out en un widget.
- Se agregó registro de equipo y categoría en la planilla.
- Se implementaron ocho categorías de llamada.
- Pull y Llamada reinician sin autoarranque.
- Se ajustó la distribución responsive y la paleta por equipo.

## 2026-09-27

- Se rehízo la interfaz desde el prototipo UX/UI aportado.
- Se incorporaron reloj de partido, goles, Pull, llamadas, Time Out, descanso, planilla e historial.
- Se agregaron temas claro/oscuro, almacenamiento local, service worker y pruebas automáticas.
