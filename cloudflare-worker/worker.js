/* =====================================================================
   CLOUDFLARE WORKER · VISTA PREVIA POR BODA PARA WHATSAPP Y REDES
   ---------------------------------------------------------------------
   Sin este Worker, al compartir `invitacion.html?boda=...` WhatsApp
   muestra el título y la imagen genéricos. Con él, el robot de WhatsApp
   recibe un HTML mínimo con el nombre de la pareja, la fecha, el lugar
   y la foto de portada de esa boda concreta.

   Las personas siguen viendo la invitación normal: el Worker solo
   interviene cuando el visitante es un robot de vista previa.

   Variables de entorno (wrangler.toml o panel de Cloudflare):
     SUPABASE_URL       https://xxxx.supabase.co
     SUPABASE_ANON_KEY  clave publishable/anon
     SITE_URL           https://vuestro-dominio.es  (sin barra final)
   ===================================================================== */

const BOT_RE = /facebookexternalhit|whatsapp|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|pinterest|googlebot|bingbot|applebot|embedly|iframely|skypeuripreview|vkshare|w3c_validator/i;

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; font-src 'self'; media-src 'self' blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests"
};

function secure(response) {
  if (!response) return response;
  const headers = new Headers(response.headers);
  Object.keys(SECURITY_HEADERS).forEach((name) => {
    if (!headers.has(name)) headers.set(name, SECURITY_HEADERS[name]);
  });
  const nullBody = [101, 204, 205, 304].includes(response.status);
  return new Response(nullBody ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}


function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function absoluteUrl(value, base) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw, base);
    return (url.protocol === 'https:' || url.protocol === 'http:') ? url.href : '';
  } catch (e) {
    return '';
  }
}

function prettyDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!m) return '';
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${parseInt(m[3], 10)} de ${meses[parseInt(m[2], 10) - 1]} de ${m[1]}`;
}

async function loadWedding(env, slug) {
  const base = String(env.SUPABASE_URL || '').replace(/\/+$/, '');
  const key = env.SUPABASE_ANON_KEY || '';
  if (!base || !key || !slug) return null;

  const endpoint = `${base}/rest/v1/bodas_publicas?id=eq.${encodeURIComponent(slug)}&select=id,data`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json'
    },
    cf: { cacheTtl: 120, cacheEverything: true }
  });
  if (!res.ok) return null;
  const rows = await res.json().catch(() => null);
  if (!Array.isArray(rows) || !rows.length) return null;
  return rows[0].data || null;
}

function renderOg(data, slug, env, canonical) {
  const site = String(env.SITE_URL || canonical.origin).replace(/\/+$/, '');
  const n1 = String(data.n1 || '').trim();
  const n2 = String(data.n2 || '').trim();
  const couple = [n1, n2].filter(Boolean).join(' y ') || 'Nuestra boda';
  const date = prettyDate(data.date);
  const place = String(data.venue || data.address || '').trim();

  const title = `${couple}${date ? ' · ' + date : ''} · Invitación de boda`;
  const description = date
    ? `Nos casamos${place ? ' en ' + place : ''} el ${date}. Consulta todos los detalles y confirma tu asistencia.`
    : 'Consulta todos los detalles de nuestra boda y confirma tu asistencia.';

  let image = absoluteUrl(data.heroPhoto, site);
  if (!image || image.startsWith('data:')) image = `${site}/img/og-default.jpg`;

  const inviteUrl = `${site}/invitacion.html?boda=${encodeURIComponent(slug)}`;

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(inviteUrl)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="MelTeInvita">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${escapeHtml(inviteUrl)}">
<meta property="og:locale" content="es_ES">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
<meta name="robots" content="noindex,follow">
<style>
  body{margin:0;background:#f7f3e8;color:#2c261e;font:16px/1.6 Georgia,serif;display:grid;place-items:center;min-height:100vh;padding:24px}
  main{max-width:520px;text-align:center}
  h1{font-size:28px;margin:0 0 8px}
  p{color:#6e6353}
  a{display:inline-block;margin-top:18px;background:#9c7c38;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px}
</style>
</head>
<body>
<main>
  <h1>${escapeHtml(couple)}</h1>
  <p>${escapeHtml(description)}</p>
  <a href="${escapeHtml(inviteUrl)}">Abrir la invitación</a>
</main>
</body>
</html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ua = request.headers.get('user-agent') || '';
    const isBot = BOT_RE.test(ua);

    // Enlace corto: /i/slug
    const shortMatch = /^\/i\/([a-z0-9-]{2,64})\/?$/i.exec(url.pathname);
    if (shortMatch) {
      const slug = shortMatch[1].toLowerCase();
      if (isBot) {
        const data = await loadWedding(env, slug);
        if (data) {
          return secure(new Response(renderOg(data, slug, env, url), {
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=300'
            }
          }));
        }
      }
      const target = new URL('/invitacion.html', url);
      target.searchParams.set('boda', slug);
      return secure(Response.redirect(target.toString(), 302));
    }

    // Vista previa de la invitación normal, solo para robots.
    const isInvitation = /\/invitacion\.html$/i.test(url.pathname);
    const slug = (url.searchParams.get('boda') || '').trim().toLowerCase();
    if (isBot && isInvitation && slug) {
      const data = await loadWedding(env, slug);
      if (data) {
        return secure(new Response(renderOg(data, slug, env, url), {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=300'
          }
        }));
      }
    }

    // Todo lo demás se sirve desde los archivos estáticos del proyecto.
    if (env.ASSETS) return secure(await env.ASSETS.fetch(request));
    return secure(new Response('Not found', { status: 404 }));
  }
};
