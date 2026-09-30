# Caso de estudio — Diseñar una mesa de tiempo para Ultimate Frisbee

## Contexto

ULTIMATE CLOCK nació como una reconstrucción completa de una interfaz inicial que no resolvía bien el uso en cancha. El proyecto partió de un prototipo UX/UI y evolucionó a partir de pruebas de interacción, restricciones de reglamento y correcciones de uso real.

## Desafío

La aplicación debía mostrar mucha información en una pantalla pequeña sin perder velocidad de operación. Además, cada reloj tenía una lógica distinta: el partido podía pausarse; Pull, Llamada, Time Out y descanso debían continuar hasta cero; los goles y las incidencias debían quedar registrados.

## Decisiones clave

### Separar relojes por comportamiento

La interfaz dejó de tratar todos los cronómetros como iguales. El reloj principal tiene pausa y reanudación. Los demás muestran una única barra de progreso, finalizan con cinco alarmas y solo permiten reiniciar al estado inicial.

### Diseñar para orientación real

En vertical, los dos marcadores y el reloj principal se apilan como Equipo 1 → Tiempo → Equipo 2 y comparten la misma altura. En horizontal, Pull queda centrado entre las llamadas de cada equipo.

### Reducir decisiones durante la jugada

Se unificó Time Out en un solo widget con dos botones coloreados por equipo. Las llamadas se separaron por equipo y la planilla conserva quién realizó cada llamado.

### Hacer visible la configuración

La aplicación comienza con un selector de perfil. Los valores oficiales funcionan como puntos de partida y la opción PERSONALIZADO permite guardar una configuración reutilizable sin esconder los tiempos dentro de submenús.

### Tratar el sonido como estado del producto

El navegador puede bloquear audio hasta recibir una interacción. Por eso la interfaz muestra ACTIVAR/DESACTIVAR SONIDO, incluye PROBAR SONIDO y conserva los avisos visuales aunque el audio no esté disponible.

## Proceso de validación

- Pruebas unitarias del motor temporal, persistencia y alertas.
- Recorrido funcional completo: goles, correcciones, llamadas, Pull, Time Out, pausa, descanso, segunda mitad, planilla e historial.
- QA responsive en tamaños móviles y horizontales.
- Verificación de publicación con hashes de archivos y consola sin errores.

## Resultado

El producto final es una herramienta operativa, local-first y publicable como sitio estático. La interfaz conserva la velocidad de una mesa de tiempo, pero también ofrece onboarding, perfiles, historial y documentación suficiente para que otra persona pueda aprenderla y evaluarla.

## Aprendizajes

- La regla más importante de un cronómetro es su comportamiento, no su apariencia.
- Una pantalla de cancha necesita mostrar el estado antes que las opciones.
- La configuración debe separar valores oficiales, valores personalizados y decisiones del torneo.
- Probar una interfaz responsive exige medir interacción y geometría, no solo comprobar que el HTML cargue.
