/* Ultimate Clock · formulario para solicitar el Modo Pro. Envía a /api/solicitud-pro (mismo sitio, backend de contacto);
   el idioma viene de ?lang= (lo pone el aviso del Modo Pro) y, si no, del navegador. */
(function () {
  'use strict';
  const T = {
    es: {
      title: 'SOLICITÁ TU MODO PRO', intro: 'El Modo Pro incluye torneos y fixture, guardado en el servidor, varios dispositivos y compartir en vivo. Contanos sobre tu torneo y te generamos un usuario y una contraseña para activarlo.',
      name: 'Nombre', team: 'Equipo de Ultimate', tournament: 'Torneo que lo solicita', message: 'Mensaje (contanos sobre tu torneo y comunidad de ultimate)', email: 'E-mail de contacto',
      send: 'ENVIAR SOLICITUD', sending: 'ENVIANDO…', back: 'VOLVER A ULTIMATE CLOCK', doneTitle: '¡SOLICITUD ENVIADA!', doneText: 'Gracias. Revisamos tu pedido y te escribimos al e-mail que dejaste con el usuario y la contraseña.',
      page: 'Solicitá tu Modo Pro · Ultimate Clock',
      invalid: 'Completá todos los campos. El mensaje necesita al menos 10 caracteres y el e-mail tiene que ser válido.', fail: 'No pudimos enviar la solicitud. Probá de nuevo en unos minutos.', many: 'Demasiadas solicitudes. Probá nuevamente más tarde.'
    },
    en: {
      title: 'REQUEST YOUR PRO MODE', intro: 'Pro Mode includes tournaments and fixtures, server storage, multiple devices and live sharing. Tell us about your tournament and we will create a username and password for you.',
      name: 'Name', team: 'Ultimate team', tournament: 'Tournament requesting it', message: 'Message (tell us about your tournament and ultimate community)', email: 'Contact e-mail',
      send: 'SEND REQUEST', sending: 'SENDING…', back: 'BACK TO ULTIMATE CLOCK', doneTitle: 'REQUEST SENT!', doneText: 'Thanks. We will review your request and write to the e-mail you left with the username and password.',
      page: 'Request your Pro Mode · Ultimate Clock',
      invalid: 'Fill in every field. The message needs at least 10 characters and the e-mail must be valid.', fail: 'We could not send the request. Try again in a few minutes.', many: 'Too many requests. Try again later.'
    }
  };
  const asked = new URLSearchParams(location.search).get('lang');
  const lang = asked === 'en' || asked === 'es' ? asked : (navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  const t = T[lang];
  document.documentElement.lang = lang;
  document.title = t.page;
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t[el.dataset.t]; });

  const form = document.getElementById('proForm'), done = document.getElementById('proDone'), err = form.querySelector('.login-error'), btn = form.querySelector('[type="submit"]');
  const showError = (text) => { err.textContent = text; err.hidden = false; };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form), d = Object.fromEntries([...f.entries()].map(([k, v]) => [k, String(v).trim()]));
    if (d.name.length < 2 || d.team.length < 2 || d.tournament.length < 2 || d.message.length < 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) { showError(t.invalid); return; }
    err.hidden = true; btn.disabled = true; btn.textContent = t.sending;
    try {
      const r = await fetch(new URL('/api/solicitud-pro', location.origin), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
      if (r.ok) { form.hidden = true; done.hidden = false; done.querySelector('a').focus(); return; }
      showError(r.status === 429 ? t.many : r.status === 400 ? t.invalid : t.fail);
    } catch { showError(t.fail); }
    btn.disabled = false; btn.textContent = t.send;
  });
})();
