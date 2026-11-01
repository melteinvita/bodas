/* =====================================================================
   PORTAL PRIVADO DE LOS NOVIOS
   ---------------------------------------------------------------------
   - Solo muestra las confirmaciones con una clave válida (token por boda).
   - No guarda la clave en la URL de otros enlaces ni en el CSV.
   - Pinta la tabla sin innerHTML: los datos de invitados nunca se
     interpretan como HTML.
   - Genera el QR localmente (js/qrcode.min.js), sin servicios externos.
   ===================================================================== */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var slug = (params.get('boda') || '').trim().toLowerCase();
  var token = (params.get('k') || '').trim();
  var invitationUrl = '';
  var wedding = null;
  var rsvps = [];
  var loading = false;

  function el(id) { return document.getElementById(id); }

  function storeKey() { return 'novios:' + (slug || 'sin-boda') + ':token'; }

  function savedToken() {
    try { return sessionStorage.getItem(storeKey()) || ''; } catch (e) { return ''; }
  }

  function saveToken(value) {
    try {
      if (value) sessionStorage.setItem(storeKey(), value);
      else sessionStorage.removeItem(storeKey());
    } catch (e) {}
  }

  function show(node, visible) {
    if (!node) return;
    node.hidden = !visible;
  }

  function showGate(message) {
    show(el('couple-loading'), false);
    show(el('couple-app'), false);
    show(el('couple-error'), false);
    show(el('access-gate'), true);
    var error = el('access-error');
    if (error) error.textContent = message || '';
    var input = el('access-token');
    if (input) {
      if (!input.value && token) input.value = token;
      input.focus();
    }
  }

  function showPortalError(message) {
    show(el('couple-loading'), false);
    show(el('access-gate'), false);
    show(el('couple-app'), false);
    show(el('couple-error'), true);
    var text = el('couple-error-text');
    if (text) text.textContent = message || 'El enlace no es válido o ha caducado.';
  }

  function showLoading() {
    show(el('access-gate'), false);
    show(el('couple-error'), false);
    show(el('couple-app'), false);
    show(el('couple-loading'), true);
  }

  /* ------------------------------------------------------------------
     FORMATO SEGURO
     ------------------------------------------------------------------ */
  function text(value) {
    return String(value == null ? '' : value).trim();
  }

  function isYes(value) {
    return /^(sí|si|s|yes|true|1)$/i.test(text(value));
  }

  function companionsOf(row) {
    var raw = row && (row.acompanantes != null ? row.acompanantes : row.companions);
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        return raw.split(/[,;\n]+/).map(function (name) {
          return { name: name.trim(), menu: '' };
        }).filter(function (c) { return c.name; });
      }
    }
    return [];
  }

  function companionsLabel(row) {
    var list = companionsOf(row);
    if (!list.length) return '';
    return list.map(function (c) {
      if (typeof c === 'string') return c;
      var name = text(c && (c.name || c.nombre));
      var menu = text(c && (c.menu || c.menu_preference));
      return menu ? name + ' (' + menu + ')' : name;
    }).filter(Boolean).join(' · ');
  }

  function hasAllergy(row) {
    return !!text(row && (row.alergias != null ? row.alergias : row.allergies));
  }

  function formatDate(value) {
    if (!value) return '';
    try {
      var date = new Date(value);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return '';
    }
  }

  /* ------------------------------------------------------------------
     CABECERA
     ------------------------------------------------------------------ */
  function renderHeader() {
    var d = wedding || {};
    var title = el('couple-title');
    if (title) {
      title.textContent = (d.n1 || d.n2)
        ? 'Boda de ' + text(d.n1) + ' & ' + text(d.n2)
        : 'Vuestra boda';
    }
    var date = el('couple-date');
    if (date) {
      var parts = [];
      if (d.date) parts.push(window.WeddingDates.format(d.date, 'es'));
      if (d.venue) parts.push(text(d.venue));
      date.textContent = parts.join(' · ');
    }
    document.title = 'Confirmaciones · ' + (text(d.n1) + ' & ' + text(d.n2)).replace(/^ & | & $/g, '');
  }

  /* ------------------------------------------------------------------
     ESTADÍSTICAS Y TABLA
     ------------------------------------------------------------------ */
  function isAttending(row) { return isYes(row.asiste); }
  function guestsOf(row) {
    var n = parseInt(row.personas, 10);
    return isNaN(n) || n < 1 ? 1 : n;
  }
  function usesBus(row) { return isYes(row.bus) || /^sí/i.test(text(row.bus)); }

  function visibleRows() {
    var query = text((el('search-guest') || {}).value).toLowerCase();
    var filter = (el('filter-status') || {}).value || 'all';

    return rsvps.filter(function (row) {
      if (filter === 'yes' && !isAttending(row)) return false;
      if (filter === 'no' && isAttending(row)) return false;
      if (filter === 'bus' && !usesBus(row)) return false;
      if (filter === 'allergy' && !hasAllergy(row)) return false;
      if (!query) return true;

      var haystack = [
        row.nombre, row.menu, row.alergias, row.cancion,
        companionsLabel(row), row.bus, row.asiste
      ].join(' ').toLowerCase();
      return haystack.indexOf(query) !== -1;
    });
  }

  function stat(id, value) {
    var node = el(id);
    if (node) node.textContent = String(value);
  }

  function renderStats() {
    var yes = 0, no = 0, bus = 0, allergies = 0;
    rsvps.forEach(function (row) {
      if (isAttending(row)) {
        yes += guestsOf(row);
        if (usesBus(row)) bus += guestsOf(row);
      } else {
        no += 1;
      }
      if (hasAllergy(row)) allergies += 1;
    });
    stat('c-yes', yes);
    stat('c-no', no);
    stat('c-bus', bus);
    stat('c-allergies', allergies);
  }

  function badge(row) {
    var span = document.createElement('span');
    span.className = 'rsvp-badge ' + (isAttending(row) ? 'is-yes' : 'is-no');
    span.textContent = isAttending(row) ? 'Sí' : 'No';
    return span;
  }

  function cell(value) {
    var td = document.createElement('td');
    if (value instanceof Node) td.appendChild(value);
    else td.textContent = text(value) || '—';
    return td;
  }

  function renderTable() {
    var tbody = el('couple-tbody');
    if (!tbody) return;
    tbody.textContent = '';

    var rows = visibleRows();
    rows.forEach(function (row) {
      var tr = document.createElement('tr');

      var nameCell = document.createElement('td');
      var strong = document.createElement('strong');
      strong.textContent = text(row.nombre) || 'Sin nombre';
      nameCell.appendChild(strong);
      var created = formatDate(row.created_at || row.createdAt);
      if (created) {
        var small = document.createElement('small');
        small.textContent = created;
        nameCell.appendChild(small);
      }
      tr.appendChild(nameCell);

      var attendCell = document.createElement('td');
      attendCell.appendChild(badge(row));
      tr.appendChild(attendCell);

      tr.appendChild(cell(isAttending(row) ? guestsOf(row) : '—'));
      tr.appendChild(cell(row.menu));
      tr.appendChild(cell(usesBus(row) ? 'Sí' : 'No'));
      tr.appendChild(cell(row.alergias));
      tr.appendChild(cell(row.cancion));
      tr.appendChild(cell(companionsLabel(row)));

      tbody.appendChild(tr);
    });

    var empty = el('couple-empty');
    if (empty) {
      empty.hidden = rows.length > 0;
      empty.textContent = rsvps.length
        ? 'Ningún invitado coincide con el filtro.'
        : 'Aún no hay confirmaciones.';
    }
  }

  function renderAll() {
    renderHeader();
    renderStats();
    renderTable();
    document.dispatchEvent(new CustomEvent('novios:rendered', { detail: { rsvps: rsvps } }));
  }

  /* ------------------------------------------------------------------
     ENLACE Y QR
     ------------------------------------------------------------------ */
  function drawQr() {
    var box = el('qr-code');
    if (!box || !invitationUrl) return;
    box.textContent = '';

    if (typeof window.QRCode !== 'function') {
      var fallback = document.createElement('a');
      fallback.href = invitationUrl;
      fallback.target = '_blank';
      fallback.rel = 'noopener';
      fallback.textContent = 'Abrir invitación';
      fallback.style.fontSize = '12px';
      box.appendChild(fallback);
      return;
    }

    try {
      new window.QRCode(box, {
        text: invitationUrl,
        width: 200,
        height: 200,
        colorDark: '#243021',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel ? window.QRCode.CorrectLevel.H : 2
      });
    } catch (e) {
      var link = document.createElement('a');
      link.href = invitationUrl;
      link.textContent = invitationUrl;
      link.style.fontSize = '11px';
      link.style.wordBreak = 'break-all';
      box.appendChild(link);
    }
  }

  function renderLinks() {
    if (window.Nube && window.Nube.linksFor) {
      invitationUrl = window.Nube.linksFor(slug, '').invitation;
    } else {
      invitationUrl = new URL('invitacion.html?boda=' + encodeURIComponent(slug), window.location.href).href;
    }

    var input = el('invite-link');
    if (input) input.value = invitationUrl;

    var open = el('btn-open-invite');
    if (open) open.href = invitationUrl;

    drawQr();
  }

  function shareWhatsapp() {
    var d = wedding || {};
    var message = '💍 ¡Nos casamos! ' + text(d.n1) + ' y ' + text(d.n2) +
      ' queremos compartir nuestra invitación de boda: ' + invitationUrl;
    window.open('https://wa.me/?text=' + encodeURIComponent(message), '_blank', 'noopener');
  }

  /* ------------------------------------------------------------------
     CARGA
     ------------------------------------------------------------------ */
  function load(accessToken, options) {
    if (loading) return;
    options = options || {};
    if (!slug) {
      showPortalError('El enlace no incluye la boda. Pide a MelTeInvita el enlace correcto.');
      return;
    }
    if (!accessToken) {
      showGate('');
      return;
    }
    if (!window.Nube || !window.Nube.cargarNovios) {
      showPortalError('No se ha podido cargar el conector de datos. Revisa tu conexión y vuelve a intentarlo.');
      return;
    }

    loading = true;
    showLoading();
    var submit = el('access-submit');
    if (submit) { submit.disabled = true; submit.textContent = 'Comprobando…'; }

    window.Nube.cargarNovios(slug, accessToken).then(function (result) {
      wedding = (result && result.wedding) || {};
      rsvps = (result && Array.isArray(result.rsvps)) ? result.rsvps : [];
      token = accessToken;
      saveToken(accessToken);
      renderLinks();
      renderAll();
      show(el('couple-loading'), false);
      show(el('couple-error'), false);
      show(el('access-gate'), false);
      show(el('couple-app'), true);
    }).catch(function (err) {
      var message = (err && err.message) ? err.message : '';
      var authProblem = err && (err.status === 401 || err.status === 403 || err.status === 400) ||
        /clave|token|válid|valid/i.test(message);

      if (authProblem) {
        saveToken('');
        showGate('La clave no es válida o ha cambiado. Revísala y vuelve a intentarlo.');
      } else if (options.silent) {
        show(el('couple-loading'), false);
        show(el('couple-app'), true);
      } else {
        showPortalError('No hemos podido conectar con el servidor. Revisa tu conexión y vuelve a intentarlo.');
      }
      if (window.console && console.error) console.error('[Portal novios]', err);
    }).then(function () {
      loading = false;
      if (submit) { submit.disabled = false; submit.textContent = 'Entrar'; }
    });
  }

  /* ------------------------------------------------------------------
     CSV
     ------------------------------------------------------------------ */
  function exportCsv() {
    var headers = ['Nombre', 'Asiste', 'Personas', 'Menú', 'Autobús', 'Alergias', 'Canción', 'Acompañantes', 'Fecha'];
    var rows = rsvps.map(function (row) {
      return [
        text(row.nombre),
        isAttending(row) ? 'Sí' : 'No',
        isAttending(row) ? guestsOf(row) : 0,
        text(row.menu),
        usesBus(row) ? 'Sí' : 'No',
        text(row.alergias),
        text(row.cancion),
        companionsLabel(row),
        formatDate(row.created_at || row.createdAt)
      ];
    });
    var filename = 'invitados-' + (slug || 'boda') + '.csv';
    if (window.downloadCsv) {
      window.downloadCsv(filename, headers, rows);
    } else {
      alert('No se ha podido preparar el CSV.');
    }
  }

  /* ------------------------------------------------------------------
     EVENTOS
     ------------------------------------------------------------------ */
  function bind() {
    var form = el('access-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = el('access-token');
        var value = input ? input.value.trim() : '';
        var error = el('access-error');
        if (error) error.textContent = '';
        if (!value) {
          if (error) error.textContent = 'Escribe la clave que te enviamos.';
          if (input) input.focus();
          return;
        }
        load(value);
      });
    }

    var refresh = el('btn-refresh-rsvp');
    if (refresh) {
      refresh.addEventListener('click', function () {
        if (!token) return showGate('');
        refresh.disabled = true;
        load(token, { silent: true });
        setTimeout(function () { refresh.disabled = false; }, 1200);
      });
    }

    var csv = el('btn-download-csv');
    if (csv) csv.addEventListener('click', exportCsv);

    var search = el('search-guest');
    if (search) search.addEventListener('input', renderTable);
    var filter = el('filter-status');
    if (filter) filter.addEventListener('change', renderTable);

    var copy = el('btn-copy-invite');
    if (copy) {
      copy.addEventListener('click', function () {
        window.copyText(invitationUrl).then(function (ok) {
          copy.textContent = ok ? '✓ Enlace copiado' : 'Copia el enlace manualmente';
          setTimeout(function () { copy.textContent = '📋 Copiar enlace'; }, 2200);
        });
      });
    }

    var wa = el('btn-share-wa');
    if (wa) wa.addEventListener('click', shareWhatsapp);

    var retry = el('couple-retry');
    if (retry) retry.addEventListener('click', function () { window.location.reload(); });
  }

  function init() {
    bind();

    var body = document.body;
    if (!body || body.dataset.page !== 'novios') return;

    if (!slug) {
      showPortalError('Falta el identificador de la boda en el enlace.');
      return;
    }

    if (!token) token = savedToken();

    if (token) {
      load(token);
    } else {
      showGate('');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
