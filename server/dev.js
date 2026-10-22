'use strict';
// Servidor de desarrollo y pruebas: sirve la app (carpeta raíz del repo) y la API en /api, con una base propia.
//   UC_DB=:memory: UC_PORT=8766 node server/dev.js
// Crea las cuentas de prueba Mendoza y Santafe con la contraseña UC_CLAVE_PRUEBA (por defecto "clave-de-prueba-1").
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { abrir } = require('./db');
const { crearManejador } = require('./app');
const auth = require('./auth');

const RAIZ = path.resolve(__dirname, '..');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

const db = abrir(process.env.UC_DB || ':memory:');
for (const u of ['Mendoza', 'Santafe']) {
  try { auth.crearCuenta(db, u, process.env.UC_CLAVE_PRUEBA || 'clave-de-prueba-1'); } catch { /* ya existe */ }
}
const api = crearManejador(db, { prefijo: '/api' });
const servidor = http.createServer((req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (ruta.startsWith('/api')) {
    if (process.env.UC_LOG) { const fin = res.end.bind(res); res.end = (b) => { if (req.url.includes('sync')) console.log('   <-', String(b).slice(0, 300)); return fin(b); }; }
    if (process.env.UC_LOG) res.on('finish', () => console.log(req.method, req.url, res.statusCode, (req.headers.authorization || '').slice(-6)));
    return api(req, res);
  }
  const archivo = path.join(RAIZ, ruta === '/' ? 'index.html' : ruta);
  if (!archivo.startsWith(RAIZ + path.sep) || !fs.existsSync(archivo) || fs.statSync(archivo).isDirectory()) { res.writeHead(404); return res.end('no'); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(archivo).pipe(res);
});
servidor.listen(Number(process.env.UC_PORT || 8766), '127.0.0.1', () => console.log('listo ' + servidor.address().port));
