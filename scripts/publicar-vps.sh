#!/usr/bin/env bash
# Publica la rama main de juanaustral/ultimate-clock en https://iona.ar/ultimateclock/.
set -euo pipefail
REF="${1:-main}"
REPO="${REPO:-https://github.com/juanaustral/ultimate-clock}"
DEST="${DEST:-/opt/iona-web/site/ultimateclock}"
BACKUPS="${BACKUPS:-/opt/iona-web/backups}"
URL="${URL:-https://iona.ar/ultimateclock}"
FILES=(index.html ultimate-clock.html tokens.css ultimate-clock.css i18n.js clock-engine.js alerts.js sheet-export.js tournament.js changelog.js ultimate-clock.js icon.svg manifest.webmanifest sw.js icon-192.png icon-512.png icon-maskable-512.png apple-touch-icon.png favicon-32.png og-image.png screenshot-narrow.png screenshot-wide.png)

STAMP="$(date +%Y%m%d-%H%M%S)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "1/5 Descargando $REF"
git clone --quiet --depth 1 "$REPO" "$WORK/repo"
git -C "$WORK/repo" fetch --quiet --depth 1 origin "$REF" 2>/dev/null || true
git -C "$WORK/repo" checkout --quiet FETCH_HEAD 2>/dev/null || git -C "$WORK/repo" checkout --quiet "$REF"
echo "    commit $(git -C "$WORK/repo" rev-parse --short HEAD)"
for f in "${FILES[@]}"; do [ -f "$WORK/repo/$f" ] || { echo "Falta $f en el repositorio; no se publica nada."; exit 1; }; done

mkdir -p "$WORK/release"
for f in "${FILES[@]}"; do install -m 644 "$WORK/repo/$f" "$WORK/release/$f"; done

echo "2/5 Respaldando la versión publicada"
mkdir -p "$BACKUPS"
BACKUP="$BACKUPS/ultimateclock-pre-$STAMP.tar.gz"
tar -czf "$BACKUP" -C "$(dirname "$DEST")" "$(basename "$DEST")"
tar -tzf "$BACKUP" >/dev/null
echo "    $BACKUP"

echo "3/5 Cambio atómico"
mv "$DEST" "$BACKUPS/ultimateclock-prev-$STAMP"
mv "$WORK/release" "$DEST"

echo "4/5 Comprobando $URL"
fail=0
for f in "${FILES[@]}"; do
  local_sum="$(sha256sum "$WORK/repo/$f" | cut -d' ' -f1)"
  remote_sum="$(curl -fsS -H 'Cache-Control: no-cache' "$URL/$f?v=$STAMP" | sha256sum | cut -d' ' -f1)" || remote_sum="error"
  if [ "$local_sum" = "$remote_sum" ]; then echo "    ok    $f"; else echo "    DIFIERE $f"; fail=1; fi
done
grep -o "ultimate-clock-offline-v[0-9]*" "$DEST/sw.js" | sed 's/^/    caché: /'

if [ "$fail" -ne 0 ]; then
  echo "Hay diferencias. Restaurando: mv $BACKUPS/ultimateclock-prev-$STAMP $DEST"
  rm -rf "$DEST"; mv "$BACKUPS/ultimateclock-prev-$STAMP" "$DEST"
  exit 1
fi
echo "5/5 Publicado. Respaldo en $BACKUP"
