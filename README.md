# MelTeInvita · Invitaciones de boda digitales (2.0)

Versión corregida y ampliada del proyecto de invitaciones. Incluye catálogo comercial,
ocho plantillas comerciales (más las diecinueve anteriores, conservadas como «legacy»), sobre animado, RSVP conectado a Supabase, portal privado para los novios,
panel de administración, multiidioma (castellano, valencià e inglés), páginas legales y
todos los recursos alojados en local.

> **Modelo de negocio:** manual. Tú configuras cada boda desde el panel y publicas. Los
> clientes no editan la invitación ni tienen autoservicio.

---

## 1. Contenido de la entrega

```
MELVINTA 2.0/
├─ catalogo.html              Página comercial (39 €, diseños, FAQ, formulario)
├─ invitacion.html            Invitación pública (?boda=slug)
├─ admin.html                 Panel privado (noindex)
├─ novios.html                Portal privado de los novios (?boda=slug&k=token)
├─ aviso-legal.html           Plantilla legal
├─ privacidad.html            Plantilla legal
├─ cookies.html               Política de cookies / almacenamiento
├─ encargo-tratamiento.html   Modelo de encargo de tratamiento (noindex)
├─ css/                       Estilos por página
├─ js/                        config, comun, plantillas, nube, admin, invite, novios, catálogo, idiomas, legal, cookies, QR local
├─ img/                       Portadas, galería, favicon y OG por defecto
├─ audio/ambiente.mp3         Música de fondo (48 s)
├─ fonts/                     52 archivos woff2 + fonts.css (sin Google Fonts)
├─ supabase/schema.sql        Tablas, RLS, RPC, Storage, retención y borrado
├─ cloudflare-worker/         Worker opcional para vista previa en redes sociales
├─ _headers                   Cabeceras de seguridad para Cloudflare Pages / Netlify
├─ robots.txt / sitemap.xml   SEO
└─ .assetsignore              Excluye código fuente del despliegue estático
```

---

## 2. Puesta en marcha rápida

1. Abre `js/config.js` y revisa:
   - `WHATSAPP_PHONE` → ya configurado en `34682389653`.
   - `CONTACT_EMAIL`, `WEBSITE_URL`.
   - `SUPABASE_URL` y `SUPABASE_ANON_KEY` (clave pública, nunca la `service_role`).
   - `STRIPE_PAYMENT_LINK` si vas a cobrar online (vacío = pedido por WhatsApp).
2. Sirve la carpeta con cualquier servidor estático. En local:

   ```bash
   python -m http.server 8123 --bind 127.0.0.1 --directory "MELVINTA 2.0"
   ```

   Abre `http://127.0.0.1:8123/catalogo.html` y `http://127.0.0.1:8123/admin.html`.
3. Sin Supabase configurado, la app funciona en **modo local**: guarda en `localStorage`,
   permite previsualizar y exportar, pero no publica ni recibe RSVP reales.

> No abras `admin.html` con doble clic (`file://`) si vas a usar Supabase: el navegador
> bloquea peticiones desde ese origen. Usa un servidor local o el dominio publicado.

---

## 3. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) y elige región europea.
2. Ve a **SQL Editor**, pega el contenido de `supabase/schema.sql` y ejecútalo.
   Crea:
   - `bodas` (datos de cada boda).
   - `confirmaciones` (RSVP).
   - `administradores` (quién puede publicar y leer).
   - Vista pública `bodas_publicas` (sin token ni datos privados).
   - RPC `crear_confirmacion` para invitados anónimos.
   - RPC `borrar_boda` y política de retención.
   - Bucket `fotos-bodas` con políticas de lectura pública y escritura autenticada.
3. En **Authentication → Users**, crea tu usuario administrador (email + contraseña).
   Desactiva el registro público en **Authentication → Providers → Email**.
4. En **SQL Editor**, autoriza ese usuario:

   ```sql
   insert into public.administradores (email)
   values ('tu-email@dominio.com')
   on conflict (email) do nothing;
   ```

5. Copia la URL del proyecto y la clave **publishable/anon** en `js/config.js`.
   La clave `service_role` no se usa en el navegador.

> Si cambias de proyecto de Supabase, actualiza también el dominio de
> `Content-Security-Policy` en `_headers` (`img-src`, `media-src` y `connect-src`).

### Publicar una boda

1. Entra en `admin.html` → **Entrar** con el usuario administrador.
2. Escribe el identificador (ej. `alejandro-y-martina`), configura todo y guarda.
3. Pulsa **Publicar online**. Se suben datos, fotos y se genera el token del portal.
4. La app muestra dos enlaces:
   - Invitación: `invitacion.html?boda=alejandro-y-martina`
   - Portal de novios: `novios.html?boda=alejandro-y-martina&k=TOKEN`

El token se genera una vez y **no se guarda en el JSON público**. Si se pierde, puedes
volver a cargar la boda desde la nube para consultarlo (requiere sesión).

### RSVP

- El invitado escribe en `confirmaciones` mediante la RPC `crear_confirmacion`.
- El rol anónimo **no puede leer** confirmaciones.
- El panel y el portal de novios leen con sesión autenticada y RLS.
- Se guarda una copia local para consultar sin conexión; no sustituye a la nube.
- Los datos de salud (alergias) se muestran solo en el portal privado y el CSV.
- Para borrar RSVP antiguos automáticamente, programa
  `select public.limpiar_confirmaciones_cron(30)` con `pg_cron` (ver el final de
  `supabase/schema.sql`). La variante manual del panel exige sesión de administrador.

---

## 4. Despliegue

### Cloudflare Pages (recomendado)

1. Sube la carpeta a un repositorio o usa despliegue directo.
2. Build command: *(ninguno)*. Output directory: la raíz de `MELVINTA 2.0`.
3. El archivo `_headers` aplica CSP, `nosniff`, `Referrer-Policy` y caché.
4. `.assetsignore` evita publicar `supabase/`, `cloudflare-worker/` y documentación.
5. Añade tu dominio y actualiza `WEBSITE_URL` en `js/config.js`.

### Netlify

Arrastra la carpeta a Netlify. `_headers` también se interpreta. Sin build.

### GitHub Pages

Funciona como sitio estático, pero **no** aplica `_headers`. Si lo usas, configura las
cabeceras en un proxy/CDN delante. Recuerda que las rutas son relativas y funcionan.

### Comprobaciones después de publicar

- `https://TU-DOMINIO/catalogo.html` carga sin errores en consola.
- Login del panel correcto y publicación de una boda de prueba.
- RSVP real desde el móvil y aparición en el panel.
- Enlace de novios abre con token y sin token muestra error controlado.
- `robots.txt` y `sitemap.xml` responden.
- Cabeceras CSP activas (DevTools → Network → Headers).

---

## 5. Worker opcional de vista previa (Open Graph)

Las invitaciones con `?boda=slug` se sirven como HTML estático, así que las redes sociales
no pueden leer el título y la foto de cada boda. El Worker de `cloudflare-worker/` lo
resuelve:

1. Despliega el Worker y asígnale un subdominio, por ejemplo `og.melteinvita.es`.
2. Configura `OG_WORKER_URL` en `js/config.js`.
3. Sigue `cloudflare-worker/README.md` para variables y ruta.

Es opcional: sin Worker todo funciona, solo se comparte la imagen genérica.

---

## 6. Datos legales antes de vender

Las páginas legales son **plantillas**. Antes de publicar, sustituye:

- `[NOMBRE Y APELLIDOS / RAZÓN SOCIAL]`
- `[NIF]`
- `[DIRECCIÓN FISCAL]`
- `[EMAIL DE CONTACTO]`
- `[TELÉFONO]`
- `[PROVEEDOR DE HOSTING]`
- `[CIUDAD]`

Y revisa el texto con un profesional. También debes:

- Informar a los invitados del tratamiento y pedir consentimiento explícito para alergias.
- Firmar el encargo de tratamiento con cada pareja (modelo incluido).
- Mantener el registro de actividades de tratamiento si te aplica.
- No usar testimonios ni opiniones inventadas. La estructura del catálogo está preparada
  para añadir opiniones reales cuando las tengas.

---

## 7. Seguridad aplicada

- Sin contraseña maestra en el código: Supabase Auth + tabla `administradores`.
- RLS en todas las tablas; el rol público solo ejecuta la RPC de alta de RSVP.
- Vista `bodas_publicas` sin token, sin teléfono privado ni datos internos.
- Token de portal de novios aleatorio (32 bytes) y almacenado en `sessionStorage`.
- Todo el HTML dinámico se construye con `textContent` o se escapa con `esc()`.
- URLs validadas contra `javascript:` y `data:` (salvo imágenes permitidas).
- Fotos en Supabase Storage; nunca base64 dentro del JSON publicado.
- `localStorage` aislado por boda: `wedding:<slug>:data`, `:rsvp`, `:envelope-opened`, `:client-id`.
- Cabeceras CSP y `X-Content-Type-Options` en `_headers`.
- Sin cookies de analítica, publicidad ni píxeles.
- `admin.html`, `novios.html`, `invitacion.html` y el encargo llevan `noindex`.

### Limitaciones conocidas

- El modo local no es multiusuario: los RSVP se guardan solo en ese navegador.
- La protección anti-spam del RSVP es básica (validación y límite de longitud). Si sufres
  abuso, añade Turnstile de Cloudflare a la RPC o al formulario.
- El token del portal viaja en la URL. No lo compartas en redes ni lo pegues en webs
  públicas; usa el enlace privado de WhatsApp.
- Stripe es opcional y se gestiona como enlace de pago; no hay carrito ni facturación
  automática en esta versión.

---

## 8. Pruebas manuales recomendadas

1. **Catálogo:** abre el modal de cada diseño, cambia idioma y prueba el botón de WhatsApp.
2. **Sobre:** abre y cierra, comprueba que no se repite en la misma pestaña.
3. **Invitación:** recorre secciones, mapa, calendario, música y formulario RSVP.
4. **Idiomas:** `?lang=es`, `?lang=val`, `?lang=en`; la fecha y los menús cambian.
5. **Panel:** las 5 pestañas cambian, guardar persiste tras recargar, exporta JSON y CSV.
6. **Portal de novios:** sin token muestra error; con token muestra tabla, filtros, QR y CSV.
7. **Consola:** sin errores en las 8 páginas.
8. **Móvil:** 360 px, 390 px y 768 px; sin scroll horizontal.

---

## 9. Personalización rápida

- **Precio:** `PRICE_EUR`, `PRICE_BEFORE_1`, `PRICE_BEFORE_2` en `js/config.js` y textos
  del catálogo si cambias la cifra.
- **WhatsApp:** `WHATSAPP_PHONE` (formato internacional sin `+`).
- **Colores y tipografías:** `css/invitacion.css` y `js/plantillas.js`.
- **Textos de idioma:** `js/idiomas.js`.
- **Música:** sustituye `audio/ambiente.mp3` manteniendo el nombre.
- **Fotos por defecto:** `img/hero-*.jpg` y `img/galeria-*.jpg`.
- **SEO:** `sitemap.xml`, `robots.txt` y metadatos de `catalogo.html`.

---

## 10. Licencia y créditos

- Código y diseño: MelTeInvita.
- Fuentes: familias de Google Fonts con licencia SIL Open Font License, autoalojadas en
  `fonts/`. Consulta la licencia de cada familia antes de redistribuir.
- QR: [qrcodejs](https://github.com/davidshimjs/qrcodejs) (MIT), copia local en
  `js/qrcode.min.js`.
- Fotografías de muestra: recursos generados para la demo. Sustitúyelas por fotos reales
  con derechos antes de publicar una boda.

---

¿Dudas? `hola@melteinvita.es` · WhatsApp `+34 682 389 653`.
"# bodas" 
