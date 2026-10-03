# Auditoría de funcionamiento — 03/10/2026 (v41)

Recorrido de la app en Chromium (390×844, español e inglés) y lectura del código de cada pantalla, buscando botones que falten, opciones que se contradigan o textos que compliquen entender cómo funciona.

## Corregido en la v41

| # | Hallazgo | Cambio |
|---|---|---|
| 1 | En modo torneo no había forma de salir (pedido de Juan). | MENU → SALIR DEL MODO TORNEO. Con un partido sin guardar pide guardarlo antes. |
| 2 | En modo partido nunca se preguntaba por los jugadores (pedido de Juan). | Paso opcional «Jugadores» tras los equipos, y campo en el editor de equipo. En el gol se elige de la lista o se escribe otro nombre. |
| 3 | El modo partido recordaba nombres y colores del partido anterior, y al abrir la app mostraba el partido ya guardado (pedido de Juan: empezar siempre de cero). | ＋ NUEVO PARTIDO y la apertura con partido guardado crean uno vacío. La planilla guardada queda en Planillas guardadas. |
| 4 | Al elegir MODO TORNEO en el inicio, el cartel seguía diciendo MODO PARTIDO. | El modo cambia en el acto. |
| 5 | La entrada MODO TORNEO del menú no decía si entraba o abría la gestión. | ENTRAR AL MODO TORNEO (partido) / EQUIPOS DEL TORNEO (torneo), en un grupo MODO. |
| 6 | ＋ NUEVO PARTIDO volvía a preguntar el modo, contradiciendo SALIR DEL MODO TORNEO. | Conserva el modo actual; el cambio se hace desde el grupo MODO. |
| 7 | Volver de la pantalla del torneo dejaba el tablero con «Equipo 1/2» sin avisar. | Ofrece elegir los equipos (o avisa que faltan equipos). |
| 8 | «Editar tiempos» abría una pantalla titulada «Preparar partido». | Título unificado. |
| 9 | El tutorial y la nota de guardado no mencionaban modos ni torneo. | Textos actualizados en español e inglés. |

## Aplicado en la v42 (puntos 1 a 7 de la lista siguiente)

Los puntos 1 a 7 de abajo se resolvieron en la v42 (ver `CHANGELOG.md`). No se hizo un generador de cruces/fixture, y el punto 8 sigue abierto.

## Pendiente original (propuestas)

1. **No se pueden borrar planillas guardadas.** La lista de Planillas guardadas solo crece; hace falta una acción de borrar (con confirmación) o «borrar todas».
2. **Pase y gol pueden ser la misma persona.** Habría que impedirlo o avisar.
3. **Si se cierra la elección de equipos del torneo con la X**, el tablero queda con «Equipo 1/2» sin vínculo (los goles no cuentan para estadísticas). Se puede elegir tocando el nombre, pero conviene bloquear INICIAR hasta tener los dos equipos.
4. **Un solo torneo a la vez.** Un organizador con dos torneos debe exportar e importar.
5. **El cartel del encabezado y el texto «ULTIMATE CLOCK»**: en pantallas de hasta 430 px se oculta el texto. Evaluar un cartel más corto (por ejemplo «PARTIDO» / «TORNEO») para conservarlo.
6. **Tutorial**: no tiene pasos propios para los modos ni para el torneo.
7. **Estadísticas**: solo goles y pases por jugador; no hay tabla de posiciones ni cruces.
8. **Probar en teléfono real** (iPhone y Android) toda la secuencia de modos.
