# Dirección UX/UI — ULTIMATE CLOCK

Referencia: prototipo Stitch `stitch_document_based_app_builder.zip` aportado por Juan. Desde octubre de 2026 rige el sistema "Línea de banda", con auditoría, principios y distribución en `docs/DISENO-2026-10.md`.

- Un único encabezado muestra el logo, ULTIMATE CLOCK y el botón MENU. El menú abre con el logo, MODO CLARO / MODO OSCURO y tres grupos: PARTIDO (＋ NUEVO PARTIDO primero y en color, Planilla, Guardar), SONIDO Y PANTALLA (Activar/Probar sonido, Pantalla completa, Configurar) y AYUDA (Cómo usar la app, Info). REINICIAR CONTADORES queda aparte, al final y en rojo.
- PLANILLA reúne el partido actual (registro rápido, eventos y botones EXPORTAR PDF · CSV · JSON) y las planillas guardadas; ya no hay una pantalla Historial aparte.
- Info muestra el logo, VISITÁ MI SITIO WEB (iona.ar) y DONÁ PARA APOYAR EL PROYECTO. Mientras no haya enlace de cobro (`DONATION_URL` en `ultimate-clock.js`), el botón de donar explica que todavía no está disponible.
- Logo: un disco con la corona de un cronómetro y el tiempo transcurrido en blanco. Se usa en el encabezado, el menú, Info y el ícono de la app (`icon.svg`).
- El botón + suma el gol al instante; el aviso superior ofrece PASE Y GOL y DESHACER durante 6 s. Las cuentas marcan los últimos 10 s y la pantalla se mantiene encendida mientras corre un reloj.
- El tablero ocupa exactamente la pantalla, sin scroll, en teléfono y tablet. En vertical: Equipo 1 | Equipo 2, debajo el reloj, luego Pull | Time Out y Llamada 1 | Llamada 2. En horizontal: Equipo 1 | Equipo 2 | Pull | Time Out arriba y Reloj | Llamada 1 | Llamada 2 abajo. El pie se oculta en horizontal de menos de 480 px de alto.
- El reloj del partido domina el tablero y es el único pausado/reanudable. Pull, Llamadas y Time Out son neutros en reposo y se llenan de color mientras corren (azul el Pull, el color del equipo en Llamadas y Time Out); al cumplirse muestran un borde rojo.
- Pull y Llamada vuelven a Listo al tocar REINICIAR; una nueva cuenta empieza solo con un segundo toque en INICIAR. Hay un único TIME OUT con dos botones de equipo y su cupo restante.
- Al iniciar, PERFIL DE TIEMPO presenta los oficiales, los guardados y NUEVO PERFIL. MENU oscurece y difumina el tablero detrás de las opciones.
- Los títulos y cupos de timeouts tienen lectura más grande. Cada botón muestra el restante y el total de su mitad; el cupo se renueva al comenzar la segunda. Los marcadores de gol no llevan el punto decorativo de color.
- El fin del primer tiempo abre un diálogo con INICIAR MEDIO TIEMPO. Durante el descanso, la tarjeta del reloj muestra la cuenta del medio tiempo; no se pausa y al terminar ofrece SEGUNDO TIEMPO.
- Configuración presenta un valor total por reloj y perfiles WFDF, USA Ultimate y PERSONALIZADO guardable. Se retiraron los subtiempos de la interfaz y los modos visuales adicionales.
- El diálogo de Llamada contiene las ocho categorías solicitadas y una guía breve según la selección. Identifica al equipo en la planilla sin interpretar la decisión arbitral ni consumir time outs automáticamente.
- Las acciones y selectores tienen superficies táctiles de al menos 44 × 44 px en los anchos verificados. Se mantiene contraste legible y compatibilidad con movimiento reducido.
- Info usa la paleta de la app e incluye CONOCÉ ULTIMATE FRISBEE MENDOZA, enlazado al Instagram que figuraba en la versión previa.

La referencia no certifica reglas. No hay sincronización entre dispositivos; el almacenamiento es local.
