/* =====================================================================
   CONFIGURACIÓN DEL NEGOCIO Y DE SUPABASE
   =====================================================================
   Este archivo es el único sitio donde debes cambiar datos de contacto,
   marca y conexión. La clave de Supabase que aparece aquí es la clave
   pública ("publishable" / "anon"): está diseñada para vivir en el
   navegador y NO da acceso de escritura gracias a las políticas RLS del
   archivo supabase/schema.sql. Nunca pongas aquí la service_role key.
   ===================================================================== */
window.APP_CONFIG = {
  // --- Marca y contacto -------------------------------------------------
  BRAND_NAME: 'MelTeInvita',
  BRAND_SHORT: 'MelTeInvita',
  // Número de WhatsApp en formato internacional, sin + ni espacios.
  WHATSAPP_PHONE: '34682389653',
  CONTACT_EMAIL: 'hola@melteinvita.es', // Cambia por tu email real
  WEBSITE_URL: '', // Ej. https://melteinvita.es (sin barra final)

  // --- Supabase ---------------------------------------------------------
  SUPABASE_URL: 'https://keyeoylikquupystxrdx.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_iJ5cT44OtspaQAtuk4wwzA_dHt7CHYG',
  STORAGE_BUCKET: 'fotos-bodas',

  // --- Publicación ------------------------------------------------------
  // Identificador que aparece por defecto en el panel.
  DEFAULT_SLUG: 'alejandro-y-martina',
  // Tiempo (en meses) que una invitación permanece online. Solo informativo.
  HOSTING_MONTHS: 12,

  // --- Pago -------------------------------------------------------------
  // Enlace de pago de Stripe (Payment Link). Si está vacío, el botón de
  // reserva abrirá WhatsApp para cerrar el pedido manualmente.
  STRIPE_PAYMENT_LINK: '',
  // Precio único de lanzamiento (en euros). Cambia también los textos del
  // catálogo si modificas esta cifra.
  PRICE_EUR: 39,
  PRICE_BEFORE_1: 69,
  PRICE_BEFORE_2: 99,

  // --- Vista previa en redes sociales (Cloudflare Worker) ---------------
  // Ej. https://og.melteinvita.es  (ver cloudflare-worker/README.md)
  OG_WORKER_URL: '',

  // --- Legal ------------------------------------------------------------
  // Rellena estos datos en las páginas legales antes de publicar.
  LEGAL_NAME: '[NOMBRE Y APELLIDOS / RAZÓN SOCIAL]',
  LEGAL_NIF: '[NIF]',
  LEGAL_ADDRESS: '[DIRECCIÓN FISCAL]',
  LEGAL_EMAIL: '[EMAIL DE CONTACTO]',
  LEGAL_PHONE: '[TELÉFONO]'
};
