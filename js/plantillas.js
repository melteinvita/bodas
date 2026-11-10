/* =====================================================================
   CATÁLOGO DE PLANTILLAS Y DATOS INICIALES
   ===================================================================== */
window.WEDDING_TEMPLATES = {
  /* ---------------------------------------------------------------
     COLECCIÓN ACTUAL · las nueve plantillas comerciales de MelTeInvita
     --------------------------------------------------------------- */
  classic: {
    id: 'classic',
    name: '01 · Classic Elegance',
    badge: 'Clásica y Atemporal',
    desc: 'Marfil, filetes en dorado champagne y nombres en versales. La papelería de gran gala que nunca pasa de moda.',
    colors: ['#C6AE83', '#F8F5EF', '#393630'],
    defaultEnvelope: false,
    defaultSealColor: 'marfil'
  },
  romantic: {
    id: 'romantic',
    name: '02 · Romantic Bloom',
    badge: 'Romántica y Delicada',
    desc: 'Rosa empolvado, verde salvia y ramas florales dibujadas a línea. Papelería artesanal para una boda de jardín.',
    colors: ['#D8B8B1', '#FAF6F0', '#74645B'],
    defaultEnvelope: true,
    defaultSealColor: 'marfil'
  },
  minimal: {
    id: 'minimal',
    name: '03 · Modern Minimal',
    badge: 'Contemporánea y Editorial',
    desc: 'Mucho blanco, tipografía de revista y composición asimétrica. Una invitación de estudio de branding.',
    colors: ['#DED5C8', '#F9F8F5', '#282725'],
    defaultEnvelope: false,
    defaultSealColor: 'marfil'
  },
  mediterranean: {
    id: 'mediterranean',
    name: '04 · Mediterranean Organic',
    badge: 'Natural y Luminosa',
    desc: 'Verde oliva, arena y terracota suave. Papel artesanal para una boda entre olivos, viñedos o jardines.',
    colors: ['#777C5B', '#F7F4ED', '#BC8F79'],
    defaultEnvelope: true,
    defaultSealColor: 'verde'
  },

  timeless: {
    id: 'timeless',
    name: '05 · Timeless Editorial',
    badge: 'Editorial y Sofisticada',
    desc: 'Nombres a gran escala, fotografía integrada y filetes en champagne. Una invitación de revista de moda, cálida y personal.',
    colors: ['#CDB892', '#FAF8F4', '#1F1E1C'],
    defaultEnvelope: false,
    defaultSealColor: 'marfil',
    /* Imágenes de ambiente solo para la demo del catálogo (no son fotos de la pareja) */
    demoHero: 'img/demo/timeless-hero.jpg',
    demoGallery: ['img/demo/timeless-1.jpg', 'img/demo/timeless-2.jpg', 'img/demo/timeless-3.jpg']
  },
  'french-romance': {
    id: 'french-romance',
    name: '06 · French Romance',
    badge: 'Romántica y Francesa',
    desc: 'Marcos ornamentales finísimos, rosa antiguo y dorado envejecido. La papelería de un château en la Provenza.',
    colors: ['#C9A09A', '#FBF7EF', '#5C4E49'],
    defaultEnvelope: true,
    defaultSealColor: 'marfil',
    /* Imágenes de ambiente solo para la demo del catálogo (no son fotos de la pareja) */
    demoHero: 'img/demo/french-romance-hero.jpg',
    demoGallery: ['img/demo/french-romance-1.jpg', 'img/demo/french-romance-2.jpg', 'img/demo/french-romance-3.jpg']
  },
  'black-tie': {
    id: 'black-tie',
    name: '07 · Black Tie',
    badge: 'Nocturna y de Gala',
    desc: 'Negro profundo, marfil y filetes geométricos en champagne. Para una boda de etiqueta que empieza al caer la noche.',
    colors: ['#C9B27C', '#0E0E0F', '#F4EFE6'],
    defaultEnvelope: true,
    defaultSealColor: 'noche',
    /* Imágenes de ambiente solo para la demo del catálogo (no son fotos de la pareja) */
    demoHero: 'img/demo/black-tie-hero.jpg',
    demoGallery: ['img/demo/black-tie-1.jpg', 'img/demo/black-tie-2.jpg', 'img/demo/black-tie-3.jpg']
  },
  garden: {
    id: 'garden',
    name: '08 · Garden Wedding',
    badge: 'Jardín y Naturaleza',
    desc: 'Follaje a la acuarela en verde bosque y salvia, con toques de rosa nude. Una boda al aire libre en un jardín privado.',
    colors: ['#5E7260', '#FAF7F0', '#DDB9AE'],
    defaultEnvelope: true,
    defaultSealColor: 'verde',
    /* Imágenes de ambiente solo para la demo del catálogo (no son fotos de la pareja) */
    demoHero: 'img/demo/garden-hero.jpg',
    demoGallery: ['img/demo/garden-1.jpg', 'img/demo/garden-2.jpg', 'img/demo/garden-3.jpg']
  },
  'royal-burgundy': {
    id: 'royal-burgundy',
    name: '09 · Royal Burgundy',
    badge: 'Romántica y de Gala',
    desc: 'Burdeos profundo, marfil cálido y detalles oro champán. Una invitación editorial de inspiración clásica para una celebración elegante.',
    colors: ['#5A1727', '#F7F1E8', '#C5A46D'],
    defaultEnvelope: true,
    defaultSealColor: 'burdeos',
    demoHero: 'img/demo/black-tie-hero.jpg',
    demoGallery: ['img/demo/black-tie-1.jpg', 'img/demo/black-tie-2.jpg', 'img/demo/black-tie-3.jpg']
  },

  /* ---------------------------------------------------------------
     COLECCIÓN ANTERIOR (legacy)
     Siguen renderizando para las bodas ya publicadas con estos
     identificadores, pero no se ofrecen en el catálogo ni en el
     selector del panel (se muestran con ?legacy=1 o si la boda ya
     usa una de ellas).
     --------------------------------------------------------------- */
  olivo: {
    id: 'olivo',
    legacy: true,
    name: '01 · Olivo Mediterráneo',
    badge: 'Fincas y Exterior',
    desc: 'Verde oliva, marfil, ramas botánicas y tipografía clásica.',
    colors: ['#5b6d52', '#faf7f0', '#c5a869'],
    defaultEnvelope: false,
    defaultSealColor: 'verde'
  },
  editorial: {
    id: 'editorial',
    legacy: true,
    name: '02 · Editorial Minimalista',
    badge: 'Lujo Urbano',
    desc: 'Blanco roto y negro, diseño de revista, asimetría y gran formato.',
    colors: ['#141414', '#f8f7f4', '#8c857b'],
    defaultEnvelope: false,
    defaultSealColor: 'marfil'
  },
  flores: {
    id: 'flores',
    legacy: true,
    name: '03 · Flores Románticas',
    badge: 'Romántica y Suave',
    desc: 'Rosa empolvado, verde salvia, pétalos sutiles y marcos florales.',
    colors: ['#d49ea5', '#fffaf8', '#8fa392'],
    defaultEnvelope: false,
    defaultSealColor: 'burdeos'
  },
  sobre: {
    id: 'sobre',
    legacy: true,
    name: '04 · Sobre Premium',
    badge: 'Producto Estrella ★',
    desc: 'Apertura animada con sobre y sello de lacre con iniciales.',
    colors: ['#b89758', '#f6f1e5', '#2a362b'],
    defaultEnvelope: true,
    defaultSealColor: 'marfil'
  },
  terracota: {
    id: 'terracota',
    legacy: true,
    name: '05 · Terracota Natural',
    badge: 'Rústica y Boho',
    desc: 'Tonos tierra, terracota, arena y arcos orgánicos cálidos.',
    colors: ['#b85d43', '#f7efe6', '#8c6249'],
    defaultEnvelope: false,
    defaultSealColor: 'burdeos'
  },
  noche: {
    id: 'noche',
    legacy: true,
    name: '06 · Noche Elegante',
    badge: 'Nocturna y Oro',
    desc: 'Azul noche, negro y dorado brillante con destellos luminosos.',
    colors: ['#0e151f', '#d4af37', '#5e1b29'],
    defaultEnvelope: true,
    defaultSealColor: 'noche'
  },
  gotico: {
    id: 'gotico',
    legacy: true,
    name: '07 · Gótico & Rock',
    badge: 'Alternativa y Oscura',
    desc: 'Negro obsidiana, carmesí y plata envejecida. Till death do us part.',
    colors: ['#0d0d0f', '#9e1b24', '#d9d6d0'],
    defaultEnvelope: true,
    defaultSealColor: 'burdeos'
  },
  elegante: {
    id: 'elegante',
    legacy: true,
    name: '08 · Alta Etiqueta',
    badge: 'Clásica y Palaciega',
    desc: 'Azul imperial, blanco seda y champán. Papelería fina de gran gala.',
    colors: ['#1c252c', '#fbf9f5', '#c2a675'],
    defaultEnvelope: true,
    defaultSealColor: 'marfil'
  },
  starwars: {
    id: 'starwars',
    legacy: true,
    name: '09 · Galaxia Lejana',
    badge: 'Épica y Cinematográfica',
    desc: 'Cielo estrellado, paneles holográficos y oro galáctico. Una boda legendaria.',
    colors: ['#070913', '#ffe81f', '#2e67f8'],
    defaultEnvelope: true,
    defaultSealColor: 'noche'
  },
  ibiza: {
    id: 'ibiza',
    legacy: true,
    name: '10 · Ibiza & Formentera',
    badge: 'Beach Club y Playa',
    desc: 'Estilo Beso Beach, blanco ibicenco, azul turquesa de cala y textura de lino.',
    colors: ['#1ca3ec', '#ffffff', '#f4ede2'],
    defaultEnvelope: false,
    defaultSealColor: 'marfil'
  },
  bridgerton: {
    id: 'bridgerton',
    legacy: true,
    name: '11 · Los Bridgerton',
    badge: 'Lady Whistledown',
    desc: 'Azul Bridgerton, estética Regencia inglesa, porcelana y panfleto real.',
    colors: ['#6889a8', '#fdfbf7', '#c5a059'],
    defaultEnvelope: true,
    defaultSealColor: 'marfil'
  },
  amalfi: {
    id: 'amalfi',
    legacy: true,
    name: '12 · Positano & Amalfi',
    badge: 'Cerámica Italiana',
    desc: 'Azul cobalto, amarillo limón de Sorrento, blanco y cenefas de mayólica.',
    colors: ['#1034a6', '#fffdf2', '#f4c430'],
    defaultEnvelope: false,
    defaultSealColor: 'verde'
  },
  bodega: {
    id: 'bodega',
    legacy: true,
    name: '13 · Bodega Gran Reserva',
    badge: 'La Rioja y Viñedos',
    desc: 'Vino tinto burdeos, etiqueta de crianza, malla dorada y cobre envejecido.',
    colors: ['#5e1924', '#f6f0e6', '#b87333'],
    defaultEnvelope: true,
    defaultSealColor: 'burdeos'
  },
  viajeros: {
    id: 'viajeros',
    legacy: true,
    name: '14 · Pasaporte & Boarding Pass',
    badge: 'Viajeros First Class',
    desc: 'Pasaporte oficial, sellos de aduana, panel de vuelos y tarjeta de embarque.',
    colors: ['#162436', '#f7f4ea', '#c59b27'],
    defaultEnvelope: true,
    defaultSealColor: 'noche'
  },
  festival: {
    id: 'festival',
    legacy: true,
    name: '15 · Coachella & Tomorrowland',
    badge: 'WedFest VIP ★',
    desc: 'Cartel Line-up de festival, estética Coachella, horarios de escenarios y pase VIP.',
    colors: ['#1c0d33', '#ff477e', '#ffbe0b'],
    defaultEnvelope: false,
    defaultSealColor: 'noche'
  },
  harrypotter: {
    id: 'harrypotter',
    legacy: true,
    name: '16 · Harry Potter & Hogwarts',
    badge: 'Carta de Hogwarts',
    desc: 'Pergamino mágico, lacre de Hogwarts, Mapa del Merodeador y billete Andén 9¾.',
    colors: ['#740001', '#f3e7c9', '#d3a625'],
    defaultEnvelope: true,
    defaultSealColor: 'burdeos'
  },
  lotr: {
    id: 'lotr',
    legacy: true,
    name: '17 · El Señor de los Anillos',
    badge: 'Tierra Media y Rivendel',
    desc: 'Verde Lothlórien, oro del Anillo Único, arcos élficos de Rivendel y La Comarca.',
    colors: ['#1b3324', '#f4efe4', '#d4af37'],
    defaultEnvelope: true,
    defaultSealColor: 'verde'
  },
  hollywood: {
    id: 'hollywood',
    legacy: true,
    name: '18 · Premios Oscar & Hollywood',
    badge: 'Alfombra Roja y Cine',
    desc: 'Dorado estatuilla Oscar, rojo terciopelo Dolby Theatre, póster de estreno y VIP Pass.',
    colors: ['#0f0f0f', '#c90016', '#e5c158'],
    defaultEnvelope: true,
    defaultSealColor: 'burdeos'
  },
  gamer: {
    id: 'gamer',
    legacy: true,
    name: '19 · Gamer: PlayStation & Co-Op',
    badge: 'Player 1 & Player 2',
    desc: 'Interfaz PlayStation, estética Cyberpunk neón, trofeo de platino y modo cooperativo.',
    colors: ['#090b10', '#00f0ff', '#ff0055'],
    defaultEnvelope: false,
    defaultSealColor: 'noche'
  }
};

/* Claves de plantilla visibles en catálogo y panel.
   Las plantillas legacy solo aparecen con ?legacy=1 o si es la seleccionada. */
window.templateKeys = function (selected) {
  var showAll = /(?:^|[?&])legacy=1(?:&|$)/.test(window.location.search);
  return Object.keys(window.WEDDING_TEMPLATES).filter(function (key) {
    var tpl = window.WEDDING_TEMPLATES[key];
    return !tpl.legacy || showAll || key === selected;
  });
};

window.DEFAULT_WEDDING_DATA = {
  id: 'alejandro-y-martina',
  template: 'classic',
  useEnvelope: true,
  envelopeStyle: 'marfil', // marfil | verde | burdeos | noche
  musicEnabled: true,
  musicFile: 'audio/ambiente.mp3',
  defaultLanguage: 'es',
  n1: 'Alejandro',
  n2: 'Martina',
  eyebrow: '¡NOS CASAMOS!',
  date: '2027-06-12',
  time: '12:30',
  endTime: '23:30',
  message: 'Después de compartir tantos momentos inolvidables, queremos celebrar nuestro amor rodeados de las personas que más queremos.',
  storyTitle: 'Nuestra Historia',
  storyText: 'Todo comenzó con una mirada cómplice y una conversación que parecía no tener fin. Hoy damos el paso más bonito de nuestras vidas y no sería lo mismo sin ti.',
  venue: 'Finca Los Olivos',
  address: 'Elche, Alicante',
  map: 'https://maps.google.com/?q=Elche,Alicante',
  dressCode: 'Cóctel Elegante (Se ruega reservar el color blanco para la novia)',
  transportInfo: 'Habrá servicio de autobuses desde el centro de Elche a las 11:45h y regreso a las 02:00h.',
  giftMessage: 'Vuestra presencia es nuestro mejor regalo. Si además queréis tener un detalle con nosotros para nuestra luna de miel:',
  iban: 'ES91 2100 0418 4502 0005 1332',
  rsvpDeadline: '15 de mayo de 2027',
  maxGuests: 4,
  contactPhone: '', // WhatsApp de los novios para incidencias del RSVP
  privacyUrl: 'privacidad.html',
  cookiesUrl: 'cookies.html',
  legalUrl: 'aviso-legal.html',
  sections: {
    story: true,
    itinerary: true,
    gallery: true,
    details: true,
    gifts: true,
    rsvp: true
  },
  events: [
    { time: '12:30', title: 'Ceremonia', place: 'Jardines de la Finca', icon: 'rings' },
    { time: '14:00', title: 'Cóctel de Bienvenida', place: 'Terraza de los Olivos', icon: 'cheers' },
    { time: '15:30', title: 'Banquete', place: 'Salón Acristalado', icon: 'dinner' },
    { time: '18:30', title: 'Gran Fiesta', place: 'Zona Chill & Dance', icon: 'music' }
  ],
  heroPhoto: '',
  galleryPhotos: []
};
