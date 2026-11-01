/* =====================================================================
   INVITACIÓN PÚBLICA
   - Renderiza sin innerHTML con datos de usuario (anti-XSS)
   - No muestra datos de demo si hay ?boda y aún no llegaron los reales
   - Sobre: una sola apertura por sesión, scroll bloqueado y botón real
   - RSVP: éxito solo si Supabase confirma; error visible con reintento
   - Calendario con hora real de Madrid y ctz
   ===================================================================== */
(function () {
  'use strict';

  var CFG = window.APP_CONFIG || {};
  var params = new URLSearchParams(window.location.search);
  var slug = (params.get('boda') || '').trim().toLowerCase() || CFG.DEFAULT_SLUG || 'alejandro-y-martina';
  var isPreview = params.has('preview');
  var isDemo = params.has('demo') || (!params.get('boda') && !isPreview);
  var isRemote = !!params.get('boda') && !isPreview && !isDemo;
  var replayParam = params.get('replay') === '1';
  var storeSlug = isDemo ? 'demo' : slug;

  var currentData = null;
  var countdownTimer = null;
  var currentLang = 'es';
  var fallbackTimer = null;
  var remoteResolved = false;
  var isSubmitting = false;
  var audio = null;
  var fadeTimer = null;

  var DEFAULT_GALLERY = ['img/galeria-1.jpg', 'img/galeria-2.jpg', 'img/galeria-3.jpg'];
  var DEFAULT_HERO_BY_THEME = {
    olivo: 'img/hero-olivo.jpg',
    editorial: 'img/hero-editorial.jpg',
    flores: 'img/hero-flores.jpg',
    sobre: 'img/hero-sobre.jpg',
    terracota: 'img/hero-terracota.jpg',
    noche: 'img/hero-noche.jpg',
    gotico: 'img/hero-gotico.jpg',
    elegante: 'img/hero-elegante.jpg',
    starwars: 'img/hero-starwars.jpg'
  };
  /* Las plantillas 10-19 construyen su portada solo con CSS (gradientes,
     texturas y patrones): no dependen de ninguna fotografía. */
  var CSS_HERO_THEMES = ['ibiza', 'bridgerton', 'amalfi', 'bodega', 'viajeros', 'festival', 'harrypotter', 'lotr', 'hollywood', 'gamer'];
  var ORNAMENTS_SVG = {
    olivo: '<svg viewBox="0 0 100 40"><path d="M10,30 Q50,5 90,30 M30,22 C25,12 18,15 22,24 M50,17 C46,7 38,10 42,19 M70,22 C66,12 58,15 62,24" stroke-width="1.5" stroke-linecap="round"/></svg>',
    editorial: '<svg viewBox="0 0 100 20"><line x1="20" y1="10" x2="80" y2="10" stroke-width="1"/></svg>',
    flores: '<svg viewBox="0 0 100 40"><circle cx="50" cy="20" r="5" stroke-width="1.3"/><circle cx="35" cy="24" r="3.5" stroke-width="1.2"/><circle cx="65" cy="24" r="3.5" stroke-width="1.2"/><path d="M15,28 Q50,12 85,28" stroke-width="1.2"/></svg>',
    sobre: '<svg viewBox="0 0 100 40"><polygon points="50,6 54,16 65,16 56,22 59,32 50,26 41,32 44,22 35,16 46,16" stroke-width="1.3"/></svg>',
    terracota: '<svg viewBox="0 0 100 40"><path d="M20,32 A30,24 0 0,1 80,32" stroke-width="1.5"/><circle cx="50" cy="18" r="4" stroke-width="1.3"/></svg>',
    noche: '<svg viewBox="0 0 100 40"><polygon points="50,4 53,16 65,20 53,24 50,36 47,24 35,20 47,16" stroke-width="1.4"/></svg>',
    gotico: '<svg viewBox="0 0 100 44"><path d="M50,4 V40 M38,13 L50,4 L62,13 M34,40 H66 M40,29 H60 M43,22 H57" stroke-width="1.2" stroke-linecap="square"/><path d="M18,40 Q28,30 38,40 M62,40 Q72,30 82,40" stroke-width="1"/></svg>',
    elegante: '<svg viewBox="0 0 100 40"><line x1="6" y1="20" x2="38" y2="20" stroke-width="0.9"/><line x1="62" y1="20" x2="94" y2="20" stroke-width="0.9"/><rect x="45" y="15" width="10" height="10" transform="rotate(45 50 20)" stroke-width="1"/><circle cx="50" cy="20" r="2" stroke-width="1"/></svg>',
    starwars: '<svg viewBox="0 0 100 40"><path d="M50,5 L55,17 L68,18 L58,26 L61,38 L50,31 L39,38 L42,26 L32,18 L45,17 Z" stroke-width="1.3" stroke-linejoin="round"/><ellipse cx="50" cy="21" rx="43" ry="11" stroke-width="0.9" transform="rotate(-12 50 21)"/></svg>',
    ibiza: '<svg viewBox="0 0 100 40"><circle cx="50" cy="18" r="7" stroke-width="1.2"/><path d="M50,3 V8 M50,28 V33 M35,18 H40 M60,18 H65 M39,7 l3,3 M61,7 l-3,3 M39,29 l3,-3 M61,29 l-3,-3" stroke-width="1.1" stroke-linecap="round"/><path d="M16,34 Q29,29 42,34 T68,34 T94,34" stroke-width="1.1"/></svg>',
    bridgerton: '<svg viewBox="0 0 100 40"><path d="M30,31 L33,15 L41,24 L50,12 L59,24 L67,15 L70,31 Z" stroke-width="1.2" stroke-linejoin="round"/><path d="M30,35 H70" stroke-width="1"/><circle cx="50" cy="8" r="1.7" stroke-width="1"/><circle cx="32" cy="11" r="1.2" stroke-width="1"/><circle cx="68" cy="11" r="1.2" stroke-width="1"/></svg>',
    amalfi: '<svg viewBox="0 0 100 40"><path d="M50,5 L65,20 L50,35 L35,20 Z" stroke-width="1.2"/><path d="M50,12 L58,20 L50,28 L42,20 Z" stroke-width="1"/><path d="M10,20 H28 M72,20 H90" stroke-width="1"/><circle cx="50" cy="20" r="1.6" stroke-width="1"/></svg>',
    bodega: '<svg viewBox="0 0 100 40"><path d="M50,4 V15" stroke-width="1.2"/><circle cx="43" cy="20" r="3.3" stroke-width="1.1"/><circle cx="57" cy="20" r="3.3" stroke-width="1.1"/><circle cx="50" cy="26" r="3.3" stroke-width="1.1"/><circle cx="43" cy="32" r="3.3" stroke-width="1.1"/><circle cx="57" cy="32" r="3.3" stroke-width="1.1"/><path d="M50,4 C60,2 66,7 68,14" stroke-width="1"/></svg>',
    viajeros: '<svg viewBox="0 0 100 40"><circle cx="48" cy="20" r="12" stroke-width="1.1"/><ellipse cx="48" cy="20" rx="5" ry="12" stroke-width="1"/><path d="M36,20 H60" stroke-width="1"/><path d="M78,8 l-15,8 6,2 4,-4 2,7 3,-1 -1,-6 5,-2 z" stroke-width="1" stroke-linejoin="round"/></svg>',
    festival: '<svg viewBox="0 0 100 40"><path d="M50,4 L53.5,15 L64,18 L53.5,21 L50,32 L46.5,21 L36,18 L46.5,15 Z" stroke-width="1.2" stroke-linejoin="round"/><circle cx="50" cy="18" r="16" stroke-width="0.9" stroke-dasharray="2 4"/></svg>',
    harrypotter: '<svg viewBox="0 0 100 40"><path d="M50,4 L67,10 V22 C67,31 59,35 50,37 C41,35 33,31 33,22 V10 Z" stroke-width="1.2" stroke-linejoin="round"/><path d="M53,10 L44,20 H50 L46,30 L57,18 H50 Z" stroke-width="1.1" stroke-linejoin="round"/></svg>',
    lotr: '<svg viewBox="0 0 100 40"><circle cx="50" cy="20" r="10" stroke-width="1.3"/><circle cx="50" cy="20" r="6.4" stroke-width="0.9" stroke-dasharray="1 3"/><path d="M24,29 C17,23 19,15 26,15 C30,15 32,19 30,23" stroke-width="1"/><path d="M76,11 C83,17 81,25 74,25 C70,25 68,21 70,17" stroke-width="1"/></svg>',
    hollywood: '<svg viewBox="0 0 100 40"><path d="M50,4 L53.6,15 L65,16 L56,22.6 L59,34 L50,27.4 L41,34 L44,22.6 L35,16 L46.4,15 Z" stroke-width="1.2" stroke-linejoin="round"/><path d="M13,8 V32 M87,8 V32" stroke-width="1"/><circle cx="13" cy="12" r="1.4" stroke-width="1"/><circle cx="13" cy="20" r="1.4" stroke-width="1"/><circle cx="13" cy="28" r="1.4" stroke-width="1"/><circle cx="87" cy="12" r="1.4" stroke-width="1"/><circle cx="87" cy="20" r="1.4" stroke-width="1"/><circle cx="87" cy="28" r="1.4" stroke-width="1"/></svg>',
    gamer: '<svg viewBox="0 0 100 40"><path d="M20,26 L26,13 L32,26 Z" stroke-width="1.1" stroke-linejoin="round"/><circle cx="49" cy="18" r="6.5" stroke-width="1.2"/><path d="M62,11 L72,22 M72,11 L62,22" stroke-width="1.2" stroke-linecap="round"/><rect x="79" y="12" width="9" height="9" stroke-width="1.1"/></svg>'
  };
  var THEME_IDS = ['olivo', 'editorial', 'flores', 'sobre', 'terracota', 'noche', 'gotico', 'elegante', 'starwars',
    'ibiza', 'bridgerton', 'amalfi', 'bodega', 'viajeros', 'festival', 'harrypotter', 'lotr', 'hollywood', 'gamer'];
  var ICONS_MAP = { rings: '💍', cheers: '🥂', dinner: '🍽️', music: '🎶', bus: '🚌', church: '⛪' };

  function el(id) { return document.getElementById(id); }
  function t(key, fallback) {
    if (window.Idiomas && window.Idiomas.t) {
      var value = window.Idiomas.t(key);
      if (value) return value;
    }
    return fallback || '';
  }
  function setText(id, value) {
    var node = el(id);
    if (node) node.textContent = value == null ? '' : value;
  }
  function safePhoto(value) { return window.safeUrl(value, { image: true }); }
  function safeLink(value) { return window.safeUrl(value); }

  function normalizeData(data) {
    var base = window.DEFAULT_WEDDING_DATA || {};
    var d = Object.assign({}, base, data || {});
    d.sections = Object.assign({}, base.sections || {}, (data && data.sections) || {});
    d.events = (data && Array.isArray(data.events)) ? data.events : JSON.parse(JSON.stringify(base.events || []));
    if (!Array.isArray(d.galleryPhotos)) d.galleryPhotos = [];
    delete d.token;
    delete d.clave_admin;
    return d;
  }

  function initialData() {
    if (isDemo) {
      var demo = normalizeData({});
      var demoTpl = params.get('demo');
      if (demoTpl && window.WEDDING_TEMPLATES && window.WEDDING_TEMPLATES[demoTpl]) {
        demo.template = demoTpl;
        demo.useEnvelope = true;
        demo.envelopeStyle = window.WEDDING_TEMPLATES[demoTpl].defaultSealColor || 'marfil';
      }
      return demo;
    }
    if (isPreview) return window.Store.loadData(slug);
    if (isRemote) {
      var cached = window.Store.loadData(slug, { allowDefaults: false });
      return cached ? normalizeData(cached) : normalizeData({});
    }
    return normalizeData({});
  }

  function chosenLanguage(data) {
    var fromUrl = (params.get('lang') || '').toLowerCase();
    if (['es', 'val', 'en'].indexOf(fromUrl) !== -1) return fromUrl;
    try {
      var stored = localStorage.getItem('melvinta:lang');
      if (['es', 'val', 'en'].indexOf(stored) !== -1) return stored;
    } catch (e) {}
    var def = (data && data.defaultLanguage) || 'es';
    return ['es', 'val', 'en'].indexOf(def) !== -1 ? def : 'es';
  }

  function removePreload() {
    document.body.classList.remove('preload');
  }

  function hideEnvelope() {
    var overlay = el('envelope-overlay');
    if (overlay) overlay.classList.add('hidden');
    document.body.classList.remove('envelope-locked');
  }

  function showEnvelope() {
    var overlay = el('envelope-overlay');
    var stage = el('envelope-stage');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    if (stage) stage.classList.remove('opening');
    document.body.classList.add('envelope-locked');
  }

  function markOpened() {
    if (!isPreview && !isDemo) window.Store.markEnvelopeOpened(slug);
  }

  function setupEnvelope(d, forceReplay) {
    var overlay = el('envelope-overlay');
    var stage = el('envelope-stage');
    var seal = el('wax-seal');
    var skip = el('env-skip');
    if (!overlay || !stage || !seal || !skip) return;

    var i1 = String(d.n1 || 'A').trim().charAt(0).toUpperCase() || 'A';
    var i2 = String(d.n2 || 'M').trim().charAt(0).toUpperCase() || 'M';
    setText('seal-initials', i1 + '&' + i2);
    setText('env-names', (d.n1 || 'Alejandro') + ' & ' + (d.n2 || 'Martina'));
    setText('env-eyebrow', d.eyebrow || t('eyebrow', '¡NOS CASAMOS!'));
    setText('env-date-short', window.WeddingDates.short(d.date));

    var styles = ['marfil', 'verde', 'burdeos', 'noche'];
    var envStyle = styles.indexOf(d.envelopeStyle) !== -1 ? d.envelopeStyle : 'marfil';
    overlay.className = 'envelope-overlay env-' + envStyle + (overlay.classList.contains('hidden') ? ' hidden' : '');

    if (!d.useEnvelope) {
      hideEnvelope();
      return;
    }

    var alreadyOpened = !isPreview && !isDemo && window.Store.hasOpenedEnvelope(slug);
    var visible = !overlay.classList.contains('hidden');
    var opening = stage.classList.contains('opening');

    if (!forceReplay && (alreadyOpened || !visible)) {
      // Si ya se abrió en esta sesión, no se vuelve a cerrar.
      if (alreadyOpened) hideEnvelope();
      return;
    }

    if (!opening) {
      showEnvelope();
      stage.classList.remove('opening');
    }

    var openEnvelope = function () {
      if (stage.classList.contains('opening')) return;
      stage.classList.add('opening');
      markOpened();
      document.body.classList.remove('envelope-locked');
      if (d.musicEnabled) startMusic();
      window.setTimeout(function () {
        overlay.classList.add('hidden');
      }, 1150);
    };

    seal.onclick = openEnvelope;
    skip.onclick = function () {
      markOpened();
      hideEnvelope();
      if (d.musicEnabled) startMusic();
    };

    if (visible && !opening) {
      document.body.classList.add('envelope-locked');
      if (forceReplay) {
        window.setTimeout(function () {
          try { seal.focus({ preventScroll: true }); } catch (e) {}
        }, 300);
      }
    }
  }

  /* ------------------------------------------------------------------
     MÚSICA
     ------------------------------------------------------------------ */
  function setupMusic(d) {
    audio = el('bg-music');
    var btn = el('music-toggle');
    if (!audio || !btn) return;

    var src = safePhoto(d.musicFile) || 'audio/ambiente.mp3';
    if (audio.getAttribute('src') !== src) audio.setAttribute('src', src);
    audio.loop = true;

    btn.style.display = d.musicEnabled ? 'flex' : 'none';
    btn.onclick = function () {
      if (audio.paused) startMusic();
      else stopMusic();
    };
    audio.addEventListener('error', function () {
      btn.style.display = 'none';
    });
    audio.addEventListener('play', function () {
      btn.classList.add('playing');
      btn.textContent = '⏸';
    });
    audio.addEventListener('pause', function () {
      btn.classList.remove('playing');
      btn.textContent = '♫';
    });
  }

  function startMusic() {
    if (!audio || !currentData || currentData.musicEnabled === false) return;
    clearInterval(fadeTimer);
    audio.volume = 0;
    var play = audio.play();
    if (play && play.then) {
      play.then(function () {
        var step = 0;
        fadeTimer = setInterval(function () {
          step++;
          audio.volume = Math.min(0.32, step * 0.02);
          if (audio.volume >= 0.32) clearInterval(fadeTimer);
        }, 80);
      }).catch(function () {
        // El navegador puede bloquear el autoplay; el botón sigue visible.
      });
    }
  }

  function stopMusic() {
    if (audio) {
      audio.pause();
      audio.volume = 0;
    }
    clearInterval(fadeTimer);
  }

  /* ------------------------------------------------------------------
     CUENTA ATRÁS
     ------------------------------------------------------------------ */
  function updateCountdown(dateStr, timeStr) {
    if (countdownTimer) clearInterval(countdownTimer);
    var target = window.WeddingDates.madridDate(dateStr, timeStr);

    function tick() {
      var diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setText('cd-days', '0');
        setText('cd-hours', '00');
        setText('cd-mins', '00');
        setText('cd-secs', '00');
        return;
      }
      var days = Math.floor(diff / 86400000);
      var hours = Math.floor((diff % 86400000) / 3600000);
      var mins = Math.floor((diff % 3600000) / 60000);
      var secs = Math.floor((diff % 60000) / 1000);
      setText('cd-days', days);
      setText('cd-hours', String(hours).padStart(2, '0'));
      setText('cd-mins', String(mins).padStart(2, '0'));
      setText('cd-secs', String(secs).padStart(2, '0'));
    }
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  /* ------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------ */
  function renderInvitation(dataObj, options) {
    options = options || {};
    var d = normalizeData(dataObj || currentData || initialData());
    currentData = d;

    var tpl = (window.WEDDING_TEMPLATES && window.WEDDING_TEMPLATES[d.template]) ? d.template : 'sobre';
    var rootBody = document.body;
    THEME_IDS.forEach(function (id) { rootBody.classList.remove('theme-' + id); });
    rootBody.classList.add('theme-' + tpl);
    rootBody.setAttribute('data-template', tpl);

    var heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      var mi1 = String(d.n1 || 'A').trim().charAt(0).toUpperCase() || 'A';
      var mi2 = String(d.n2 || 'M').trim().charAt(0).toUpperCase() || 'M';
      heroContent.setAttribute('data-monogram', mi1 + ' & ' + mi2);
    }

    setText('n1', d.n1 || 'Alejandro');
    setText('n2', d.n2 || 'Martina');
    setText('eyebrow', d.eyebrow || '¡NOS CASAMOS!');
    setText('message', d.message || '');
    setText('story-title', d.storyTitle || 'Nuestra Historia');
    setText('story-text', d.storyText || '');
    setText('venue', d.venue || '');
    setText('time', (d.time || '12:30') + ' h');
    setText('address', d.address || '');
    setText('dress-code', d.dressCode || '');
    setText('transport-info', d.transportInfo || '');
    setText('gift-message', d.giftMessage || '');
    setText('iban-text', d.iban || '');
    setText('rsvp-deadline', d.rsvpDeadline || t('deadlineDefault', 'un mes antes de la boda'));
    setText('footer-names', (d.n1 || '') + ' & ' + (d.n2 || ''));
    setText('footer-date', window.WeddingDates.short(d.date));

    var heroOrnament = el('hero-ornament');
    if (heroOrnament) heroOrnament.innerHTML = ORNAMENTS_SVG[tpl] || ORNAMENTS_SVG.olivo;

    /* Fondo de portada: arte propio de la plantilla (01-09) o CSS puro (10-19).
       La foto de los novios ya no sustituye al fondo: se integra en el marco
       temático de #hero-photo (css/portadas.css). */
    var heroBg = el('hero-bg');
    var bgArt = CSS_HERO_THEMES.indexOf(tpl) === -1
      ? (DEFAULT_HERO_BY_THEME[tpl] || DEFAULT_HERO_BY_THEME.olivo) : '';
    if (heroBg) heroBg.style.backgroundImage = bgArt ? window.cssImageUrl(bgArt) : '';
    renderHeroPhoto(d);

    updateDateDisplay(d);
    updateCountdown(d.date, d.time);

    var sections = d.sections || {};
    setHidden('sec-story', !sections.story);
    setHidden('sec-itinerary', !sections.itinerary);
    setHidden('sec-gallery', !sections.gallery);
    setHidden('sec-details', !sections.details);
    setHidden('sec-gifts', !sections.gifts);
    setHidden('sec-rsvp', !sections.rsvp);

    setupMusic(d);
    setupEnvelope(d, !!options.replayEnvelope);

    var mapBtn = el('map-btn');
    if (mapBtn) {
      var mapUrl = safeLink(d.map);
      if (!mapUrl) {
        mapUrl = 'https://maps.google.com/?q=' + encodeURIComponent([d.venue, d.address].filter(Boolean).join(' '));
      }
      mapBtn.href = mapUrl;
    }

    var cal = el('calendar-btn');
    if (cal) cal.href = window.WeddingDates.googleCalendar(d);

    renderItinerary(d);
    renderGallery(d);
    setupRsvp(d);
    updateMeta(d);
    updateShareButton(d);

    document.dispatchEvent(new CustomEvent('wedding:rendered', { detail: { data: d, lang: currentLang } }));
  }

  /* Foto de portada integrada en el marco de cada plantilla.
     - Reutiliza d.heroPhoto (misma subida del panel; sin sistema duplicado).
     - Sin foto: estado vacío elegante con el monograma, nunca una foto ficticia.
     - Encuadre: object-fit: cover + object-position (d.heroPhotoFocus opcional,
       "x% y%"; por defecto 50% 30% para no cortar rostros). */
  function renderHeroPhoto(d) {
    var fig = el('hero-photo');
    var img = el('hero-photo-img');
    if (!fig || !img) return;
    var i1 = String(d.n1 || 'A').trim().charAt(0).toUpperCase() || 'A';
    var i2 = String(d.n2 || 'M').trim().charAt(0).toUpperCase() || 'M';
    setText('hero-photo-mono', i1 + '&' + i2);

    var src = safePhoto(d.heroPhoto);
    var focus = /^\d{1,3}(\.\d+)?% \d{1,3}(\.\d+)?%$/.test(String(d.heroPhotoFocus || ''))
      ? d.heroPhotoFocus : '50% 30%';
    img.style.objectPosition = focus;
    if (src) {
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
      img.alt = t('heroPhotoAlt', 'Fotografía de ' + (d.n1 || '') + ' y ' + (d.n2 || ''));
      img.hidden = false;
      img.onerror = function () { img.hidden = true; fig.classList.add('is-empty'); };
      fig.classList.remove('is-empty');
    } else {
      img.removeAttribute('src');
      img.alt = '';
      img.hidden = true;
      fig.classList.add('is-empty');
    }
  }

  function setHidden(id, hidden) {
    var node = el(id);
    if (node) node.hidden = !!hidden;
  }

  function updateDateDisplay(d) {
    var longDate = window.WeddingDates.format(d.date, currentLang);
    var shortDate = window.WeddingDates.short(d.date);
    setText('date-formatted', longDate);
    setText('hero-date-pill', longDate);
    setText('editorial-date', shortDate);
    setText('env-date-short', shortDate);
  }

  function renderItinerary(d) {
    var list = el('timeline-list');
    if (!list) return;
    list.textContent = '';
    (d.events || []).forEach(function (ev) {
      var item = document.createElement('div');
      item.className = 'timeline-item';

      var dot = document.createElement('div');
      dot.className = 'timeline-dot';
      dot.textContent = ICONS_MAP[ev.icon] || '✨';

      var card = document.createElement('div');
      card.className = 'timeline-card';

      var time = document.createElement('div');
      time.className = 'timeline-time';
      time.textContent = (ev.time || '') + ' H';

      var title = document.createElement('div');
      title.className = 'timeline-title';
      title.textContent = ev.title || '';

      var place = document.createElement('div');
      place.className = 'timeline-place';
      place.textContent = ev.place || '';

      card.appendChild(time);
      card.appendChild(title);
      card.appendChild(place);
      item.appendChild(dot);
      item.appendChild(card);
      list.appendChild(item);
    });
  }

  function renderGallery(d) {
    var grid = el('gallery-grid');
    if (!grid) return;
    grid.textContent = '';
    var photos = (d.galleryPhotos && d.galleryPhotos.length) ? d.galleryPhotos : DEFAULT_GALLERY;
    photos.forEach(function (photo, index) {
      var src = safePhoto(photo);
      if (!src) return;
      var wrap = document.createElement('div');
      wrap.className = 'gallery-item';
      var img = document.createElement('img');
      img.src = src;
      img.alt = t('galleryAlt', 'Foto de la pareja') + ' ' + (index + 1);
      img.loading = 'lazy';
      wrap.appendChild(img);
      grid.appendChild(wrap);
    });
  }

  /* ------------------------------------------------------------------
     RSVP
     ------------------------------------------------------------------ */
  function maxGuests(d) {
    var n = parseInt(d.maxGuests, 10);
    return Math.max(1, Math.min(10, isNaN(n) ? 4 : n));
  }

  function fillGuestSelect(d) {
    var select = el('rsvp-guests');
    if (!select) return;
    var max = maxGuests(d);
    var current = parseInt(select.value, 10) || 1;
    select.textContent = '';
    for (var i = 1; i <= max; i++) {
      var option = document.createElement('option');
      option.value = String(i);
      option.textContent = i === 1 ? t('guestOne', '1 persona (solo yo)') : i + ' ' + t('guestsWord', 'personas');
      select.appendChild(option);
    }
    select.value = String(Math.min(current, max));
  }

  function menuOptions() {
    return [
      ['Estándar', t('menuStandard', 'Menú estándar')],
      ['Vegetariano', t('menuVeg', 'Vegetariano')],
      ['Vegano', t('menuVegan', 'Vegano')],
      ['Infantil', t('menuKids', 'Menú infantil')],
      ['Sin gluten', t('menuGluten', 'Sin gluten')],
      ['Otro', t('menuOther', 'Otro')]
    ];
  }

  function renderCompanions() {
    var container = el('rsvp-companions');
    var attending = el('rsvp-attending');
    var guestsSelect = el('rsvp-guests');
    if (!container || !attending || !guestsSelect) return;

    var current = {};
    container.querySelectorAll('.companion-row').forEach(function (row) {
      current[row.getAttribute('data-index')] = {
        name: row.querySelector('input') ? row.querySelector('input').value : '',
        menu: row.querySelector('select') ? row.querySelector('select').value : 'Estándar'
      };
    });

    container.textContent = '';
    var attendingYes = attending.value === 'Sí';
    var guests = parseInt(guestsSelect.value, 10) || 1;
    var count = attendingYes ? Math.max(0, guests - 1) : 0;

    for (var i = 0; i < count; i++) {
      var row = document.createElement('div');
      row.className = 'companion-row';
      row.setAttribute('data-index', i);

      var name = document.createElement('input');
      name.type = 'text';
      name.maxLength = 80;
      name.placeholder = t('companionName', 'Nombre del acompañante') + ' ' + (i + 1);
      name.setAttribute('aria-label', t('companionName', 'Nombre del acompañante') + ' ' + (i + 1));
      if (current[i] && current[i].name) name.value = current[i].name;

      var menu = document.createElement('select');
      menu.setAttribute('aria-label', t('companionMenu', 'Menú del acompañante') + ' ' + (i + 1));
      menuOptions().forEach(function (opt) {
        var option = document.createElement('option');
        option.value = opt[0];
        option.textContent = opt[1];
        if (current[i] && current[i].menu === opt[0]) option.selected = true;
        menu.appendChild(option);
      });

      row.appendChild(name);
      row.appendChild(menu);
      container.appendChild(row);
    }

    var group = el('rsvp-companions-group');
    if (group) group.hidden = !(attendingYes && count > 0);
  }

  function toggleAttendanceFields() {
    var attending = el('rsvp-attending');
    if (!attending) return;
    var yes = attending.value === 'Sí';
    ['rsvp-menu-group', 'rsvp-bus-group', 'rsvp-allergies-group', 'rsvp-song-group', 'rsvp-guests-group'].forEach(function (id) {
      var node = el(id);
      if (node) node.hidden = !yes;
    });
    var companions = el('rsvp-companions-group');
    if (companions) companions.hidden = !yes;
    if (!yes) {
      var guests = el('rsvp-guests');
      if (guests) guests.value = '1';
    }
    renderCompanions();
  }

  function setupRsvp(d) {
    fillGuestSelect(d);
    toggleAttendanceFields();

    var attending = el('rsvp-attending');
    if (attending && !attending.dataset.bound) {
      attending.dataset.bound = '1';
      attending.addEventListener('change', toggleAttendanceFields);
    }
    var guests = el('rsvp-guests');
    if (guests && !guests.dataset.bound) {
      guests.dataset.bound = '1';
      guests.addEventListener('change', renderCompanions);
    }
    var form = el('rsvp-form');
    if (form && !form.dataset.bound) {
      form.dataset.bound = '1';
      form.addEventListener('submit', handleRsvpSubmit);
    }
    var retry = el('rsvp-retry');
    if (retry && !retry.dataset.bound) {
      retry.dataset.bound = '1';
      retry.addEventListener('click', function () {
        if (form) form.requestSubmit();
      });
    }
  }

  function rsvpErrorMessage(custom) {
    var base = custom || t('errorText', 'Revisa tu conexión e inténtalo de nuevo. Tus datos siguen rellenados.');
    var phone = currentData && String(currentData.contactPhone || '').replace(/[^\d]/g, '');
    var box = el('rsvp-error-msg');
    if (!box) return;
    box.textContent = base;
    if (phone) {
      var extra = document.createElement('span');
      extra.textContent = ' ' + t('errorWhatsapp', 'Si sigue fallando, avisa a los novios por WhatsApp:') + ' ';
      var link = document.createElement('a');
      link.href = 'https://wa.me/' + phone;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = '+' + phone;
      link.style.color = '#6d1f1f';
      extra.appendChild(link);
      box.appendChild(extra);
    }
  }

  function showRsvpError(message) {
    var box = el('rsvp-error');
    rsvpErrorMessage(message);
    if (box) { box.hidden = false; box.style.display = 'block'; }
  }

  function showRsvpSuccess(name) {
    var form = el('rsvp-form');
    var success = el('rsvp-success');
    var error = el('rsvp-error');
    var text = el('rsvp-success-text');
    if (form) form.style.display = 'none';
    if (error) { error.hidden = true; error.style.display = 'none'; }
    if (success) success.style.display = 'block';
    if (text) {
      var template = t('successText', 'tu confirmación se ha registrado correctamente.');
      if (name && template) {
        template = template.charAt(0).toLowerCase() + template.slice(1);
      }
      text.textContent = (name ? name + ', ' : '') + template;
    }
  }

  function collectCompanions() {
    var container = el('rsvp-companions');
    var list = [];
    if (!container) return list;
    container.querySelectorAll('.companion-row').forEach(function (row) {
      var input = row.querySelector('input');
      var select = row.querySelector('select');
      var name = input ? input.value.trim() : '';
      var menu = select ? select.value : 'Estándar';
      if (name) list.push({ name: name, menu: menu });
    });
    return list;
  }

  function handleRsvpSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;

    var form = el('rsvp-form');
    var nameInput = el('rsvp-name');
    var attendingInput = el('rsvp-attending');
    var guestsInput = el('rsvp-guests');
    var menuInput = el('rsvp-menu');
    var busInput = el('rsvp-bus');
    var allergiesInput = el('rsvp-allergies');
    var songInput = el('rsvp-song');
    var consentInput = el('rsvp-consent');
    var honeypot = el('rsvp-website');
    var submit = el('rsvp-submit');

    if (!nameInput || !attendingInput || !consentInput) return;

    // Los bots rellenan el campo oculto: no se envía nada, pero no les damos pistas.
    if (honeypot && honeypot.value.trim()) {
      showRsvpSuccess(nameInput.value.trim());
      return;
    }

    var name = nameInput.value.trim();
    if (name.length < 2) {
      showRsvpError(t('errorName', 'Escribe tu nombre y apellidos.'));
      nameInput.focus();
      return;
    }
    if (!consentInput.checked) {
      showRsvpError(t('errorConsent', 'Debes aceptar la política de privacidad para enviar la confirmación.'));
      return;
    }

    var attending = attendingInput.value === 'No' ? 'No' : 'Sí';
    var guests = attending === 'Sí' ? (parseInt(guestsInput && guestsInput.value, 10) || 1) : 1;
    var payload = {
      boda: slug,
      name: name,
      attending: attending,
      guests: guests,
      menu: attending === 'Sí' && menuInput ? menuInput.value : '',
      bus: attending === 'Sí' && busInput ? busInput.value : '',
      allergies: attending === 'Sí' && allergiesInput ? allergiesInput.value.trim() : '',
      song: attending === 'Sí' && songInput ? songInput.value.trim() : '',
      companions: attending === 'Sí' ? collectCompanions() : [],
      clientId: window.Store.clientId(storeSlug),
      consent: true,
      website: '',
      createdAt: new Date().toISOString()
    };

    var errorBox = el('rsvp-error');
    if (errorBox) { errorBox.hidden = true; errorBox.style.display = 'none'; }
    isSubmitting = true;
    if (submit) { submit.disabled = true; submit.textContent = t('sending', 'Enviando…'); }

    function finishSuccess() {
      showRsvpSuccess(name);
      isSubmitting = false;
      if (submit) { submit.disabled = false; submit.textContent = t('submitBtn', 'Enviar Confirmación ✓'); }
      window.dispatchEvent(new CustomEvent('rsvp:sent', { detail: payload }));
    }

    function finishError(err) {
      isSubmitting = false;
      if (submit) { submit.disabled = false; submit.textContent = t('submitBtn', 'Enviar Confirmación ✓'); }
      showRsvpError(t('errorText', 'Revisa tu conexión e inténtalo de nuevo. Tus datos siguen rellenados.'));
      if (window.console && console.error) console.error('[RSVP]', err);
    }

    // En demo o vista previa no enviamos datos reales.
    if (isDemo || isPreview || !isRemote) {
      var list = window.Store.loadRsvp(storeSlug);
      list.unshift(Object.assign({ id: Date.now(), demo: true }, payload));
      window.Store.saveRsvp(storeSlug, list);
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'RSVP_ADDED', payload: payload }, '*');
      }
      window.setTimeout(finishSuccess, 350);
      return;
    }

    if (!window.Nube || !window.Nube.enviarRsvp) {
      finishError(new Error('No se cargó el conector de Supabase.'));
      return;
    }

    window.Nube.enviarRsvp(payload).then(function (res) {
      if (!res || res.ok !== false) finishSuccess();
      else finishError(new Error('Respuesta no válida'));
    }).catch(function (err) {
      finishError(err);
    });
  }

  /* ------------------------------------------------------------------
     META / COMPARTIR / IDIOMA
     ------------------------------------------------------------------ */
  function updateMeta(d) {
    var title = (d.n1 || '') + ' & ' + (d.n2 || '') + ' · Invitación de boda';
    document.title = title;
    var description = 'Invitación de boda de ' + (d.n1 || '') + ' y ' + (d.n2 || '') +
      (d.date ? ' el ' + window.WeddingDates.format(d.date, 'es') : '') +
      (d.venue ? ' en ' + d.venue : '') + '. Confirma tu asistencia.';
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', description);
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);
    var ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', window.location.href);

    var photo = safePhoto(d.heroPhoto) ||
      (CSS_HERO_THEMES.indexOf(d.template) === -1
        ? (DEFAULT_HERO_BY_THEME[d.template] || DEFAULT_HERO_BY_THEME.olivo)
        : 'img/og-default.jpg');
    if (photo && !/^data:/.test(photo)) {
      var ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        try { ogImage.setAttribute('content', new URL(photo, window.location.href).href); } catch (e) {}
      }
    }
  }

  function updateShareButton(d) {
    var btn = el('share-wa-btn');
    if (!btn) return;
    btn.onclick = function () {
      var url = window.location.href.split('#')[0].split('?')[0];
      var query = [];
      if (params.get('boda')) query.push('boda=' + encodeURIComponent(slug));
      if (currentLang && currentLang !== 'es') query.push('lang=' + encodeURIComponent(currentLang));
      var link = query.length ? url + '?' + query.join('&') : url;
      var texts = {
        es: '💍 ¡Nos casamos! ' + (d.n1 || '') + ' y ' + (d.n2 || '') + ' queremos compartir contigo nuestra invitación de boda: ',
        val: '💍 Ens casem! ' + (d.n1 || '') + ' i ' + (d.n2 || '') + ' volem compartir amb tu la nostra invitació de boda: ',
        en: '💍 We are getting married! ' + (d.n1 || '') + ' and ' + (d.n2 || '') + ' would love to share our wedding invitation with you: '
      };
      var text = (texts[currentLang] || texts.es) + link;
      window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
    };
  }

  function setLanguage(lang) {
    if (['es', 'val', 'en'].indexOf(lang) === -1) return;
    currentLang = lang;
    if (currentData) {
      updateDateDisplay(currentData);
      updateShareButton(currentData);
      renderCompanions();
    }
  }

  /* ------------------------------------------------------------------
     ESTADO DE ERROR
     ------------------------------------------------------------------ */
  function showUnavailable(reason) {
    clearTimeout(fallbackTimer);
    removePreload();
    hideEnvelope();
    stopMusic();
    var shell = el('invite-shell');
    var status = el('invite-status');
    var title = el('invite-status-title');
    var text = el('invite-status-text');
    if (shell) shell.hidden = true;
    if (status) status.hidden = false;
    if (reason === 'not-found') {
      if (title) title.textContent = t('statusTitle', 'No encontramos esta invitación');
      if (text) text.textContent = t('statusText', 'Comprueba el enlace que te han enviado o pide uno nuevo a los novios.');
    } else {
      if (title) title.textContent = t('offlineTitle', 'No podemos cargar la invitación');
      if (text) text.textContent = t('offlineText', 'Revisa tu conexión y vuelve a intentarlo. Si el problema continúa, avisa a los novios.');
    }
  }

  /* ------------------------------------------------------------------
     EVENTOS
     ------------------------------------------------------------------ */
  window.addEventListener('wedding:data', function (ev) {
    if (!ev.detail || !ev.detail.data) return;
    remoteResolved = true;
    clearTimeout(fallbackTimer);
    var status = el('invite-status');
    if (status) status.hidden = true;
    var shell = el('invite-shell');
    if (shell) shell.hidden = false;
    renderInvitation(ev.detail.data, { replayEnvelope: false });
    removePreload();
  });

  window.addEventListener('wedding:unavailable', function (ev) {
    remoteResolved = true;
    showUnavailable(ev.detail && ev.detail.reason);
  });

  window.addEventListener('message', function (ev) {
    if (!ev.data) return;
    if (ev.data.type === 'UPDATE_INVITE') {
      renderInvitation(ev.data.payload, { replayEnvelope: !!ev.data.replayEnvelope });
      removePreload();
    } else if (ev.data.type === 'REPLAY_ENVELOPE') {
      renderInvitation(currentData, { replayEnvelope: true });
    }
  });

  window.addEventListener('online', function () {
    if (isRemote && !remoteResolved) window.location.reload();
  });

  document.addEventListener('click', function (e) {
    var copy = e.target.closest ? e.target.closest('#copy-iban-btn') : null;
    if (!copy) return;
    var iban = el('iban-text') ? el('iban-text').textContent.trim() : '';
    if (!iban) return;
    window.copyText(iban).then(function (ok) {
      copy.textContent = ok ? t('copied', '✓ ¡Cuenta copiada!') : t('copyFail', 'No se pudo copiar');
      window.setTimeout(function () {
        copy.textContent = t('copyIban', '📋 Copiar Número de Cuenta');
      }, 2200);
    });
  });

  /* ------------------------------------------------------------------
     INICIALIZACIÓN
     ------------------------------------------------------------------ */
  var initial = initialData();
  currentLang = chosenLanguage(initial);
  renderInvitation(initial, { replayEnvelope: replayParam || isDemo || (isPreview && !window.Store.hasOpenedEnvelope(slug)) });

  if (isRemote && !window.Store.hasData(slug)) {
    // No mostramos datos falsos: la página sigue oculta hasta recibir la boda real.
    fallbackTimer = setTimeout(function () {
      if (!remoteResolved) showUnavailable('offline');
    }, 6000);
  } else {
    removePreload();
  }
  if (isPreview || isDemo) removePreload();

  window.InviteApp = {
    render: renderInvitation,
    setLanguage: setLanguage,
    getData: function () { return currentData; },
    getSlug: function () { return slug; },
    isPreview: isPreview,
    isDemo: isDemo
  };
})();
