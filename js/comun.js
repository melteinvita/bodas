/* =====================================================================
   UTILIDADES COMUNES: seguridad, fechas, almacenamiento por boda y CSV
   ===================================================================== */
(function () {
  'use strict';

  var CONFIG = window.APP_CONFIG || {};

  /* ------------------------------------------------------------------
     1. ESCAPADO Y URLS SEGURAS
     ------------------------------------------------------------------ */
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Devuelve una URL segura o ''. Evita javascript:, data: en enlaces, etc.
  function safeUrl(value, options) {
    options = options || {};
    var raw = String(value == null ? '' : value).trim();
    if (!raw) return '';

    if (raw.charAt(0) === '#') return raw;

    if (options.image && /^data:image\/(jpeg|png|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(raw)) {
      return raw;
    }
    // Rutas relativas del propio proyecto (file:// también funciona en local).
    if (/^(img|audio|css|js)\//.test(raw) || /^[a-z0-9._-]+\.(html|jpg|jpeg|png|webp|gif|mp3|css|js)$/i.test(raw)) {
      return raw;
    }

    try {
      var url = new URL(raw, window.location.href);
      var allowed = ['http:', 'https:'];
      if (!options.image) allowed = allowed.concat(['mailto:', 'tel:']);
      if (allowed.indexOf(url.protocol) === -1) return '';
      return url.href;
    } catch (e) {
      return '';
    }
  }

  function cssImageUrl(value) {
    var url = safeUrl(value, { image: true });
    if (!url) return '';
    return 'url("' + url.replace(/["\\\n\r]/g, function (c) {
      return '\\' + c.charCodeAt(0).toString(16) + ' ';
    }) + '")';
  }

  /* ------------------------------------------------------------------
     2. CSV SEGURO (anti fórmula de Excel)
     ------------------------------------------------------------------ */
  function csvCell(value) {
    var text = String(value == null ? '' : value);
    // Si empieza por = + - @ (o tab/CR), Excel lo interpreta como fórmula.
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function downloadCsv(filename, headers, rows) {
    var lines = [headers.map(csvCell).join(';')];
    rows.forEach(function (row) {
      lines.push(row.map(csvCell).join(';'));
    });
    var csv = String.fromCharCode(0xFEFF) + lines.join('\r\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  }

  /* ------------------------------------------------------------------
     3. FECHAS Y HORA DE MADRID
     ------------------------------------------------------------------ */
  var LOCALES = { es: 'es-ES', val: 'ca-ES', en: 'en-GB' };

  function localeFor(lang) {
    return LOCALES[lang] || LOCALES.es;
  }

  function parseDateParts(value) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!m) return null;
    return { year: +m[1], month: +m[2], day: +m[3] };
  }

  function parseTimeParts(value) {
    var m = /^(\d{1,2}):(\d{2})/.exec(String(value || ''));
    if (!m) return null;
    return { hour: Math.min(23, +m[1]), minute: Math.min(59, +m[2]) };
  }

  function formatWeddingDate(value, lang) {
    var p = parseDateParts(value);
    if (!p) return String(value || '');
    var date = new Date(Date.UTC(p.year, p.month - 1, p.day, 12, 0, 0));
    try {
      return date.toLocaleDateString(localeFor(lang), {
        day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC'
      }).toUpperCase();
    } catch (e) {
      return value;
    }
  }

  function formatWeddingDateShort(value) {
    var p = parseDateParts(value);
    if (!p) return '';
    return String(p.day).padStart(2, '0') + ' · ' + String(p.month).padStart(2, '0') + ' · ' + p.year;
  }

  // Desfase de una zona horaria concreta (minutos) para una fecha UTC.
  function timeZoneOffsetMinutes(timeZone, date) {
    try {
      var dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: timeZone, hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      var parts = {};
      dtf.formatToParts(date).forEach(function (p) { parts[p.type] = p.value; });
      var asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, (+parts.hour) % 24, +parts.minute, +parts.second);
      return Math.round((asUTC - date.getTime()) / 60000);
    } catch (e) {
      return -120; // España en verano como aproximación
    }
  }

  // Convierte una hora civil de Madrid a un objeto Date UTC correcto.
  function madridDate(dateValue, timeValue) {
    var d = parseDateParts(dateValue) || { year: 2027, month: 6, day: 12 };
    var t = parseTimeParts(timeValue) || { hour: 12, minute: 30 };
    var target = Date.UTC(d.year, d.month - 1, d.day, t.hour, t.minute, 0);
    var guess = target;
    for (var i = 0; i < 3; i++) {
      guess = target - timeZoneOffsetMinutes('Europe/Madrid', new Date(guess)) * 60000;
    }
    return new Date(guess);
  }

  function compactUtc(date) {
    return String(date.getUTCFullYear()) +
      String(date.getUTCMonth() + 1).padStart(2, '0') +
      String(date.getUTCDate()).padStart(2, '0') + 'T' +
      String(date.getUTCHours()).padStart(2, '0') +
      String(date.getUTCMinutes()).padStart(2, '0') + '00';
  }

  function googleCalendarUrl(data) {
    data = data || {};
    var start = madridDate(data.date, data.time);
    var endTime = data.endTime || '23:30';
    var end = madridDate(data.date, endTime);
    if (end <= start) end = new Date(end.getTime() + 24 * 3600 * 1000);

    var title = 'Boda de ' + (data.n1 || '') + ' y ' + (data.n2 || '');
    var location = [data.venue, data.address].filter(Boolean).join(', ');
    var details = data.message || '';
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent(title) +
      '&dates=' + compactUtc(start) + '/' + compactUtc(end) +
      '&ctz=Europe%2FMadrid' +
      '&location=' + encodeURIComponent(location) +
      '&details=' + encodeURIComponent(details);
  }

  /* ------------------------------------------------------------------
     4. ALMACENAMIENTO AISLADO POR BODA
     ------------------------------------------------------------------ */
  function deepDefaults() {
    try {
      return JSON.parse(JSON.stringify(window.DEFAULT_WEDDING_DATA || {}));
    } catch (e) {
      return {};
    }
  }

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function mergeData(base, saved) {
    var out = Object.assign({}, base, saved || {});
    out.sections = Object.assign({}, (base && base.sections) || {}, (saved && saved.sections) || {});
    if (!Array.isArray(out.events)) out.events = (base && base.events) || [];
    if (!Array.isArray(out.galleryPhotos)) out.galleryPhotos = [];
    delete out.token;       // el token de novios nunca vive en el JSON público
    delete out.clave_admin; // compatibilidad con versiones antiguas
    return out;
  }

  function keysFor(slug) {
    var safe = String(slug || 'sin-boda');
    return {
      data: 'wedding:' + safe + ':data',
      rsvp: 'wedding:' + safe + ':rsvp',
      env: 'wedding:' + safe + ':envelope-opened',
      client: 'wedding:' + safe + ':client-id'
    };
  }

  var Store = {
    keys: keysFor,

    slugFromLocation: function () {
      var params = new URLSearchParams(window.location.search);
      var fromUrl = (params.get('boda') || '').trim();
      if (fromUrl) return fromUrl.toLowerCase();
      if (document.body && document.body.dataset.slug) return document.body.dataset.slug;
      return CONFIG.DEFAULT_SLUG || 'alejandro-y-martina';
    },

    hasData: function (slug) {
      return !!localStorage.getItem(keysFor(slug).data);
    },

    loadData: function (slug, options) {
      options = options || {};
      var base = deepDefaults();
      if (!slug) return base;
      var saved = readJson(keysFor(slug).data, null);
      if (!saved) return options.allowDefaults === false ? null : base;
      return mergeData(base, saved);
    },

    saveData: function (slug, data) {
      if (!slug) return false;
      var clean = mergeData(deepDefaults(), data || {});
      delete clean.token;
      try {
        localStorage.setItem(keysFor(slug).data, JSON.stringify(clean));
        return true;
      } catch (e) {
        window.dispatchEvent(new CustomEvent('wedding:storage-error', { detail: e }));
        return false;
      }
    },

    removeData: function (slug) {
      try { localStorage.removeItem(keysFor(slug).data); } catch (e) {}
    },

    loadRsvp: function (slug) {
      var list = readJson(keysFor(slug).rsvp, []);
      return Array.isArray(list) ? list : [];
    },

    saveRsvp: function (slug, list) {
      if (!slug) return false;
      try {
        localStorage.setItem(keysFor(slug).rsvp, JSON.stringify(Array.isArray(list) ? list : []));
        return true;
      } catch (e) {
        return false;
      }
    },

    hasOpenedEnvelope: function (slug) {
      try { return sessionStorage.getItem(keysFor(slug).env) === '1'; } catch (e) { return false; }
    },

    markEnvelopeOpened: function (slug) {
      try { sessionStorage.setItem(keysFor(slug).env, '1'); } catch (e) {}
    },

    clientId: function (slug) {
      var key = keysFor(slug).client;
      try {
        var existing = sessionStorage.getItem(key);
        if (existing) return existing;
        var id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() :
          'c-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
        sessionStorage.setItem(key, id);
        return id;
      } catch (e) {
        return 'c-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
      }
    },

    uid: function () {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
      return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    }
  };

  /* ------------------------------------------------------------------
     5. VARIOS
     ------------------------------------------------------------------ */
  function slugify(value) {
    return String(value || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64);
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments, self = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(self, args); }, wait);
    };
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) {
      return false;
    }
  }

  window.esc = esc;
  window.safeUrl = safeUrl;
  window.cssImageUrl = cssImageUrl;
  window.csvCell = csvCell;
  window.downloadCsv = downloadCsv;
  window.copyText = copyText;
  window.slugify = slugify;
  window.debounce = debounce;
  window.Store = Store;
  window.WeddingDates = {
    format: formatWeddingDate,
    short: formatWeddingDateShort,
    googleCalendar: googleCalendarUrl,
    madridDate: madridDate,
    localeFor: localeFor
  };
})();
