# Historial de cambios

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
