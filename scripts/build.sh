#!/bin/sh
# Reconstruye ultimate-clock.js a partir de los módulos en src/.
# Los módulos se concatenan en orden: cada uno es un fragmento de la misma IIFE.
set -e
cd "$(dirname "$0")/.."
cat src/uc-core.js src/uc-board.js src/uc-sheet.js src/uc-tournament.js src/uc-init.js > ultimate-clock.js
echo "ultimate-clock.js reconstruido ($(wc -c < ultimate-clock.js) bytes)"
