# REDISEÑO MELTEINVITA · Registro de trabajo

Rama: `redesign/melteinvita-premium-19-templates`
Estado: **Fase 1 completada (integración fotográfica en las 19 portadas).** Las fases 2–4 están pendientes (ver §6).

## 1. Auditoría técnica (verificada en el código actual)

- Web **estática** multipágina, JavaScript vanilla, sin build ni framework. Despliegue en Cloudflare Pages / Netlify.
- Catálogo de 19 plantillas en `js/plantillas.js` (`window.WEDDING_TEMPLATES`). IDs: `olivo, editorial, flores, sobre, terracota, noche, gotico, elegante, starwars, ibiza, bridgerton, amalfi, bodega, viajeros, festival, harrypotter, lotr, hollywood, gamer`. **Las 19 existen** y coinciden con el inventario.
- Renderizado en `js/invite.js`; el tema se aplica con `body.theme-<id>`; todo el CSS temático vive en `css/invitacion.css` (4.062 líneas, 24–59 reglas por tema).
- Previsualización del panel: `postMessage({type:'UPDATE_INVITE', payload})` hacia el iframe de `invitacion.html`.
- Foto de portada: el campo `heroPhoto` **ya existía** (subida en `admin.js`, publicación a Storage en `nube.js`). Se reutiliza; no se crea otro sistema de subida.
- Hallazgo de la línea base: las plantillas 01–09 usaban `heroPhoto` como fondo a pantalla completa (y por defecto un fondo abstracto, **no** una foto de pareja); las 10–19 construían la portada solo con CSS y **ignoraban la foto**. El repositorio no contiene ninguna foto real de pareja.
- CSP (`_headers`): `img-src 'self' data: blob:` + Supabase. El rediseño no requiere cambiarla.

## 2. Línea base (antes de modificar)

19/19 demos (`invitacion.html?demo=<id>`) a 390 px: 0 errores de consola, 0 desbordamiento horizontal.

## 3. Arquitectura del cambio

| Archivo | Cambio |
|---|---|
| `invitacion.html` | Nuevo `figure#hero-photo` dentro de `.hero-content` y enlace a `css/portadas.css`. |
| `js/invite.js` | `renderHeroPhoto(d)`: pinta `heroPhoto` en el marco, alterna `.is-empty`, `object-position` configurable (`heroPhotoFocus`, opcional, por defecto `50% 30%`). El fondo de portada vuelve a ser el arte propio de cada plantilla; ya no lo sustituye la foto. |
| `css/portadas.css` (nuevo) | Sistema común `.hero-photo/.hp-frame/.hp-img/.hp-empty/.hp-deco` + 19 tratamientos. Solo CSS; sin dependencias ni recursos externos. |

Contratos preservados: IDs DOM existentes, `heroPhoto`, `UPDATE_INVITE`, `body.theme-<id>`, `?demo=<id>`, sobre, RSVP, idiomas, música. Todo texto dinámico entra por `textContent` / `safeUrl`.

Estado sin foto: marco temático con monograma (inicial de cada novio). Nunca se muestra una foto ficticia.
Fotos vertical / horizontal / cuadrada: `object-fit: cover` sin deformar. Si un rostro queda cortado, `heroPhotoFocus` (p. ej. `"50% 20%"`) ajusta el encuadre; **aún no hay control en el panel** para ello.

## 4. Dirección artística de la foto por plantilla

| # | Plantilla | Tratamiento |
|---|---|---|
| 01 | Olivo | Papel marfil con filete dorado y dos ramas de olivo SVG |
| 02 | Editorial | Fotografía en B/N de revista, sombra dura, etiqueta «Nº 01» |
| 03 | Flores | Óvalo con aro de papel y flores de cinco pétalos |
| 04 | Sobre | Tarjeta fotográfica de papelería con cinta, ligera rotación y relieve |
| 05 | Terracota | Arco de cerámica con anillo terracota y repisa de barro |
| 06 | Noche | Retrato con viñeta cálida, doble filete dorado y destellos |
| 07 | Gótico | Ventana ojival en gris con contorno plateado y sello carmesí |
| 08 | Alta Etiqueta | Marco de gala champán con rombos y filigrana |
| 09 | Galaxia | Panel holográfico con esquinas biseladas, escaneo y etiqueta |
| 10 | Ibiza | Forma orgánica, palmas y sol |
| 11 | Bridgerton | Camafeo oval con marco dorado cónico y flores azules |
| 12 | Amalfi | Marco de mayólica cobalto/limón con limones |
| 13 | Bodega | Etiqueta de vino «Gran Reserva» con sello de cobre |
| 14 | Viajeros | Carné de viajero guilloché con sello de aduana |
| 15 | Festival | Entrada VIP con muescas de ticket y degradado de atardecer |
| 16 | Harry Potter | Fotografía encantada sobre pergamino con cinta |
| 17 | Señor de los Anillos | Aro dorado con hojas de mallorn |
| 18 | Hollywood | Fotograma de película con perforaciones y estrella |
| 19 | Gamer | Pantalla de selección de personaje: HUD, barra y «READY» |

Todas son interpretaciones originales: sin logotipos, escudos, personajes ni recursos protegidos.

## 5. Pruebas realizadas (Chrome headless + Playwright)

- 19 plantillas × foto vertical a 390 px, 768 px y 1440 px: 0 desbordamiento, 0 errores de consola.
- 19 plantillas × foto cuadrada a 360 px: 0 desbordamiento.
- 19 plantillas × foto horizontal y × sin foto a 390 px: revisión visual; rostros visibles, estado vacío correcto.
- `catalogo.html`, `admin.html`, `novios.html`, `invitacion.html`: sin errores de consola.
- La foto se inyecta por el mismo canal que el panel (`UPDATE_INVITE` con data URL).
- Las fotos de prueba proceden de las imágenes de referencia y **no se incluyen** en el repositorio.

## 6. Pendiente (no hecho)

1. Catálogo premium (`catalogo.html`, `js/catalogo.js`, `css/catalogo.css`): tarjetas con identidad por plantilla.
2. Rediseño de secciones interiores (historia, cuenta atrás, itinerario, ubicación, galería, RSVP, cierre) por plantilla.
3. Sobres y lacres por plantilla; revisión del itinerario como pieza temática.
4. Control de encuadre (`heroPhotoFocus`) en el panel y prueba con subida real a Supabase.
5. Composición específica de escritorio (hoy la invitación es una columna centrada, como antes).
6. Prueba con navegadores reales (Safari iOS) y fotos de cámara reales.
7. Comparativas antes/después de las interiores.

## 7. Despliegue

Sin build. Subir los archivos modificados (`invitacion.html`, `js/invite.js`, `css/portadas.css`). Tras desplegar, vaciar caché de `/css/*` y `/js/*` (max-age 3600).
