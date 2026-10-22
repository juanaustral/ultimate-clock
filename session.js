/* Ultimate Clock · sesión de la cuenta. Guarda el token en el dispositivo y habla con /api (login, quién soy, logout).
   Sin cuenta la app funciona igual: el modo se recuerda en `uc-modo` ("local"). */
(function (root) {
  'use strict';
  const KEY = 'uc-sesion', MODO = 'uc-modo', API = 'uc-api';

  const leer = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const escribir = (k, v) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); return true; } catch { return false; } };

  function apiBase() {
    const forzada = leer(API);
    if (forzada) return forzada.replace(/\/*$/, '/');
    return new URL('api/', root.document ? root.document.baseURI : 'http://localhost/').href;
  }
  function actual() {
    try { const s = JSON.parse(leer(KEY) || 'null'); return s && s.token && s.usuario ? s : null; } catch { return null; }
  }
  const token = () => (actual() || {}).token || null;
  const usuario = () => (actual() || {}).usuario || null;
  const modoLocal = () => leer(MODO) === 'local';
  const usarLocal = () => escribir(MODO, 'local');

  async function pedir(ruta, opciones = {}, fetchFn = root.fetch.bind(root)) {
    const h = { 'Content-Type': 'application/json', ...(opciones.headers || {}) };
    const t = token();
    if (t) h.Authorization = 'Bearer ' + t;
    return fetchFn(apiBase() + ruta, { ...opciones, headers: h });
  }

  /* Devuelve { ok:true, usuario } o { ok:false, motivo: 'credenciales' | 'bloqueado' | 'red' }. */
  async function entrar(user, clave, fetchFn) {
    let r;
    try { r = await pedir('login', { method: 'POST', body: JSON.stringify({ usuario: user, clave }) }, fetchFn); }
    catch { return { ok: false, motivo: 'red' }; }
    if (r.status === 429) return { ok: false, motivo: 'bloqueado' };
    if (!r.ok) return { ok: false, motivo: r.status >= 500 ? 'red' : 'credenciales' };
    const d = await r.json();
    escribir(KEY, JSON.stringify({ token: d.token, usuario: d.usuario }));
    escribir(MODO, null);
    return { ok: true, usuario: d.usuario };
  }
  async function salir(fetchFn) {
    try { await pedir('logout', { method: 'POST', body: '{}' }, fetchFn); } catch { /* sin red: igual se cierra en este dispositivo */ }
    escribir(KEY, null);
  }
  /* El servidor ya no reconoce el token (venció o cambió la clave). */
  function vencida() { escribir(KEY, null); }

  const api = { apiBase, actual, token, usuario, modoLocal, usarLocal, entrar, salir, vencida, pedir };
  if (typeof module !== 'undefined') module.exports = api; else root.UCSession = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
