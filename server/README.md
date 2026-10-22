# Servidor de Ultimate Clock

API HTTP chica con Node (≥ 22.5, usa `node:sqlite`) y cero dependencias. Cuentas con contraseña scrypt, sesiones con token opaco (se guarda solo su hash) y sincronización por registros con control de versión.

## Rutas (bajo `/api`)

| Ruta | Qué hace |
|---|---|
| `GET /health` | Estado |
| `POST /login` `{usuario, clave}` | Devuelve `{token, usuario}`; 5 intentos fallidos por 15 min bloquean la cuenta |
| `GET /me`, `POST /logout` | Sesión actual / cerrar |
| `POST /sync/subir` `{dispositivo, cambios[]}` | Aplica cambios con `base` (versión conocida). Responde `ok` o `conflicto` con el dato actual |
| `GET /sync/bajar?desde=N` | Registros cambiados después del `seq` N |
| `GET /publico/<usuario>/<torneo>` | Sin sesión. Torneo compartido con el link en vivo (`vivo.html?u=&t=`): equipos, fixture, marcadores y partidos en juego, sin jugadores. 404 si no existe o se dejó de compartir |

Se sincronizan `partidos` y `torneos`. El partido en curso y los ajustes quedan en cada dispositivo.

## Cuentas (las crea Juan en el servidor, no la app)

```
docker exec -i ultimate-clock-api node server/cuentas.js crear Mendoza
docker exec -i ultimate-clock-api node server/cuentas.js clave Mendoza   # cambia la clave y cierra las sesiones
```

La contraseña se pide por la terminal (o `UC_CLAVE`); nunca por argumento ni al repositorio.

## Desarrollo y pruebas

```
npm test                                  # todas las pruebas
UC_PORT=8766 node server/dev.js           # app + API con base en memoria y cuentas de prueba
node qa/navegador/sync-dos-dispositivos.cjs   # dos dispositivos, corte de red y conflicto (Chromium)
```

## Puesta en producción

Mismo esquema que la API de Ultimate Pixel: contenedor en la red `iona-web_default` (sin puerto público), ruta `/ultimateclock/api/*` en el Caddy de iona-web y base en `/opt/ultimate-clock-data` incluida en el backup diario.

```
sudo bash server/deploy.sh        # idempotente: construye el contenedor, agrega la ruta y el respaldo, valida y recarga Caddy
docker exec -i ultimate-clock-api node server/cuentas.js crear Mendoza   # pide la contraseña por la terminal
bash scripts/publicar-vps.sh      # publica la app (incluye fixture.js, local-store.js, session.js y sync.js)
```

El script respalda el Caddyfile y el script de backup antes de tocarlos. No crea cuentas ni contraseñas.
