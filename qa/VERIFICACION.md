# Verificación — ULTIMATE CLOCK — 27/09/2026

## Publicación en iona.ar/ultimateclock — 29/09/2026

- Se verificó el servidor Contabo `vmi3378085` y el contenedor `iona-web` antes de publicar. La carpeta anterior se archivó y se conserva fuera de la raíz pública. No se cambió Caddy ni DNS.
- La URL sin barra final redirige a `https://iona.ar/ultimateclock/` y entrega HTTP 200. CSS, JavaScript, manifiesto, ícono y service worker respondieron 200. Los SHA-256 del HTML y JavaScript públicos coincidieron con los del paquete local.
- En el navegador publicado se comprobó el tablero a 320×568, 390×844 y 844×390. El alto y ancho de documento coincidieron con el viewport en cada tamaño; hay un solo TIME OUT y ningún marcador decorativo de equipo. Pull aparece entre las Llamadas en horizontal.
- El menú abrió con fondo oscurecido. PROBAR SONIDO mostró el aviso de tres tonos y el control pasó a DESACTIVAR SONIDO. No aparecieron errores de consola. La salida audible y el volumen real no se pueden medir desde esta verificación.
- La versión pública anterior usaba la clave de navegador `ultimateClock.v1`; la nueva usa `ultimate-clock-v2`. El historial anterior no se migró, pero tampoco se borró del navegador.

## Widget único de TIME OUT y control de sonido — 29/09/2026

- Se quitaron los marcadores decorativos de los dos widgets de goles. El código del tablero sitúa Llamada de Equipo 1, Pull y Llamada de Equipo 2 en ese orden y la grilla horizontal asigna Pull al centro. TIME OUT se genera como un único widget con botones y cupos independientes para ambos equipos.
- El sonido comienza deshabilitado a nivel del navegador hasta que un gesto permita activar `AudioContext`. El botón cambia entre ACTIVAR SONIDO y DESACTIVAR SONIDO según el estado real. PROBAR SONIDO programa la misma triple alarma de 1050 Hz que una finalización. Los avisos visuales se despachan aunque no haya permiso de audio.
- `node --check` aprobó para `ultimate-clock.js` y `alerts.js`; 13/13 pruebas automáticas aprobaron, incluidas activación, silencio, prueba de triple tono y aviso visual sin permiso de audio.
- No se pudo completar la revisión interactiva de esta corrección: el navegador de prueba bloqueó abrir `file:` por su política de seguridad y el entorno de ejecución no permitió conectarse al servidor local. Quedan pendientes la inspección visual en los cinco tamaños y la escucha física del sonido con PROBAR SONIDO.
- Continuación: se simuló un fallo al crear el tono. El motor desactivó el audio, notificó a la interfaz y conservó el aviso visual. Pasaron 14/14 pruebas, la comprobación sintáctica de ambos archivos JavaScript y el análisis de CSS sin errores de parseo. La escucha y el aspecto en navegador siguen sin verificación.

## Llamadas por equipo y ajustes de operación — 29/09/2026

- El selector inicial mostró los perfiles oficiales y NUEVO PERFIL abrió directamente el formulario. Un perfil de prueba de 1 s se guardó y apareció en el desplegable; con el partido iniciado, el selector mantuvo fijo el perfil actual.
- Pull terminó y REINICIAR volvió a 00:01 / LISTO sin empezar otra cuenta. Llamada del Equipo 2 terminó y REINICIAR volvió a LISTO sin abrir un nuevo formulario. Después de la alerta de Llamada, Pull completó normalmente.
- La planilla mostró “Llamada · Equipo 2 · Travel” y “Llamada · Equipo 2 · Pick”. El desplegable ofreció las ocho categorías y al elegir Tiempo de Espíritu cambió la explicación del diálogo.
- MENU aplicó `blur(7px)` y oscureció el fondo. MÁS COLORES expuso el selector nativo libre. Los widgets de Llamada y Time Out tomaron el color de su equipo con contraste automático.
- En navegador, a 320 × 568, 390 × 844, 768 × 1024, 844 × 390 y 1440 × 900 no hubo desplazamiento ni controles, números o barras recortados; los botones visibles conservaron 44 × 44 px como mínimo.
- Se verificaron `node --check` y 11/11 pruebas automáticas. El test de audio comprueba tres tonos de 1050 Hz por finalización; no mide volumen ni timbre en un parlante físico.
- Capturas actualizadas: `compact.jpg`, `mobile.jpg`, `landscape.jpg` y `desktop.jpg`. La revisión de categorías se basó en [WFDF 2025–2028](https://rules.wfdf.sport/resources/) y [USA Ultimate 2026–2027](https://usaultimate.org/rules/).

## Ajuste de tablero — 29/09/2026

- MENU agrupa las diez opciones del encabezado en cualquier ancho; se comprobó su apertura a 320 × 568.
- En vertical, los tres paneles principales aparecen en el orden Equipo 1 → Tiempo → Equipo 2. No aparece el texto de almacenamiento ni otro pie de página.
- El tablero ocupó exactamente el alto y ancho visibles, sin desplazamiento, a 320 × 568, 390 × 844, 844 × 390 y 1440 × 900. A 320 × 568 y 1440 × 900, todos los botones visibles midieron al menos 44 × 44 px.
- Capturas: `mobile.jpg` (390 × 844), `landscape.jpg` (844 × 390) y `desktop.jpg` (1440 × 900).

## Corrección de apertura — 28/09/2026

- Se reprodujo un conflicto de puerto: 8765 estaba ocupado por un servidor cuyo directorio no era la app. El iniciador corregido usó el puerto estable 8766 y entregó el HTML, CSS, JS, manifiesto e icono con respuestas HTTP 200.
- En Safari, la versión anterior dejaba el tablero en blanco por un error de JavaScript al calcular el color del tema antes de que el CSS importado estuviera disponible. Con valores de respaldo, el tablero abrió sin errores de consola y Planilla → Tablero funcionó.
- También se comprobó la carga en el navegador integrado. La apertura directa de `file:` no se pudo verificar por la política del navegador de prueba; se recomienda el iniciador local.
- Captura de la app funcionando en Safari: `safari.png`.

## Implementado y comprobado

- 11/11 pruebas automáticas con Node aprobadas. Cubren motor temporal, pausa del reloj principal, recuperación tras suspensión/recarga, persistencia de perfil, validaciones, contraste de equipos y tres pulsos de chicharra simulados por finalización.
- En navegador móvil se recorrieron Pull, Llamada, Time out, reloj principal, primer tiempo, descanso y segundo tiempo con un perfil corto. Pull, Llamada y Time out quedaron sin control de pausa y terminaron en cero. El reloj principal sí se pausó y reanudó.
- Al usar un time out del Equipo 1, el cupo pasó de 3/3 a 2/3. Tras el descanso y el inicio de la segunda mitad, volvió a 3/3 y el widget quedó disponible con su barra en cero.
- Se verificaron el aviso PRIMER TIEMPO CUMPLIDO, INICIAR MEDIO TIEMPO, la cuenta del descanso sin pausa y el aviso para INICIAR SEGUNDO TIEMPO.
- La configuración mostró WFDF, USA Ultimate y el perfil personalizado guardado; cambiar a WFDF actualizó los valores del tablero. El menú contiene Claro y Oscuro, las acciones en un solo encabezado y el enlace solicitado en Info.
- En tablero y configuración, a 320, 390, 768 y 1440 px no hubo desborde horizontal. Todos los botones, selectores, campos y enlaces visibles y habilitados midieron al menos 44 × 44 px.
- Sin errores de JavaScript observados en el navegador. `node --check` aprobó.

Las capturas finales del tablero claro son `mobile.jpg` (390 × 844) y `desktop.jpg` (1440 × 900). `pruebas.txt` contiene la salida de las pruebas automáticas.

## Límites de verificación

El test de audio usa un contexto simulado y comprueba tres pulsos, no el volumen real del parlante. Falta probar en un teléfono o tableta físicos, con luz de cancha y lector de pantalla. La carga sin conexión no se volvió a probar después de este ajuste de interfaz. Los tiempos de cada torneo deben confirmarse con su organización.

## Revisión del 30/09/2026

- El selector inicial muestra los tres botones en el orden pedido y con colores distintos. El perfil se confirma al tocar **USAR ESTE PERFIL**.
- Se recorrieron los seis pasos del tutorial en navegador: foco y resaltado sobre el elemento correspondiente, avance, cierre y retorno al tablero. El tutorial también figura en MENU.
- A 320×568 y 844×390, el tablero completo y el pie quedaron dentro del alto visible (`scrollHeight === innerHeight`), sin desborde horizontal; también se inspeccionó 390×844.
- El pie conserva los tres textos completos. **DONÁ** usa `href="#"` y abre el aviso de que el enlace de cobro aún no está disponible.
- `node --check` aprobó; 14/14 pruebas del motor y audio pasaron. La versión publicada abrió el selector y el tutorial y no registró errores de consola.
- Pendiente: enlace real de donación; escucha física y lectura en cancha. La carga offline no se retesteó en modo desconectado.

## Ajuste de audio, pantalla y pie del 30/09/2026

- Finalizaciones y PROBAR SONIDO programan cinco pulsos agudos a mayor ganancia; la prueba automática comprueba los cinco osciladores.
- USAR ESTE PERFIL solicita pantalla completa cuando el navegador lo permite; MENU incluye PANTALLA COMPLETA y el control para salir.
- Se eliminó la sombra/franja roja del header. El pie ahora muestra DESARROLLADO POR IONA.AR, ULTIMATE FRISBEE MENDOZA y APOYÁ ESTE PROYECTO.
- La versión publicada fue comprobada en 320×568 y 844×390: `scrollHeight === innerHeight`, sin desborde horizontal y con `box-shadow: none` en el header. El navegador mostró el botón de pantalla completa y el aviso “Sonido de prueba: cinco alarmas”. Los SHA-256 de HTML, JS, CSS, alerts.js y service worker coinciden entre local y VPS.

## Prueba funcional completa del 30/09/2026

En `https://iona.ar/ultimateclock/` se ejecutó una partida corta con perfil personalizado: se editó Equipo 1, se eligió color y se abrió MÁS COLORES; se registraron dos goles para Cóndores (uno con pase y anotador), un gol para Equipo 2 y una corrección; se inició y completó Pull; se hicieron llamadas para ambos equipos y se verificaron categorías; se ejecutó un Time Out de Cóndores y su cupo pasó a 0/1; se pausó y reanudó el reloj total; se completaron primer tiempo, descanso, segunda mitad y partido.

La planilla guardada apareció en Historial y su detalle conservó 17 eventos: goles, ajuste, Pull, llamadas de ambos equipos, Time Out, pausas, primer tiempo, descanso, segunda mitad y final. Tras recargar, el selector inicial conservó el perfil **QA breve** y sus tres acciones. No se observaron errores de consola.

## Ajuste de goles y alturas del 30/09/2026

- Los dos subtítulos no editables de los contadores muestran **GOLES**; el nombre editable de cada equipo permanece separado.
- En orientación vertical se fijaron tres filas iguales para Equipo 1, reloj principal y Equipo 2. En la versión publicada midieron 49/49/49 px a 320×568 y 83/83/83 px a 390×844; `scrollHeight === innerHeight`, sin desborde horizontal y sin errores de consola.

## Modo torneo del 03/10/2026 (v38)

- `node --test tests/*.test.cjs`: 42/42 (8 nuevas en `tests/tournament.test.cjs`: obligatoriedad del nombre y número opcional, lista pegada, saneamiento, estadísticas, archivo exportar/importar, CSV, cableado).
- Recorrido en Chromium a 390×844 con servidor local: crear torneo, dos equipos, jugadores (aviso por número repetido), lista pegada, elegir equipos al empezar partido, gol con pase y anotador de la lista y con "Otro", guardar, estadísticas (Ana 2 goles, Beto 1 pase), exportar JSON y CSV, recargar (persiste), eliminar e importar, archivo inválido rechazado, inglés. Sin errores de consola ni desborde horizontal.
- Cuadro de equipos con selector sin desborde horizontal a 320×568, 844×390 y 1280×800 (el cuadro se desplaza cuando falta alto).

## Ficha de equipo del 03/10/2026 (v39)

- 42/42 pruebas. En Chromium a 390×844: crear torneo abre la ficha con 14 filas; guardar vacío avisa del nombre; número sin nombre y número repetido avisan y enfocan; Enter avanza y crea filas; AGREGAR JUGADOR llega a 15 filas; pegar lista rellena filas libres; el equipo se agrega y se puede cargar un segundo; editar, vaciar una fila y cambiar de idioma conserva el borrador; la lista del cuadro de gol refleja la ficha. Sin errores de consola.

## Modo partido y modo torneo del 03/10/2026 (v40)

- 42/42 pruebas. Chromium a 390×844: el inicio muestra MODO PARTIDO / MODO TORNEO; modo partido → equipos escritos, cartel MODO PARTIDO, gol y gol desde la planilla con campos de texto; nuevo partido → MODO TORNEO → pantalla del torneo, crear torneo y tres equipos, EMPEZAR PARTIDO DEL TORNEO → cartel MODO TORNEO, nombres y colores de la lista, cuadro de gol solo con listas (sin campos de texto, sin «Otro»), equipo sin jugadores con aviso, cambio de equipo bloqueado con el partido empezado, estadísticas tras guardar. Sin errores de consola. Encabezado sin desborde a 320×568, 390×844 y 844×390.

## Auditoría de modos del 03/10/2026 (v41)

- 45/45 pruebas. Chromium a 390×844: inicio → modo partido → equipos → jugadores (paso 2 de 4) → gol con lista y «Otro», equipo sin lista con texto libre, editor de equipo con jugadores; menú en modo partido (ENTRAR AL MODO TORNEO) y en torneo (EQUIPOS DEL TORNEO + SALIR); entrar y salir con partido empezado piden guardar; volver de la pantalla del torneo abre la elección de equipos; ＋ NUEVO PARTIDO en torneo abre directo la elección y en partido deja nombres en blanco; recarga con partido guardado arranca vacío y conserva la planilla; menú en inglés. Sin errores de consola.

## Pendientes de la auditoría del 03/10/2026 (v42)

- 46/46 pruebas (nueva: posiciones y resultados). Chromium a 390×844: volver de la pantalla del torneo abre la elección de equipos; INICIAR sin equipos la abre; pase = gol se rechaza y deja el cuadro abierto; posiciones y resultados tras guardar un partido; segundo torneo, cambio entre torneos y eliminar el activo; eliminar planilla con confirmación; tutorial de 7 pasos. Sin errores de consola. Encabezado sin desborde a 320×568, 360×640, 390×844 y 844×390.

## Tiempos por torneo del 03/10/2026 (v43)

- 47/47 pruebas. Chromium a 390×844: perfil por defecto WFDF, crear perfil «Liga 40» desde el torneo, el partido de torneo muestra los tiempos (resta 40:00, descanso 20:00) sin preguntar perfil, EDITAR TIEMPOS bloqueado con aviso, cambio a USA Ultimate, exportar el archivo (lleva `timing`), importarlo en un contexto limpio (otro dispositivo) recrea el perfil y el partido usa 40:00. Sin errores de consola.
