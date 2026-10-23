/* Idioma y tema: los de la app (si hay), ?lang= en la dirección o el del navegador. */
(function () {
  var settings = {};
  try { settings = (JSON.parse(localStorage.getItem('ultimate-clock-v2') || 'null') || {}).settings || {}; } catch (e) {}
  var query = new URLSearchParams(location.search).get('lang');
  var lang = query === 'en' || query === 'es' ? query : settings.lang === 'en' || settings.lang === 'es' ? settings.lang : /^en/i.test(navigator.language || '') ? 'en' : 'es';
  if (settings.theme === 'dark') document.documentElement.dataset.theme = 'dark';
  function apply(next) {
    lang = next;
    document.documentElement.lang = lang;
    document.querySelectorAll('article[data-lang]').forEach(function (a) { a.hidden = a.dataset.lang !== lang; });
    document.querySelectorAll('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    document.getElementById('barTitle').textContent = lang === 'en' ? 'User manual' : 'Manual de usuario';
    document.getElementById('backLink').href = lang === 'en' ? '../?lang=en' : '../';
    document.title = (lang === 'en' ? 'User manual' : 'Manual de usuario') + ' · Ultimate Clock';
  }
  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () { apply(b.dataset.lang); history.replaceState(null, '', '?lang=' + lang + location.hash); });
  });
  apply(lang);
})();
