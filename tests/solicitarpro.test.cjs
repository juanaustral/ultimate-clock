const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

test('el formulario de solicitud del Modo Pro tiene los cinco datos pedidos y envía al backend de contacto', () => {
  const html = read('solicitarpro/index.html'), js = read('solicitarpro/solicitarpro.js');
  for (const name of ['name', 'team', 'tournament', 'message', 'email']) assert.match(html, new RegExp(`name="${name}"[^>]*required`), name);
  assert.match(js, /\/api\/solicitud-pro/);
  assert.doesNotMatch(html, /<script(?![^>]*src=)[^>]*>/i, 'la CSP del sitio solo permite scripts del mismo origen');
});
test('el aviso del Modo Pro enlaza al formulario, se publica con la app y el service worker no lo reemplaza', () => {
  assert.match(read('ultimate-clock.js'), /href="solicitarpro\/\?lang=\$\{lang\}"/);
  assert.match(read('scripts/publicar-vps.sh'), /solicitarpro\/index\.html solicitarpro\/solicitarpro\.js/);
  assert.match(read('sw.js'), /includes\('\/solicitarpro'\)/);
});
