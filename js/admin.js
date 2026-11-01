/* =====================================================================
   PANEL DE ADMINISTRACIÓN
   - Estado aislado por boda (wedding:<slug>:data)
   - Sin contraseña en el código
   - Sin invitados de ejemplo en producción
   - Toda la tabla se construye con textContent (sin XSS)
   ===================================================================== */
(function () {
  'use strict';

  var el = function (id) { return document.getElementById(id); };
  var CFG = window.APP_CONFIG || {};
  var slug = window.Store.slugFromLocation();
  var state = window.Store.loadData(slug);
  var rsvpList = window.Store.loadRsvp(slug);
  var toastTimer = null;

  var textFields = [
    'n1', 'n2', 'date', 'time', 'endTime', 'eyebrow', 'message',
    'storyTitle', 'storyText', 'venue', 'address', 'map',
    'dressCode', 'transportInfo', 'giftMessage', 'iban',
    'rsvpDeadline', 'envelopeStyle', 'defaultLanguage', 'contactPhone'
  ];
  var secKeys = ['story', 'itinerary', 'gallery', 'details', 'gifts', 'rsvp'];

  function showToast(msg) {
    var t = el('status-toast');
    if (t) t.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      if (t) t.textContent = 'Vista previa sincronizada en tiempo real.';
    }, 6000);
  }

  /* ------------------------------------------------------------------
     PLANTILLAS
     ------------------------------------------------------------------ */
  function renderTemplateCards() {
    var grid = el('templates-grid');
    if (!grid || !window.WEDDING_TEMPLATES) return;
    grid.textContent = '';

    Object.keys(window.WEDDING_TEMPLATES).forEach(function (key) {
      var tpl = window.WEDDING_TEMPLATES[key];
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'tpl-card' + (state.template === tpl.id ? ' selected' : '');
      card.setAttribute('aria-pressed', state.template === tpl.id ? 'true' : 'false');

      var header = document.createElement('div');
      header.className = 'tpl-header';
      var name = document.createElement('span');
      name.className = 'tpl-name';
      name.textContent = tpl.name;
      var badge = document.createElement('span');
      badge.className = 'tpl-badge';
      badge.textContent = tpl.badge;
      header.appendChild(name);
      header.appendChild(badge);

      var desc = document.createElement('p');
      desc.className = 'tpl-desc';
      desc.textContent = tpl.desc;

      var swatches = document.createElement('div');
      swatches.className = 'tpl-swatches';
      (tpl.colors || []).forEach(function (color) {
        var sw = document.createElement('span');
        sw.className = 'tpl-swatch';
        sw.style.background = color;
        swatches.appendChild(sw);
      });

      card.appendChild(header);
      card.appendChild(desc);
      card.appendChild(swatches);
      card.addEventListener('click', function () {
        state.template = tpl.id;
        state.envelopeStyle = tpl.defaultSealColor || state.envelopeStyle;
        if (el('envelopeStyle')) el('envelopeStyle').value = state.envelopeStyle;
        renderTemplateCards();
        syncAndPreview(false);
        showToast('Plantilla cambiada a: ' + tpl.name);
      });
      grid.appendChild(card);
    });
  }

  /* ------------------------------------------------------------------
     ITINERARIO
     ------------------------------------------------------------------ */
  var ICONS = [
    ['rings', '💍 Anillos'],
    ['church', '⛪ Ceremonia'],
    ['cheers', '🥂 Cóctel'],
    ['dinner', '🍽️ Banquete'],
    ['music', '🎶 Fiesta'],
    ['bus', '🚌 Autobús']
  ];

  function makeIconSelect(value, idx) {
    var select = document.createElement('select');
    select.setAttribute('data-idx', idx);
    select.setAttribute('data-field', 'icon');
    ICONS.forEach(function (opt) {
      var o = document.createElement('option');
      o.value = opt[0];
      o.textContent = opt[1];
      if (value === opt[0]) o.selected = true;
      select.appendChild(o);
    });
    return select;
  }

  function renderEventsEditor() {
    var container = el('events-container');
    if (!container) return;
    container.textContent = '';

    (state.events || []).forEach(function (ev, idx) {
      var row = document.createElement('div');
      row.className = 'event-row';

      var time = document.createElement('input');
      time.type = 'time';
      time.value = ev.time || '12:30';
      time.setAttribute('data-idx', idx);
      time.setAttribute('data-field', 'time');
      time.setAttribute('aria-label', 'Hora del evento ' + (idx + 1));

      var title = document.createElement('input');
      title.type = 'text';
      title.value = ev.title || '';
      title.placeholder = 'Evento (ej. Ceremonia)';
      title.maxLength = 120;
      title.setAttribute('data-idx', idx);
      title.setAttribute('data-field', 'title');
      title.setAttribute('aria-label', 'Título del evento ' + (idx + 1));

      var place = document.createElement('input');
      place.type = 'text';
      place.value = ev.place || '';
      place.placeholder = 'Lugar / zona';
      place.maxLength = 120;
      place.setAttribute('data-idx', idx);
      place.setAttribute('data-field', 'place');
      place.setAttribute('aria-label', 'Lugar del evento ' + (idx + 1));

      var select = makeIconSelect(ev.icon || 'rings', idx);

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn-del';
      del.title = 'Eliminar evento';
      del.setAttribute('aria-label', 'Eliminar evento ' + (idx + 1));
      del.textContent = '×';
      del.addEventListener('click', function () {
        state.events.splice(idx, 1);
        renderEventsEditor();
        syncAndPreview(false);
      });

      row.appendChild(time);
      row.appendChild(title);
      row.appendChild(place);
      row.appendChild(select);
      row.appendChild(del);
      container.appendChild(row);
    });

    container.querySelectorAll('input, select').forEach(function (input) {
      input.addEventListener('input', function () {
        var i = parseInt(input.getAttribute('data-idx'), 10);
        var field = input.getAttribute('data-field');
        if (!state.events[i]) return;
        state.events[i][field] = input.value;
        scheduleSync();
      });
      input.addEventListener('change', function () {
        var i = parseInt(input.getAttribute('data-idx'), 10);
        var field = input.getAttribute('data-field');
        if (!state.events[i]) return;
        state.events[i][field] = input.value;
        syncAndPreview(false);
      });
    });
  }

  if (el('btn-add-event')) {
    el('btn-add-event').addEventListener('click', function () {
      state.events = state.events || [];
      state.events.push({
        time: '20:00',
        title: 'Nuevo momento',
        place: 'Zona principal',
        icon: 'cheers'
      });
      renderEventsEditor();
      syncAndPreview(false);
    });
  }

  /* ------------------------------------------------------------------
     FORMULARIO
     ------------------------------------------------------------------ */
  function populateForm() {
    textFields.forEach(function (key) {
      if (el(key) && state[key] !== undefined && state[key] !== null) el(key).value = state[key];
    });

    if (el('maxGuests')) el('maxGuests').value = parseInt(state.maxGuests, 10) || 4;
    if (el('useEnvelope')) el('useEnvelope').checked = !!state.useEnvelope;
    if (el('musicEnabled')) el('musicEnabled').checked = state.musicEnabled !== false;

    secKeys.forEach(function (sk) {
      if (el('sec_' + sk)) el('sec_' + sk).checked = !!state.sections[sk];
    });

    renderTemplateCards();
    renderEventsEditor();
    renderPhotoPreviews();
    updatePreviewSrc();
    updateInviteLink();
  }

  function collectFormValues() {
    textFields.forEach(function (key) {
      if (el(key)) state[key] = el(key).value;
    });

    if (el('maxGuests')) {
      var n = parseInt(el('maxGuests').value, 10);
      state.maxGuests = Math.max(1, Math.min(10, isNaN(n) ? 4 : n));
    }
    if (el('useEnvelope')) state.useEnvelope = el('useEnvelope').checked;
    if (el('musicEnabled')) state.musicEnabled = el('musicEnabled').checked;

    secKeys.forEach(function (sk) {
      if (el('sec_' + sk)) state.sections[sk] = el('sec_' + sk).checked;
    });
    return state;
  }

  var scheduled = null;
  function scheduleSync() {
    clearTimeout(scheduled);
    scheduled = setTimeout(function () { syncAndPreview(false); }, 180);
  }

  function syncAndPreview(replayEnvelope) {
    collectFormValues();
    var saved = window.Store.saveData(slug, state);
    if (!saved) showToast('⚠️ Sin espacio en el navegador. Publica o reduce las fotos locales.');
    var iframe = el('preview-iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'UPDATE_INVITE',
        payload: state,
        replayEnvelope: !!replayEnvelope
      }, '*');
    }
    updateInviteLink();
  }

  function updatePreviewSrc(forceReplay) {
    var iframe = el('preview-iframe');
    if (!iframe) return;
    var src = 'invitacion.html?preview=1&boda=' + encodeURIComponent(slug) + (forceReplay ? '&replay=1' : '');
    if (iframe.getAttribute('src') !== src) iframe.src = src;
  }

  function updateInviteLink() {
    var link = el('btn-open-invite');
    if (!link) return;
    var published = window.Nube && window.Nube.getToken && window.Nube.getToken();
    link.href = window.Nube && window.Nube.linksFor ?
      (published ? window.Nube.linksFor(slug, published).invitation : window.Nube.linksFor(slug, '').invitation + '&preview=1') :
      'invitacion.html?preview=1&boda=' + encodeURIComponent(slug);
  }

  document.querySelectorAll('.panel-card input, .panel-card textarea, .panel-card select').forEach(function (input) {
    if (input.type === 'file' || input.id === 'rsvp-search') return;
    input.addEventListener('input', scheduleSync);
    input.addEventListener('change', function () { syncAndPreview(false); });
  });

  /* ------------------------------------------------------------------
     FOTOS
     ------------------------------------------------------------------ */
  function safePhoto(value) {
    return window.safeUrl(value, { image: true });
  }

  function renderPhotoPreviews() {
    var hero = el('hero-photo-preview');
    if (hero) {
      hero.textContent = '';
      var heroUrl = safePhoto(state.heroPhoto);
      if (heroUrl) {
        var img = document.createElement('img');
        img.src = heroUrl;
        img.alt = 'Foto de portada actual';
        var wrap = document.createElement('div');
        wrap.className = 'focus-picker';
        wrap.title = 'Haz clic donde estén las caras para que la portada las mantenga siempre visibles';
        wrap.appendChild(img);
        var fm = String(state.heroPhotoFocus || '').match(/^(\d{1,3}(?:\.\d+)?)% (\d{1,3}(?:\.\d+)?)%$/);
        var fx = fm ? parseFloat(fm[1]) : 50, fy = fm ? parseFloat(fm[2]) : 30;
        var dot = document.createElement('i');
        dot.className = 'focus-dot';
        dot.style.left = fx + '%';
        dot.style.top = fy + '%';
        wrap.appendChild(dot);
        wrap.addEventListener('click', function (ev) {
          var r = wrap.getBoundingClientRect();
          if (!r.width || !r.height) return;
          var x = Math.max(0, Math.min(100, Math.round((ev.clientX - r.left) / r.width * 100)));
          var y = Math.max(0, Math.min(100, Math.round((ev.clientY - r.top) / r.height * 100)));
          state.heroPhotoFocus = x + '% ' + y + '%';
          dot.style.left = x + '%';
          dot.style.top = y + '%';
          syncAndPreview(false);
        });
        hero.appendChild(wrap);
        var hint = document.createElement('p');
        hint.className = 'focus-hint';
        hint.textContent = 'Toca la foto donde estén las caras: la portada las mantendrá centradas en cualquier pantalla.';
        hero.appendChild(hint);
      }
    }

    var gallery = el('gallery-preview');
    if (gallery) {
      gallery.textContent = '';
      (state.galleryPhotos || []).forEach(function (photo, index) {
        var url = safePhoto(photo);
        if (!url) return;
        var img = document.createElement('img');
        img.src = url;
        img.alt = 'Foto de galería ' + (index + 1);
        gallery.appendChild(img);
      });
    }
  }

  function compressImage(file, maxWidth, callback) {
    if (!file || !/^image\//.test(file.type)) {
      callback(new Error('El archivo no es una imagen válida.'));
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      callback(new Error('La imagen supera los 12 MB. Usa una más ligera.'));
      return;
    }
    var reader = new FileReader();
    reader.onerror = function () { callback(new Error('No se pudo leer la imagen.')); };
    reader.onload = function (e) {
      var img = new Image();
      img.onerror = function () { callback(new Error('No se pudo procesar la imagen.')); };
      img.onload = function () {
        try {
          var canvas = document.createElement('canvas');
          var w = img.width;
          var h = img.height;
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          callback(null, canvas.toDataURL('image/jpeg', 0.82));
        } catch (err) {
          callback(err);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function savePhotoLocally(dataUrl, kind) {
    if (window.Nube && window.Nube.isAdmin && window.Nube.isAdmin()) {
      showToast('Subiendo ' + kind + ' a Storage…');
      return window.Nube.uploadDataUrl(dataUrl, slug, kind).then(function (url) {
        showToast('✓ Foto subida a Supabase Storage.');
        return url;
      }).catch(function (err) {
        showToast('⚠️ No se pudo subir: ' + err.message + ' Se guardará en local y se subirá al publicar.');
        return dataUrl;
      });
    }
    return Promise.resolve(dataUrl);
  }

  if (el('heroPhotoInput')) {
    el('heroPhotoInput').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      compressImage(file, 1600, function (err, dataUrl) {
        if (err) { showToast('⚠️ ' + err.message); return; }
        savePhotoLocally(dataUrl, 'portada').then(function (url) {
          state.heroPhoto = url;
          state.heroPhotoFocus = '';
          renderPhotoPreviews();
          syncAndPreview(false);
          if (!/^data:/.test(url)) showToast('✓ Foto de portada optimizada y subida.');
          else showToast('✓ Foto de portada optimizada (se subirá al publicar).');
        });
      });
    });
  }

  if (el('btn-clear-hero')) {
    el('btn-clear-hero').addEventListener('click', function () {
      state.heroPhoto = '';
      state.heroPhotoFocus = '';
      if (el('heroPhotoInput')) el('heroPhotoInput').value = '';
      renderPhotoPreviews();
      syncAndPreview(false);
      showToast('Usando la fotografía original de la plantilla.');
    });
  }

  if (el('galleryInput')) {
    el('galleryInput').addEventListener('change', function (e) {
      var files = Array.from(e.target.files || []).slice(0, 8);
      e.target.value = '';
      if (!files.length) return;
      var results = [];
      var done = 0;
      files.forEach(function (file) {
        compressImage(file, 1000, function (err, dataUrl) {
          if (!err && dataUrl) results.push(dataUrl);
          done++;
          if (done === files.length) {
            if (!results.length) { showToast('⚠️ No se pudo procesar ninguna foto.'); return; }
            Promise.all(results.map(function (url, i) {
              return savePhotoLocally(url, 'galeria-' + (i + 1));
            })).then(function (urls) {
              state.galleryPhotos = (state.galleryPhotos || []).concat(urls).slice(0, 8);
              renderPhotoPreviews();
              syncAndPreview(false);
              showToast('✓ ' + urls.length + ' fotos añadidas a la galería.');
            });
          }
        });
      });
    });
  }

  if (el('btn-clear-gallery')) {
    el('btn-clear-gallery').addEventListener('click', function () {
      if (!confirm('¿Vaciar la galería de fotos?')) return;
      state.galleryPhotos = [];
      if (el('galleryInput')) el('galleryInput').value = '';
      renderPhotoPreviews();
      syncAndPreview(false);
      showToast('Galería vaciada.');
    });
  }

  /* ------------------------------------------------------------------
     ACCIONES SUPERIORES
     ------------------------------------------------------------------ */
  if (el('btn-save')) {
    el('btn-save').addEventListener('click', function () {
      syncAndPreview(false);
      showToast('💾 Cambios guardados en este navegador. Pulsa «Publicar online» para subirlos.');
    });
  }

  if (el('btn-reset')) {
    el('btn-reset').addEventListener('click', function () {
      if (!confirm('Se restaurarán los datos de demostración de esta boda. ¿Continuar?')) return;
      window.Store.removeData(slug);
      state = window.Store.loadData(slug);
      rsvpList = [];
      window.Store.saveRsvp(slug, rsvpList);
      populateForm();
      renderRsvpTable();
      syncAndPreview(true);
      showToast('↺ Datos restaurados a la demostración inicial.');
    });
  }

  if (el('btn-export-json')) {
    el('btn-export-json').addEventListener('click', function () {
      collectFormValues();
      var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'boda-' + window.slugify((state.n1 || 'pareja') + '-' + (state.n2 || 'boda')) + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      showToast('⬇ Archivo JSON de la boda descargado.');
    });
  }

  if (el('btn-copy-wa')) {
    el('btn-copy-wa').addEventListener('click', function () {
      var token = window.Nube && window.Nube.getToken ? window.Nube.getToken() : '';
      var links = window.Nube && window.Nube.linksFor ? window.Nube.linksFor(slug, token) : { invitation: '' };
      var msg = '✨ ¡Hola! Aquí tenéis vuestra invitación digital de boda de ' +
        (state.n1 || '') + ' y ' + (state.n2 || '') + ' (' + (state.date || '') + ').\n' +
        'Enlace para invitados: ' + links.invitation + '\n' +
        '¡Esperamos que os encante!';
      window.copyText(msg).then(function (ok) {
        showToast(ok ? '💬 Mensaje para el cliente copiado.' : 'No se pudo copiar el mensaje.');
      });
    });
  }

  if (el('btn-replay-envelope')) {
    el('btn-replay-envelope').addEventListener('click', function () {
      state.useEnvelope = true;
      if (el('useEnvelope')) el('useEnvelope').checked = true;
      syncAndPreview(true);
      var iframe = el('preview-iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'REPLAY_ENVELOPE' }, '*');
      }
      showToast('✉️ Sobre cerrado en la vista previa: toca el sello para abrirlo.');
    });
  }

  /* ------------------------------------------------------------------
     RSVP
     ------------------------------------------------------------------ */
  function setRsvpList(list) {
    rsvpList = Array.isArray(list) ? list.slice() : [];
    window.Store.saveRsvp(slug, rsvpList);
    renderRsvpTable();
  }

  function hasAllergy(item) {
    var a = String(item.allergies || '').trim().toLowerCase();
    return !!a && a !== 'ninguna' && a !== '-' && a !== 'no';
  }

  function companionsText(item) {
    if (!Array.isArray(item.companions) || !item.companions.length) return '';
    return item.companions.map(function (c) {
      var name = c.name || 'Acompañante';
      return c.menu ? name + ' — ' + c.menu : name;
    }).join(' · ');
  }

  function renderRsvpTable() {
    var tbody = el('rsvp-tbody');
    if (!tbody) return;
    tbody.textContent = '';

    var q = (el('rsvp-search') ? el('rsvp-search').value : '').trim().toLowerCase();
    var totalYes = 0, totalNo = 0, totalBus = 0, totalAllergies = 0;

    rsvpList.forEach(function (item) {
      var count = parseInt(item.guests, 10) || 1;
      if (item.attending === 'Sí') {
        totalYes += count;
        if (item.bus === 'Sí') totalBus += count;
        if (hasAllergy(item)) totalAllergies++;
      } else {
        totalNo += count;
      }
    });

    if (el('stat-yes')) el('stat-yes').textContent = totalYes;
    if (el('stat-no')) el('stat-no').textContent = totalNo;
    if (el('stat-bus')) el('stat-bus').textContent = totalBus;
    if (el('stat-allergies')) el('stat-allergies').textContent = totalAllergies;

    var filtered = rsvpList.filter(function (item) {
      if (!q) return true;
      var hay = [item.name, item.allergies, item.song, item.menu, item.bus, companionsText(item)].join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    });

    filtered.forEach(function (item) {
      var tr = document.createElement('tr');

      var tdName = document.createElement('td');
      var strong = document.createElement('strong');
      strong.textContent = item.name || '(sin nombre)';
      tdName.appendChild(strong);
      if (item.created_at) {
        var date = document.createElement('small');
        try {
          date.textContent = new Date(item.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
        } catch (e) { date.textContent = String(item.created_at); }
        tdName.appendChild(date);
      }
      if (item.demo) {
        var demo = document.createElement('small');
        demo.textContent = 'Prueba local';
        tdName.appendChild(demo);
      }

      var tdAttend = document.createElement('td');
      tdAttend.textContent = item.attending === 'Sí' ? '✅ Sí' : '❌ No';
      var tdGuests = document.createElement('td');
      tdGuests.textContent = String(item.guests || 1);
      var tdMenu = document.createElement('td');
      tdMenu.textContent = item.menu || '—';
      var tdBus = document.createElement('td');
      tdBus.textContent = item.bus || 'No';
      var tdAllergies = document.createElement('td');
      tdAllergies.textContent = item.allergies || 'Ninguna';
      var tdSong = document.createElement('td');
      tdSong.textContent = item.song || '—';
      var tdComp = document.createElement('td');
      tdComp.textContent = companionsText(item) || '—';

      var tdActions = document.createElement('td');
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn-delete';
      del.title = 'Eliminar confirmación';
      del.setAttribute('aria-label', 'Eliminar confirmación de ' + (item.name || 'invitado'));
      del.textContent = '🗑';
      del.addEventListener('click', function () {
        removeRsvp(item);
      });
      tdActions.appendChild(del);

      [tdName, tdAttend, tdGuests, tdMenu, tdBus, tdAllergies, tdSong, tdComp, tdActions].forEach(function (td) {
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    var empty = el('rsvp-empty');
    if (empty) empty.hidden = filtered.length > 0;
  }

  function removeRsvp(item) {
    if (!confirm('¿Eliminar la confirmación de ' + (item.name || 'este invitado') + '?')) return;
    var isCloud = item.id && String(item.id).indexOf('-') !== -1;
    var done = function () {
      rsvpList = rsvpList.filter(function (x) { return x !== item && x.id !== item.id; });
      window.Store.saveRsvp(slug, rsvpList);
      renderRsvpTable();
      showToast('Confirmación eliminada.');
    };
    if (isCloud && window.Nube && window.Nube.deleteRsvp && window.Nube.isAdmin()) {
      window.Nube.deleteRsvp(item.id).then(done).catch(function (err) {
        showToast('⚠️ No se pudo borrar en la nube: ' + err.message);
      });
    } else {
      done();
      if (isCloud) showToast('Quitada de este navegador. Inicia sesión para borrarla también en la nube.');
    }
  }

  if (el('rsvp-search')) el('rsvp-search').addEventListener('input', renderRsvpTable);

  if (el('btn-refresh-rsvp')) {
    el('btn-refresh-rsvp').addEventListener('click', function () {
      if (window.Nube && window.Nube.isAdmin && window.Nube.isAdmin()) {
        showToast('Actualizando confirmaciones…');
        window.Nube.reloadRsvps().then(function (list) {
          setRsvpList(list);
          showToast('✓ Confirmaciones actualizadas.');
        }).catch(function () {});
      } else {
        showToast('Inicia sesión para actualizar desde la nube. Mostrando la copia local.');
      }
    });
  }

  if (el('btn-export-csv')) {
    el('btn-export-csv').addEventListener('click', function () {
      var headers = ['Nombre', 'Asiste', 'Personas', 'Menu', 'Autobus', 'Alergias', 'Cancion', 'Acompanantes', 'Consentimiento', 'Fecha'];
      var rows = rsvpList.map(function (r) {
        return [
          r.name || '',
          r.attending || '',
          r.guests || 1,
          r.menu || '',
          r.bus || '',
          r.allergies || '',
          r.song || '',
          companionsText(r),
          r.consent ? 'Sí' : 'No',
          r.created_at ? new Date(r.created_at).toLocaleString('es-ES') : ''
        ];
      });
      window.downloadCsv('invitados-' + window.slugify((state.n1 || 'boda') + '-' + (state.n2 || '')) + '.csv', headers, rows);
      showToast('📊 CSV descargado correctamente.');
    });
  }

  window.addEventListener('message', function (ev) {
    if (!ev.data) return;
    if (ev.data.type === 'RSVP_ADDED') {
      rsvpList = window.Store.loadRsvp(slug);
      renderRsvpTable();
      showToast('🎉 Nueva confirmación recibida desde la invitación.');
    }
  });

  window.addEventListener('wedding:storage-error', function () {
    showToast('⚠️ El navegador se ha quedado sin espacio. Publica la boda o reduce las fotos.');
  });

  /* ------------------------------------------------------------------
     API PARA NUBE.JS
     ------------------------------------------------------------------ */
  function loadFromCloud(data, rsvps, token) {
    var cloudSlug = (window.Nube && window.Nube.getAdminSlug && window.Nube.getAdminSlug()) || slug;
    slug = cloudSlug;
    var base = window.Store.loadData(slug);
    state = Object.assign({}, base, data || {}, {
      sections: Object.assign({}, base.sections || {}, (data && data.sections) || {}),
      events: (data && Array.isArray(data.events)) ? data.events : (base.events || [])
    });
    window.Store.saveData(slug, state);
    populateForm();
    setRsvpList(rsvps || []);
    if (window.Nube) window.Nube.setToken(token || '');
    updatePreviewSrc();
    showToast('✓ Boda cargada desde la nube.');
  }

  function switchSlug(newSlug) {
    var clean = window.slugify(newSlug);
    if (!clean || clean === slug) return;
    syncAndPreview(false);
    var hadData = window.Store.hasData(clean);
    slug = clean;
    if (window.Nube && window.Nube.setAdminSlug) window.Nube.setAdminSlug(slug);
    state = window.Store.loadData(slug);
    rsvpList = window.Store.loadRsvp(slug);
    window.Store.saveData(slug, state);
    populateForm();
    renderRsvpTable();
    updatePreviewSrc();
    showToast(hadData ? 'Boda «' + slug + '» cargada.' : 'Nueva boda «' + slug + '»: datos de demo cargados. Edita y publica.');
  }

  function markPublished(publishedSlug) {
    if (publishedSlug) slug = publishedSlug;
    updatePreviewSrc();
    updateInviteLink();
    showToast('✅ Publicada. El enlace de invitados y el portal de novios están listos arriba.');
  }

  window.AdminPanel = {
    switchSlug: switchSlug,
    loadFromCloud: loadFromCloud,
    setRsvpList: setRsvpList,
    markPublished: markPublished,
    getSlug: function () { return slug; }
  };

  // Compatibilidad con versiones anteriores de nube.js
  window.getWeddingState = function () {
    collectFormValues();
    return JSON.parse(JSON.stringify(state));
  };
  window.setWeddingState = function (data) {
    state = Object.assign({}, window.Store.loadData(slug), data || {});
    window.Store.saveData(slug, state);
    populateForm();
  };

  /* ------------------------------------------------------------------
     PESTAÑAS DEL PANEL
     ------------------------------------------------------------------ */
  function setupTabs() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll('.tab-btn'));
    var panes = Array.prototype.slice.call(document.querySelectorAll('.tab-pane'));
    if (!buttons.length || !panes.length) return;

    function activate(id) {
      buttons.forEach(function (btn) {
        var on = btn.getAttribute('data-tab') === id;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
        btn.tabIndex = on ? 0 : -1;
      });
      panes.forEach(function (pane) {
        var on = pane.id === id;
        pane.classList.toggle('active', on);
        pane.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
    }

    buttons.forEach(function (btn, idx) {
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', btn.classList.contains('active') ? 'true' : 'false');
      var targetID = btn.getAttribute('data-tab');
      var pane = targetID ? document.getElementById(targetID) : null;
      if (pane) {
        if (!btn.id) btn.id = 'tabbtn-' + targetID;
        btn.setAttribute('aria-controls', targetID);
        pane.setAttribute('role', 'tabpanel');
        pane.setAttribute('aria-labelledby', btn.id);
        pane.setAttribute('aria-hidden', pane.classList.contains('active') ? 'false' : 'true');
      }
      btn.addEventListener('click', function () {
        activate(btn.getAttribute('data-tab'));
      });
      btn.addEventListener('keydown', function (ev) {
        if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
        ev.preventDefault();
        var delta = ev.key === 'ArrowRight' ? 1 : -1;
        var next = buttons[(idx + delta + buttons.length) % buttons.length];
        next.focus();
        activate(next.getAttribute('data-tab'));
      });
    });

    var hash = String(window.location.hash || '').replace('#', '');
    var target = hash ? document.getElementById(hash) : null;
    if (target && target.classList.contains('tab-pane')) activate(hash);
  }

  // Inicializar
  setupTabs();
  populateForm();
  renderRsvpTable();
})();
