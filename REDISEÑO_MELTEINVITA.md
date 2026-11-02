# REDISEÑO MELTEINVITA · Registro de trabajo

Rama: `redesign/melteinvita-premium-19-templates`
Estado: Fase 1 (foto en 19 portadas, versión con marcos) hecha y **en revisión**. Fase 1b: nueva dirección artística de portadas de página completa, aprobada solo a medias: Bridgerton, Ibiza, Hollywood y El Señor de los Anillos (v2). El resto de plantillas sigue con los marcos de la v1 hasta aprobar la v2.

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
| `js/invite.js` | `renderHeroPhoto(d)`: pinta `heroPhoto`, alterna `.is-empty` y admite `heroPhotoFocus` (opcional, `"x% y%"`, por defecto `50% 30%`). El fondo de portada ya no lo sustituye la foto. |
| `css/portadas.css` | Andamiaje común (`.hero-photo`, `.hp-frame`, `.hp-img`, `.hp-empty`, `.hp-deco`) + una composición por plantilla. Solo CSS, sin recursos externos (CSP: `img-src 'self' data:`). |

**Principio (v2):** la foto no va en un recuadro. Ocupa la portada y se funde con el fondo mediante máscaras y degradados; cada plantilla añade sus propias capas (papel, ola, cortinaje, billete, velas, arco de luz…) y la tipografía se apoya en la zona de transición, nunca sobre los rostros.

Contratos preservados: IDs DOM, `heroPhoto`, `UPDATE_INVITE`, `body.theme-<id>`, `?demo=<id>`, sobre, RSVP, idiomas, música. Todo texto dinámico entra por `textContent` / `safeUrl`.
Sin foto: cada portada muestra su composición con el monograma (inicial de cada novio). Nunca una foto ficticia.

## 4. Composición por plantilla

| # | Plantilla | Composición |
|---|---|---|
| 01 | Olivo | Foto a sangre fundida en papel de finca; ramas de olivo finas sobre el borde |
| 02 | Editorial | Portada de revista: foto desplazada a la derecha, fecha vertical, titular grande escalonado |
| 03 | Flores | Foto con bordes de acuarela difuminados; flores en las esquinas |
| 04 | Sobre | Borde de papel rasgado y lacre con iniciales |
| 05 | Terracota | Foto sobre arcos concéntricos de barro y arena |
| 06 | Noche | Guirnalda de luces cálidas y tipografía dorada en cursiva |
| 07 | Gótico | Foto desaturada, arbotantes finos y rosa carmesí |
| 08 | Alta Etiqueta | Filigrana de esquina y monograma de gala |
| 09 | Galaxia | Horizonte de planeta con luz de borde y estrellas |
| 10 | Ibiza | Foto con borde de ola, luz de verano y titular escalonado |
| 11 | Bridgerton | Papelería de sociedad: cabecera, foto con bordes de papel, nomeolvides |
| 12 | Amalfi | Foto sobre banda de mayólica; limones en la esquina |
| 13 | Bodega | Foto fundida en burdeos, rótulo vertical «Gran Reserva», sello de cobre |
| 14 | Viajeros | Foto + billete de embarque (perforación, muescas, código de barras) y sello de aduana |
| 15 | Festival | Hora dorada: sol, palmeras y guirnalda de luces |
| 16 | Magia | Noche estrellada, velas flotantes y castillo en silueta (original) |
| 17 | Señor de los Anillos | Arco de luz con inscripción decorativa y bruma verde |
| 18 | Hollywood | Foto casi a pantalla completa, cortinaje de teatro y focos suaves |
| 19 | Gamer | Luz cian/magenta en los bordes, rejilla suave y tres corazones pixelados |

Todas son interpretaciones originales: sin logotipos, escudos, personajes ni recursos protegidos.

## 5. Pruebas realizadas (Chrome headless + Playwright)

19 plantillas × {360 px foto cuadrada, 390 px vertical, 390 px horizontal, 390 px sin foto, 768 px, 1440 px}: 0 desbordamiento y 0 errores de consola en las 114 combinaciones. `catalogo.html`, `admin.html`, `novios.html` e `invitacion.html`: sin errores. La foto se inyecta por el mismo canal que el panel (`UPDATE_INVITE`). Las fotos de prueba son recortes de las imágenes de referencia y no están en el repositorio.

## 6. Pendiente

1. Catálogo premium (`catalogo.html`, `js/catalogo.js`, `css/catalogo.css`).
2. Rediseño de secciones interiores por plantilla (historia, cuenta atrás, itinerario, ubicación, galería, RSVP, cierre).
3. Sobres y lacres por plantilla.
4. Diferenciar más las portadas oscuras (06, 07, 08, 09, 16, 18, 19 comparten estructura «foto + fundido + texto»).
5. Control de encuadre (`heroPhotoFocus`) en el panel; prueba con subida real a Supabase y fotos de cámara reales.
6. Composición propia de escritorio (hoy columna central).
7. Prueba en Safari iOS.

## 7. Despliegue

Sin build. Subir `invitacion.html`, `js/invite.js` y `css/portadas.css`. Tras desplegar, vaciar caché de `/css/*` y `/js/*` (max-age 3600).

## Portadas oscuras · estructuras propias (BATCH3/BATCH4 en css/portadas.css)
- Noche: invertida (nombres arriba + guirnalda; foto emerge desde abajo con foco cálido).
- Gótico: corte diagonal, rosetón gigante de fondo, nombres en columna lateral.
- Alta Etiqueta: óvalo/arco muy suave con espacio negativo, filetes dobles de oro, nombres en una línea entre dos rayas, monograma arriba.
- Galaxia: nombres en perspectiva arriba, pareja sobre el horizonte del planeta, fecha bajo el horizonte.
- Magia: pareja arriba entre bruma, nombres flotando a media altura, castillo y velas abajo.
- Gamer: dos barras de luz cian/magenta, foto en dos temperaturas, un nombre bajo cada barra.
- Hollywood: sin cambios (referencia aprobada).
Trampa: para posicionar en absoluto los hijos de .hero-content hay que usar `.hero-content > .clase` (la regla base `> :not(.hero-photo)` fuerza position:relative).

## Fase 3 · escritorio, catálogo, panel, interiores y sobres
- **Escritorio (≥900px)**, bloque BATCH5 de `css/portadas.css`: la portada sale de la columna de 580px (`width:100vw`) y se divide: texto a la izquierda (44%) y foto a la derecha (56%) fundida con el fondo de cada plantilla. Los decorativos `.hp-d*` se ocultan; Gótico, Alta Etiqueta, Galaxia, Magia, Gamer y Viajeros tienen ajustes propios. Por debajo de 900px no cambia nada. Los interiores siguen en columna.
- **Catálogo**: cada tarjeta carga una miniatura viva de la portada (`invitacion.html?demo=<id>&thumb=1`) en un iframe escalado y diferido. `?thumb` oculta sobre, idioma, música y cookies, y sustituye el monograma por una pareja ilustrada (SVG propio) como foto de ejemplo.
- **Panel**: en la pestaña de fotos, tocar la miniatura de portada fija `heroPhotoFocus` ("x% y%"). Sin foco elegido, cada plantilla usa su encuadre propio.
- **Interiores**: costura portada→interior (`--seam` por plantilla, medido del borde inferior real de cada portada; `box-shadow` inset en `.hero + .section`, sin pseudo-elementos para no pisar el filete existente).
- **Sobres** (`css/sobres.css`): fondo, papel, solapa y lacre propios por plantilla. El aspecto completo se aplica cuando el color de lacre es el predeterminado de la plantilla; si el cliente elige otro color en el panel, se respeta su color y solo se mantiene la forma del sello.
- Trampa: en `.hero-content` no usar `position:absolute` en escritorio (pasa a ser el bloque contenedor de la foto y la encoge).

## Compatibilidad Safari / iOS (revisión sin dispositivo)
- Sin WebKit disponible en el entorno de pruebas, se revisó el CSS a mano: todas las máscaras llevan `-webkit-mask-image`; las de varias capas con intersección llevan `-webkit-mask-composite`; `clip-path` con prefijo; `background-clip:text` con `-webkit-`.
- Fallbacks añadidos: `100vh` antes de `100svh` (Safari < 15.4), `overflow-x:hidden` antes de `clip` (Safari < 16) y relleno proporcional para la miniatura del catálogo si no hay `aspect-ratio`.
- Pendiente de comprobar en un Safari real (Mac/iPad o servicio en la nube): foto de cámara grande, animación de velas (SMIL en imagen de fondo) y altura de portada con la barra del navegador.
