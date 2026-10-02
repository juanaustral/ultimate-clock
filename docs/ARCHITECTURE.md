# Arquitectura

## Modelo técnico

ULTIMATE CLOCK es una aplicación web estática sin servidor de aplicación. El navegador contiene la interfaz, el motor temporal, las alertas y el almacenamiento de la planilla.

```text
index.html / ultimate-clock.html
        │
        ├── ultimate-clock.js  → tablero, flujo, perfiles, planilla, historial
        ├── i18n.js             → textos en inglés (el español es la clave)
        ├── clock-engine.js     → estado temporal, anchors, validaciones
        ├── alerts.js           → AudioContext, cinco pulsos, avisos visuales
        ├── sheet-export.js     → planillas a PDF y CSV, sin dependencias
        ├── tokens.css          → variables de color y tipografía
        ├── ultimate-clock.css  → layout responsive y temas
        └── sw.js                → caché offline versionada
```

## Estado

El estado del partido vive en memoria mientras se opera y se serializa en `localStorage` bajo la versión `ultimate-clock-v2`. Los perfiles personalizados y el historial se guardan en el mismo dispositivo y origen.

El motor no descuenta tiempo usando solo un contador de frames. Conserva marcas de inicio y deltas, por lo que puede recuperar el tiempo transcurrido cuando una pestaña se suspende o vuelve a primer plano.

## Contratos de tiempo

| Elemento | Pausa | Finalización | Reinicio |
|---|---:|---|---|
| Reloj del partido | Sí | transición de mitad o final | reinicia el partido con confirmación |
| Pull | No | cinco alarmas + aviso visual | vuelve a LISTO sin autoarranque |
| Llamada | No | cinco alarmas + aviso visual | vuelve a LISTO sin abrir otra llamada |
| Time Out | No | cinco alarmas + aviso visual | queda disponible según cupo |
| Medio tiempo | No | cinco alarmas + aviso de transición | habilita segunda mitad |

## Seguridad y límites

- No hay credenciales ni datos personales.
- No se modifican DNS, Caddy ni servicios desde el código del proyecto.
- Los nombres, colores y planillas quedan en el almacenamiento del navegador.
- Borrar el almacenamiento o cambiar de origen/puerto puede ocultar el historial local.
- La app registra incidencias; no decide sanciones ni reemplaza al reglamento del torneo.

## Ejecución local

La aplicación usa recursos relativos y debe servirse por HTTP. El iniciador `Iniciar Ultimate Clock.command` levanta un servidor local en un puerto estable y abre el navegador. Para ejecutar pruebas:

```bash
node --test tests/*.test.cjs
```

No se necesitan dependencias npm para ejecutar la app.

## Publicación

El sitio público se sirve en [`https://iona.ar/ultimateclock/`](https://iona.ar/ultimateclock/). La publicación copia únicamente los assets estáticos de la aplicación; no requiere una API ni base de datos.
