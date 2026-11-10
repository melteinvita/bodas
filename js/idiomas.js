/* =====================================================================
   IDIOMAS DE LA INVITACIÓN (castellano · valencià · inglés)
   ---------------------------------------------------------------------
   - Traduce los elementos con data-i18n, data-i18n-option y
     data-i18n-placeholder.
   - Añade un selector accesible sobre el sobre.
   - Respeta ?lang=val, ?lang=en y la preferencia guardada.
   - Los textos se insertan con textContent: nunca se interpreta HTML.
   ===================================================================== */
(function () {
  'use strict';

  var LANGS = ['es', 'val', 'en'];
  var LANG_NAMES = { es: 'Castellano', val: 'Valencià', en: 'English' };
  var LANG_SHORT = { es: 'ES', val: 'VAL', en: 'EN' };
  var STORAGE_KEY = 'melvinta:lang';

  var DICT = {
    es: {
      hint: 'Tienes una invitación especial · Toca el sello para abrir',
      open: 'Abrir',
      skip: 'Saltar introducción ↗',
      statusEyebrow: 'INVITACIÓN',
      statusTitle: 'No encontramos esta invitación',
      statusText: 'Comprueba el enlace que te han enviado o vuelve a intentarlo.',
      retry: 'Volver a intentar',
      saveDate: 'RESERVA LA FECHA',
      days: 'Días',
      hours: 'Horas',
      mins: 'Min',
      secs: 'Seg',
      addCal: '📅 Añadir a Google Calendar',
      howBegan: 'CÓMO EMPEZÓ TODO',
      whereWhen: 'DÓNDE Y CUÁNDO',
      openMaps: '📍 Abrir en Google Maps',
      program: 'PROGRAMA DEL GRAN DÍA',
      moments: 'NUESTROS MOMENTOS',
      gallery: 'Galería',
      practical: 'INFORMACIÓN PRÁCTICA',
      detailsTitle: 'Detalles del Evento',
      dressTitle: '👔 Código de Vestimenta',
      busTitle: '🚌 Transporte y Alojamiento',
      giftEyebrow: 'LISTA DE BODAS',
      giftTitle: 'Un Detalle Especial',
      copyIban: '📋 Copiar Número de Cuenta',
      rsvpEyebrow: 'CONFIRMA TU ASISTENCIA',
      rsvpTitle: '¿Nos acompañas?',
      rsvpIntro: 'Por favor, confírmanos tu asistencia antes del',
      deadlineDefault: 'un mes antes de la boda',
      labelName: 'Nombre y Apellidos *',
      phName: 'Ej. Laura Gómez y Carlos Ruiz',
      labelAttend: '¿Asistirás? *',
      attYes: '¡Sí, allí estaré!',
      attNo: 'No podré asistir',
      labelGuests: 'Nº de Personas',
      labelCompanions: 'Acompañantes',
      companionsHint: 'Indica el nombre y el menú de cada persona (sin contarte a ti).',
      labelMenu: 'Preferencia de Menú',
      menuStandard: 'Menú Estándar',
      menuVeg: 'Vegetariano',
      menuVegan: 'Vegano',
      menuKids: 'Menú Infantil',
      menuGluten: 'Sin gluten',
      menuOther: 'Otro (lo indico en alergias)',
      labelBus: '¿Usarás el Autobús?',
      busNo: 'No, iré en mi coche',
      busYes: 'Sí, reservadme plaza',
      labelAllergies: 'Alergias o Intolerancias Alimentarias',
      phAllergies: 'Ej. Sin gluten, alergia a frutos secos...',
      labelSong: '🎵 ¿Qué canción no puede faltar en la fiesta?',
      phSong: 'Ej. Mi Gran Noche - Raphael',
      consent: 'He leído la política de privacidad y acepto el uso de mis datos para gestionar la asistencia y el catering, incluidos los datos de alergias o intolerancias que indique.',
      privacyLink: 'Política de privacidad',
      legalLink: 'Aviso legal',
      cookiesLink: 'Cookies',
      submitBtn: 'Enviar Confirmación ✓',
      errorTitle: 'No hemos podido registrar tu confirmación.',
      errorText: 'Revisa tu conexión e inténtalo de nuevo. Tus datos siguen rellenados.',
      retrySend: 'Reintentar envío',
      successTitle: '¡Muchas gracias!',
      successText: 'Tu confirmación se ha registrado correctamente.',
      shareWa: '💬 Compartir por WhatsApp',
      galleryAlt: 'Foto de la pareja',
      guestOne: '1 persona (solo yo)',
      guestsWord: 'personas',
      tplDemo: 'Ver demo',
      tplChoose: 'Elegir este',
      tplDemoTitle: 'Demo · ',
      companionName: 'Nombre del acompañante',
      companionMenu: 'Menú del acompañante',
      errorName: 'Escribe tu nombre y apellidos.',
      errorConsent: 'Debes aceptar la política de privacidad para enviar la confirmación.',
      errorWhatsapp: 'Si el problema continúa, escribe a los novios por WhatsApp:',
      sending: 'Enviando…',
      copied: '✓ ¡Cuenta copiada!',
      copyFail: 'No se pudo copiar',
      offlineTitle: 'No podemos cargar la invitación',
      offlineText: 'Revisa tu conexión y vuelve a intentarlo. Si el problema continúa, avisa a los novios.',
      heroKicker: 'Junto a nuestras familias, os invitamos con alegría a',
      heroScript: 'la boda de',
      heroFootnote: 'Celebración a continuación'
    },

    val: {
      hint: 'Tens una invitació especial · Toca el segell per a obrir',
      open: 'Obrir',
      skip: 'Saltar la introducció ↗',
      statusEyebrow: 'INVITACIÓ',
      statusTitle: 'No trobem aquesta invitació',
      statusText: "Comprova l'enllaç que t'han enviat o torna-ho a intentar.",
      retry: 'Tornar-ho a intentar',
      saveDate: 'RESERVA LA DATA',
      days: 'Dies',
      hours: 'Hores',
      mins: 'Min',
      secs: 'Seg',
      addCal: '📅 Afegir a Google Calendar',
      howBegan: 'COM VA COMENÇAR TOT',
      whereWhen: 'ON I QUAN',
      openMaps: '📍 Obrir en Google Maps',
      program: 'PROGRAMA DEL GRAN DIA',
      moments: 'ELS NOSTRES MOMENTS',
      gallery: 'Galeria',
      practical: 'INFORMACIÓ PRÀCTICA',
      detailsTitle: "Detalls de l'Esdeveniment",
      dressTitle: '👔 Codi de Vestimenta',
      busTitle: '🚌 Transport i Allotjament',
      giftEyebrow: 'LLISTA DE NOCES',
      giftTitle: 'Un Detall Especial',
      copyIban: '📋 Copiar el Número de Compte',
      rsvpEyebrow: 'CONFIRMA LA TEUA ASSISTÈNCIA',
      rsvpTitle: 'Ens acompanyes?',
      rsvpIntro: "Per favor, confirma'ns la teua assistència abans del",
      deadlineDefault: 'un mes abans del casament',
      labelName: 'Nom i Cognoms *',
      phName: 'Ex. Laura Gómez i Carlos Ruiz',
      labelAttend: 'Assistiràs? *',
      attYes: "Sí, hi estaré!",
      attNo: 'No podré assistir',
      labelGuests: 'Nombre de Persones',
      labelCompanions: 'Acompanyants',
      companionsHint: 'Indica el nom i el menú de cada persona (sense comptar-te a tu).',
      labelMenu: 'Preferència de Menú',
      menuStandard: 'Menú Estàndard',
      menuVeg: 'Vegetarià',
      menuVegan: 'Vegà',
      menuKids: 'Menú Infantil',
      menuGluten: 'Sense gluten',
      menuOther: 'Altre (ho indique en al·lèrgies)',
      labelBus: "Utilitzaràs l'Autobús?",
      busNo: 'No, aniré en el meu cotxe',
      busYes: 'Sí, reserveu-me plaça',
      labelAllergies: 'Al·lèrgies o Intoleràncies Alimentàries',
      phAllergies: 'Ex. Sense gluten, al·lèrgia a fruits secs...',
      labelSong: '🎵 Quina cançó no pot faltar a la festa?',
      phSong: 'Ex. Mi Gran Noche - Raphael',
      consent: "He llegit la política de privacitat i accepte l'ús de les meues dades per a gestionar l'assistència i el càtering, incloses les dades d'al·lèrgies o intoleràncies que indique.",
      privacyLink: 'Política de privacitat',
      legalLink: 'Avís legal',
      cookiesLink: 'Cookies',
      submitBtn: 'Enviar Confirmació ✓',
      errorTitle: 'No hem pogut registrar la teua confirmació.',
      errorText: 'Revisa la teua connexió i torna-ho a intentar. Les teues dades continuen omplertes.',
      retrySend: 'Tornar a enviar',
      successTitle: 'Moltes gràcies!',
      successText: "La teua confirmació s'ha registrat correctament.",
      shareWa: '💬 Compartir per WhatsApp',
      galleryAlt: 'Foto de la parella',
      guestOne: '1 persona (només jo)',
      guestsWord: 'persones',
      tplDemo: 'Veure demo',
      tplChoose: 'Triar este',
      tplDemoTitle: 'Demo · ',
      companionName: "Nom de l'acompanyant",
      companionMenu: "Menú de l'acompanyant",
      errorName: 'Escriu el teu nom i cognoms.',
      errorConsent: "Has d'acceptar la política de privacitat per a enviar la confirmació.",
      errorWhatsapp: 'Si el problema continua, escriu als nuvis per WhatsApp:',
      sending: 'Enviant…',
      copied: '✓ Compte copiat!',
      copyFail: "No s'ha pogut copiar",
      offlineTitle: 'No podem carregar la invitació',
      offlineText: 'Revisa la teua connexió i torna-ho a intentar. Si el problema continua, avisa els nuvis.',
      heroKicker: 'Amb les nostres famílies, us convidem amb alegria a',
      heroScript: 'el casament de',
      heroFootnote: 'Celebració a continuació'
    },

    en: {
      hint: 'You have a special invitation · Tap the seal to open',
      open: 'Open',
      skip: 'Skip intro ↗',
      statusEyebrow: 'INVITATION',
      statusTitle: "We can't find this invitation",
      statusText: 'Check the link you were sent or try again.',
      retry: 'Try again',
      saveDate: 'SAVE THE DATE',
      days: 'Days',
      hours: 'Hours',
      mins: 'Min',
      secs: 'Sec',
      addCal: '📅 Add to Google Calendar',
      howBegan: 'HOW IT ALL BEGAN',
      whereWhen: 'WHERE & WHEN',
      openMaps: '📍 Open in Google Maps',
      program: "THE DAY'S SCHEDULE",
      moments: 'OUR MOMENTS',
      gallery: 'Gallery',
      practical: 'PRACTICAL INFO',
      detailsTitle: 'Event Details',
      dressTitle: '👔 Dress Code',
      busTitle: '🚌 Transport & Accommodation',
      giftEyebrow: 'WEDDING LIST',
      giftTitle: 'A Special Gesture',
      copyIban: '📋 Copy Account Number',
      rsvpEyebrow: 'CONFIRM YOUR ATTENDANCE',
      rsvpTitle: 'Will you join us?',
      rsvpIntro: 'Please confirm your attendance before',
      deadlineDefault: 'one month before the wedding',
      labelName: 'Full Name *',
      phName: 'e.g. Laura Gómez and Carlos Ruiz',
      labelAttend: 'Will you attend? *',
      attYes: "Yes, I'll be there!",
      attNo: "I can't make it",
      labelGuests: 'Number of Guests',
      labelCompanions: 'Guests joining you',
      companionsHint: "Add each person's name and menu (not including you).",
      labelMenu: 'Menu Preference',
      menuStandard: 'Standard menu',
      menuVeg: 'Vegetarian',
      menuVegan: 'Vegan',
      menuKids: "Children's menu",
      menuGluten: 'Gluten-free',
      menuOther: "Other (I'll note it under allergies)",
      labelBus: 'Will you use the bus?',
      busNo: "No, I'll drive",
      busYes: 'Yes, please reserve a seat',
      labelAllergies: 'Food Allergies or Intolerances',
      phAllergies: 'e.g. Gluten-free, nut allergy...',
      labelSong: '🎵 Which song must we play at the party?',
      phSong: 'e.g. Dancing Queen - ABBA',
      consent: 'I have read the privacy policy and agree to the use of my data to manage attendance and catering, including any allergy or intolerance information I provide.',
      privacyLink: 'Privacy policy',
      legalLink: 'Legal notice',
      cookiesLink: 'Cookies',
      submitBtn: 'Send RSVP ✓',
      errorTitle: "We couldn't save your RSVP.",
      errorText: 'Check your connection and try again. Your details are still filled in.',
      retrySend: 'Retry',
      successTitle: 'Thank you!',
      successText: 'Your RSVP has been saved.',
      shareWa: '💬 Share on WhatsApp',
      galleryAlt: 'Photo of the couple',
      guestOne: '1 guest (just me)',
      guestsWord: 'guests',
      tplDemo: 'View demo',
      tplChoose: 'Choose this',
      tplDemoTitle: 'Demo · ',
      companionName: 'Guest name',
      companionMenu: 'Guest menu',
      errorName: 'Please enter your full name.',
      errorConsent: 'Please accept the privacy policy before sending your RSVP.',
      errorWhatsapp: 'If the problem continues, message the couple on WhatsApp:',
      sending: 'Sending…',
      copied: '✓ Account copied!',
      copyFail: "Couldn't copy",
      offlineTitle: "We can't load the invitation",
      offlineText: 'Check your connection and try again. If the problem continues, let the couple know.',
      heroKicker: 'Together with our families we joyfully invite you to',
      heroScript: 'the wedding of',
      heroFootnote: 'Celebration to follow'
    }
  };

  var current = 'es';
  var userChose = false;
  var originals = new WeakMap();

  /* ------------------------------------------------------------------
     PLANTILLAS: NOMBRE, ETIQUETA Y DESCRIPCIÓN EN LOS TRES IDIOMAS
     ------------------------------------------------------------------ */
  var TEMPLATES = {
    classic: {
      es: { name: '01 · Classic Elegance', badge: 'Clásica y Atemporal', desc: 'Marfil, filetes en dorado champagne y nombres en versales. La papelería de gran gala que nunca pasa de moda.' },
      val: { name: '01 · Classic Elegance', badge: 'Clàssica i Atemporal', desc: 'Marfil, filets en daurat xampany i noms en versals. La papereria de gran gala que mai passa de moda.' },
      en: { name: '01 · Classic Elegance', badge: 'Classic & Timeless', desc: 'Ivory, champagne-gold rules and capital-letter names. The black-tie stationery that never goes out of style.' }
    },
    romantic: {
      es: { name: '02 · Romantic Bloom', badge: 'Romántica y Delicada', desc: 'Rosa empolvado, verde salvia y ramas florales dibujadas a línea. Papelería artesanal para una boda de jardín.' },
      val: { name: '02 · Romantic Bloom', badge: 'Romàntica i Delicada', desc: 'Rosa empolvorat, verd sàlvia i branques florals dibuixades a línia. Papereria artesanal per a un casament de jardí.' },
      en: { name: '02 · Romantic Bloom', badge: 'Romantic & Delicate', desc: 'Dusty rose, sage green and line-drawn floral sprigs. Handcrafted stationery for a garden wedding.' }
    },
    minimal: {
      es: { name: '03 · Modern Minimal', badge: 'Contemporánea y Editorial', desc: 'Mucho blanco, tipografía de revista y composición asimétrica. Una invitación de estudio de branding.' },
      val: { name: '03 · Modern Minimal', badge: 'Contemporània i Editorial', desc: 'Molt de blanc, tipografia de revista i composició asimètrica. Una invitació d\'estudi de branding.' },
      en: { name: '03 · Modern Minimal', badge: 'Contemporary & Editorial', desc: 'Generous white space, magazine typography and asymmetric layout. An invitation from a branding studio.' }
    },
    mediterranean: {
      es: { name: '04 · Mediterranean Organic', badge: 'Natural y Luminosa', desc: 'Verde oliva, arena y terracota suave. Papel artesanal para una boda entre olivos, viñedos o jardines.' },
      val: { name: '04 · Mediterranean Organic', badge: 'Natural i Lluminosa', desc: 'Verd oliva, sorra i terracota suau. Paper artesanal per a un casament entre oliveres, vinyes o jardins.' },
      en: { name: '04 · Mediterranean Organic', badge: 'Natural & Luminous', desc: 'Olive green, sand and soft terracotta. Handmade paper for a wedding among olive trees, vineyards or gardens.' }
    },
    timeless: {
      es: { name: '05 · Timeless Editorial', badge: 'Editorial y Sofisticada', desc: 'Nombres a gran escala, fotografía integrada y filetes en champagne. Una invitación de revista de moda, cálida y personal.' },
      val: { name: '05 · Timeless Editorial', badge: 'Editorial i Sofisticada', desc: 'Noms a gran escala, fotografia integrada i filets en xampany. Una invitació de revista de moda, càlida i personal.' },
      en: { name: '05 · Timeless Editorial', badge: 'Editorial & Sophisticated', desc: 'Oversized names, integrated photography and champagne rules. A fashion-magazine invitation that stays warm and personal.' }
    },
    'french-romance': {
      es: { name: '06 · French Romance', badge: 'Romántica y Francesa', desc: 'Marcos ornamentales finísimos, rosa antiguo y dorado envejecido. La papelería de un château en la Provenza.' },
      val: { name: '06 · French Romance', badge: 'Romàntica i Francesa', desc: 'Marcs ornamentals finíssims, rosa antic i daurat envellit. La papereria d\'un château a la Provença.' },
      en: { name: '06 · French Romance', badge: 'Romantic & French', desc: 'Hairline ornamental frames, antique rose and aged gold. The stationery of a Provençal château.' }
    },
    'black-tie': {
      es: { name: '07 · Black Tie', badge: 'Nocturna y de Gala', desc: 'Negro profundo, marfil y filetes geométricos en champagne. Para una boda de etiqueta que empieza al caer la noche.' },
      val: { name: '07 · Black Tie', badge: 'Nocturna i de Gala', desc: 'Negre profund, marfil i filets geomètrics en xampany. Per a un casament d\'etiqueta que comença en caure la nit.' },
      en: { name: '07 · Black Tie', badge: 'Evening & Formal', desc: 'Deep black, ivory and geometric champagne rules. For a formal wedding that begins as night falls.' }
    },
    garden: {
      es: { name: '08 · Garden Wedding', badge: 'Jardín y Naturaleza', desc: 'Follaje a la acuarela en verde bosque y salvia, con toques de rosa nude. Una boda al aire libre en un jardín privado.' },
      val: { name: '08 · Garden Wedding', badge: 'Jardí i Natura', desc: 'Fullatge a l\'aquarel·la en verd bosc i sàlvia, amb tocs de rosa nude. Un casament a l\'aire lliure en un jardí privat.' },
      en: { name: '08 · Garden Wedding', badge: 'Garden & Nature', desc: 'Watercolour foliage in forest green and sage with touches of nude rose. An outdoor wedding in a private garden.' }
    },
    'royal-burgundy': {
      es: { name: '09 · Royal Burgundy', badge: 'Romántica y de Gala', desc: 'Burdeos profundo, marfil cálido y detalles oro champán. Una invitación editorial de inspiración clásica para una celebración elegante.' },
      val: { name: '09 · Royal Burgundy', badge: 'Romàntica i de Gala', desc: 'Bordeus profund, marfil càlid i detalls d’or xampany. Una invitació editorial d’inspiració clàssica per a una celebració elegant.' },
      en: { name: '09 · Royal Burgundy', badge: 'Romantic & Grand', desc: 'Deep burgundy, warm ivory and champagne-gold details. A classic-inspired editorial invitation for an elegant celebration.' }
    },
    olivo: {
      es: { name: '01 · Olivo Mediterráneo', badge: 'Fincas y Exterior', desc: 'Verde oliva, marfil y ramas botánicas. Papel orgánico y tipografía clásica.' },
      val: { name: '01 · Olivera Mediterrània', badge: 'Fincas i Exterior', desc: 'Verd oliva, marfil i branques botàniques. Paper orgànic i tipografia clàssica.' },
      en: { name: '01 · Mediterranean Olive', badge: 'Estates & Outdoors', desc: 'Olive green, ivory and botanical branches. Organic paper and classic type.' }
    },
    editorial: {
      es: { name: '02 · Editorial Minimalista', badge: 'Lujo Urbano', desc: 'Blanco roto y negro, retícula de revista, asimetría y gran formato.' },
      val: { name: '02 · Editorial Minimalista', badge: 'Luxe Urbà', desc: 'Blanc trencat i negre, retícula de revista, asimetria i gran format.' },
      en: { name: '02 · Minimal Editorial', badge: 'Urban Luxury', desc: 'Off-white and black, magazine grid, asymmetry and oversized type.' }
    },
    flores: {
      es: { name: '03 · Flores Románticas', badge: 'Romántica y Suave', desc: 'Rosa empolvado, salvia y marcos florales. Cursiva caligráfica y papelería fina.' },
      val: { name: '03 · Flors Romàntiques', badge: 'Romàntica i Suau', desc: 'Rosa empolvorat, sàlvia i marcs florals. Cursiva cal·ligràfica i papereria fina.' },
      en: { name: '03 · Romantic Flowers', badge: 'Romantic & Soft', desc: 'Powder pink, sage and floral frames. Calligraphic script and fine stationery.' }
    },
    sobre: {
      es: { name: '04 · Sobre Premium', badge: 'Producto Estrella ★', desc: 'Apertura animada con sobre y sello de lacre. Papel algodón y letterpress.' },
      val: { name: '04 · Sobre Premium', badge: 'Producte Estrela ★', desc: 'Obertura animada amb sobre i segell de lacre. Paper cotó i letterpress.' },
      en: { name: '04 · Premium Envelope', badge: 'Signature Piece ★', desc: 'Animated envelope with wax seal. Cotton paper and letterpress finish.' }
    },
    terracota: {
      es: { name: '05 · Terracota Natural', badge: 'Rústica y Boho', desc: 'Arcos, tonos tierra y arena. Sombras cálidas y ritmo boho-arquitectónico.' },
      val: { name: '05 · Terracota Natural', badge: 'Rústica i Boho', desc: 'Arcs, tons terra i arena. Ombres càlides i ritme boho-arquitectònic.' },
      en: { name: '05 · Natural Terracotta', badge: 'Rustic & Boho', desc: 'Arches, earth and sand tones. Warm shadows and boho-architectural rhythm.' }
    },
    noche: {
      es: { name: '06 · Noche Elegante', badge: 'Nocturna y Oro', desc: 'Azul noche y oro metálico con polvo estelar y tarjetas de cristal.' },
      val: { name: '06 · Nit Elegant', badge: 'Nocturna i Or', desc: 'Blau nit i or metàl·lic amb pols estelar i targetes de vidre.' },
      en: { name: '06 · Elegant Night', badge: 'Night & Gold', desc: 'Midnight blue and metallic gold with stardust and glass cards.' }
    },
    gotico: {
      es: { name: '07 · Gótico & Rock', badge: 'Alternativa y Oscura', desc: 'Negro obsidiana, carmesí y plata envejecida. Till death do us part.' },
      val: { name: '07 · Gòtic & Rock', badge: 'Alternativa i Fosca', desc: 'Negre obsidiana, carmesí i plata envellida. Till death do us part.' },
      en: { name: '07 · Gothic & Rock', badge: 'Alternative & Dark', desc: 'Obsidian black, crimson and aged silver. Till death do us part.' }
    },
    elegante: {
      es: { name: '08 · Alta Etiqueta', badge: 'Clásica y Palaciega', desc: 'Azul imperial, blanco seda y champán. Papelería fina de gran gala.' },
      val: { name: '08 · Alta Etiqueta', badge: 'Clàssica i Palatina', desc: 'Blau imperial, blanc seda i xampany. Papereria fina de gran gala.' },
      en: { name: '08 · High Society', badge: 'Classic & Palatial', desc: 'Imperial navy, silk white and champagne. Fine black-tie stationery.' }
    },
    starwars: {
      es: { name: '09 · Galaxia Lejana', badge: 'Épica y Cinematográfica', desc: 'Cielo estrellado, paneles holográficos y oro galáctico. Una boda legendaria.' },
      val: { name: '09 · Galàxia Llunyana', badge: 'Èpica i Cinematogràfica', desc: 'Cel estrellat, panells hologràfics i or galàctic. Un casament llegendari.' },
      en: { name: '09 · Faraway Galaxy', badge: 'Epic & Cinematic', desc: 'Star field, holographic panels and galactic gold. A legendary wedding.' }
    },
    ibiza: {
      es: { name: '10 · Ibiza & Formentera', badge: 'Beach Club y Playa', desc: 'Estilo Beso Beach, blanco ibicenco, azul turquesa de cala y textura de lino.' },
      val: { name: '10 · Eivissa i Formentera', badge: 'Beach Club i Platja', desc: 'Estil Beso Beach, blanc eivissenc, blau turquesa de cala i textura de lli.' },
      en: { name: '10 · Ibiza & Formentera', badge: 'Beach Club & Beach', desc: 'Beso Beach style, Ibizan white, turquoise cove blue and linen texture.' }
    },
    bridgerton: {
      es: { name: '11 · Los Bridgerton', badge: 'Lady Whistledown', desc: 'Azul Bridgerton, estética Regencia inglesa, porcelana y panfleto real.' },
      val: { name: '11 · Els Bridgerton', badge: 'Lady Whistledown', desc: 'Blau Bridgerton, estètica Regency anglesa, porcellana i pamflet reial.' },
      en: { name: '11 · The Bridgertons', badge: 'Lady Whistledown', desc: 'Bridgerton blue, English Regency styling, porcelain and a society pamphlet.' }
    },
    amalfi: {
      es: { name: '12 · Positano & Amalfi', badge: 'Cerámica Italiana', desc: 'Azul cobalto, amarillo limón de Sorrento, blanco y cenefas de mayólica.' },
      val: { name: '12 · Positano i Amalfi', badge: 'Ceràmica Italiana', desc: 'Blau cobalt, groc llimona de Sorrento, blanc i sanefes de majòlica.' },
      en: { name: '12 · Positano & Amalfi', badge: 'Italian Ceramics', desc: 'Cobalt blue, Sorrento lemon yellow, white and majolica borders.' }
    },
    bodega: {
      es: { name: '13 · Bodega Gran Reserva', badge: 'La Rioja y Viñedos', desc: 'Vino tinto burdeos, etiqueta de crianza, malla dorada y cobre envejecido.' },
      val: { name: '13 · Celler Gran Reserva', badge: 'La Rioja i Vinyes', desc: 'Vi negre bordeus, etiqueta de criança, malla daurada i coure envellit.' },
      en: { name: '13 · Gran Reserva Winery', badge: 'Rioja & Vineyards', desc: 'Bordeaux red, crianza label, gold mesh and aged copper.' }
    },
    viajeros: {
      es: { name: '14 · Pasaporte & Boarding Pass', badge: 'Viajeros First Class', desc: 'Pasaporte oficial, sellos de aduana, panel de vuelos y tarjeta de embarque.' },
      val: { name: '14 · Passaport & Boarding Pass', badge: 'Viatgers First Class', desc: 'Passaport oficial, segells de duana, panell de vols i targeta d\'embarcament.' },
      en: { name: '14 · Passport & Boarding Pass', badge: 'First Class Travellers', desc: 'Official passport, customs stamps, departures board and boarding pass.' }
    },
    festival: {
      es: { name: '15 · Coachella & Tomorrowland', badge: 'WedFest VIP ★', desc: 'Cartel Line-up de festival, estética Coachella, horarios de escenarios y pase VIP.' },
      val: { name: '15 · Coachella & Tomorrowland', badge: 'WedFest VIP ★', desc: 'Cartell line-up de festival, estètica Coachella, horaris d\'escenaris i passi VIP.' },
      en: { name: '15 · Coachella & Tomorrowland', badge: 'WedFest VIP ★', desc: 'Festival line-up poster, Coachella styling, stage times and VIP pass.' }
    },
    harrypotter: {
      es: { name: '16 · Harry Potter & Hogwarts', badge: 'Carta de Hogwarts', desc: 'Pergamino mágico, lacre de Hogwarts, Mapa del Merodeador y billete Andén 9¾.' },
      val: { name: '16 · Harry Potter & Hogwarts', badge: 'Carta de Hogwarts', desc: 'Pergamí màgic, lacre de Hogwarts, Mapa del Merodeador i bitllet Andana 9¾.' },
      en: { name: '16 · Harry Potter & Hogwarts', badge: 'Hogwarts Letter', desc: 'Magic parchment, Hogwarts wax seal, Marauder\'s Map and Platform 9¾ ticket.' }
    },
    lotr: {
      es: { name: '17 · El Señor de los Anillos', badge: 'Tierra Media y Rivendel', desc: 'Verde Lothlórien, oro del Anillo Único, arcos élficos de Rivendel y La Comarca.' },
      val: { name: '17 · El Senyor dels Anells', badge: 'Terra Mitjana i Rivendel', desc: 'Verd Lóthlórien, or de l\'Anell Únic, arcs èlfics de Rivendel i La Comarca.' },
      en: { name: '17 · The Lord of the Rings', badge: 'Middle-earth & Rivendell', desc: 'Lothlórien green, One Ring gold, Rivendell elven arches and the Shire.' }
    },
    hollywood: {
      es: { name: '18 · Premios Oscar & Hollywood', badge: 'Alfombra Roja y Cine', desc: 'Dorado estatuilla Oscar, rojo terciopelo Dolby Theatre, póster de estreno y VIP Pass.' },
      val: { name: '18 · Premis Oscar & Hollywood', badge: 'Catifa Roja i Cinema', desc: 'Daurat estatueta Oscar, roig vellut Dolby Theatre, pòster d\'estrena i VIP Pass.' },
      en: { name: '18 · Oscars & Hollywood', badge: 'Red Carpet & Cinema', desc: 'Oscar gold, Dolby Theatre red velvet, premiere poster and VIP pass.' }
    },
    gamer: {
      es: { name: '19 · Gamer: PlayStation & Co-Op', badge: 'Player 1 & Player 2', desc: 'Interfaz PlayStation, estética Cyberpunk neón, trofeo de platino y modo cooperativo.' },
      val: { name: '19 · Gamer: PlayStation & Co-Op', badge: 'Player 1 & Player 2', desc: 'Interfície PlayStation, estètica Cyberpunk neó, trofeu de platí i mode cooperatiu.' },
      en: { name: '19 · Gamer: PlayStation & Co-Op', badge: 'Player 1 & Player 2', desc: 'PlayStation interface, neon cyberpunk styling, platinum trophy and co-op mode.' }
    }
  };

  function normalize(lang) {
    var value = String(lang || '').toLowerCase();
    if (value === 'ca' || value === 'va' || value === 'valencia' || value === 'valencià') return 'val';
    return LANGS.indexOf(value) === -1 ? '' : value;
  }

  function storedLang() {
    try { return normalize(localStorage.getItem(STORAGE_KEY)); } catch (e) { return ''; }
  }

  function urlLang() {
    try {
      return normalize(new URLSearchParams(window.location.search).get('lang'));
    } catch (e) {
      return '';
    }
  }

  /* Las plantillas actuales (body.clean-type) no usan emojis ni símbolos
     como decoración: se retiran de los textos de la interfaz. */
  var DECOR = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\uFE0F\u200D]/gu;
  function cleanDecor(value) {
    if (typeof value !== 'string') return value;
    if (!document.body || !document.body.classList.contains('clean-type')) return value;
    return value.replace(DECOR, '').replace(/\s{2,}/g, ' ').trim();
  }

  function t(key) {
    var dict = DICT[current] || DICT.es;
    if (Object.prototype.hasOwnProperty.call(dict, key)) return cleanDecor(dict[key]);
    if (Object.prototype.hasOwnProperty.call(DICT.es, key)) return cleanDecor(DICT.es[key]);
    return '';
  }

  function originalOf(node) {
    if (!originals.has(node)) originals.set(node, node.textContent);
    return originals.get(node);
  }

  function apply(root) {
    var scope = root || document;

    scope.querySelectorAll('[data-i18n]').forEach(function (node) {
      // El estado de error de la invitación se escribe en tiempo real.
      if (node.closest && node.closest('#invite-status')) return;
      var key = node.getAttribute('data-i18n');
      var value = t(key);
      if (value) node.textContent = value;
      else node.textContent = originalOf(node);
    });

    scope.querySelectorAll('[data-i18n-option]').forEach(function (node) {
      var value = t(node.getAttribute('data-i18n-option'));
      if (value) node.textContent = value;
    });

    scope.querySelectorAll('[data-i18n-placeholder]').forEach(function (node) {
      var value = t(node.getAttribute('data-i18n-placeholder'));
      if (value) node.setAttribute('placeholder', value);
    });

    scope.querySelectorAll('[data-i18n-label]').forEach(function (node) {
      var value = t(node.getAttribute('data-i18n-label'));
      if (value) node.setAttribute('aria-label', value);
    });

    document.documentElement.lang = current;
  }

  function syncButtons() {
    var switcher = document.getElementById('lang-switcher');
    if (!switcher) return;
    switcher.querySelectorAll('button[data-lang]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-lang') === current ? 'true' : 'false');
    });
  }

  function setLanguage(lang, options) {
    options = options || {};
    var clean = normalize(lang);
    if (!clean) return;

    current = clean;
    if (options.remember) {
      userChose = true;
      try { localStorage.setItem(STORAGE_KEY, clean); } catch (e) {}
    }

    apply(document);
    syncButtons();

    if (!options.silent && window.InviteApp && window.InviteApp.setLanguage) {
      try { window.InviteApp.setLanguage(clean); } catch (e) {}
    }

    document.dispatchEvent(new CustomEvent('idioma:cambiado', { detail: { lang: clean } }));
  }

  function buildSwitcher() {
    if (document.getElementById('lang-switcher')) return;
    if (!document.getElementById('invite-shell')) return;

    var box = document.createElement('div');
    box.id = 'lang-switcher';
    box.className = 'lang-switcher';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Idioma de la invitación');

    LANGS.forEach(function (lang) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('data-lang', lang);
      btn.setAttribute('lang', lang === 'val' ? 'ca' : lang);
      btn.setAttribute('aria-label', LANG_NAMES[lang]);
      btn.setAttribute('title', LANG_NAMES[lang]);
      btn.textContent = LANG_SHORT[lang];
      btn.addEventListener('click', function () {
        setLanguage(lang, { remember: true });
      });
      box.appendChild(btn);
    });

    document.body.appendChild(box);
  }

  function initialLanguage() {
    var fromUrl = urlLang();
    if (fromUrl) return fromUrl;
    var stored = storedLang();
    if (stored) return stored;
    var data = window.InviteApp && window.InviteApp.getData ? window.InviteApp.getData() : null;
    return normalize(data && data.defaultLanguage) || 'es';
  }

  function init() {
    buildSwitcher();
    var initial = initialLanguage();
    // invite.js ya ha pintado con su propio idioma; aquí solo sincronizamos.
    current = initial;
    // En páginas que no son la invitación (p. ej. el catálogo) no tocamos
    // el DOM ni el atributo lang del documento: solo exponemos el diccionario.
    if (!document.getElementById('invite-shell')) return;
    apply(document);
    syncButtons();
    if (window.InviteApp && window.InviteApp.setLanguage) {
      try { window.InviteApp.setLanguage(initial); } catch (e) {}
    }
  }

  document.addEventListener('wedding:rendered', function (ev) {
    var lang = normalize(ev.detail && ev.detail.lang);
    if (lang && lang !== current) {
      current = lang;
      apply(document);
      syncButtons();
    }
  });

  // Cuando llega la boda real desde Supabase, se respeta el idioma elegido.
  window.addEventListener('wedding:data', function () {
    if (userChose) return;
    var lang = initialLanguage();
    if (lang && lang !== current) {
      current = lang;
      apply(document);
      syncButtons();
    }
  });

  window.Idiomas = {
    t: t,
    apply: apply,
    setLanguage: setLanguage,
    getLanguage: function () { return current; },
    supported: LANGS.slice(),
    dict: DICT,
    templates: TEMPLATES,
    templateField: function (key, field, lang) {
      var pack = TEMPLATES[key];
      if (!pack) return '';
      var code = normalize(lang) || current;
      var source = pack[code] || pack.es;
      return source && source[field] ? source[field] : (pack.es[field] || '');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
