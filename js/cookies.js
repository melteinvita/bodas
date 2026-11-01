/* =====================================================================
   AVISO DE COOKIES / ALMACENAMIENTO LOCAL
   ---------------------------------------------------------------------
   La web no usa cookies publicitarias ni herramientas de analítica.
   Solo guarda datos técnicos necesarios (idioma, demo y sesión del
   panel). Este aviso es informativo y no bloquea la navegación.
   ===================================================================== */
(function () {
  'use strict';

  var KEY = 'melvinta:cookies-ok';
  var banner = null;

  function accepted() {
    try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; }
  }

  function remember() {
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
  }

  function ensureCss() {
    if (document.querySelector('link[data-cookies-css]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'css/cookies.css';
    link.setAttribute('data-cookies-css', '1');
    document.head.appendChild(link);
  }

  function hide() {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    banner = null;
  }

  function build() {
    if (banner || accepted()) return;
    if (window.self !== window.top) return; // dentro de la demo no hace falta
    var page = document.body ? document.body.dataset.page : '';
    if (page === 'admin' || page === 'novios') return;

    ensureCss();

    banner = document.createElement('aside');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Información sobre cookies y almacenamiento');

    var title = document.createElement('strong');
    title.textContent = 'Solo lo imprescindible';

    var text = document.createElement('p');
    text.appendChild(document.createTextNode('No usamos cookies publicitarias ni de analítica. Guardamos en tu navegador el idioma elegido y los datos técnicos necesarios para que la invitación funcione. '));
    var link = document.createElement('a');
    link.href = 'cookies.html';
    link.textContent = 'Más información';
    text.appendChild(link);
    text.appendChild(document.createTextNode('.'));

    var actions = document.createElement('div');
    actions.className = 'cookie-actions';

    var ok = document.createElement('button');
    ok.type = 'button';
    ok.className = 'primary';
    ok.textContent = 'Entendido';
    ok.addEventListener('click', function () {
      remember();
      hide();
    });

    var close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Cerrar';
    close.addEventListener('click', hide);

    actions.appendChild(ok);
    actions.appendChild(close);

    banner.appendChild(title);
    banner.appendChild(text);
    banner.appendChild(actions);
    document.body.appendChild(banner);
  }

  function init() {
    if (!document.body) return;
    if (/[?&]thumb(=|&|$)/.test(window.location.search)) return;
    build();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
