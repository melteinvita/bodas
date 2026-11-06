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
  var CSS_HERO_THEMES = ['classic', 'romantic', 'minimal', 'mediterranean', 'timeless', 'french-romance', 'black-tie', 'garden', 'ibiza', 'bridgerton', 'amalfi', 'bodega', 'viajeros', 'festival', 'harrypotter', 'lotr', 'hollywood', 'gamer'];
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
  /* Plantillas actuales: ornamentos dibujados a línea (sin emojis ni glifos). */
  ORNAMENTS_SVG.classic = "<svg viewBox='0 0 120 12'><path d='M0,6 H50 M70,6 H120' stroke-width='.8'/><path d='M60,1.6 L64.4,6 L60,10.4 L55.6,6 Z' stroke-width='.8'/></svg>";
  ORNAMENTS_SVG.romantic = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 260 80' fill='none'><path d='M6,46 C70,22 150,66 254,34' fill='none' stroke='#7F8769' stroke-width='1' stroke-linecap='round'/><g transform='translate(25.7 40.7) rotate(28)'><path d='M0,0 C3.2,-3.6 9.1,-3.6 13,0 C9.1,3.6 3.2,3.6 0,0Z' fill='#A4AA91' fill-opacity='0.5' stroke='#7F8769' stroke-width='0.5' stroke-linejoin='round'/><path d='M1.6,0 L11.2,0' stroke='#7F8769' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(46.4 38.6) rotate(-40.1)'><path d='M0,0 C3.4,-3.9 9.4,-3.9 13.5,0 C9.4,3.9 3.4,3.9 0,0Z' fill='#A4AA91' fill-opacity='0.5' stroke='#7F8769' stroke-width='0.5' stroke-linejoin='round'/><path d='M1.6,0 L11.6,0' stroke='#7F8769' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(68.1 38.9) rotate(41)'><path d='M0,0 C3.5,-4.1 9.8,-4.1 14,0 C9.8,4.1 3.5,4.1 0,0Z' fill='#A4AA91' fill-opacity='0.5' stroke='#7F8769' stroke-width='0.5' stroke-linejoin='round'/><path d='M1.7,0 L12,0' stroke='#7F8769' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(91 40.6) rotate(-32.6)'><path d='M0,0 C3.6,-4.3 10.1,-4.3 14.5,0 C10.1,4.3 3.6,4.3 0,0Z' fill='#A4AA91' fill-opacity='0.5' stroke='#7F8769' stroke-width='0.5' stroke-linejoin='round'/><path d='M1.7,0 L12.5,0' stroke='#7F8769' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(115 43) rotate(43.6)'><path d='M0,0 C3.8,-4.6 10.5,-4.6 15,0 C10.5,4.6 3.8,4.6 0,0Z' fill='#A4AA91' fill-opacity='0.5' stroke='#7F8769' stroke-width='0.5' stroke-linejoin='round'/><path d='M1.8,0 L12.9,0' stroke='#7F8769' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(140.2 45.1) rotate(-34.2)'><path d='M0,0 C3.9,-4.8 10.8,-4.8 15.5,0 C10.8,4.8 3.9,4.8 0,0Z' fill='#A4AA91' fill-opacity='0.5' stroke='#7F8769' stroke-width='0.5' stroke-linejoin='round'/><path d='M1.9,0 L13.3,0' stroke='#7F8769' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(166.7 46.2) rotate(38.4)'><path d='M0,0 C4,-5.1 11.2,-5.1 16,0 C11.2,5.1 4,5.1 0,0Z' fill='#A4AA91' fill-opacity='0.5' stroke='#7F8769' stroke-width='0.5' stroke-linejoin='round'/><path d='M1.9,0 L13.8,0' stroke='#7F8769' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(194.4 45.2) rotate(-42.4)'><path d='M0,0 C4.1,-5.3 11.5,-5.3 16.5,0 C11.5,5.3 4.1,5.3 0,0Z' fill='#A4AA91' fill-opacity='0.5' stroke='#7F8769' stroke-width='0.5' stroke-linejoin='round'/><path d='M2,0 L14.2,0' stroke='#7F8769' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(223.5 41.5) rotate(27.6)'><path d='M0,0 C4.2,-5.6 11.9,-5.6 17,0 C11.9,5.6 4.2,5.6 0,0Z' fill='#A4AA91' fill-opacity='0.5' stroke='#7F8769' stroke-width='0.5' stroke-linejoin='round'/><path d='M2,0 L14.6,0' stroke='#7F8769' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(254 34) rotate(-17.1)'><path d='M0,0 C4.5,-5.6 12.5,-5.6 17.9,0 C12.5,5.6 4.5,5.6 0,0Z' fill='#A4AA91' fill-opacity='0.5' stroke='#7F8769' stroke-width='0.5' stroke-linejoin='round'/><path d='M2.1,0 L15.4,0' stroke='#7F8769' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(72.6 30.1) rotate(3.6)'><ellipse cx='4.7' cy='0' rx='4.7' ry='3' transform='rotate(0) translate(0 0)' fill='#D8B8B1' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='4.7' cy='0' rx='4.7' ry='3' transform='rotate(60) translate(0 0)' fill='#D8B8B1' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='4.7' cy='0' rx='4.7' ry='3' transform='rotate(120) translate(0 0)' fill='#D8B8B1' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='4.7' cy='0' rx='4.7' ry='3' transform='rotate(180) translate(0 0)' fill='#D8B8B1' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='4.7' cy='0' rx='4.7' ry='3' transform='rotate(240) translate(0 0)' fill='#D8B8B1' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='4.7' cy='0' rx='4.7' ry='3' transform='rotate(300) translate(0 0)' fill='#D8B8B1' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><circle r='1.3' fill='#C6AE83'/><circle cx='2.2' cy='0.4' r='0.3' fill='#C6AE83'/><circle cx='0.3' cy='2.2' r='0.3' fill='#C6AE83'/><circle cx='-2' cy='1' r='0.3' fill='#C6AE83'/><circle cx='-1.6' cy='-1.6' r='0.3' fill='#C6AE83'/><circle cx='1.1' cy='-2' r='0.3' fill='#C6AE83'/></g><g transform='translate(145.4 36.5) rotate(3.3)'><ellipse cx='5.9' cy='0' rx='5.9' ry='3.8' transform='rotate(0) translate(0 0)' fill='#D8B8B1' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='5.9' cy='0' rx='5.9' ry='3.8' transform='rotate(60) translate(0 0)' fill='#D8B8B1' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='5.9' cy='0' rx='5.9' ry='3.8' transform='rotate(120) translate(0 0)' fill='#D8B8B1' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='5.9' cy='0' rx='5.9' ry='3.8' transform='rotate(180) translate(0 0)' fill='#D8B8B1' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='5.9' cy='0' rx='5.9' ry='3.8' transform='rotate(240) translate(0 0)' fill='#D8B8B1' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='5.9' cy='0' rx='5.9' ry='3.8' transform='rotate(300) translate(0 0)' fill='#D8B8B1' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='3.7' cy='0' rx='3.7' ry='2.4' transform='rotate(36) translate(0 0)' fill='#EBD3CD' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='3.7' cy='0' rx='3.7' ry='2.4' transform='rotate(108) translate(0 0)' fill='#EBD3CD' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='3.7' cy='0' rx='3.7' ry='2.4' transform='rotate(180) translate(0 0)' fill='#EBD3CD' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='3.7' cy='0' rx='3.7' ry='2.4' transform='rotate(252) translate(0 0)' fill='#EBD3CD' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='3.7' cy='0' rx='3.7' ry='2.4' transform='rotate(324) translate(0 0)' fill='#EBD3CD' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><circle r='1.6' fill='#C6AE83'/><circle cx='2.8' cy='0.5' r='0.4' fill='#C6AE83'/><circle cx='0.4' cy='2.8' r='0.4' fill='#C6AE83'/><circle cx='-2.6' cy='1.2' r='0.4' fill='#C6AE83'/><circle cx='-2' cy='-2.1' r='0.4' fill='#C6AE83'/><circle cx='1.3' cy='-2.5' r='0.4' fill='#C6AE83'/></g><g transform='translate(211.7 34.4) rotate(-7.9)'><ellipse cx='3.7' cy='0' rx='3.7' ry='2.4' transform='rotate(0) translate(0 0)' fill='#D8B8B1' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='3.7' cy='0' rx='3.7' ry='2.4' transform='rotate(60) translate(0 0)' fill='#D8B8B1' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='3.7' cy='0' rx='3.7' ry='2.4' transform='rotate(120) translate(0 0)' fill='#D8B8B1' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='3.7' cy='0' rx='3.7' ry='2.4' transform='rotate(180) translate(0 0)' fill='#D8B8B1' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='3.7' cy='0' rx='3.7' ry='2.4' transform='rotate(240) translate(0 0)' fill='#D8B8B1' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><ellipse cx='3.7' cy='0' rx='3.7' ry='2.4' transform='rotate(300) translate(0 0)' fill='#D8B8B1' fill-opacity='.92' stroke='#C09088' stroke-width='.45'/><circle r='1' fill='#C6AE83'/><circle cx='1.8' cy='0.3' r='0.3' fill='#C6AE83'/><circle cx='0.3' cy='1.8' r='0.3' fill='#C6AE83'/><circle cx='-1.6' cy='0.8' r='0.3' fill='#C6AE83'/><circle cx='-1.3' cy='-1.3' r='0.3' fill='#C6AE83'/><circle cx='0.8' cy='-1.6' r='0.3' fill='#C6AE83'/></g></svg>";
  ORNAMENTS_SVG.minimal = '';
  ORNAMENTS_SVG.mediterranean = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='-6 0 272 80' fill='none'><path d='M6,44 C70,16 160,62 254,30' fill='none' stroke='#655C4E' stroke-width='1.1' stroke-linecap='round'/><g transform='translate(22.5 38.5) rotate(20.2)'><path d='M0,0 C4.5,-3.4 12.6,-3.4 18,0 C12.6,3.4 4.5,3.4 0,0Z' fill='#777C5B' fill-opacity='0.88' stroke='#5F6648' stroke-width='0.4' stroke-linejoin='round'/><path d='M2.2,0 L15.5,0' stroke='#5F6648' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(40.1 35.5) rotate(-40)'><path d='M0,0 C4.7,-3.4 13,-3.4 18.6,0 C13,3.4 4.7,3.4 0,0Z' fill='#A3A884' fill-opacity='0.88' stroke='#5F6648' stroke-width='0.4' stroke-linejoin='round'/><path d='M2.2,0 L16,0' stroke='#5F6648' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(58.5 34.5) rotate(33.6)'><path d='M0,0 C4.8,-3.4 13.4,-3.4 19.2,0 C13.4,3.4 4.8,3.4 0,0Z' fill='#777C5B' fill-opacity='0.88' stroke='#5F6648' stroke-width='0.4' stroke-linejoin='round'/><path d='M2.3,0 L16.5,0' stroke='#5F6648' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(77.9 35) rotate(-30.8)'><path d='M0,0 C5,-3.4 13.9,-3.4 19.8,0 C13.9,3.4 5,3.4 0,0Z' fill='#A3A884' fill-opacity='0.88' stroke='#5F6648' stroke-width='0.4' stroke-linejoin='round'/><path d='M2.4,0 L17,0' stroke='#5F6648' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(98 36.5) rotate(39.1)'><path d='M0,0 C5.1,-3.4 14.3,-3.4 20.4,0 C14.3,3.4 5.1,3.4 0,0Z' fill='#777C5B' fill-opacity='0.88' stroke='#5F6648' stroke-width='0.4' stroke-linejoin='round'/><path d='M2.4,0 L17.5,0' stroke='#5F6648' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(118.8 38.5) rotate(-28.6)'><path d='M0,0 C5.2,-3.4 14.7,-3.4 21,0 C14.7,3.4 5.2,3.4 0,0Z' fill='#A3A884' fill-opacity='0.88' stroke='#5F6648' stroke-width='0.4' stroke-linejoin='round'/><path d='M2.5,0 L18.1,0' stroke='#5F6648' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(140.2 40.4) rotate(38.4)'><path d='M0,0 C5.4,-3.4 15.1,-3.4 21.6,0 C15.1,3.4 5.4,3.4 0,0Z' fill='#777C5B' fill-opacity='0.88' stroke='#5F6648' stroke-width='0.4' stroke-linejoin='round'/><path d='M2.6,0 L18.6,0' stroke='#5F6648' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(162.1 41.6) rotate(-32)'><path d='M0,0 C5.5,-3.4 15.5,-3.4 22.2,0 C15.5,3.4 5.5,3.4 0,0Z' fill='#A3A884' fill-opacity='0.88' stroke='#5F6648' stroke-width='0.4' stroke-linejoin='round'/><path d='M2.7,0 L19.1,0' stroke='#5F6648' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(184.6 41.8) rotate(32.4)'><path d='M0,0 C5.7,-3.4 16,-3.4 22.8,0 C16,3.4 5.7,3.4 0,0Z' fill='#777C5B' fill-opacity='0.88' stroke='#5F6648' stroke-width='0.4' stroke-linejoin='round'/><path d='M2.7,0 L19.6,0' stroke='#5F6648' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(207.4 40.2) rotate(-40.3)'><path d='M0,0 C5.8,-3.4 16.4,-3.4 23.4,0 C16.4,3.4 5.8,3.4 0,0Z' fill='#A3A884' fill-opacity='0.88' stroke='#5F6648' stroke-width='0.4' stroke-linejoin='round'/><path d='M2.8,0 L20.1,0' stroke='#5F6648' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(230.6 36.5) rotate(21.9)'><path d='M0,0 C6,-3.4 16.8,-3.4 24,0 C16.8,3.4 6,3.4 0,0Z' fill='#777C5B' fill-opacity='0.88' stroke='#5F6648' stroke-width='0.4' stroke-linejoin='round'/><path d='M2.9,0 L20.6,0' stroke='#5F6648' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><g transform='translate(254 30) rotate(-18.8)'><path d='M0,0 C6.6,-3.4 18.5,-3.4 26.4,0 C18.5,3.4 6.6,3.4 0,0Z' fill='#777C5B' fill-opacity='0.9' stroke='#5F6648' stroke-width='0.4' stroke-linejoin='round'/><path d='M3.2,0 L22.7,0' stroke='#5F6648' stroke-width='.35' stroke-opacity='.7' fill='none'/></g><path d='M70,34.7 L70.3,25.7' stroke='#655C4E' stroke-width='.7'/><ellipse cx='70.3' cy='28.7' rx='3.4' ry='5' transform='rotate(-168 70.3 28.7)' fill='#5F6648'/><ellipse cx='69.3' cy='27.1' rx='0.9' ry='1.4' fill='#ffffff' fill-opacity='.28'/><path d='M134.1,39.9 L133.4,48.9' stroke='#655C4E' stroke-width='.7'/><ellipse cx='133.4' cy='51.9' rx='3.4' ry='5' transform='rotate(14.8 133.4 51.9)' fill='#6B5560'/><ellipse cx='132.4' cy='50.3' rx='0.9' ry='1.4' fill='#ffffff' fill-opacity='.28'/><path d='M192.8,41.4 L192.3,32.4' stroke='#655C4E' stroke-width='.7'/><ellipse cx='192.3' cy='35.4' rx='3.4' ry='5' transform='rotate(-173.2 192.3 35.4)' fill='#5F6648'/><ellipse cx='191.3' cy='33.8' rx='0.9' ry='1.4' fill='#ffffff' fill-opacity='.28'/></svg>";
  ORNAMENTS_SVG.timeless = '';
  ORNAMENTS_SVG['french-romance'] = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 220 124' ><defs><filter id='wc' x='-25%' y='-25%' width='150%' height='150%'><feTurbulence type='fractalNoise' baseFrequency='.07' numOctaves='2' seed='4' result='n'/><feDisplacementMap in='SourceGraphic' in2='n' scale='2.4'/><feGaussianBlur stdDeviation='.28'/></filter><filter id='soft' x='-60%' y='-60%' width='220%' height='220%'><feGaussianBlur stdDeviation='2.2'/></filter></defs><g filter='url(#wc)'><path d='M112,112 C144,108 180,80 184,36' fill='none' stroke='#777C63' stroke-opacity='.65' stroke-width='0.9' stroke-linecap='round'/><g transform='translate(117.8 111) rotate(45.4)'><path d='M0,0 C4.3,-4.2 12.3,-4.2 17.1,0 C12.3,4.2 4.3,4.2 0,0Z' fill='#BFC4AE' fill-opacity='0.75'/><path d='M1.7,0 H14.7' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(117.8 111) rotate(-68.9)'><path d='M0,0 C2,-1.7 5.7,-1.7 7.9,0 C5.7,1.7 2,1.7 0,0Z' fill='#777C63' fill-opacity='0.5'/><path d='M0.8,0 H6.8' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(129 107.7) rotate(30.8)'><path d='M0,0 C2.8,-2.4 8,-2.4 11.2,0 C8,2.4 2.8,2.4 0,0Z' fill='#BFC4AE' fill-opacity='0.75'/><path d='M1.1,0 H9.6' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(129 107.7) rotate(-71)'><path d='M0,0 C1.9,-1.6 5.4,-1.6 7.4,0 C5.4,1.6 1.9,1.6 0,0Z' fill='#A4AA91' fill-opacity='0.72'/><path d='M0.7,0 H6.4' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(140 102.7) rotate(16.6)'><path d='M0,0 C3.3,-3 9.5,-3 13.2,0 C9.5,3 3.3,3 0,0Z' fill='#777C63' fill-opacity='0.6'/><path d='M1.3,0 H11.3' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(150.5 95.9) rotate(19.9)'><path d='M0,0 C4.4,-4.4 12.6,-4.4 17.6,0 C12.6,4.4 4.4,4.4 0,0Z' fill='#A4AA91' fill-opacity='0.72'/><path d='M1.8,0 H15.1' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(160.1 87.4) rotate(7.3)'><path d='M0,0 C2.8,-2.6 8.1,-2.6 11.3,0 C8.1,2.6 2.8,2.6 0,0Z' fill='#A4AA91' fill-opacity='0.72'/><path d='M1.1,0 H9.7' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(160.1 87.4) rotate(-93.8)'><path d='M0,0 C2.9,-2.5 8.4,-2.5 11.7,0 C8.4,2.5 2.9,2.5 0,0Z' fill='#777C63' fill-opacity='0.5'/><path d='M1.2,0 H10' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(168.6 77.4) rotate(-5.2)'><path d='M0,0 C2.3,-2.2 6.6,-2.2 9.1,0 C6.6,2.2 2.3,2.2 0,0Z' fill='#777C63' fill-opacity='0.6'/><path d='M0.9,0 H7.9' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(168.6 77.4) rotate(-102.8)'><path d='M0,0 C2.8,-2.7 8.1,-2.7 11.2,0 C8.1,2.7 2.8,2.7 0,0Z' fill='#777C63' fill-opacity='0.6'/><path d='M1.1,0 H9.6' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(175.6 65.9) rotate(-11.9)'><path d='M0,0 C2.5,-2.1 7.3,-2.1 10.2,0 C7.3,2.1 2.5,2.1 0,0Z' fill='#777C63' fill-opacity='0.5'/><path d='M1,0 H8.7' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(175.6 65.9) rotate(-121.6)'><path d='M0,0 C3.1,-2.5 8.9,-2.5 12.3,0 C8.9,2.5 3.1,2.5 0,0Z' fill='#BFC4AE' fill-opacity='0.75'/><path d='M1.2,0 H10.6' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(180.7 52.9) rotate(-22)'><path d='M0,0 C2.5,-2.4 7.2,-2.4 10,0 C7.2,2.4 2.5,2.4 0,0Z' fill='#777C63' fill-opacity='0.6'/><path d='M1,0 H8.6' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(180.7 52.9) rotate(-132.9)'><path d='M0,0 C1.6,-1.5 4.5,-1.5 6.2,0 C4.5,1.5 1.6,1.5 0,0Z' fill='#A4AA91' fill-opacity='0.72'/><path d='M0.6,0 H5.3' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(183.7 38.6) rotate(-26.1)'><path d='M0,0 C2.3,-1.9 6.7,-1.9 9.4,0 C6.7,1.9 2.3,1.9 0,0Z' fill='#BFC4AE' fill-opacity='0.75'/><path d='M0.9,0 H8.1' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(183.7 38.6) rotate(-133.9)'><path d='M0,0 C2.6,-2.6 7.5,-2.6 10.4,0 C7.5,2.6 2.6,2.6 0,0Z' fill='#777C63' fill-opacity='0.6'/><path d='M1,0 H9' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(184 36) rotate(-84.8)'><path d='M0,0 C3,-2.6 8.6,-2.6 12,0 C8.6,2.6 3,2.6 0,0Z' fill='#777C63' fill-opacity='0.6'/><path d='M1.2,0 H10.3' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g></g><g filter='url(#wc)'><path d='M184,36 C188,22 176,8 158,4' fill='none' stroke='#777C63' stroke-opacity='.65' stroke-width='0.8' stroke-linecap='round'/><g transform='translate(184.5 33.5) rotate(-23.9)'><path d='M0,0 C3,-2.6 8.6,-2.6 12,0 C8.6,2.6 3,2.6 0,0Z' fill='#BFC4AE' fill-opacity='0.75'/><path d='M1.2,0 H10.3' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(184.5 33.5) rotate(-127.9)'><path d='M0,0 C1.9,-1.8 5.4,-1.8 7.5,0 C5.4,1.8 1.9,1.8 0,0Z' fill='#BFC4AE' fill-opacity='0.75'/><path d='M0.8,0 H6.5' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(183.7 24.1) rotate(-49.7)'><path d='M0,0 C3.5,-2.9 9.9,-2.9 13.8,0 C9.9,2.9 3.5,2.9 0,0Z' fill='#BFC4AE' fill-opacity='0.75'/><path d='M1.4,0 H11.9' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(183.7 24.1) rotate(-150.2)'><path d='M0,0 C2.3,-2.2 6.6,-2.2 9.1,0 C6.6,2.2 2.3,2.2 0,0Z' fill='#777C63' fill-opacity='0.5'/><path d='M0.9,0 H7.8' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(178.7 15.6) rotate(-87.7)'><path d='M0,0 C2,-2 5.8,-2 8.1,0 C5.8,2 2,2 0,0Z' fill='#777C63' fill-opacity='0.5'/><path d='M0.8,0 H6.9' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(178.7 15.6) rotate(-174.7)'><path d='M0,0 C1.7,-1.7 5,-1.7 7,0 C5,1.7 1.7,1.7 0,0Z' fill='#A4AA91' fill-opacity='0.72'/><path d='M0.7,0 H6' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(170.2 8.7) rotate(-106.9)'><path d='M0,0 C2.9,-2.6 8.3,-2.6 11.5,0 C8.3,2.6 2.9,2.6 0,0Z' fill='#777C63' fill-opacity='0.5'/><path d='M1.2,0 H9.9' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(170.2 8.7) rotate(-207.4)'><path d='M0,0 C1.6,-1.5 4.6,-1.5 6.3,0 C4.6,1.5 1.6,1.5 0,0Z' fill='#777C63' fill-opacity='0.5'/><path d='M0.6,0 H5.4' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(159.1 4.3) rotate(-112.7)'><path d='M0,0 C2.5,-2.1 7.1,-2.1 9.9,0 C7.1,2.1 2.5,2.1 0,0Z' fill='#777C63' fill-opacity='0.5'/><path d='M1,0 H8.5' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(159.1 4.3) rotate(-213.9)'><path d='M0,0 C2.6,-2.6 7.6,-2.6 10.5,0 C7.6,2.6 2.6,2.6 0,0Z' fill='#777C63' fill-opacity='0.6'/><path d='M1.1,0 H9.1' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(158 4) rotate(-167.5)'><path d='M0,0 C2.2,-1.9 6.3,-1.9 8.8,0 C6.3,1.9 2.2,1.9 0,0Z' fill='#777C63' fill-opacity='0.6'/><path d='M0.9,0 H7.6' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g></g><g filter='url(#wc)'><path d='M108,112 C76,108 40,80 36,36' fill='none' stroke='#777C63' stroke-opacity='.65' stroke-width='0.9' stroke-linecap='round'/><g transform='translate(102.2 111) rotate(-109.4)'><path d='M0,0 C4.3,-3.6 12.4,-3.6 17.2,0 C12.4,3.6 4.3,3.6 0,0Z' fill='#777C63' fill-opacity='0.5'/><path d='M1.7,0 H14.8' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(102.2 111) rotate(-212.2)'><path d='M0,0 C3.2,-3 9.1,-3 12.7,0 C9.1,3 3.2,3 0,0Z' fill='#BFC4AE' fill-opacity='0.75'/><path d='M1.3,0 H10.9' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(91 107.7) rotate(-102.7)'><path d='M0,0 C4,-3.5 11.5,-3.5 16,0 C11.5,3.5 4,3.5 0,0Z' fill='#777C63' fill-opacity='0.6'/><path d='M1.6,0 H13.8' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(80 102.7) rotate(-90.9)'><path d='M0,0 C3.6,-3.1 10.2,-3.1 14.2,0 C10.2,3.1 3.6,3.1 0,0Z' fill='#BFC4AE' fill-opacity='0.75'/><path d='M1.4,0 H12.2' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(80 102.7) rotate(-200)'><path d='M0,0 C2.7,-2.3 7.9,-2.3 11,0 C7.9,2.3 2.7,2.3 0,0Z' fill='#BFC4AE' fill-opacity='0.75'/><path d='M1.1,0 H9.5' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(69.5 95.9) rotate(-93.7)'><path d='M0,0 C3.4,-3.2 9.9,-3.2 13.7,0 C9.9,3.2 3.4,3.2 0,0Z' fill='#BFC4AE' fill-opacity='0.75'/><path d='M1.4,0 H11.8' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(69.5 95.9) rotate(-201.6)'><path d='M0,0 C2.4,-2.2 6.8,-2.2 9.5,0 C6.8,2.2 2.4,2.2 0,0Z' fill='#A4AA91' fill-opacity='0.72'/><path d='M1,0 H8.2' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(59.9 87.4) rotate(-82.1)'><path d='M0,0 C4.4,-3.7 12.6,-3.7 17.6,0 C12.6,3.7 4.4,3.7 0,0Z' fill='#A4AA91' fill-opacity='0.72'/><path d='M1.8,0 H15.1' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(59.9 87.4) rotate(-190.6)'><path d='M0,0 C2.5,-2.4 7.2,-2.4 10,0 C7.2,2.4 2.5,2.4 0,0Z' fill='#777C63' fill-opacity='0.6'/><path d='M1,0 H8.6' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(51.4 77.4) rotate(-77.4)'><path d='M0,0 C3.8,-3.4 10.8,-3.4 15.1,0 C10.8,3.4 3.8,3.4 0,0Z' fill='#777C63' fill-opacity='0.5'/><path d='M1.5,0 H13' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(44.4 65.9) rotate(-70.7)'><path d='M0,0 C4,-3.6 11.7,-3.6 16.2,0 C11.7,3.6 4,3.6 0,0Z' fill='#A4AA91' fill-opacity='0.72'/><path d='M1.6,0 H13.9' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(39.3 52.9) rotate(-46.1)'><path d='M0,0 C3.2,-3.2 9.2,-3.2 12.7,0 C9.2,3.2 3.2,3.2 0,0Z' fill='#777C63' fill-opacity='0.6'/><path d='M1.3,0 H10.9' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(39.3 52.9) rotate(-158.6)'><path d='M0,0 C1.5,-1.4 4.4,-1.4 6.2,0 C4.4,1.4 1.5,1.4 0,0Z' fill='#A4AA91' fill-opacity='0.72'/><path d='M0.6,0 H5.3' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(36.3 38.6) rotate(-43.3)'><path d='M0,0 C2.3,-2 6.7,-2 9.3,0 C6.7,2 2.3,2 0,0Z' fill='#777C63' fill-opacity='0.6'/><path d='M0.9,0 H8' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(36 36) rotate(-95.2)'><path d='M0,0 C3,-2.6 8.6,-2.6 12,0 C8.6,2.6 3,2.6 0,0Z' fill='#777C63' fill-opacity='0.6'/><path d='M1.2,0 H10.3' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g></g><g filter='url(#wc)'><path d='M36,36 C32,22 44,8 62,4' fill='none' stroke='#777C63' stroke-opacity='.65' stroke-width='0.8' stroke-linecap='round'/><g transform='translate(35.5 33.5) rotate(-42.2)'><path d='M0,0 C2.7,-2.6 7.7,-2.6 10.7,0 C7.7,2.6 2.7,2.6 0,0Z' fill='#BFC4AE' fill-opacity='0.75'/><path d='M1.1,0 H9.2' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(35.5 33.5) rotate(-141.3)'><path d='M0,0 C3.4,-3.1 9.8,-3.1 13.5,0 C9.8,3.1 3.4,3.1 0,0Z' fill='#BFC4AE' fill-opacity='0.75'/><path d='M1.4,0 H11.6' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(36.3 24.1) rotate(-15.6)'><path d='M0,0 C3.1,-2.7 8.8,-2.7 12.2,0 C8.8,2.7 3.1,2.7 0,0Z' fill='#BFC4AE' fill-opacity='0.75'/><path d='M1.2,0 H10.5' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(36.3 24.1) rotate(-115.2)'><path d='M0,0 C1.9,-1.7 5.5,-1.7 7.7,0 C5.5,1.7 1.9,1.7 0,0Z' fill='#A4AA91' fill-opacity='0.72'/><path d='M0.8,0 H6.6' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(41.3 15.6) rotate(3.3)'><path d='M0,0 C1.9,-1.6 5.4,-1.6 7.5,0 C5.4,1.6 1.9,1.6 0,0Z' fill='#A4AA91' fill-opacity='0.72'/><path d='M0.8,0 H6.5' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(49.8 8.7) rotate(16.6)'><path d='M0,0 C1.6,-1.5 4.5,-1.5 6.2,0 C4.5,1.5 1.6,1.5 0,0Z' fill='#A4AA91' fill-opacity='0.72'/><path d='M0.6,0 H5.3' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(49.8 8.7) rotate(-76.5)'><path d='M0,0 C2.9,-2.9 8.5,-2.9 11.7,0 C8.5,2.9 2.9,2.9 0,0Z' fill='#777C63' fill-opacity='0.5'/><path d='M1.2,0 H10.1' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(60.9 4.3) rotate(37.8)'><path d='M0,0 C3.5,-3 10.1,-3 14.1,0 C10.1,3 3.5,3 0,0Z' fill='#A4AA91' fill-opacity='0.72'/><path d='M1.4,0 H12.1' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(60.9 4.3) rotate(-71.9)'><path d='M0,0 C1.7,-1.5 5,-1.5 6.9,0 C5,1.5 1.7,1.5 0,0Z' fill='#BFC4AE' fill-opacity='0.75'/><path d='M0.7,0 H5.9' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(62 4) rotate(-12.5)'><path d='M0,0 C2.2,-1.9 6.3,-1.9 8.8,0 C6.3,1.9 2.2,1.9 0,0Z' fill='#777C63' fill-opacity='0.6'/><path d='M0.9,0 H7.6' stroke='#F8F4EC' stroke-opacity='.55' stroke-width='.45' fill='none'/></g></g><path d='M110,6 C168,6 190,44 190,66 C190,96 150,118 110,118 C70,118 30,96 30,66 C30,44 52,6 110,6' fill='none' stroke='#B39A70' stroke-opacity='0.35' stroke-width='0.5' stroke-linecap='round' stroke-dasharray='1 3'/><circle cx='96' cy='60' r='17' fill='none' stroke='#B39A70' stroke-width='1.4'/><circle cx='124' cy='60' r='17' fill='none' stroke='#B39A70' stroke-width='1.4'/><path d='M110,47.6 A17,17 0 0 1 110,72.4' fill='none' stroke='#CDB993' stroke-width='3.4' stroke-opacity='.0'/><path d='M110,47.6 A17,17 0 0 0 110,72.4' fill='none' stroke='#B39A70' stroke-width='1.4'/><circle cx='96' cy='60' r='13.6' fill='none' stroke='#CDB993' stroke-width='.5' stroke-opacity='.8'/><circle cx='124' cy='60' r='13.6' fill='none' stroke='#CDB993' stroke-width='.5' stroke-opacity='.8'/><g transform='translate(110 108) rotate(10)'><circle r='11.9' fill='#C49991' fill-opacity='.30' filter='url(#soft)'/><g filter='url(#wc)'><ellipse cx='4.8' cy='0.7' rx='6.8' ry='5.3' transform='rotate(8.2 4.8 0.7)' fill='#D8B9B4' fill-opacity='.8' stroke='#C49991' stroke-opacity='.5' stroke-width='.55'/><ellipse cx='1.8' cy='4.5' rx='6.8' ry='5.3' transform='rotate(68.1 1.8 4.5)' fill='#D8B9B4' fill-opacity='.8' stroke='#C49991' stroke-opacity='.5' stroke-width='.55'/><ellipse cx='-1.8' cy='4.5' rx='6.8' ry='5.3' transform='rotate(112 -1.8 4.5)' fill='#D8B9B4' fill-opacity='.8' stroke='#C49991' stroke-opacity='.5' stroke-width='.55'/><ellipse cx='-4.8' cy='0.6' rx='6.8' ry='5.3' transform='rotate(172.5 -4.8 0.6)' fill='#D8B9B4' fill-opacity='.8' stroke='#C49991' stroke-opacity='.5' stroke-width='.55'/><ellipse cx='-2' cy='-4.4' rx='6.8' ry='5.3' transform='rotate(246 -2 -4.4)' fill='#D8B9B4' fill-opacity='.8' stroke='#C49991' stroke-opacity='.5' stroke-width='.55'/><ellipse cx='2.7' cy='-4' rx='6.8' ry='5.3' transform='rotate(304.2 2.7 -4)' fill='#D8B9B4' fill-opacity='.8' stroke='#C49991' stroke-opacity='.5' stroke-width='.55'/><ellipse cx='2.7' cy='1.2' rx='4.6' ry='3.7' transform='rotate(23.4 2.7 1.2)' fill='#C49991' fill-opacity='.62' stroke='#A97A74' stroke-opacity='.38' stroke-width='.5'/><ellipse cx='0.1' cy='3' rx='4.6' ry='3.7' transform='rotate(88.2 0.1 3)' fill='#C49991' fill-opacity='.62' stroke='#A97A74' stroke-opacity='.38' stroke-width='.5'/><ellipse cx='-2.9' cy='0.7' rx='4.6' ry='3.7' transform='rotate(166.1 -2.9 0.7)' fill='#C49991' fill-opacity='.62' stroke='#A97A74' stroke-opacity='.38' stroke-width='.5'/><ellipse cx='-1.6' cy='-2.5' rx='4.6' ry='3.7' transform='rotate(238.1 -1.6 -2.5)' fill='#C49991' fill-opacity='.62' stroke='#A97A74' stroke-opacity='.38' stroke-width='.5'/><ellipse cx='1.9' cy='-2.3' rx='4.6' ry='3.7' transform='rotate(309.6 1.9 -2.3)' fill='#C49991' fill-opacity='.62' stroke='#A97A74' stroke-opacity='.38' stroke-width='.5'/></g><path d='M-3.3,0.3 a3.3,3.3 0 1 1 4.3,-2.3 a2,2 0 1 1 -3,1.8' fill='none' stroke='#A97A74' stroke-opacity='.6' stroke-width='.65' stroke-linecap='round'/><circle r='1.1' fill='#A97A74' fill-opacity='.55'/><path d='M-8.8,-1.1 a9.3,9.3 0 0 1 7.7,-6.8' fill='none' stroke='#F8F4EC' stroke-opacity='.6' stroke-width='.8' stroke-linecap='round'/></g><g transform='translate(110 8) rotate(0) scale(0.8)' filter='url(#wc)'><path d='M0,0 C-5,-3 -5,-10 0,-14 C5,-10 5,-3 0,0Z' fill='#D8B9B4' fill-opacity='.85' stroke='#C49991' stroke-opacity='.5' stroke-width='.6'/><path d='M0,-1 C-3,-5 -2,-9 0,-12' fill='none' stroke='#C49991' stroke-opacity='.6' stroke-width='.5'/><path d='M-4,-2 C-7,-5 -6,-8 -3,-9 M4,-2 C7,-5 6,-8 3,-9' fill='none' stroke='#777C63' stroke-opacity='.6' stroke-width='.6'/></g><g transform='translate(40 94) rotate(0)' filter='url(#wc)'><ellipse cx='2.5' cy='0' rx='2.5' ry='1.4' transform='rotate(0)' fill='#F8F4EC' fill-opacity='.92' stroke='#C49991' stroke-opacity='.5' stroke-width='.5'/><ellipse cx='2.5' cy='0' rx='2.5' ry='1.4' transform='rotate(60)' fill='#F8F4EC' fill-opacity='.92' stroke='#C49991' stroke-opacity='.5' stroke-width='.5'/><ellipse cx='2.5' cy='0' rx='2.5' ry='1.4' transform='rotate(120)' fill='#F8F4EC' fill-opacity='.92' stroke='#C49991' stroke-opacity='.5' stroke-width='.5'/><ellipse cx='2.5' cy='0' rx='2.5' ry='1.4' transform='rotate(180)' fill='#F8F4EC' fill-opacity='.92' stroke='#C49991' stroke-opacity='.5' stroke-width='.5'/><ellipse cx='2.5' cy='0' rx='2.5' ry='1.4' transform='rotate(240)' fill='#F8F4EC' fill-opacity='.92' stroke='#C49991' stroke-opacity='.5' stroke-width='.5'/><ellipse cx='2.5' cy='0' rx='2.5' ry='1.4' transform='rotate(300)' fill='#F8F4EC' fill-opacity='.92' stroke='#C49991' stroke-opacity='.5' stroke-width='.5'/><circle r='0.9' fill='#B39A70' fill-opacity='.95'/></g><g transform='translate(180 94) rotate(20)' filter='url(#wc)'><ellipse cx='2.5' cy='0' rx='2.5' ry='1.4' transform='rotate(0)' fill='#F8F4EC' fill-opacity='.92' stroke='#C49991' stroke-opacity='.5' stroke-width='.5'/><ellipse cx='2.5' cy='0' rx='2.5' ry='1.4' transform='rotate(60)' fill='#F8F4EC' fill-opacity='.92' stroke='#C49991' stroke-opacity='.5' stroke-width='.5'/><ellipse cx='2.5' cy='0' rx='2.5' ry='1.4' transform='rotate(120)' fill='#F8F4EC' fill-opacity='.92' stroke='#C49991' stroke-opacity='.5' stroke-width='.5'/><ellipse cx='2.5' cy='0' rx='2.5' ry='1.4' transform='rotate(180)' fill='#F8F4EC' fill-opacity='.92' stroke='#C49991' stroke-opacity='.5' stroke-width='.5'/><ellipse cx='2.5' cy='0' rx='2.5' ry='1.4' transform='rotate(240)' fill='#F8F4EC' fill-opacity='.92' stroke='#C49991' stroke-opacity='.5' stroke-width='.5'/><ellipse cx='2.5' cy='0' rx='2.5' ry='1.4' transform='rotate(300)' fill='#F8F4EC' fill-opacity='.92' stroke='#C49991' stroke-opacity='.5' stroke-width='.5'/><circle r='0.9' fill='#B39A70' fill-opacity='.95'/></g><circle cx='52.9' cy='8.7' r='0.9' fill='#B39A70' fill-opacity='0.9'/><circle cx='69.3' cy='10.5' r='0.5' fill='#B39A70' fill-opacity='0.7'/><circle cx='106.8' cy='68.8' r='0.6' fill='#B39A70' fill-opacity='0.7'/><circle cx='35.9' cy='60.9' r='1.1' fill='#B39A70' fill-opacity='0.8'/><circle cx='75.7' cy='61.1' r='1.2' fill='#B39A70' fill-opacity='0.7'/><circle cx='168.2' cy='104.6' r='1.1' fill='#B39A70' fill-opacity='0.5'/><circle cx='50.2' cy='37.6' r='1' fill='#B39A70' fill-opacity='0.7'/><circle cx='147' cy='9' r='0.7' fill='#B39A70' fill-opacity='0.8'/><circle cx='160' cy='20.8' r='0.4' fill='#B39A70' fill-opacity='0.7'/><circle cx='139.7' cy='18.1' r='0.9' fill='#B39A70' fill-opacity='0.6'/><circle cx='98.7' cy='96.4' r='0.9' fill='#B39A70' fill-opacity='0.8'/><circle cx='182.5' cy='78.7' r='1.1' fill='#B39A70' fill-opacity='0.8'/><circle cx='106.1' cy='82.4' r='1' fill='#B39A70' fill-opacity='0.9'/><circle cx='104.4' cy='90.9' r='0.6' fill='#B39A70' fill-opacity='0.5'/></svg>";
  ORNAMENTS_SVG['black-tie'] = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 92' fill='none' stroke-linecap='square' stroke-linejoin='miter' ><g stroke='#C4A66A' stroke-width='1'><path d='M75,2 L123,46 L75,90 L27,46Z'/><path d='M75,9 L114,46 L75,83 L36,46Z' stroke-opacity='.45'/><path d='M0,46 H20 M130,46 H150'/><path d='M24,42 L28,46 L24,50 L20,46Z M126,42 L130,46 L126,50 L122,46Z' fill='#C4A66A' stroke='none'/></g></svg>";
  ORNAMENTS_SVG['garden'] = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 38'><defs><filter id='w' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur stdDeviation='.35'/></filter><filter id='b' x='-40%' y='-40%' width='180%' height='180%'><feGaussianBlur stdDeviation='1.6'/></filter></defs><path d='M6,22.8 C45,3.8 93,36.1 144,15.2' fill='none' stroke='#405744' stroke-width='1.3' stroke-opacity='0.85' stroke-linecap='round'/><g transform='translate(20.4 18) rotate(43.7)'><path d='M0,0 C2.7,-3.9 7.9,-3.6 10.9,0 C7.9,3.6 2.7,3.9 0,0Z' fill='#7C8F74' fill-opacity='0.3' transform='scale(1.14 1.32)' filter='url(#b)'/><path d='M0,0 C2.7,-3.9 7.9,-3.6 10.9,0 C7.9,3.6 2.7,3.9 0,0Z' fill='#7C8F74' fill-opacity='0.8' filter='url(#w)'/><path d='M0,0 C2.7,-3.9 7.9,-3.6 10.9,0 Z' fill='#FAF8F1' fill-opacity='.2'/><path d='M0.9,0 H9.4' stroke='#FAF8F1' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(21.9 19.8)'><circle r='9.9' fill='#DCE3D4' fill-opacity='.55' filter='url(#b)'/><ellipse cx='5.9' cy='0' rx='6.1' ry='2.9' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(67.85642043194763)'/><ellipse cx='5.9' cy='0' rx='6.1' ry='2.9' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(139.85642043194764)'/><ellipse cx='5.9' cy='0' rx='6.1' ry='2.9' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(211.85642043194764)'/><ellipse cx='5.9' cy='0' rx='6.1' ry='2.9' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(283.85642043194764)'/><ellipse cx='5.9' cy='0' rx='6.1' ry='2.9' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(355.85642043194764)'/><circle r='2' fill='#D9D58A'/><circle r='0.8' fill='#B3A94F'/></g><g transform='translate(36.3 16.5) rotate(-55.1)'><path d='M0,0 C2.6,-3.8 7.5,-3.5 10.4,0 C7.5,3.5 2.6,3.8 0,0Z' fill='#7C8F74' fill-opacity='0.3' transform='scale(1.14 1.32)' filter='url(#b)'/><path d='M0,0 C2.6,-3.8 7.5,-3.5 10.4,0 C7.5,3.5 2.6,3.8 0,0Z' fill='#7C8F74' fill-opacity='0.8' filter='url(#w)'/><path d='M0,0 C2.6,-3.8 7.5,-3.5 10.4,0 Z' fill='#FAF8F1' fill-opacity='.2'/><path d='M0.8,0 H9' stroke='#FAF8F1' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(36.3 16.5) rotate(39.9)'><ellipse cx='2.8' cy='0' rx='3' ry='1.6' fill='#D8B9AD' fill-opacity='.9'/><path d='M0,0 l-2.8,1.3' stroke='#405744' stroke-width='.6' fill='none'/></g><g transform='translate(52.9 17.5) rotate(-49)'><path d='M0,0 C2.5,-3.6 7.1,-3.3 9.9,0 C7.1,3.3 2.5,3.6 0,0Z' fill='#7C8F74' fill-opacity='0.3' transform='scale(1.14 1.32)' filter='url(#b)'/><path d='M0,0 C2.5,-3.6 7.1,-3.3 9.9,0 C7.1,3.3 2.5,3.6 0,0Z' fill='#7C8F74' fill-opacity='0.8' filter='url(#w)'/><path d='M0,0 C2.5,-3.6 7.1,-3.3 9.9,0 Z' fill='#FAF8F1' fill-opacity='.2'/><path d='M0.8,0 H8.5' stroke='#FAF8F1' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(53.8 19.9)'><circle r='9.1' fill='#DCE3D4' fill-opacity='.55' filter='url(#b)'/><ellipse cx='5.4' cy='0' rx='5.7' ry='2.7' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(8.150829455026393)'/><ellipse cx='5.4' cy='0' rx='5.7' ry='2.7' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(80.1508294550264)'/><ellipse cx='5.4' cy='0' rx='5.7' ry='2.7' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(152.15082945502638)'/><ellipse cx='5.4' cy='0' rx='5.7' ry='2.7' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(224.15082945502638)'/><ellipse cx='5.4' cy='0' rx='5.7' ry='2.7' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(296.1508294550264)'/><circle r='1.9' fill='#D9D58A'/><circle r='0.7' fill='#B3A94F'/></g><g transform='translate(70.1 19.7) rotate(62.6)'><path d='M0,0 C2.4,-3.4 6.8,-3.1 9.4,0 C6.8,3.1 2.4,3.4 0,0Z' fill='#7C8F74' fill-opacity='0.3' transform='scale(1.14 1.32)' filter='url(#b)'/><path d='M0,0 C2.4,-3.4 6.8,-3.1 9.4,0 C6.8,3.1 2.4,3.4 0,0Z' fill='#7C8F74' fill-opacity='0.8' filter='url(#w)'/><path d='M0,0 C2.4,-3.4 6.8,-3.1 9.4,0 Z' fill='#FAF8F1' fill-opacity='.2'/><path d='M0.8,0 H8.1' stroke='#FAF8F1' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(70.1 19.7) rotate(-32.4)'><ellipse cx='2.8' cy='0' rx='3' ry='1.6' fill='#D8B9AD' fill-opacity='.9'/><path d='M0,0 l-2.8,1.3' stroke='#405744' stroke-width='.6' fill='none'/></g><g transform='translate(87.9 21.8) rotate(60.2)'><path d='M0,0 C2.2,-3.2 6.4,-3 8.9,0 C6.4,3 2.2,3.2 0,0Z' fill='#7C8F74' fill-opacity='0.3' transform='scale(1.14 1.32)' filter='url(#b)'/><path d='M0,0 C2.2,-3.2 6.4,-3 8.9,0 C6.4,3 2.2,3.2 0,0Z' fill='#7C8F74' fill-opacity='0.8' filter='url(#w)'/><path d='M0,0 C2.2,-3.2 6.4,-3 8.9,0 Z' fill='#FAF8F1' fill-opacity='.2'/><path d='M0.7,0 H7.7' stroke='#FAF8F1' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(88.2 22.2)'><circle r='8.4' fill='#DCE3D4' fill-opacity='.55' filter='url(#b)'/><ellipse cx='5' cy='0' rx='5.2' ry='2.5' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(0.9442216504009586)'/><ellipse cx='5' cy='0' rx='5.2' ry='2.5' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(72.94422165040096)'/><ellipse cx='5' cy='0' rx='5.2' ry='2.5' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(144.94422165040095)'/><ellipse cx='5' cy='0' rx='5.2' ry='2.5' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(216.94422165040095)'/><ellipse cx='5' cy='0' rx='5.2' ry='2.5' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(288.94422165040095)'/><circle r='1.7' fill='#D9D58A'/><circle r='0.7' fill='#B3A94F'/></g><g transform='translate(106.2 22.5) rotate(-55.9)'><path d='M0,0 C2.1,-3 6.1,-2.8 8.4,0 C6.1,2.8 2.1,3 0,0Z' fill='#7C8F74' fill-opacity='0.3' transform='scale(1.14 1.32)' filter='url(#b)'/><path d='M0,0 C2.1,-3 6.1,-2.8 8.4,0 C6.1,2.8 2.1,3 0,0Z' fill='#7C8F74' fill-opacity='0.8' filter='url(#w)'/><path d='M0,0 C2.1,-3 6.1,-2.8 8.4,0 Z' fill='#FAF8F1' fill-opacity='.2'/><path d='M0.7,0 H7.2' stroke='#FAF8F1' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(106.2 22.5) rotate(39.1)'><ellipse cx='2.8' cy='0' rx='3' ry='1.6' fill='#D8B9AD' fill-opacity='.9'/><path d='M0,0 l-2.8,1.3' stroke='#405744' stroke-width='.6' fill='none'/></g><g transform='translate(124.9 20.8) rotate(44.6)'><path d='M0,0 C2,-2.8 5.7,-2.6 7.9,0 C5.7,2.6 2,2.8 0,0Z' fill='#7C8F74' fill-opacity='0.3' transform='scale(1.14 1.32)' filter='url(#b)'/><path d='M0,0 C2,-2.8 5.7,-2.6 7.9,0 C5.7,2.6 2,2.8 0,0Z' fill='#7C8F74' fill-opacity='0.8' filter='url(#w)'/><path d='M0,0 C2,-2.8 5.7,-2.6 7.9,0 Z' fill='#FAF8F1' fill-opacity='.2'/><path d='M0.6,0 H6.8' stroke='#FAF8F1' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(123 23)'><circle r='7.7' fill='#DCE3D4' fill-opacity='.55' filter='url(#b)'/><ellipse cx='4.6' cy='0' rx='4.8' ry='2.3' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(28.039486434247365)'/><ellipse cx='4.6' cy='0' rx='4.8' ry='2.3' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(100.03948643424737)'/><ellipse cx='4.6' cy='0' rx='4.8' ry='2.3' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(172.03948643424735)'/><ellipse cx='4.6' cy='0' rx='4.8' ry='2.3' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(244.03948643424735)'/><ellipse cx='4.6' cy='0' rx='4.8' ry='2.3' fill='#FFFDF8' fill-opacity='.95' stroke='#DCE3D4' stroke-width='.4' transform='rotate(316.03948643424735)'/><circle r='1.6' fill='#D9D58A'/><circle r='0.6' fill='#B3A94F'/></g><g transform='translate(144 15.2) rotate(-77.3)'><path d='M0,0 C1.9,-2.7 5.3,-2.5 7.4,0 C5.3,2.5 1.9,2.7 0,0Z' fill='#7C8F74' fill-opacity='0.3' transform='scale(1.14 1.32)' filter='url(#b)'/><path d='M0,0 C1.9,-2.7 5.3,-2.5 7.4,0 C5.3,2.5 1.9,2.7 0,0Z' fill='#7C8F74' fill-opacity='0.8' filter='url(#w)'/><path d='M0,0 C1.9,-2.7 5.3,-2.5 7.4,0 Z' fill='#FAF8F1' fill-opacity='.2'/><path d='M0.6,0 H6.4' stroke='#FAF8F1' stroke-opacity='.55' stroke-width='.45' fill='none'/></g><g transform='translate(144 15.2) rotate(-62.3)'><ellipse cx='2.8' cy='0' rx='3' ry='1.6' fill='#D8B9AD' fill-opacity='.9'/><path d='M0,0 l-2.8,1.3' stroke='#405744' stroke-width='.6' fill='none'/></g></svg>";
  var NEW_THEMES = ['classic', 'romantic', 'minimal', 'mediterranean', 'timeless', 'french-romance', 'black-tie', 'garden'];
  var ICONS_SVG = {"rings": "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'><circle cx='9' cy='14.5' r='5'/><circle cx='15' cy='14.5' r='5'/><path d='M7.2 5.2 9 8.2l1.8-3'/><path d='M7.2 5.2h3.6'/></svg>", "cheers": "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'><path d='M5.5 4h6l-.6 5.2a2.4 2.4 0 0 1-4.8 0z'/><path d='M8.5 11.6V19M6 19.2h5'/><path d='M13.2 5.6l5.6-1.6.9 5.1a2.4 2.4 0 0 1-4.6 1.2z'/><path d='M16.2 12.6l1.6 6.2M14.6 19.2l4.4-1.2'/></svg>", "dinner": "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='5.2'/><circle cx='12' cy='12' r='2.6'/><path d='M3.8 4v5.6a1.6 1.6 0 0 0 1.6 1.6v8M3.8 4v5M5.4 4v5M7 4v5.6a1.6 1.6 0 0 1-1.6 1.6'/><path d='M20.2 4c-1.7 1.4-2.4 3.4-2.4 6v1.2h2.4zM20.2 11.2V20'/></svg>", "music": "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'><path d='M9 18V6.2l9-2v11.6'/><circle cx='6.6' cy='18' r='2.4'/><circle cx='15.6' cy='15.8' r='2.4'/></svg>", "bus": "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'><rect x='4.5' y='4.5' width='15' height='12.5' rx='2'/><path d='M4.5 11h15M4.5 8h15'/><circle cx='8.3' cy='14' r='.5'/><circle cx='15.7' cy='14' r='.5'/><path d='M6.5 17v2.5M17.5 17v2.5'/></svg>", "church": "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 2.8v4M10.4 4.4h3.2'/><path d='M12 7l5.4 4.2V20H6.6v-8.8z'/><path d='M10.2 20v-4.6a1.8 1.8 0 0 1 3.6 0V20'/><path d='M3.6 20h16.8'/></svg>", "default": "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 4l2.2 5.8L20 12l-5.8 2.2L12 20l-2.2-5.8L4 12l5.8-2.2z'/></svg>"};
  var THEME_IDS = ['classic', 'romantic', 'minimal', 'mediterranean', 'timeless', 'french-romance', 'black-tie', 'garden', 'olivo', 'editorial', 'flores', 'sobre', 'terracota', 'noche', 'gotico', 'elegante', 'starwars',
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
        /* Las plantillas v3 muestran su tratamiento fotográfico también en la demo */
        if (window.WEDDING_TEMPLATES[demoTpl].demoHero) demo.heroPhoto = window.WEDDING_TEMPLATES[demoTpl].demoHero;
        if (window.WEDDING_TEMPLATES[demoTpl].demoGallery) demo.galleryPhotos = window.WEDDING_TEMPLATES[demoTpl].demoGallery.slice();
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

    /* Plantillas actuales: interfaz sin emojis ni símbolos decorativos. */
    var isClean = NEW_THEMES.indexOf(tpl) !== -1;
    var wasClean = rootBody.classList.contains('clean-type');
    rootBody.classList.toggle('clean-type', isClean);
    if (isClean !== wasClean && window.Idiomas && window.Idiomas.apply) window.Idiomas.apply(document);

    var heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      var mi1 = String(d.n1 || 'A').trim().charAt(0).toUpperCase() || 'A';
      var mi2 = String(d.n2 || 'M').trim().charAt(0).toUpperCase() || 'M';
      heroContent.setAttribute('data-monogram', mi1 + ' & ' + mi2);
      var foot = document.querySelector('.invite-footer');
      if (foot) foot.setAttribute('data-monogram', mi1 + ' & ' + mi2);
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

    var heroPhoto = safePhoto(d.heroPhoto);
    if (!heroPhoto && CSS_HERO_THEMES.indexOf(tpl) === -1) {
      heroPhoto = DEFAULT_HERO_BY_THEME[tpl] || DEFAULT_HERO_BY_THEME.olivo;
    }
    var heroBg = el('hero-bg');
    if (heroBg) heroBg.style.backgroundImage = heroPhoto ? window.cssImageUrl(heroPhoto) : '';
    rootBody.classList.toggle('has-hero-photo', !!heroPhoto);

    updateDateDisplay(d);
    renderHeroExtras(d);
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
    renderStoryPhoto(d, tpl);
    setupBlackTieMotion(tpl);
    setupRsvp(d);
    updateMeta(d);
    updateShareButton(d);

    document.dispatchEvent(new CustomEvent('wedding:rendered', { detail: { data: d, lang: currentLang } }));
  }

  function setHidden(id, hidden) {
    var node = el(id);
    if (node) node.hidden = !!hidden;
  }

  /* Datos de la portada que usan las plantillas actuales (hora, lugar y fecha
     en columna). Las demás plantillas los mantienen ocultos por CSS. */
  function renderHeroExtras(d) {
    setText('hero-time', d.time ? d.time + ' h' : '');
    setText('hero-venue', d.venue || '');
    setText('hero-address', d.address || '');
    var parts = String(window.WeddingDates.short(d.date) || '').split(' · ');
    setText('hds-d', parts[0] || '');
    setText('hds-m', parts[1] || '');
    setText('hds-y', parts[2] ? parts[2].slice(-2) : '');
    var longest = Math.max(String(d.n1 || '').length, String(d.n2 || '').length);
    var names = document.querySelector('.hero-names');
    if (names) names.setAttribute('data-len', longest > 12 ? 'xl' : (longest > 9 ? 'l' : 'm'));
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
      if (document.body.classList.contains('clean-type')) {
        dot.innerHTML = ICONS_SVG[ev.icon] || ICONS_SVG['default']; /* constantes propias, sin datos de usuario */
        dot.classList.add('timeline-dot-line');
      } else {
        dot.textContent = ICONS_MAP[ev.icon] || '✨';
      }

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

  /* French Romance: retrato vertical enmarcado en la historia (reutiliza una foto de la galería;
     el resto de plantillas no lo reciben). */
  function renderStoryPhoto(d, tpl) {
    var sec = el('sec-story');
    if (!sec) return;
    var old = sec.querySelector('.story-photo');
    if (old) old.remove();
    if (tpl !== 'french-romance' && tpl !== 'black-tie' && tpl !== 'garden') return;
    var list = d.galleryPhotos || [];
    var src = safePhoto(list[1] || list[0]);
    if (!src) return;
    var fig = document.createElement('figure');
    fig.className = 'story-photo';
    var img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';
    img.decoding = 'async';
    fig.appendChild(img);
    sec.insertBefore(fig, sec.firstChild);
  }

  /* Black Tie y Garden: entradas discretas al hacer scroll. Solo se activa con estas plantillas,
     con IntersectionObserver disponible y sin prefers-reduced-motion. */
  var btObserver = null;
  function setupBlackTieMotion(tpl) {
    if (btObserver) { btObserver.disconnect(); btObserver = null; }
    var body = document.body;
    document.querySelectorAll('.bt-r').forEach(function (n) { n.classList.remove('bt-r', 'bt-in'); });
    body.classList.remove('bt-motion');
    if ((tpl !== 'black-tie' && tpl !== 'garden') || !('IntersectionObserver' in window)) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var sel = '#sec-story .story-photo, #sec-story > .eyebrow, #story-title, #story-text, .countdown-grid, .timeline-item, .gallery-item, .info-card, .iban-box, .rsvp-form, .invite-footer h3';
    var nodes = document.querySelectorAll(sel);
    btObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('bt-in'); btObserver.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    nodes.forEach(function (n) { n.classList.add('bt-r'); btObserver.observe(n); });
    body.classList.add('bt-motion');
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
      copy.classList.toggle('is-copied', !!ok);
      window.setTimeout(function () {
        copy.classList.remove('is-copied');
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
