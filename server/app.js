'use strict';
// API HTTP de Ultimate Clock. Sin framework: un manejador (req, res).
const auth = require('./auth');

const MAX_CUERPO = 64 * 1024;

function responder(res, estado, cuerpo) {
  const texto = JSON.stringify(cuerpo);
  res.writeHead(estado, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(texto);
}

function leerJson(req) {
  return new Promise((resolve, reject) => {
    let tam = 0;
    let excedido = false;
    const partes = [];
    req.on('data', (c) => {
      tam += c.length;
      if (tam > MAX_CUERPO) { if (!excedido) { excedido = true; reject(Object.assign(new Error('grande'), { estado: 413 })); } return; }
      partes.push(c);
    });
    req.on('end', () => {
      if (excedido) return;
      if (!partes.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(partes).toString('utf8'))); }
      catch { reject(Object.assign(new Error('json'), { estado: 400 })); }
    });
    req.on('error', reject);
  });
}

function tokenDe(req) {
  const m = /^Bearer (\S+)$/.exec(req.headers.authorization || '');
  return m ? m[1] : null;
}

// prefijo: ruta bajo la que cuelga la API (p. ej. /ultimateclock/api si el proxy no la recorta).
function crearManejador(db, { prefijo = '/api' } = {}) {
  return async (req, res) => {
    try {
      const ruta = new URL(req.url, 'http://x').pathname.replace(/\/+$/, '');
      if (!ruta.startsWith(prefijo)) return responder(res, 404, { error: 'no encontrado' });
      const sub = ruta.slice(prefijo.length) || '/';

      if (req.method === 'GET' && sub === '/health') return responder(res, 200, { ok: true });

      if (req.method === 'POST' && sub === '/login') {
        const { usuario, clave } = await leerJson(req);
        const r = auth.iniciarSesion(db, usuario, clave);
        if (r.error === 'bloqueado') return responder(res, 429, { error: 'demasiados intentos, probá más tarde' });
        if (r.error) return responder(res, 401, { error: 'usuario o contraseña incorrectos' });
        return responder(res, 200, { token: r.token, usuario: r.usuario });
      }

      if (req.method === 'GET' && sub === '/me') {
        const cuenta = auth.cuentaDeToken(db, tokenDe(req));
        if (!cuenta) return responder(res, 401, { error: 'sin sesión' });
        return responder(res, 200, { usuario: cuenta.usuario });
      }

      if (req.method === 'POST' && sub === '/logout') {
        auth.cerrarSesion(db, tokenDe(req));
        return responder(res, 200, { ok: true });
      }

      return responder(res, 404, { error: 'no encontrado' });
    } catch (e) {
      if (e.estado) return responder(res, e.estado, { error: 'pedido inválido' });
      console.error('error interno:', e.message); // nunca se registran cuerpos ni contraseñas
      return responder(res, 500, { error: 'error interno' });
    }
  };
}

module.exports = { crearManejador };
