# ULTIMATE CLOCK — prompt para Google Stitch

Derivado del plan `PLAN (1)-2.md`. Esta versión reescribe el bloque «Texto para Google Stitch»
para que Stitch entienda **qué pantallas generar** y, sobre todo, que **toda la interfaz debe
entrar en una sola pantalla** (sin scroll) tanto en teléfono 9:16 (1080 × 1920) como en tablet.

---

## Cómo usarlo en Stitch

1. **Dispositivo primero.** Stitch genera por tipo de dispositivo. Empezá con el prompt maestro en
   modo **Mobile** (encuadre 1080 × 1920, 9:16). Cuando la pantalla principal esté resuelta,
   generá la variante **Tablet** (1536 × 2048, 3:4) usando el bloque *Encuadre tablet* del final.
2. **Un objetivo por prompt.** El prompt maestro pide solo la **pantalla principal jugable**
   (header + tablero + 4 cronómetros). Las pantallas secundarias (configuración, temas, historial,
   planilla, modales) se piden después con los prompts 2–10.
3. **Si Stitch recorta o agrega scroll**, repetí la instrucción de encuadre como frase final del
   prompt: *«Todo debe verse completo en 1080 × 1920 sin desplazamiento»*.
4. **Estilo antes que contenido.** Si el resultado sale genérico, reenviá solo el bloque
   *Dirección visual* y pedí que reestilice la pantalla ya generada.

---

## PROMPT MAESTRO (pantalla principal — Mobile 1080 × 1920)

```text
Diseñá la pantalla principal de una app web llamada «ULTIMATE CLOCK», un cronómetro de
instrumento para dirigir partidos de Ultimate Frisbee desde la sideline.

CONTRATO DE ENCUADRE — obligatorio, es lo más importante del pedido:
- Toda la interfaz debe entrar COMPLETA en una sola pantalla, sin scroll vertical ni horizontal.
- Encuadre de referencia: teléfono vertical 1080 × 1920 px, relación 9:16.
- Máxima prioridad: la pantalla debe verse entera, sin recortes y sin desplazamiento.
- Resolvelo con una grilla de altura fija que ocupe el 100 % de la altura de la pantalla
  (100dvh): header arriba, tablero principal al medio, fila de cronómetros operativos abajo,
  línea de estado al pie. Cada fila recibe una proporción fija de la altura total.
- Usá tipografía y espaciados relativos (clamp, %, dvh) para que todo escale al encuadre.
- Nada secundario en esta pantalla: configuración, temas, historial, planilla y modales van en
  pantallas aparte, nunca comprimidos dentro de la vista principal.
- Todos los botones con área táctil mínima de 44 × 44 px, aunque la pantalla sea compacta.

Dirección visual:
- Instrumento retro deportivo. Inspiración en despertadores digitales de los 80 con display de
  siete segmentos.
- Números gruesos estilo LED, etiquetas en tipografía monoespaciada, títulos en condensada
  (Barlow Condensed / DM Mono o equivalentes).
- Retícula técnica visible, bordes rectos o radios mínimos, marcos metálicos planos.
- Paleta: verde de cancha, negro, crema, ámbar, verde fosforescente, blanco.
- Sin degradados decorativos, sin tarjetas blandas genéricas, sin sombras pesadas, sin estética
  de dashboard corporativo ni de app financiera.
- El color nunca comunica solo: cada estado lleva además texto, icono o cambio de forma.
- Debajo de cada display hay una línea de estado luminosa: verde corriendo, ámbar pausado,
  rojo límite superado.

Estructura de la pantalla principal (todo dentro del encuadre, de arriba hacia abajo):

1) HEADER — una sola franja horizontal fina:
   - A la izquierda: logo circular de disco volador y el texto «ULTIMATE CLOCK».
   - A la derecha: selector de perfil visual (nombre del modo activo), rueda de configuración,
     botón «R» de reset, botón de guardar con icono de disquete, icono de información.
   - En teléfono los controles secundarios (R, guardar, información) se agrupan detrás de un
     botón de menú de acciones para no achicar los blancos táctiles.

2) TABLERO PRINCIPAL — fila en tres columnas, la más alta de la pantalla:
   - EQUIPO 1 y EQUIPO 2 a los lados: nombre editable arriba, fondo con el color del equipo,
     puntaje enorme en display de siete segmentos, botones táctiles «+» y «−», marca de
     identidad del equipo (trama o borde además del color).
   - RELOJ DE PARTIDO al centro: tiempo transcurrido en siete segmentos como elemento
     dominante; debajo, tiempo restante total y tiempo restante hasta el half-time cap;
     estado textual visible («Preparado», «Corriendo», «Pausado», «Half-time cap»,
     «Time cap», «Finalizado»); rueda de configuración.

3) CRONÓMETROS OPERATIVOS — fila en tres columnas:
   - PULL «Inicio de punto»: cuenta regresiva grande, secuencia visible 45 s / 60 s / 75 s,
     fase actual, próximo límite destacado, estado «Corriendo» o «Pausado», rueda.
   - LLAMADA «Resolución de llamada»: tipo de llamada seleccionado (falta, violación, pick,
     travel, stall, gol discutido, técnica, otra), cuenta regresiva e hitos visibles 15 s, 45 s
     y 60 s, estado textual, rueda.
   - TIME-OUT: dos botones grandes «TIME-OUT EQUIPO 1» y «TIME-OUT EQUIPO 2», cada uno con el
     color de su equipo más su nombre escrito; muestra equipo que pidió el time-out, duración
     transcurrida o restante, usos usados y disponibles por equipo, avisos y rueda.

Estados y alertas a diseñar:
- Cada cronómetro puede verse corriendo, pausado, superado o completado.
- Límite superado: flash fuerte en el panel, borde y texto «LÍMITE SUPERADO».
- Tiempo cumplido: flash más intenso y texto «COMPLETADO».
- Variante accesible sin animaciones agresivas (reducción de movimiento): reemplazar el flash
  por un estado fijo de alto contraste.
- Aviso inicial de activación de audio antes de empezar el partido.

El resultado debe parecer una herramienta deportiva real, resistente y precisa, pensada para
leerse bajo sol intenso, y debe verse COMPLETA y sin scroll en 1080 × 1920.
```

---

## ENCUADRE TABLET (variante del prompt maestro)

Agregá esto al final del prompt maestro cuando generes la versión Tablet:

```text
Adaptá la misma pantalla a tablet vertical 1536 × 2048 px (relación 3:4), también completa y
sin scroll. Mantené las mismas proporciones de filas (header / tablero / cronómetros / línea de
estado). En tablet el tablero principal usa tres columnas con el reloj de partido más ancho, los
paneles de equipo más grandes y más aire interno, y la fila de cronómetros operativos mantiene
tres columnas alineadas con el tablero. Los displays de siete segmentos y los botones crecen en
proporción al ancho disponible. Mismos colores, misma retícula, misma jerarquía: solo cambia la
densidad, nunca la estructura. Si el encuadre también se usa en horizontal 4:3, el tablero pasa a
ocupar el ancho completo y los tres cronómetros se ubican en una banda inferior de una sola fila.
```

---

## PROMPTS SECUNDARIOS (pantallas y modales)

### 2 — Configuración
```text
Pantalla de configuración de «ULTIMATE CLOCK», encuadre 1080 × 1920, sin scroll. Selector de
reglamento: «WFDF 2025–2028», «USA Ultimate 2026–2027», «Personalizado». Lista de perfiles
visuales con vista previa en miniatura, botón «Nuevo modo», formulario para nombrar el modo,
personalización de colores y de los valores de cada cronómetro (duración total, half-time cap,
time cap, descanso, pull 45/60/75 s, llamada 15/45/60 s, time-outs por equipo). Estado
«Personalizado» visible cuando se modificó al menos un valor. Aviso: «Los cambios se guardan
automáticamente en este dispositivo». Misma estética de instrumento: monoespaciada para datos,
condensada para títulos, controles grandes, sin degradados.
```

### 3 — Perfiles visuales (menú)
```text
Pantalla/menú de perfiles visuales de «ULTIMATE CLOCK» mostrando las cinco variantes lado a
lado como miniaturas del mismo tablero: 1) Claro (crema, tinta verde oscura, amarillo);
2) Oscuro (negro, blanco, verde fosforescente); 3) Sol (fondo blanco, negro, verde intenso);
4) Ámbar alto contraste (negro, blanco, ámbar); 5) Cian alto contraste (azul muy oscuro, blanco,
cian brillante). Marcar cuál está activo. Botón «Nuevo modo» al pie. Indicar el contraste de
texto de cada perfil (cumple WCAG AA). Sin degradados ni tarjetas blandas.
```

### 4 — Modal «Registrar gol»
```text
Modal centrado sobre la pantalla principal de «ULTIMATE CLOCK», encuadre 1080 × 1920. Título
«Registrar gol» con el nombre y color del equipo. Dos campos opcionales apilados: «Pase» y
«Gol» (goleador). Botones grandes «Cancelar» y «Confirmar». Muestra la hora del evento. Estética
de instrumento: bordes rectos, monoespaciada en los campos, alto contraste.
```

### 5 — Corrección de puntaje
```text
Modal de corrección «−1» de «ULTIMATE CLOCK»: mensaje «¿Restar un gol a <EQUIPO>?», aclaración
«Quedará registrado como ajuste manual», botones «Cancelar» y «Restar gol». Encabezado con el
color del equipo, sin depender solo del color.
```

### 6 — Modal de reset
```text
Modal de reset de «ULTIMATE CLOCK»: mensaje «¿Reiniciar todos los contadores?», aclaración «El
historial guardado y los perfiles no se borrarán», botones «Cancelar» y «Reiniciar contadores»
(este último con énfasis de advertencia, borde y texto, no solo color).
```

### 7 — Modal de información
```text
Modal de información de «ULTIMATE CLOCK», encuadre 1080 × 1920. Texto: «Desarrollado por Juan
Martínez García, de la comunidad de Ultimate Frisbee Mendoza.» con «Ultimate Frisbee Mendoza»
como enlace resaltado a https://www.instagram.com/ultimatefrisbeemza/. Botón «Visitá mi sitio»
(placeholder [URL PERSONAL DE JUAN]), botón «Conocé más proyectos» hacia https://iona.ar/, texto
«Esta app es gratuita para la comunidad del Ultimate Frisbee.» y botón «Apoyá este proyecto»
(placeholder [URL FUTURA DE DONACIONES]). Estética sobria de instrumento, logo circular de disco
arriba.
```

### 8 — Historial de partidos
```text
Pantalla de historial de «ULTIMATE CLOCK», encuadre 1080 × 1920. Lista de partidos guardados:
cada fila muestra nombre de equipo 1, resultado, nombre de equipo 2, fecha del partido y una
etiqueta compacta del reglamento (WFDF / USAU / Personalizado), con los colores de cada equipo
en un pequeño indicador. Estado vacío: «Todavía no hay partidos guardados.» y botón «Comenzar un
partido». Botón fijo «Nuevo partido» al pie.
```

### 9 — Planilla de un partido guardado
```text
Planilla completa de un partido guardado de «ULTIMATE CLOCK»: equipos y colores, resultado,
fecha y hora, reglamento, perfil visual usado, tabla de goles con hora, pase y goleador, ajustes
manuales, duración total, límites superados, pausas y time-outs por equipo. Estética de
formulario técnico: líneas finas, monoespaciada, jerarquía por tipografía, no por color.
```

### 10 — Estado vacío / arranque de partido
```text
Primer arranque de «ULTIMATE CLOCK»: pantalla de activación de audio («Tocá para habilitar el
sonido de las alertas») y elección de reglamento antes de comenzar, con el tablero principal
visible y en estado «Preparado». Encuadre 1080 × 1920, sin scroll.
```

---

## Reglas de encuadre (resumen para cualquier prompt)

| Concepto | Teléfono | Tablet |
|---|---|---|
| Encuadre | 1080 × 1920 px (9:16) | 1536 × 2048 px (3:4) |
| Referencia pequeña | 390 × 844 px | 768 × 1024 px |
| Referencia grande | — | 1440 × 1024 px (horizontal 4:3 opcional) |
| Altura | 100dvh, grilla de filas fijas | 100dvh, filas fijas más aire |
| Scroll | nunca, ni vertical ni horizontal | nunca |
| Área táctil | mínimo 44 × 44 px | mínimo 48 × 48 px |
| Orden vertical | header · tablero (reloj primero) · pull · llamada · time-out | igual, con tablero de 3 columnas |

Nota de diseño: con la exigencia de «todo sin scroll» en 9:16, en teléfono los cuatro
cronómetros deben convivir en una banda compacta (grilla 2 × 2 o tres columnas bajas) y el
reloj de partido conserva la mayor jerarquía visual. Si algo no entra, se mueve a modal —
nunca se encoge un botón por debajo de 44 px ni se agrega desplazamiento.
