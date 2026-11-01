/* =====================================================================
   CONEXIÓN CON SUPABASE
   - Publicar y leer confirmaciones: solo con sesión de administrador.
   - Invitación pública: lee la vista bodas_publicas (sin token ni claves).
   - RSVP: función RPC validada; nunca escribe directamente en la tabla.
   - Portal de novios: función RPC protegida con token por boda.
   ===================================================================== */
(function () {
  'use strict';

  var CFG = window.APP_CONFIG || {};
  var SUPABASE_URL = String(CFG.SUPABASE_URL || '').replace(/\/+$/, '');
  var SUPABASE_KEY = CFG.SUPABASE_ANON_KEY || '';
  var BUCKET = CFG.STORAGE_BUCKET || 'fotos-bodas';
  var SESSION_KEY = 'melvinta:supabase-session';
  var isConfigured = /^https:\/\//.test(SUPABASE_URL) && SUPABASE_KEY.length > 20;

  var session = readSession();
  var adminSlug = null;
  var adminToken = null;
  var busy = false;

  /* ------------------------------------------------------------------
     SESIÓN Y AUTENTICACIÓN
     ------------------------------------------------------------------ */
  function readSession() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveSession(data) {
    if (!data || !data.access_token) {
      session = null;
      try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
      return;
    }
    session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || (session && session.refresh_token) || '',
      expires_at: Date.now() + ((data.expires_in || 3600) * 1000) - 30000,
      email: (data.user && data.user.email) || (session && session.email) || ''
    };
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (e) {}
  }

  function clearSession() {
    session = null;
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  function authRequest(path, options) {
    options = options || {};
    var headers = {
      apikey: SUPABASE_KEY,
      'Content-Type': 'application/json'
    };
    if (options.token) headers.Authorization = 'Bearer ' + options.token;
    if (options.accessToken) headers.Authorization = 'Bearer ' + options.accessToken;
    return fetch(SUPABASE_URL + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    }).then(function (res) {
      return res.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
        if (!res.ok) {
          var err = new Error((data && (data.msg || data.message || data.error_description)) || ('Error ' + res.status));
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  function login(email, password) {
    if (!isConfigured) return Promise.reject(new Error('Supabase no está configurado.'));
    return authRequest('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: { email: email, password: password }
    }).then(function (data) {
      saveSession(data);
      updateAuthUi();
      return data;
    });
  }

  function refreshSession() {
    if (!session || !session.refresh_token) return Promise.resolve(null);
    return authRequest('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: { refresh_token: session.refresh_token }
    }).then(function (data) {
      saveSession(data);
      updateAuthUi();
      return data.access_token;
    }).catch(function () {
      clearSession();
      updateAuthUi();
      return null;
    });
  }

  function getAccessToken() {
    if (!session || !session.access_token) return Promise.resolve(null);
    if (Date.now() < session.expires_at) return Promise.resolve(session.access_token);
    return refreshSession();
  }

  function logout() {
    var token = session && session.access_token;
    return (token ? authRequest('/auth/v1/logout', { method: 'POST', accessToken: token }).catch(function () {}) : Promise.resolve())
      .then(function () {
        clearSession();
        adminToken = null;
        updateAuthUi();
        setProgress('Sesión cerrada.');
      });
  }

  function isAdmin() {
    return !!(session && session.access_token);
  }

  /* ------------------------------------------------------------------
     REST GENÉRICO
     ------------------------------------------------------------------ */
  function rest(path, options) {
    options = options || {};
    var headers = {
      apikey: SUPABASE_KEY,
      'Content-Type': 'application/json'
    };
    var tokenPromise = options.auth ? getAccessToken() : Promise.resolve(SUPABASE_KEY);
    return tokenPromise.then(function (token) {
      if (options.auth && !token) {
        var authErr = new Error('Necesitas iniciar sesión.');
        authErr.code = 'AUTH_REQUIRED';
        throw authErr;
      }
      headers.Authorization = 'Bearer ' + token;
      Object.keys(options.headers || {}).forEach(function (k) { headers[k] = options.headers[k]; });
      return fetch(SUPABASE_URL + path, {
        method: options.method || 'GET',
        headers: headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });
    }).then(function (res) {
      return res.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
        if (!res.ok) {
          var err = new Error((data && (data.message || data.details || data.hint || data.error)) || ('Error ' + res.status));
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  function publicRest(path) {
    return rest(path, { auth: false });
  }

  /* ------------------------------------------------------------------
     INTERFAZ DE ADMINISTRACIÓN
     ------------------------------------------------------------------ */
  function el(id) { return document.getElementById(id); }

  function setProgress(msg) {
    var node = el('cloud-progress');
    if (node) node.textContent = msg || '';
  }

  function setProgressError(msg) {
    var node = el('cloud-progress');
    if (node) {
      node.textContent = '⚠️ ' + msg;
      node.style.color = '#ffb3a7';
    }
  }

  function clearProgressError() {
    var node = el('cloud-progress');
    if (node) node.style.color = '';
  }

  function updateAuthUi() {
    var status = el('cloud-auth-status');
    var loginBtn = el('btn-cloud-login');
    var logoutBtn = el('btn-cloud-logout');
    if (!status) return;
    if (isAdmin()) {
      status.textContent = '● Sesión iniciada' + (session.email ? ' · ' + session.email : '');
      status.className = 'cloud-auth ok';
      if (loginBtn) loginBtn.hidden = true;
      if (logoutBtn) logoutBtn.hidden = false;
    } else {
      status.textContent = '○ Sesión no iniciada (solo vista local)';
      status.className = 'cloud-auth';
      if (loginBtn) loginBtn.hidden = false;
      if (logoutBtn) logoutBtn.hidden = true;
    }
  }

  function openAuthModal() {
    var modal = el('auth-modal');
    if (!modal) return;
    modal.hidden = false;
    var email = el('auth-email');
    var err = el('auth-error');
    if (err) err.textContent = '';
    if (email) setTimeout(function () { email.focus(); }, 50);
  }

  function closeAuthModal() {
    var modal = el('auth-modal');
    if (modal) modal.hidden = true;
    var pass = el('auth-password');
    if (pass) pass.value = '';
  }

  function requireAuth() {
    return getAccessToken().then(function (token) {
      if (!token) {
        openAuthModal();
        var err = new Error('Inicia sesión para publicar o descargar datos.');
        err.code = 'AUTH_REQUIRED';
        throw err;
      }
      return token;
    });
  }

  function baseUrl() {
    return new URL('./', window.location.href).href;
  }

  function linksFor(slug, token) {
    var base = baseUrl();
    return {
      invitation: base + 'invitacion.html?boda=' + encodeURIComponent(slug),
      portal: base + 'novios.html?boda=' + encodeURIComponent(slug) + '&k=' + encodeURIComponent(token || '')
    };
  }

  function renderCloudLinks(slug, token) {
    var box = el('cloud-links');
    if (!box) return;
    box.textContent = '';
    var links = linksFor(slug, token);

    function addLink(label, href) {
      var a = document.createElement('a');
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = label;
      box.appendChild(a);
    }
    function addCopy(label, text) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.addEventListener('click', function () {
        window.copyText(text).then(function (ok) {
          setProgress(ok ? '✓ Enlace copiado al portapapeles.' : 'Copia manualmente: ' + text);
        });
      });
      box.appendChild(b);
    }

    addLink('Enlace invitados ↗', links.invitation);
    addCopy('Copiar invitados', links.invitation);
    if (token) {
      addLink('Portal novios ↗', links.portal);
      addCopy('Copiar portal', links.portal);
      var t = document.createElement('span');
      t.className = 'cloud-token';
      t.textContent = 'Clave de novios: ' + token.slice(0, 10) + '… (guárdala)';
      box.appendChild(t);
    }
    var panel = el('btn-open-invite');
    if (panel) panel.href = links.invitation + '&preview=1';
  }

  function adminState() {
    if (window.getWeddingState) return window.getWeddingState();
    var slug = el('cloud-slug') ? el('cloud-slug').value.trim() : (CFG.DEFAULT_SLUG || 'alejandro-y-martina');
    return window.Store.loadData(slug);
  }

  function validateWedding(data, slug) {
    if (!slug) return 'El identificador de la URL no puede estar vacío.';
    if (!data || !String(data.n1 || '').trim() || !String(data.n2 || '').trim()) {
      return 'Faltan los nombres de la pareja.';
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data.date || ''))) {
      return 'Falta una fecha de boda válida.';
    }
    return '';
  }

  function generateToken() {
    var bytes = new Uint8Array(32);
    if (window.crypto && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
      return Array.prototype.map.call(bytes, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    }
    var out = '';
    for (var i = 0; i < 64; i++) out += Math.floor(Math.random() * 16).toString(16);
    return out;
  }

  function dataUrlToBlob(dataUrl) {
    var parts = String(dataUrl).split(',');
    var mime = /data:([^;]+)/.exec(parts[0]);
    var binary = atob(parts[1]);
    var len = binary.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: (mime && mime[1]) || 'image/jpeg' });
  }

  function uploadBlob(blob, slug, kind) {
    return getAccessToken().then(function (token) {
      if (!token) throw new Error('Inicia sesión para subir fotos.');
      var ext = blob.type === 'image/png' ? 'png' : (blob.type === 'image/webp' ? 'webp' : 'jpg');
      var path = slug + '/' + kind + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
      return fetch(SUPABASE_URL + '/storage/v1/object/' + encodeURIComponent(BUCKET) + '/' + path, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: 'Bearer ' + token,
          'Content-Type': blob.type || 'image/jpeg',
          'x-upsert': 'true'
        },
        body: blob
      }).then(function (res) {
        if (!res.ok) {
          return res.text().then(function (txt) {
            throw new Error('No se pudo subir la foto. Revisa el bucket y las políticas de Storage. ' + (txt || ''));
          });
        }
        return SUPABASE_URL + '/storage/v1/object/public/' + encodeURIComponent(BUCKET) + '/' + path;
      });
    });
  }

  function uploadDataUrl(dataUrl, slug, kind) {
    if (!/^data:image\//i.test(dataUrl)) return Promise.resolve(dataUrl);
    return uploadBlob(dataUrlToBlob(dataUrl), slug, kind);
  }

  function prepareImages(data, slug, onProgress) {
    var tasks = [];
    var d = JSON.parse(JSON.stringify(data || {}));
    if (d.heroPhoto && /^data:image\//i.test(d.heroPhoto)) {
      tasks.push(uploadDataUrl(d.heroPhoto, slug, 'portada').then(function (url) {
        d.heroPhoto = url;
        if (onProgress) onProgress('Portada subida a Storage.');
      }));
    }
    if (Array.isArray(d.galleryPhotos)) {
      d.galleryPhotos = d.galleryPhotos.slice(0, 8);
      d.galleryPhotos.forEach(function (photo, i) {
        if (!/^data:image\//i.test(photo)) return;
        tasks.push(uploadDataUrl(photo, slug, 'galeria-' + (i + 1)).then(function (url) {
          d.galleryPhotos[i] = url;
          if (onProgress) onProgress('Foto ' + (i + 1) + ' subida a Storage.');
        }));
      });
    }
    return Promise.all(tasks).then(function () { return d; });
  }

  function publish() {
    if (busy) return;
    if (!isConfigured) {
      alert('Supabase no está configurado. Revisa js/config.js.');
      return;
    }
    var slugInput = el('cloud-slug');
    var slug = window.slugify(slugInput ? slugInput.value : '');
    if (!slug) {
      setProgressError('Escribe un identificador válido (letras, números y guiones).');
      return;
    }
    busy = true;
    clearProgressError();
    var publishBtn = el('btn-cloud-publish');
    if (publishBtn) publishBtn.disabled = true;

    requireAuth().then(function () {
      var data = adminState();
      var invalid = validateWedding(data, slug);
      if (invalid) throw new Error(invalid);
      data.id = slug;
      delete data.token;
      delete data.clave_admin;

      setProgress('Preparando fotos…');
      return prepareImages(data, slug, setProgress).then(function (prepared) {
        setProgress('Buscando la invitación existente…');
        return rest('/rest/v1/bodas?id=eq.' + encodeURIComponent(slug) + '&select=id,token', { auth: true })
          .then(function (rows) {
            var token = (Array.isArray(rows) && rows[0] && rows[0].token) ? rows[0].token : generateToken();
            setProgress('Publicando en Supabase…');
            return rest('/rest/v1/bodas?on_conflict=id', {
              method: 'POST',
              auth: true,
              headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
              body: { id: slug, data: prepared, token: token, updated_at: new Date().toISOString() }
            }).then(function () {
              adminToken = token;
              adminSlug = slug;
              window.Store.saveData(slug, prepared);
              if (window.AdminPanel && window.AdminPanel.markPublished) window.AdminPanel.markPublished(slug);
              setProgress('✅ Invitación publicada. Enlace de invitados y portal privado listos.');
              renderCloudLinks(slug, token);
            });
          });
      });
    }).catch(function (err) {
      if (err && err.code === 'AUTH_REQUIRED') {
        setProgressError('Inicia sesión para publicar.');
      } else {
        setProgressError(err.message || 'No se pudo publicar.');
      }
    }).then(function () {
      busy = false;
      if (publishBtn) publishBtn.disabled = false;
    });
  }

  function loadFromCloud() {
    if (busy) return;
    if (!isConfigured) {
      alert('Supabase no está configurado. Revisa js/config.js.');
      return;
    }
    var slugInput = el('cloud-slug');
    var slug = window.slugify(slugInput ? slugInput.value : '');
    if (!slug) {
      setProgressError('Escribe un identificador válido.');
      return;
    }
    busy = true;
    clearProgressError();
    var btn = el('btn-cloud-load');
    if (btn) btn.disabled = true;

    requireAuth().then(function () {
      setProgress('Descargando la boda…');
      return Promise.all([
        rest('/rest/v1/bodas?id=eq.' + encodeURIComponent(slug) + '&select=id,data,token', { auth: true }),
        rest('/rest/v1/confirmaciones?boda_id=eq.' + encodeURIComponent(slug) + '&select=*&order=created_at.desc', { auth: true })
      ]).then(function (results) {
        var rows = results[0];
        var rsvps = results[1];
        if (!Array.isArray(rows) || !rows.length) {
          throw new Error('No existe ninguna boda con el identificador «' + slug + '».');
        }
        var row = rows[0];
        adminSlug = slug;
        adminToken = row.token || '';
        window.Store.saveData(slug, row.data || {});
        window.Store.saveRsvp(slug, Array.isArray(rsvps) ? rsvps : []);
        if (window.AdminPanel && window.AdminPanel.loadFromCloud) {
          window.AdminPanel.loadFromCloud(row.data || {}, Array.isArray(rsvps) ? rsvps : [], row.token || '');
        }
        renderCloudLinks(slug, row.token || '');
        setProgress('✅ Boda cargada desde la nube con ' + (rsvps ? rsvps.length : 0) + ' confirmaciones.');
      });
    }).catch(function (err) {
      if (err && err.code === 'AUTH_REQUIRED') setProgressError('Inicia sesión para cargar.');
      else setProgressError(err.message || 'No se pudo cargar la boda.');
    }).then(function () {
      busy = false;
      if (btn) btn.disabled = false;
    });
  }

  function reloadRsvps() {
    if (!adminSlug && el('cloud-slug')) adminSlug = window.slugify(el('cloud-slug').value);
    if (!adminSlug) return Promise.reject(new Error('No hay una boda seleccionada.'));
    return requireAuth().then(function () {
      return rest('/rest/v1/confirmaciones?boda_id=eq.' + encodeURIComponent(adminSlug) + '&select=*&order=created_at.desc', { auth: true });
    }).then(function (rows) {
      var list = Array.isArray(rows) ? rows : [];
      window.Store.saveRsvp(adminSlug, list);
      if (window.AdminPanel && window.AdminPanel.setRsvpList) window.AdminPanel.setRsvpList(list);
      setProgress('✓ Confirmaciones actualizadas (' + list.length + ').');
      return list;
    }).catch(function (err) {
      if (err && err.code === 'AUTH_REQUIRED') setProgressError('Inicia sesión para actualizar las confirmaciones.');
      else setProgressError(err.message || 'No se pudieron actualizar las confirmaciones.');
      throw err;
    });
  }

  function deleteRsvp(id) {
    if (!adminSlug) return Promise.reject(new Error('No hay boda seleccionada.'));
    if (String(id).indexOf('-') === -1) return Promise.resolve(true); // fila de prueba local
    return requireAuth().then(function () {
      return rest('/rest/v1/confirmaciones?id=eq.' + encodeURIComponent(id), { method: 'DELETE', auth: true });
    }).then(function () {
      setProgress('Confirmación eliminada.');
      return true;
    });
  }

  /* ------------------------------------------------------------------
     INVITACIÓN PÚBLICA
     ------------------------------------------------------------------ */
  function fetchWithTimeout(url, options, ms) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, ms || 9000);
    options = options || {};
    options.signal = controller.signal;
    return fetch(url, options).finally(function () { clearTimeout(timer); });
  }

  function loadPublicWedding(slug) {
    return fetchWithTimeout(SUPABASE_URL + '/rest/v1/bodas_publicas?id=eq.' + encodeURIComponent(slug) + '&select=id,data', {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY
      }
    }).then(function (res) {
      return res.text().then(function (text) {
        var rows = null;
        try { rows = text ? JSON.parse(text) : null; } catch (e) { rows = null; }
        if (!res.ok) {
          var err = new Error((rows && (rows.message || rows.hint)) || 'No se pudo cargar la invitación.');
          err.status = res.status;
          throw err;
        }
        if (!Array.isArray(rows) || !rows.length || !rows[0].data) {
          var notFound = new Error('Invitación no encontrada.');
          notFound.code = 'NOT_FOUND';
          throw notFound;
        }
        return rows[0].data;
      });
    });
  }

  function initInvitation() {
    var body = document.body;
    if (!body || body.dataset.page === 'admin' || body.dataset.page === 'novios') return;
    if (!el('rsvp-form')) return;

    var params = new URLSearchParams(window.location.search);
    var slug = (params.get('boda') || '').trim().toLowerCase();
    var isPreview = params.has('preview');
    var isDemo = params.has('demo');

    if (!slug || isPreview || isDemo) return; // demo/preview usan datos locales
    if (!isConfigured) {
      window.dispatchEvent(new CustomEvent('wedding:unavailable', {
        detail: { reason: 'config', slug: slug }
      }));
      return;
    }

    loadPublicWedding(slug).then(function (data) {
      window.Store.saveData(slug, data);
      window.dispatchEvent(new CustomEvent('wedding:data', {
        detail: { data: data, slug: slug, source: 'cloud' }
      }));
    }).catch(function (err) {
      var cached = window.Store.loadData(slug, { allowDefaults: false });
      if (cached) {
        window.dispatchEvent(new CustomEvent('wedding:data', {
          detail: { data: cached, slug: slug, source: 'cache', offline: true }
        }));
        return;
      }
      var reason = err && err.code === 'NOT_FOUND' ? 'not-found' : 'offline';
      window.dispatchEvent(new CustomEvent('wedding:unavailable', {
        detail: { reason: reason, slug: slug, message: err && err.message }
      }));
    });
  }

  /* ------------------------------------------------------------------
     RSVP PÚBLICO
     ------------------------------------------------------------------ */
  function enviarRsvp(payload) {
    var slug = (payload && payload.boda) || '';
    if (!slug) return Promise.reject(new Error('Falta la boda.'));
    if (!isConfigured) return Promise.reject(new Error('La conexión con Supabase no está configurada.'));

    var body = {
      p_boda: slug,
      p_nombre: payload.name,
      p_asiste: payload.attending,
      p_personas: payload.guests,
      p_menu: payload.menu || '',
      p_bus: payload.bus || '',
      p_alergias: payload.allergies || '',
      p_cancion: payload.song || '',
      p_acompanantes: payload.companions || [],
      p_client_id: payload.clientId,
      p_consentimiento: !!payload.consent,
      p_website: payload.website || ''
    };

    return fetchWithTimeout(SUPABASE_URL + '/rest/v1/rpc/crear_confirmacion', {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }, 12000).then(function (res) {
      return res.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
        if (res.status === 409) return { ok: true, duplicate: true };
        if (!res.ok) {
          var msg = (data && (data.message || data.details || data.hint)) || 'No se pudo registrar la confirmación.';
          var err = new Error(msg);
          err.status = res.status;
          throw err;
        }
        if (data && data.ok === false) throw new Error(data.message || 'No se pudo registrar la confirmación.');
        return data || { ok: true };
      });
    });
  }

  /* ------------------------------------------------------------------
     PORTAL DE NOVIOS
     ------------------------------------------------------------------ */
  function cargarNovios(slug, token) {
    if (!isConfigured) return Promise.reject(new Error('Supabase no está configurado.'));
    if (!slug || !token) return Promise.reject(new Error('Falta el enlace privado.'));
    return Promise.all([
      loadPublicWedding(slug),
      fetchWithTimeout(SUPABASE_URL + '/rest/v1/rpc/rsvp_por_token', {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ p_boda: slug, p_token: token })
      }, 12000).then(function (res) {
        return res.text().then(function (text) {
          var data = null;
          try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
          if (!res.ok) {
            var err = new Error((data && (data.message || data.details)) || 'La clave no es válida.');
            err.status = res.status;
            throw err;
          }
          return Array.isArray(data) ? data : [];
        });
      })
    ]).then(function (results) {
      return { wedding: results[0], rsvps: results[1] };
    });
  }

  /* ------------------------------------------------------------------
     EVENTOS DE LA INTERFAZ DE ADMIN
     ------------------------------------------------------------------ */
  function initAdminUi() {
    if (!el('cloud-slug')) return;
    updateAuthUi();

    var slugInput = el('cloud-slug');
    var initial = new URLSearchParams(window.location.search).get('boda') || CFG.DEFAULT_SLUG || 'alejandro-y-martina';
    slugInput.value = initial;
    adminSlug = window.slugify(initial);

    var loginBtn = el('btn-cloud-login');
    if (loginBtn) loginBtn.addEventListener('click', openAuthModal);
    var logoutBtn = el('btn-cloud-logout');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    var cancelBtn = el('auth-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', closeAuthModal);

    var authForm = el('auth-form');
    if (authForm) {
      authForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = el('auth-email').value.trim();
        var pass = el('auth-password').value;
        var errBox = el('auth-error');
        var submit = el('auth-submit');
        if (errBox) errBox.textContent = '';
        if (submit) { submit.disabled = true; submit.textContent = 'Entrando…'; }
        login(email, pass).then(function () {
          closeAuthModal();
          setProgress('✓ Sesión iniciada. Ya puedes publicar y cargar confirmaciones.');
        }).catch(function (err) {
          if (errBox) errBox.textContent = 'No se pudo entrar. Revisa email y contraseña.';
        }).then(function () {
          if (submit) { submit.disabled = false; submit.textContent = 'Entrar'; }
        });
      });
    }

    var publishBtn = el('btn-cloud-publish');
    if (publishBtn) publishBtn.addEventListener('click', publish);
    var loadBtn = el('btn-cloud-load');
    if (loadBtn) loadBtn.addEventListener('click', loadFromCloud);

    slugInput.addEventListener('change', function () {
      var newSlug = window.slugify(slugInput.value);
      slugInput.value = newSlug;
      if (window.AdminPanel && window.AdminPanel.switchSlug) {
        window.AdminPanel.switchSlug(newSlug);
      }
      adminSlug = newSlug;
      adminToken = '';
      setProgress('Trabajando en la boda «' + newSlug + '». Pulsa «Publicar» para subirla.');
    });

    if (session) {
      getAccessToken().then(function (token) {
        if (token) updateAuthUi();
        else updateAuthUi();
      });
    }

    var deleteModal = el('auth-modal');
    if (deleteModal) {
      deleteModal.addEventListener('click', function (e) {
        if (e.target === deleteModal) closeAuthModal();
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAuthModal();
    });
  }

  /* ------------------------------------------------------------------
     API PÚBLICA
     ------------------------------------------------------------------ */
  window.Nube = {
    isConfigured: isConfigured,
    isAdmin: isAdmin,
    getAccessToken: getAccessToken,
    login: login,
    logout: logout,
    getToken: function () { return adminToken; },
    setToken: function (t) { adminToken = t || ''; },
    getAdminSlug: function () { return adminSlug; },
    setAdminSlug: function (s) { adminSlug = window.slugify(s); },
    linksFor: linksFor,
    renderCloudLinks: renderCloudLinks,
    publish: publish,
    loadFromCloud: loadFromCloud,
    reloadRsvps: reloadRsvps,
    deleteRsvp: deleteRsvp,
    enviarRsvp: enviarRsvp,
    cargarNovios: cargarNovios,
    prepareImages: prepareImages,
    uploadDataUrl: uploadDataUrl,
    generateToken: generateToken,
    openAuthModal: openAuthModal,
    setProgress: setProgress
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (document.body && document.body.dataset.page === 'admin') initAdminUi();
    initInvitation();
  });
})();
