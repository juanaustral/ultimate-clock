#!/usr/bin/env bash
# Monta o actualiza la API de Ultimate Clock en el VPS (infraestructura: la corre quien tenga permiso de Docker y Caddy).
#   sudo bash server/deploy.sh
# Idempotente: se puede correr de nuevo para actualizar el contenedor. No crea cuentas ni toca contraseñas:
# eso se hace aparte con server/cuentas.js (ver server/README.md).
set -euo pipefail
cd "$(dirname "$0")"

# 1. datos (el contenedor corre como el usuario node, uid 1000)
mkdir -p /opt/ultimate-clock-data
chown 1000:1000 /opt/ultimate-clock-data

# 2. contenedor en la red interna de Caddy, sin puerto público
docker compose up -d --build
sleep 2
docker exec iona-web wget -qO- http://ultimate-clock-api:8590/ultimateclock/api/health && echo

# 3. ruta en Caddy (con copia del Caddyfile antes de tocarlo)
CF=/opt/iona-web/Caddyfile
if ! grep -q 'ultimate-clock-api' "$CF"; then
  cp "$CF" "$CF.pre-ultimateclock-api-$(date +%Y%m%d-%H%M%S)"
  python3 - "$CF" <<'PY'
import sys
p = sys.argv[1]; s = open(p).read()
anchor = "    @api path /api/*\n"
block = """    # API de Ultimate Clock: cuentas y sincronizacion (contenedor ultimate-clock-api, red interna de Docker).
    @ucapi path /ultimateclock/api/*
    handle @ucapi {
        reverse_proxy ultimate-clock-api:8590
    }
"""
assert s.count(anchor) == 1, "no encontré el bloque @api del sitio iona.ar"
open(p, "w").write(s.replace(anchor, block + anchor))
PY
fi
docker exec iona-web caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
docker exec iona-web caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile

# 4. la base entra en el respaldo diario (copia consistente de SQLite)
BK=/usr/local/sbin/kos-backup.sh
if ! grep -q 'ultimate-clock-data' "$BK"; then
  cp "$BK" "$BK.pre-ultimateclock-$(date +%Y%m%d-%H%M%S)"
  python3 - "$BK" <<'PY'
import sys
p = sys.argv[1]; s = open(p).read()
anchor = "# PANEL: copia consistente de SQLite"
line = """# Ultimate Clock: cuentas y partidos (copia consistente de SQLite)
mkdir -p "$STAGE/ultimate-clock-data"
[ -f /opt/ultimate-clock-data/ultimate-clock.sqlite ] && sqlite3 /opt/ultimate-clock-data/ultimate-clock.sqlite ".backup '$STAGE/ultimate-clock-data/ultimate-clock.sqlite'"
"""
assert s.count(anchor) == 1, "no encontré dónde agregarlo en el respaldo"
open(p, "w").write(s.replace(anchor, line + anchor))
PY
  bash -n "$BK"
fi

# 5. comprobación desde afuera
curl -fsS https://iona.ar/ultimateclock/api/health && echo
echo "Listo: API en https://iona.ar/ultimateclock/api/"
