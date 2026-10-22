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

Se sincronizan `partidos` y `torneos`. El partido en curso y los ajustes quedan en cada dispositivo.

## Cuentas (las crea Juan en el servidor, no la app)

```
UC_DB=/var/lib/ultimate-clock/ultimate-clock.sqlite node server/cuentas.js crear Mendoza
UC_DB=... node server/cuentas.js clave Mendoza      # cambia la clave y cierra las sesiones
```

La contraseña se pide por la terminal (o `UC_CLAVE`); nunca por argumento ni al repositorio.

## Desarrollo y pruebas

```
npm test                                  # todas las pruebas
UC_PORT=8766 node server/dev.js           # app + API con base en memoria y cuentas de prueba
node qa/navegador/sync-dos-dispositivos.cjs   # dos dispositivos, corte de red y conflicto (Chromium)
```

## Puesta en producción (requiere aprobación de Juan: toca el servidor)

1. Copiar `server/` a `/opt/ultimate-clock-api/`, crear el usuario `ultimateclock` y `/var/lib/ultimate-clock/`.
2. Instalar `server/deploy/ultimate-clock-api.service` y arrancarlo; crear las cuentas con `server/cuentas.js`.
3. Agregar `server/deploy/Caddyfile.fragmento` al `Caddyfile` de iona-web (respaldar antes). La CSP actual (`default-src 'self'`) ya permite la API en el mismo origen.
4. Incluir `/var/lib/ultimate-clock/` en el backup diario.
5. Publicar la app con `scripts/publicar-vps.sh` (sube también `fixture.js`, `local-store.js`, `session.js` y `sync.js`).
