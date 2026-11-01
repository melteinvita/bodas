/* =====================================================================
   CATÁLOGO COMERCIAL
   ---------------------------------------------------------------------
   - Pinta las 19 plantillas desde js/plantillas.js.
   - Abre cada demo en un iframe local (sin servicios de terceros).
   - Compone el mensaje de WhatsApp con los datos del formulario.
   - Usa el enlace de Stripe solo si está configurado y es https.
   ===================================================================== */
(function () {
  'use strict';

  var CFG = window.APP_CONFIG || {};
  var PHONE = String(CFG.WHATSAPP_PHONE || '').replace(/[^\d]/g, '');
  var lastFocus = null;

  function el(id) { return document.getElementById(id); }

  function clean(value, max) {
    return String(value == null ? '' : value).trim().slice(0, max || 500);
  }

  function whatsappUrl(message) {
    return 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(message);
  }

  function openWhatsapp(message) {
    if (!PHONE) return false;
    var win = window.open(whatsappUrl(message), '_blank', 'noopener');
    return !!win;
  }

  function templateLabel(tpl) {
    return stripNumber(tpl.name);
  }

  function stripNumber(value) {
    return String(value || '').replace(/^\d+\s*·\s*/, '');
  }

  /* Traducción de las tarjetas: ?lang=val / ?lang=en, español por defecto. */
  var LANGS = ['es', 'val', 'en'];
  function uiLang() {
    try {
      var q = (new URLSearchParams(window.location.search).get('lang') || '').toLowerCase();
      if (LANGS.indexOf(q) !== -1) return q;
    } catch (e) {}
    return 'es';
  }

  function tplField(key, field, fallback) {
    if (window.Idiomas && window.Idiomas.templateField) {
      var value = window.Idiomas.templateField(key, field, uiLang());
      if (value) return value;
    }
    return fallback || '';
  }

  function uiText(key, fallback) {
    var dicts = window.Idiomas && window.Idiomas.dict;
    if (dicts) {
      var lang = uiLang();
      if (dicts[lang] && dicts[lang][key]) return dicts[lang][key];
      if (dicts.es && dicts.es[key]) return dicts.es[key];
    }
    return fallback || '';
  }

  /* ------------------------------------------------------------------
     TARJETAS DEL CATÁLOGO
     ------------------------------------------------------------------ */
  function renderCards() {
    var grid = el('catalog-grid');
    if (!grid || !window.WEDDING_TEMPLATES) return;
    grid.textContent = '';

    Object.keys(window.WEDDING_TEMPLATES).forEach(function (key) {
      var tpl = window.WEDDING_TEMPLATES[key];

      var card = document.createElement('article');
      card.className = 'demo-card';
      card.setAttribute('data-template', key);

      var header = document.createElement('div');
      header.className = 'tpl-header';

      var name = document.createElement('span');
      name.className = 'tpl-name';
      name.textContent = tplField(key, 'name', tpl.name || key);
      header.appendChild(name);

      var badgeText = tplField(key, 'badge', tpl.badge);
      if (badgeText) {
        var badge = document.createElement('span');
        badge.className = 'tpl-badge';
        badge.textContent = badgeText;
        header.appendChild(badge);
      }

      var colors = tpl.colors || [];
      var preview = document.createElement('div');
      preview.className = 'tpl-preview';
      preview.setAttribute('aria-hidden', 'true');
      if (colors.length >= 2) {
        preview.style.background = 'linear-gradient(148deg, ' + colors[1] + ' 0%, ' + colors[1] + ' 38%, ' + colors[0] + ' 100%)';
        preview.style.color = colors[2] || colors[0];
        preview.style.boxShadow = 'inset 0 0 0 1px rgba(0,0,0,.08)';
      }
      var previewNum = document.createElement('span');
      previewNum.className = 'tpl-preview-num';
      var numMatch = String(tpl.name || '').match(/^\s*(\d{1,2})/);
      previewNum.textContent = numMatch ? numMatch[1] : key.charAt(0).toUpperCase();
      var previewMark = document.createElement('span');
      previewMark.className = 'tpl-preview-mark';
      previewMark.textContent = 'A & M';
      preview.appendChild(previewNum);
      preview.appendChild(previewMark);

      var swatches = document.createElement('div');
      swatches.className = 'tpl-swatches';
      colors.forEach(function (color) {
        var dot = document.createElement('span');
        dot.className = 'tpl-swatch';
        dot.style.background = color;
        dot.title = color;
        swatches.appendChild(dot);
      });

      var desc = document.createElement('p');
      desc.className = 'tpl-desc';
      desc.textContent = tplField(key, 'desc', tpl.desc || '');

      var actions = document.createElement('div');
      actions.className = 'card-actions';

      var demoBtn = document.createElement('button');
      demoBtn.type = 'button';
      demoBtn.className = 'btn btn-primary';
      demoBtn.textContent = uiText('tplDemo', 'Ver demo');
      demoBtn.addEventListener('click', function () { openDemo(key); });

      var chooseBtn = document.createElement('button');
      chooseBtn.type = 'button';
      chooseBtn.className = 'btn btn-ghost';
      chooseBtn.textContent = uiText('tplChoose', 'Elegir este');
      chooseBtn.addEventListener('click', function () { chooseTemplate(tpl); });

      actions.appendChild(demoBtn);
      actions.appendChild(chooseBtn);

      card.appendChild(header);
      card.appendChild(preview);
      card.appendChild(swatches);
      card.appendChild(desc);
      card.appendChild(actions);
      grid.appendChild(card);
    });
  }

  function chooseTemplate(tpl) {
    var select = el('contact-style');
    if (select) {
      var label = templateLabel(tpl);
      var found = false;
      Array.prototype.forEach.call(select.options, function (option) {
        if (option.value === label) {
          select.value = label;
          found = true;
        }
      });
      if (!found) {
        var custom = document.createElement('option');
        custom.value = label;
        custom.textContent = tpl.name;
        select.appendChild(custom);
        select.value = label;
      }
    }
    var target = el('contacto');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var nameInput = el('contact-name');
    if (nameInput) setTimeout(function () { nameInput.focus({ preventScroll: true }); }, 450);
  }

  /* ------------------------------------------------------------------
     MODAL DE DEMO
     ------------------------------------------------------------------ */
  function openDemo(key) {
    var modal = el('demo-modal');
    var frame = el('demo-iframe');
    if (!modal || !frame) return;

    lastFocus = document.activeElement;
    frame.src = 'invitacion.html?demo=' + encodeURIComponent(key);
    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    var title = el('modal-tpl-title');
    if (title && window.WEDDING_TEMPLATES && window.WEDDING_TEMPLATES[key]) {
      var tplMeta = window.WEDDING_TEMPLATES[key];
      title.textContent = uiText('tplDemoTitle', 'Demo · ') + stripNumber(tplField(key, 'name', tplMeta.name));
    }

    var close = el('btn-close-modal');
    if (close) close.focus();
    document.addEventListener('keydown', onModalKeydown);
  }

  function closeDemo() {
    var modal = el('demo-modal');
    var frame = el('demo-iframe');
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onModalKeydown);
    if (frame) frame.src = 'about:blank';
    if (lastFocus && lastFocus.focus) {
      try { lastFocus.focus(); } catch (e) {}
    }
    lastFocus = null;
  }

  function onModalKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeDemo();
    }
  }

  /* ------------------------------------------------------------------
     COMPRA
     ------------------------------------------------------------------ */
  function buy() {
    var stripe = window.safeUrl ? window.safeUrl(CFG.STRIPE_PAYMENT_LINK) : '';
    if (stripe && /^https:/i.test(stripe)) {
      window.open(stripe, '_blank', 'noopener');
      return;
    }
    if (!PHONE) {
      alert('El pago aún no está configurado. Escríbenos por email y lo cerramos manualmente.');
      return;
    }
    openWhatsapp(
      'Hola, quiero reservar una invitación de boda digital por ' + (CFG.PRICE_EUR || 39) + ' €. ' +
      '¿Me contáis cómo seguimos?'
    );
  }

  /* ------------------------------------------------------------------
     FORMULARIO DE CONTACTO
     ------------------------------------------------------------------ */
  function validateContact() {
    var name = el('contact-name');
    var phone = el('contact-phone');
    var email = el('contact-email');
    var consent = el('contact-consent');
    var error = el('contact-error');

    if (error) error.textContent = '';

    if (!name || clean(name.value, 120).length < 2) {
      if (error) error.textContent = 'Escribe vuestros nombres.';
      if (name) name.focus();
      return false;
    }
    if (!phone || clean(phone.value, 30).replace(/\D/g, '').length < 6) {
      if (error) error.textContent = 'Escribe un teléfono o WhatsApp de contacto.';
      if (phone) phone.focus();
      return false;
    }
    if (email && clean(email.value, 120) && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean(email.value, 120))) {
      if (error) error.textContent = 'El email no parece válido.';
      if (email) email.focus();
      return false;
    }
    if (!consent || !consent.checked) {
      if (error) error.textContent = 'Debes aceptar la política de privacidad para que podamos responderte.';
      if (consent) consent.focus();
      return false;
    }
    return true;
  }

  function submitContact(e) {
    e.preventDefault();
    if (!validateContact()) return;
    if (!PHONE) {
      var error = el('contact-error');
      if (error) error.textContent = 'El WhatsApp no está configurado. Escríbenos por email.';
      return;
    }

    var lines = [
      'Hola, soy ' + clean(el('contact-name').value, 120) + '.',
      'Quiero reservar una invitación de boda digital (' + (CFG.PRICE_EUR || 39) + ' €, todo incluido).'
    ];

    var phone = clean(el('contact-phone').value, 30);
    var email = clean(el('contact-email').value, 120);
    var date = clean(el('contact-date').value, 10);
    var style = clean(el('contact-style').value, 80);
    var message = clean(el('contact-message').value, 800);

    if (phone) lines.push('Mi WhatsApp: ' + phone);
    if (email) lines.push('Mi email: ' + email);
    if (date) {
      try {
        var parts = date.split('-');
        lines.push('Fecha de la boda: ' + parts[2] + '/' + parts[1] + '/' + parts[0]);
      } catch (err) {
        lines.push('Fecha de la boda: ' + date);
      }
    }
    if (style) lines.push('Diseño favorito: ' + style);
    if (message) lines.push('Detalles: ' + message);

    var opened = openWhatsapp(lines.join('\n'));
    var note = el('contact-error');
    if (!opened && note) {
      note.textContent = 'No se ha podido abrir WhatsApp. Escríbenos a ' + (CFG.CONTACT_EMAIL || 'nuestro email') + '.';
    } else if (note) {
      note.textContent = '';
      var button = e.target.querySelector('button[type="submit"]');
      if (button) {
        var original = button.textContent;
        button.textContent = '✓ WhatsApp abierto';
        setTimeout(function () { button.textContent = original; }, 3200);
      }
    }
  }

  function fillContactDirect() {
    var wa = document.querySelector('.contact-direct a[href^="https://wa.me/"]');
    if (wa && PHONE) {
      wa.href = 'https://wa.me/' + PHONE;
      wa.textContent = 'WhatsApp: +' + PHONE.replace(/^(\d{2})(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4');
    }
    var mail = document.querySelector('.contact-direct a[href^="mailto:"]');
    if (mail && CFG.CONTACT_EMAIL) {
      mail.href = 'mailto:' + CFG.CONTACT_EMAIL;
      mail.textContent = CFG.CONTACT_EMAIL;
    }
  }

  /* ------------------------------------------------------------------
     NAVEGACIÓN Y VARIOS
     ------------------------------------------------------------------ */
  function bindNav() {
    var toggle = el('nav-toggle');
    document.querySelectorAll('.site-nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (toggle) toggle.checked = false;
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !toggle) return;
      toggle.checked = false;
    });
  }

  function init() {
    renderCards();
    fillContactDirect();

    var year = el('year');
    if (year) year.textContent = String(new Date().getFullYear());

    var buyBtn = el('btn-buy');
    if (buyBtn) buyBtn.addEventListener('click', buy);

    var close = el('btn-close-modal');
    if (close) close.addEventListener('click', closeDemo);

    var modal = el('demo-modal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeDemo();
      });
    }

    var form = el('contact-form');
    if (form) form.addEventListener('submit', submitContact);

    bindNav();
    document.dispatchEvent(new CustomEvent('catalogo:listo'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
