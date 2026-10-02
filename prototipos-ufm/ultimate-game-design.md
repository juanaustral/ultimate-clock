# Punto por punto — diseño del juego

## Revisión 2 · 2026-09-22

La segunda versión reemplaza la interfaz de tarjetas blandas por una pizarra táctica de partido: retícula visible, tipografía condensada, tinta verde, papel sin estucar, amarillo de ataque y rojo de alerta. La imagen editorial funciona como portada; cada situación de reglas se explica con un SVG propio y accesible, para que el gráfico corresponda a la pregunta.

- Partida completa con tres duraciones: corto (8 jugadas), medio (15) y largo (25).
- Nuevo modo **DIAGRAMA DE JUEGO**: ocho nodos secuenciales desde el pull al punto siguiente. Cada respuesta correcta desbloquea el nodo posterior; hay tres vidas.
- Traducción revisada como guía interpretativa en español: conserva *pull*, *check*, *stall*, *pivot* y *mark* como términos habituales y los define en contexto.
- Se profundizaron referencias a §§9–21, especialmente pull fuera, puesta en juego, gol, stall, marking violations, continuación, travel, pick, faltas, seguridad y observers.
- `ultimate-game-flow.workflow.json` es la especificación Archify del recorrido; validación showcase: 9/9, cero warnings. `ultimate-game-flow.html` es su export independiente.

**Estado:** implementado, verificado y publicado en el VPS con HTTPS
**Fecha:** 22 de septiembre de 2026  
**Público inferido:** personas que están empezando a jugar o a comprender Ultimate; explicaciones simples primero, precisión reglamentaria disponible en cada caso.  
**Reglamento de referencia:** USA Ultimate, *Official Rules of Ultimate 2026–2027*. El juego enseña con paráfrasis en español y referencias por sección; no reemplaza el texto oficial ni las reglas particulares de cada torneo.

## 1. Propósito y promesa

Aprender el reglamento tomando decisiones en jugadas reconocibles: observar qué ocurrió, elegir qué hacer y entender por qué la regla produce ese resultado. La unidad de juego no es una pregunta de memoria aislada, sino una situación en cancha.

**Promesa:** «Leé la jugada. Elegí qué pasa. Entendé la regla.»  
**Nombre provisional:** Punto por punto.  
**Acción central:** resolver la situación reglamentaria que aparece en pantalla.

## 2. Principios pedagógicos y decisiones de diseño

1. **Recuperación activa:** cada escena pide decidir antes de mostrar la explicación; el jugador intenta recuperar la regla, no solo volver a leerla.
2. **Transferencia:** las reglas reaparecen en situaciones y formulaciones distintas, incluyendo consecuencias sobre la posesión, el espacio y la continuación del juego.
3. **Corrección inmediata y específica:** después de cada decisión se muestra el resultado, la pista decisiva, una explicación breve y el número exacto de regla. Equivocarse no oculta la explicación.
4. **Repaso distribuido:** las reglas falladas vuelven a una cola de repaso en la misma sesión y se priorizan en una visita posterior; el progreso se guarda localmente.
5. **Autonomía con progresión:** cinco capítulos ordenan el aprendizaje. Se puede continuar el recorrido o volver a un capítulo para repasar.
6. **Puntos como señal, no como pedagogía:** la puntuación y el progreso hacen visible el avance, pero dominar una regla se demuestra contestando situaciones nuevas.
7. **Ritmo sin cronómetro:** no hay premio por responder rápido. El stall aparece como contenido de una jugada, no como presión temporal sobre quien aprende.

La evidencia consultada respalda practicar la recuperación con feedback para favorecer retención y transferencia; un estudio reciente de gamificación encontró que puntos y barras de progreso mejoraban aspectos de motivación declarada, pero no el recuerdo posterior. Por eso las recompensas acompañan la práctica en lugar de reemplazarla.

## 3. Bucle de juego

`Elegir capítulo → observar jugada → decidir → recibir feedback y cita → sumar puntos o perder una vida → avanzar o repasar → ver progreso`

### Reglas de la partida

- **Vidas:** hasta 3 al iniciar cada partida. Cada respuesta incorrecta quita exactamente 1. No se conceden vidas extra durante esa partida.
- **Puntos:** +100 por respuesta correcta. Sin bonus de velocidad ni multiplicadores que oculten la comprensión.
- **Error:** muestra cuál era la decisión correcta, qué detalle de la escena importaba y la sección USAU aplicable. Luego permite seguir mientras queden vidas.
- **Cero vidas:** termina la partida y muestra resumen de puntos, capítulos y reglas para repasar. El botón «Jugar de nuevo» inicia otra partida con 3 vidas.
- **Reinicio manual:** puede reiniciarse desde el menú. El reinicio confirma la acción, pone la partida actual en cero y conserva récord, partidas terminadas y reglas ya vistas.
- **Persistencia:** partida en curso, mejor puntaje, avance y cola de repaso en `localStorage`. Sin cuenta, servidor ni transmisión de datos.
- **Acceso de consulta:** reglas, glosario breve y fuente oficial disponibles en cualquier momento; abrir la consulta no daña una vida ni altera la partida.

## 4. Recorrido de aprendizaje

| Capítulo | Contenido | Resultado de aprendizaje |
|---|---|---|
| 1. Antes del pull | §§1–9: objetivo, Spirit, definiciones, cancha, equipo, estructura, timeouts, sustituciones y pull | Reconocer cómo empieza el punto y qué pueden hacer los equipos antes del pull. |
| 2. El disco en juego | §§10–14: reinicios, límites, end zones, anotación y turnovers | Seguir el estado del disco y determinar posesión, punto de puesta en juego o gol. |
| 3. Pivote y marca | §§15–19: stall, marking violations, llamadas, travels y picks | Distinguir infracciones que detienen el juego de las que no, y anticipar la resolución. |
| 4. Jugar con cuidado | §§20–21: fouls, dangerous play y positioning | Priorizar seguridad, identificar contacto relevante y comprender derechos de espacio. |
| 5. Spirit y variantes | §§22–23; anexos A–G: observers, etiquette, cancha, mixed, misconduct, señales, youth, beach y Ultimate 4’s | Aplicar el marco de auto-arbitraje y reconocer qué depende de una variante o del evento. |

**Cobertura objetivo:** al menos una situación verificable por cada §1–23, más casos para reglas de alto valor de decisión (pull, turnover, scoring, stall, resolución de llamadas, end-zone possession y seguridad). Los anexos se presentan como consulta y como escenarios solo cuando la adaptación se puede explicar sin confundirla con el juego estándar 7v7.

### Dificultad gradual

- **Lectura inicial:** un hecho y dos o tres opciones claras; práctica de fundamentos.
- **Lectura de jugada:** dos hechos relevantes y consecuencias sobre posesión o reinicio.
- **Decisión avanzada:** timing, efecto sobre la jugada, llamada contestada/retractada o interacción de reglas.

La dificultad crece por complejidad reglamentaria, no por menor tiempo ni por opciones tramposas. Cada alternativa incorrecta debe representar un error de interpretación plausible.

## 5. Pantallas y estados

1. **Inicio / continuar:** título, promesa, partida guardada si existe, tres vidas visibles y acción principal «Jugar».
2. **Mapa de capítulos:** cinco estaciones con estado bloqueado, disponible o completado; puntaje acumulado y porcentaje de situaciones resueltas.
3. **Situación de juego:** capítulo y progreso; campo ilustrado con posiciones, disco y trayectoria; texto de situación; pregunta y respuestas accesibles; botón para confirmar decisión.
4. **Feedback correcto:** confirmación visual y textual, puntos ganados, explicación breve, cita y botón «Siguiente jugada».
5. **Feedback incorrecto:** una vida menos, respuesta correcta y explicación sin tono punitivo; la regla se agenda para repaso.
6. **Pausa / regla:** glosario, regla citada y enlace a USA Ultimate; volver a la escena conserva el estado.
7. **Progreso:** puntaje récord, capítulos, reglas dominadas/en repaso y botón de reinicio.
8. **Fin de partida:** resumen, lista de reglas por repasar y reinicio con tres vidas.

## 6. Dirección visual y prototipo

- **Estética:** interfaz deportiva de aprendizaje, cálida y precisa; evitar apariencia infantil o dashboard genérico.
- **Paleta base:** crema, tinta oscura, verde de cancha; pera para acción principal, celeste para navegación/info y coral para error/alerta. El color nunca es la única señal de estado.
- **Tipografía:** sans redondeada legible para titulares y lectura, mono solo para marcadores breves de estado o sección.
- **Composición desktop:** navegación compacta; recorrido de capítulo; zona de cancha como foco; panel de decisión a su lado; puntaje, vidas y progreso siempre visibles.
- **Composición mobile:** el campo precede a la pregunta; controles grandes, opciones apiladas y puntaje/vidas en una barra fija no obstructiva.
- **Gráficos:** cancha vectorial con líneas, end zones, jugadores codificados por equipo, cono de trayectoria y disco; dibujo informativo, no decoración de fondo.
- **Movimiento con propósito:** trayectoria del disco al abrir la jugada, progreso que se completa al acertar, contador de puntos que sube, vida que se retira al fallar, pequeña celebración de acierto y transiciones de capítulo. Sin sonido automático.
- **Accesibilidad:** teclado, focus visible, lectores de pantalla, contraste AA, texto además de color, objetivos táctiles amplios y `prefers-reduced-motion`.

## 7. Modelo de datos local

- `run`: capítulo, posición actual, vidas (0–3), puntaje y respuestas de la partida.
- `profile`: récord, total de partidas, capítulos alcanzados, reglas dominadas y última actividad.
- `reviewQueue`: ids de reglas falladas y próxima oportunidad de repaso.
- `settings`: preferencia de movimiento y sonido (desactivado por defecto, si se añade).

No se recopilan nombres, correo, ubicación ni analítica externa. Un botón de reinicio explica que el récord se conserva antes de borrar el estado de partida.

## 8. Aceptación para la implementación

- Una respuesta correcta suma puntos, una incorrecta resta exactamente una vida; nunca hay más de 3 vidas.
- Al llegar a cero aparece el resumen y se puede reiniciar con 3 vidas.
- El progreso y la partida sobreviven a una recarga; reiniciar conserva récord y métricas históricas.
- Toda pregunta contiene decisión inequívoca en el contexto indicado, explicación y referencia de regla.
- La consulta reglamentaria no cambia vidas/puntaje.
- Las cinco familias cubren §§1–23 y distinguen reglas estándar de anexos/variantes.
- La partida se puede completar con teclado y en viewport de 320 px sin scroll horizontal; el movimiento respeta reducción de movimiento.
- El juego funciona offline después de cargarlo y no requiere dependencias externas para su lógica.

## 9. Fuentes consultadas

### Reglamento

- USA Ultimate, [Official Rules of Ultimate 2026–2027](https://usaultimate.org/rules/), §§1–23 y anexos A–G. Consultado el 21-09-2026. Fuente normativa principal.
- USA Ultimate, [Rules Resources](https://usaultimate.org/rules/resources/), edición PDF 2026–2027, cambios sustantivos y recursos de apoyo.

### Aprendizaje y gamificación

- Karpicke, J. D. & Blunt, J. R. (2011). “Retrieval Practice Produces More Learning than Elaborative Studying with Concept Mapping.” *Science*, 331(6018), 772–775. [DOI: 10.1126/science.1199327](https://doi.org/10.1126/science.1199327). Práctica de recuperación favoreció aprendizaje significativo y preguntas inferenciales en el material estudiado.
- Butler, A. C. (2010). “Repeated Testing Produces Superior Transfer of Learning Relative to Repeated Studying.” *Journal of Experimental Psychology: Learning, Memory, and Cognition*, 36(5), 1118–1133. [DOI: 10.1037/a0019902](https://doi.org/10.1037/a0019902). En cuatro experimentos, tests repetidos mejoraron retención/transferencia respecto del repaso repetido; el feedback ayudó a corregir errores.
- Ruitenburg, K. et al. (2020). “Implementing Distributed Practice in Statistics Courses: Benefits for Retention and Transfer.” *Journal of Applied Research in Memory and Cognition*, 9(4), 532–541. [DOI: 10.1016/j.jarmac.2020.08.014](https://doi.org/10.1016/j.jarmac.2020.08.014). En una implementación curricular, el grupo que distribuyó la práctica obtuvo mejores resultados de retención y transferencia cinco semanas después que el grupo que la concentró; el cumplimiento importó.
- van den Broek, G. S. E. et al. (2026). “Gamified feedback in adaptive retrieval practice: Points and progress-bars enhance motivation but not learning.” *Computers in Human Behavior*, 177, 108862. [DOI: 10.1016/j.chb.2025.108862](https://doi.org/10.1016/j.chb.2025.108862). En un experimento online con 166 adultos, puntos/barras elevaron varias medidas auto-reportadas de motivación, sin mejora detectada en recuerdo a 2–3 días.
- To, J. et al. (2024). “Effects of self-explaining feedback on learning from problem-solving errors.” *Contemporary Educational Psychology*, 79, 102326. [DOI: 10.1016/j.cedpsych.2024.102326](https://doi.org/10.1016/j.cedpsych.2024.102326). En tareas de física, explicaciones guiadas de errores favorecieron corregirlos y el transfer cercano en determinadas condiciones.

**Límite de generalización:** los estudios citados no prueban la eficacia de este juego ni estudian Ultimate; orientan decisiones pedagógicas. La eficacia del producto requerirá pruebas con aprendices, observando decisiones nuevas y recuerdo diferido, no solo puntaje o satisfacción.

## 10. Estado de entrega

- **Implementado:** aplicación autocontenida en `ultimate-game.html`, `ultimate-game.css`, `tokens.css` y `ultimate-game.js`; 25 situaciones en cinco capítulos, repaso por error, vidas, puntaje, persistencia local, búsqueda y consulta de 30 tarjetas (secciones 1–23 y anexos A–G).
- **Verificado:** recorrido completo; respuestas correctas e incorrectas, pérdida de vidas, cierre de partida, récord conservado, reinicio, progreso y búsqueda. Sin errores de consola ni desborde horizontal en 320, 375, 414, 768, 1024, 1280, 1440 y 1920 px. Contraste de texto conforme a WCAG AA en las vistas revisadas y controles reducidos para `prefers-reduced-motion`.
- **Preparado en el VPS:** `ultimate-game.html`, `ultimate-game.css`, `ultimate-game.js` y `tokens.css` están en `/opt/ultimate-game`, una carpeta aislada. Las huellas SHA-256 locales y remotas coinciden; Caddy y DNS siguen sin cambios.
- **Publicado:** la versión servida está en `https://iona.ar/ultimate/`, dentro de una subcarpeta nueva del root estático existente. No fue necesario cambiar DNS, abrir puertos ni modificar Caddy.
- **Verificado en producción:** HTTPS devolvió `200`, el HTML servido contiene la app, las huellas SHA-256 coinciden y el navegador confirmó inicio de partida, respuesta correcta (+100), feedback con cita USAU y respuesta incorrecta con pérdida de una vida (`3/3` → `2/3`) y repaso. La consola del navegador no registró errores.
- **Pendiente:** pruebas con usuarios reales y seguimiento de recuerdo diferido; la app mantiene el progreso localmente y no incorpora analítica externa.
