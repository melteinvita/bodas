# Vista previa por boda en WhatsApp (Cloudflare Worker)

Sin este paso todo funciona igual, pero al compartir el enlace los
invitados verán el título y la imagen genéricos (`img/og-default.jpg`).
Con el Worker, cada boda muestra su nombre, su fecha, su lugar y su foto.

Es un extra opcional. No es necesario para probar la app en local.

---

## 1. Instala Wrangler

```bash
npm.cmd install -g wrangler
wrangler login
```

En Windows, si `npm` está bloqueado por la política de ejecución, usa
`npm.cmd` (como arriba).

## 2. Rellena los datos

Edita `wrangler.toml`:

- `SUPABASE_URL`: la URL de tu proyecto.
- `SUPABASE_ANON_KEY`: la clave publishable/anon.
- `SITE_URL`: tu dominio final, sin barra al final.

## 3. Publica

Desde esta carpeta:

```bash
cd cloudflare-worker
wrangler deploy
```

Wrangler sube la carpeta del proyecto como web estática y activa el
Worker en `/i/*` y en `/invitacion.html`. El archivo `.assetsignore`
de la raíz evita publicar el propio Worker, el SQL, el README y el ZIP.
El Worker añade las cabeceras de seguridad a todas las respuestas, así
que también protege el despliegue hecho con Workers Assets.

## 4. Dominio

En Cloudflare → Workers & Pages → tu Worker → Settings → Domains & Routes,
añade tu dominio o subdominio (por ejemplo `invitaciones.tudominio.es`).
Si el dominio está en Cloudflare, el certificado se emite solo.

## 5. Prueba

1. Abre `https://TU-DOMINIO/invitacion.html?boda=alejandro-y-martina`.
2. Comprueba la vista previa con:
   - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
   - [Twitter Card Validator](https://cards-dev.twitter.com/validator)
3. En WhatsApp, envía el enlace a un chat contigo mismo. La primera vez
   puede tardar unos minutos en actualizar la caché.

También existe el enlace corto `https://TU-DOMINIO/i/alejandro-y-martina`:
a los robots les devuelve las etiquetas OG y a las personas las redirige
a la invitación.

## Cómo funciona

- Solo interviene si el `User-Agent` es de un robot de vista previa
  (WhatsApp, Facebook, Telegram, LinkedIn, Twitter/X…).
- Consulta `bodas_publicas` con la clave pública y lee únicamente
  `id` y `data`.
- Escapa todos los textos antes de insertarlos en el HTML.
- No expone el token del portal de novios ni datos de confirmaciones.
- Si Supabase no responde, sirve la web normal sin romper el enlace.

## Coste

El plan gratuito de Workers incluye 100.000 peticiones al día. Una boda
normal no se acerca ni de lejos. Si no quieres usarlo, simplemente no
despliegues este Worker: el resto de la app funciona sin él.
