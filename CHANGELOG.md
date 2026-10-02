# Historial de cambios

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
