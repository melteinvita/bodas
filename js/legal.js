/* =====================================================================
   RELLENO AUTOMÁTICO DE LAS PÁGINAS LEGALES
   ---------------------------------------------------------------------
   Si rellenas los campos LEGAL_* de js/config.js, los marcadores de las
   plantillas legales se sustituyen solos. Si los dejas con los valores
   por defecto, la página sigue mostrando los marcadores para que sepas
   que aún falta completarlos.
   ===================================================================== */
(function () {
  'use strict';

  var CFG = window.APP_CONFIG || {};
  var values = {
    '[NOMBRE Y APELLIDOS / RAZÓN SOCIAL]': CFG.LEGAL_NAME,
    '[NOMBRE]': CFG.LEGAL_NAME,
    '[NIF]': CFG.LEGAL_NIF,
    '[DIRECCIÓN FISCAL]': CFG.LEGAL_ADDRESS,
    '[DIRECCIÓN]': CFG.LEGAL_ADDRESS,
    '[EMAIL DE CONTACTO]': CFG.LEGAL_EMAIL,
    '[EMAIL]': CFG.LEGAL_EMAIL,
    '[TELÉFONO]': CFG.LEGAL_PHONE
  };

  var active = Object.keys(values).filter(function (token) {
    return values[token] && String(values[token]).trim() && values[token] !== token;
  });
  if (!active.length) return;

  function replaceTokens(text) {
    active.forEach(function (token) {
      if (text.indexOf(token) !== -1) {
        text = text.split(token).join(String(values[token]).trim());
      }
    });
    return text;
  }

  function run() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var node;
    while ((node = walker.nextNode())) {
      var next = replaceTokens(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    }

    Array.prototype.forEach.call(document.querySelectorAll('a[href]'), function (link) {
      var href = link.getAttribute('href');
      if (!href || (href.indexOf('mailto:') !== 0 && href.indexOf('tel:') !== 0)) return;
      var fixed = replaceTokens(href);
      if (fixed !== href) link.setAttribute('href', fixed);
    });

    var email = CFG.LEGAL_EMAIL;
    if (email && email.indexOf('@') !== -1 && email.indexOf('[') === -1) {
      Array.prototype.forEach.call(document.querySelectorAll('a[href^="mailto:"]'), function (link) {
        if (link.getAttribute('href') === 'mailto:[EMAIL DE CONTACTO]') {
          link.setAttribute('href', 'mailto:' + email);
          if (link.textContent.indexOf('[EMAIL DE CONTACTO]') !== -1) link.textContent = email;
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
