# Product brief — ULTIMATE CLOCK

## Qué es

ULTIMATE CLOCK es un tablero táctil para dirigir el tiempo operativo de un partido de Ultimate Frisbee desde un único dispositivo. Reúne reloj de partido, goles, Pull, llamadas, Time Out, descanso, planilla e historial local en una interfaz pensada para cancha.

**Proyecto:** Juan Martínez García / IONA  
**Producto publicado:** [iona.ar/ultimateclock](https://iona.ar/ultimateclock/)  
**Tipo:** aplicación web progresiva, local-first y sin cuentas.

## Problema

Durante un partido, la persona que lleva el tiempo necesita alternar entre cronómetros, conteo de goles y registro de incidencias. Las herramientas genéricas separan estas tareas, tienen controles pequeños o permiten pausar relojes que deberían continuar hasta el final.

ULTIMATE CLOCK concentra las decisiones críticas en controles grandes, estados visibles y una secuencia de partido que acompaña el flujo real: inicio, primera mitad, descanso, segunda mitad y cierre.

## Usuarios

- Mesa o persona responsable del tiempo.
- Organización de torneos y partidos amistosos.
- Capitanías o equipos que necesitan una planilla de incidencias.
- Personas que aprenden a operar un partido de Ultimate.

## Principios de diseño

1. **Una acción importante, un control claro.** Los relojes no pausables no ofrecen un botón de pausa ambiguo.
2. **Lectura a distancia.** Los números, títulos, cupos y barras usan una jerarquía fuerte y contraste automático por equipo.
3. **Cancha primero.** El tablero ocupa el alto disponible, funciona en vertical y horizontal y mantiene controles táctiles de al menos 44 × 44 px.
4. **Estado explícito.** Cada reloj comunica si está listo, corriendo, cumplido o reiniciado.
5. **Reglas configurables.** WFDF, USA Ultimate y perfiles personalizados conviven sin presentar un valor configurable como regla universal.
6. **Datos bajo control de la persona.** Las planillas se guardan en el navegador y pueden exportarse como PDF, CSV o JSON.

## Flujo principal

1. Seleccionar un perfil oficial o crear uno personalizado.
2. Revisar equipos, colores y tiempos totales.
3. Activar y probar el sonido del dispositivo.
4. Operar el reloj principal y registrar goles, llamadas y Time Outs.
5. Completar la transición de primer tiempo, descanso y segunda mitad.
6. Guardar la planilla, exportarla y consultarla desde Planilla (planillas guardadas).

## Alcance actual

### Incluido

- Perfiles WFDF 2025–2028, USA Ultimate 2026–2027 y personalizados.
- Reloj total pausado/reanudable.
- Pull, Llamada, Time Out y medio tiempo sin pausa.
- Cinco alarmas agudas al completar un tiempo y aviso visual intenso.
- Goles con corrección, pase y anotador.
- Llamadas por equipo con ocho categorías.
- Cupo de Time Out por equipo y por mitad.
- Planilla, historial local y exportación PDF, CSV y JSON.
- Tutorial guiado, tema claro/oscuro, pantalla completa y diseño responsive.

### Fuera de alcance

- Sincronización entre dispositivos.
- Resolución automática de disputas o sanciones.
- Cuenta de usuario o backend de datos.
- Certificación reglamentaria de los tiempos de un torneo.
- Enlace de donación real: el botón queda preparado, pero todavía usa `#`.

## Resultado y evidencia

- 23/23 pruebas automáticas aprobadas.
- Prueba funcional completa de partido con 17 eventos registrados.
- Verificación publicada en 320×568, 390×844 y 844×390 sin scroll ni errores de consola.
- Capturas y trazabilidad en [`qa/VERIFICACION.md`](../qa/VERIFICACION.md).

## Próximos pasos

1. Validar volumen, legibilidad y uso con un teléfono o tableta en cancha.
2. Añadir el enlace real para apoyar el proyecto.
3. Considerar exportación PDF/CSV si una organización la necesita.
4. Evaluar sincronización opcional solo después de validar el flujo local-first.
