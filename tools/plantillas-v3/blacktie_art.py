"""Recursos SVG originales para 07 · Black Tie — THE GRAND EVENING.
Lenguaje: Art Déco contemporáneo (líneas finas, chaflanes, rombos, abanico).
Sin botánica ni ornamentos barrocos. Todo se incrusta como data URI."""
import math

GOLD = '#C4A66A'       # oro champagne (sobre negro)
GOLD_OLD = '#9C8050'   # oro envejecido
GOLD_INK = '#7B6333'   # oro oscuro para sobre marfil (contraste AA)
BLACK = '#101012'


def r1(x):
    return ('%.1f' % x).rstrip('0').rstrip('.')


def svg(w, h, body, extra=''):
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {w} {h}' fill='none' "
            f"stroke-linecap='square' stroke-linejoin='miter' {extra}>{body}</svg>")


# ------------------------------------------------------------------ esquinas
def corner(color=GOLD, fx=False, fy=False):
    """Esquina escalonada con chaflán y rombo (56x56)."""
    body = (f"<g stroke='{color}' stroke-width='1'>"
            "<path d='M.5,56 V16.5 L16.5,.5 H56'/>"
            "<path d='M7.5,56 V20 L20,7.5 H56' stroke-opacity='.45'/>"
            "<path d='M16.5,11.5 L21.5,16.5 L16.5,21.5 L11.5,16.5Z' fill='" + color + "' stroke='none'/>"
            "</g>")
    t = 'matrix(%d 0 0 %d %d %d)' % (-1 if fx else 1, -1 if fy else 1, 56 if fx else 0, 56 if fy else 0)
    return svg(56, 56, f"<g transform='{t}'>{body}</g>")


# ------------------------------------------------------------------ monograma
def badge(color=GOLD):
    """Marco de rombo para el monograma (150x92). El texto lo pone el CSS."""
    return svg(150, 92, (
        f"<g stroke='{color}' stroke-width='1'>"
        "<path d='M75,2 L123,46 L75,90 L27,46Z'/>"
        "<path d='M75,9 L114,46 L75,83 L36,46Z' stroke-opacity='.45'/>"
        "<path d='M0,46 H20 M130,46 H150'/>"
        f"<path d='M24,42 L28,46 L24,50 L20,46Z M126,42 L130,46 L126,50 L122,46Z' fill='{color}' stroke='none'/>"
        "</g>"))


def fan(color=GOLD, inline=False):
    """Abanico Art Déco: rayos y arcos concéntricos (360x156)."""
    cx, cy = 180, 152
    parts = [f"<g stroke='{color}' stroke-width='.9'>"]
    for i in range(0, 25):
        a = math.pi + math.pi * i / 24
        r0, r1_ = 30, (142 if i % 2 == 0 else 118)
        parts.append(f"<path d='M{r1(cx + math.cos(a) * r0)},{r1(cy + math.sin(a) * r0)} "
                     f"L{r1(cx + math.cos(a) * r1_)},{r1(cy + math.sin(a) * r1_)}' stroke-opacity='.62'/>")
    for r, o in ((30, .95), (62, .7), (96, .55), (126, .45), (146, .8)):
        parts.append(f"<path d='M{cx - r},{cy} A{r},{r} 0 0 1 {cx + r},{cy}' stroke-opacity='{o}'/>")
    parts.append(f"<path d='M14,{cy} H346'/><path d='M60,{cy + 4} H300' stroke-opacity='.4'/>")
    parts.append(f"<path d='M{cx},4 L{cx + 6},10 L{cx},16 L{cx - 6},10Z' fill='{color}' stroke='none'/>")
    parts.append("</g>")
    return svg(360, 158, ''.join(parts))


def keyline(color=GOLD):
    """Filete que sigue el corte achaflanado de la fotografía (se estira al contenedor)."""
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none' fill='none'>"
            f"<polygon points='0,0 91,0 100,7.2 100,100 9,100 0,92.8' stroke='{color}' stroke-width='1' "
            f"vector-effect='non-scaling-stroke' stroke-opacity='.8'/></svg>")


# ------------------------------------------------------------------ separadores
def div_diamond(color=GOLD):
    return svg(200, 16, (f"<g stroke='{color}' stroke-width='1'><path d='M0,8 H82 M118,8 H200'/>"
                         "<path d='M100,1.5 L106.5,8 L100,14.5 L93.5,8Z'/></g>"
                         f"<path d='M100,5.5 L102.5,8 L100,10.5 L97.5,8Z' fill='{color}'/>"))


def div_steps(color=GOLD):
    return svg(120, 14, (f"<g stroke='{color}' stroke-width='1'><path d='M10,1.5 H110'/><path d='M30,7 H90'/>"
                         "<path d='M48,12.5 H72'/></g>"))


def div_triple(color=GOLD):
    return svg(200, 16, (f"<g stroke='{color}' stroke-width='1'><path d='M0,8 H70 M130,8 H200'/></g>"
                         f"<g fill='{color}'><path d='M80,4 L84,8 L80,12 L76,8Z'/><path d='M100,2 L106,8 L100,14 L94,8Z'/>"
                         "<path d='M120,4 L124,8 L120,12 L116,8Z'/></g>"))


def div_zig(color=GOLD):
    return svg(200, 16, (f"<g stroke='{color}' stroke-width='1'><path d='M0,8 H72 L80,2 L90,14 L100,2 L110,14 L120,2 L128,8 H200'/></g>"))


# ------------------------------------------------------------------ iconos (línea fina, geométricos)
def _icon(body, color):
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' fill='none' stroke='{color}' "
            f"stroke-width='1.2' stroke-linecap='square' stroke-linejoin='miter'>{body}</svg>")


def icon_pin(c=GOLD):
    return _icon("<path d='M24 43 L11 24 A14 14 0 1 1 37 24 Z'/><path d='M24 14.5 L29.5 20 L24 25.5 L18.5 20Z'/>", c)


def icon_bowtie(c=GOLD):
    return _icon("<path d='M5 17 L20 24 L5 31Z M43 17 L28 24 L43 31Z'/><path d='M20 19 H28 V29 H20Z'/>"
                 "<path d='M24 5 V13 M24 35 V43' stroke-opacity='.55'/>", c)


def icon_bus(c=GOLD):
    return _icon("<path d='M9 14 L14 8 H34 L39 14 V36 H9Z'/><path d='M9 22 H39 M9 15 H39'/>"
                 "<path d='M15 36 V41 M33 36 V41 M16 29 H18 M30 29 H32'/>", c)


def icon_gift(c=GOLD):
    return _icon("<path d='M9 21 H39 V41 H9Z'/><path d='M7 14 H41 V21 H7Z'/><path d='M24 14 V41'/>"
                 "<path d='M24 14 L15 7 V14 M24 14 L33 7 V14'/>", c)


def icon_check(c=GOLD_INK):
    return _icon("<path d='M24 3 L45 24 L24 45 L3 24Z'/><path d='M15 24.5 L21.5 31 L33.5 17.5' stroke-width='1.6'/>", c)


def icon_alert(c='#8A3535'):
    return _icon("<path d='M24 3 L45 24 L24 45 L3 24Z'/><path d='M24 14 V27 M24 32.5 V33.5' stroke-width='1.8'/>", c)


# ------------------------------------------------------------------ texturas
def grain(dark=True):
    """Grano fino en mosaico: papel negro mate / papel de algodón marfil."""
    col = '1 .9 .75' if dark else '.2 .17 .12'
    r, g, b = col.split()
    op = '.16' if dark else '.09'
    return (f"<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>"
            f"<filter id='n' x='0' y='0' width='100%' height='100%'>"
            f"<feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' seed='3' stitchTiles='stitch'/>"
            f"<feColorMatrix values='0 0 0 0 {r}  0 0 0 0 {g}  0 0 0 0 {b}  0 0 0 {op} 0'/></filter>"
            f"<rect width='100%' height='100%' filter='url(#n)'/></svg>")


# ------------------------------------------------------------------ pequeños recursos
def arrow(color):
    """Flecha de los <select>."""
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8' fill='none' stroke='{color}' "
            "stroke-width='1.2' stroke-linecap='square'><path d='M1 1.5 6 6.5 11 1.5'/></svg>")


def diamond(color=GOLD):
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10' fill='none' stroke='{color}' stroke-width='1'>"
            "<path d='M5,.8 L9.2,5 L5,9.2 L.8,5Z'/></svg>")


def seal_mark(color='#6F5A2E'):
    """Doble rombo concéntrico para el sello del sobre."""
    return svg(64, 64, (f"<g stroke='{color}' stroke-width='1' stroke-opacity='.8'><path d='M32,5 L59,32 L32,59 L5,32Z'/>"
                        "<path d='M32,11 L53,32 L32,53 L11,32Z' stroke-opacity='.5'/></g>"))
