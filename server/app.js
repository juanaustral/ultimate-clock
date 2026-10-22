'use strict';
// API HTTP de Ultimate Clock. Sin framework: un manejador (req, res).
const auth = require('./auth');
const sync = require('./sync');
const publico = require('./publico');

const MAX_CUERPO = 64 * 1024;
const MAX_CUERPO_SYNC = 4 * 1024 * 1024;

function responder(res, estado, cuerpo) {
  const texto = JSON.stringify(cuerpo);
  res.writeHead(estado, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(texto);
}

function leerJson(req, max = MAX_CUERPO) {
  return new Promise((resolve, reject) => {
    let tam = 0;
    let excedido = false;
    const partes = [];
    req.on('data', (c) => {
      tam += c.length;
      if (tam > max) { if (!excedido) { excedido = true; reject(Object.assign(new Error('grande'), { estado: 413 })); } return; }
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

      // Torneo compartido: /publico/<usuario>/<slug>, sin sesión y solo lectura.
      if (req.method === 'GET' && sub.startsWith('/publico/')) {
        const [, , usuario, slug] = sub.split('/');
        let datos = null;
        try { datos = publico.obtener(db, decodeURIComponent(usuario || ''), decodeURIComponent(slug || '')); } catch (e) { if (e instanceof URIError) datos = null; else throw e; }
        if (!datos) return responder(res, 404, { error: 'no encontrado' });
        return responder(res, 200, datos);
      }

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

      if (sub === '/sync/subir' || sub === '/sync/bajar') {
        const cuenta = auth.cuentaDeToken(db, tokenDe(req));
        if (!cuenta) return responder(res, 401, { error: 'sin sesión' });
        if (req.method === 'POST' && sub === '/sync/subir') {
          const { dispositivo, cambios } = await leerJson(req, MAX_CUERPO_SYNC);
          return responder(res, 200, { resultados: sync.subir(db, cuenta.id, dispositivo, cambios) });
        }
        if (req.method === 'GET' && sub === '/sync/bajar') {
          const desde = Number(new URL(req.url, 'http://x').searchParams.get('desde') || 0);
          if (!Number.isInteger(desde) || desde < 0) return responder(res, 400, { error: 'pedido inválido' });
          return responder(res, 200, sync.bajar(db, cuenta.id, desde));
        }
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
