"""Recursos SVG originales para 08 · Garden Wedding — THE SECRET GARDEN.
Botánica a la acuarela (capas translúcidas con velo difuminado y nervio marfil):
olivo, eucalipto, helecho, jazmín, rosa de jardín y florecillas silvestres.
Cada composición usa una mezcla distinta de especies; nada se repite entre
secciones. Todo se incrusta como data URI (CSP: img-src 'self' data:)."""
import math, random

FOREST = '#405744'
DEEP = '#293F32'
SAGE = '#A7B49C'
PALE = '#DCE3D4'
IVORY = '#FAF8F1'
PAPER = '#FFFDF8'
BLUSH = '#D8B9AD'
ROSE = '#B98779'
BLUE = '#9DB1A3'      # eucalipto
OLIVE = '#7C8F74'


def r1(x):
    return ('%.1f' % x).rstrip('0').rstrip('.')


DEFS = ("<defs><filter id='w' x='-20%' y='-20%' width='140%' height='140%'><feGaussianBlur stdDeviation='.35'/></filter>"
        "<filter id='b' x='-40%' y='-40%' width='180%' height='180%'><feGaussianBlur stdDeviation='1.6'/></filter></defs>")


def svg(w, h, body, defs=True):
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {w} {h}'>"
            f"{DEFS if defs else ''}{body}</svg>")


# ------------------------------------------------------------------ geometría
def bez(p, t):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = p
    u = 1 - t
    x = u**3*x0 + 3*u*u*t*x1 + 3*u*t*t*x2 + t**3*x3
    y = u**3*y0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t**3*y3
    dx = 3*u*u*(x1-x0) + 6*u*t*(x2-x1) + 3*t*t*(x3-x2)
    dy = 3*u*u*(y1-y0) + 6*u*t*(y2-y1) + 3*t*t*(y3-y2)
    return x, y, math.degrees(math.atan2(dy, dx))


def stem(p, color=DEEP, w=1.5, op=.8):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = p
    return (f"<path d='M{r1(x0)},{r1(y0)} C{r1(x1)},{r1(y1)} {r1(x2)},{r1(y2)} {r1(x3)},{r1(y3)}' "
            f"fill='none' stroke='{color}' stroke-width='{w}' stroke-opacity='{op}' stroke-linecap='round'/>")


# ------------------------------------------------------------------ hojas
def leaf(x, y, ang, L, ratio, fill, op=.62, vein=True, veil=True):
    W = L * ratio
    d = (f"M0,0 C{r1(L*.25)},{r1(-W)} {r1(L*.72)},{r1(-W*.92)} {r1(L)},0 "
         f"C{r1(L*.72)},{r1(W*.92)} {r1(L*.25)},{r1(W)} 0,0Z")
    o = f"<g transform='translate({r1(x)} {r1(y)}) rotate({r1(ang)})'>"
    if veil:
        o += f"<path d='{d}' fill='{fill}' fill-opacity='{r1(op*.32)}' transform='scale(1.14 1.32)' filter='url(#b)'/>"
    o += f"<path d='{d}' fill='{fill}' fill-opacity='{op}' filter='url(#w)'/>"
    # mitad de luz: da el aire de acuarela (una cara más clara)
    o += (f"<path d='M0,0 C{r1(L*.25)},{r1(-W)} {r1(L*.72)},{r1(-W*.92)} {r1(L)},0 Z' fill='{IVORY}' fill-opacity='.2'/>")
    if vein:
        o += f"<path d='M{r1(L*.08)},0 H{r1(L*.86)}' stroke='{IVORY}' stroke-opacity='.55' stroke-width='.45' fill='none'/>"
    return o + "</g>"


def branch(p, rnd, n, L0, L1, ratio, cols, side=(1, -1), spread=(38, 62), tip=True, op=.8, alt=False, start=.08):
    """Rama con hojas alternas/opuestas a lo largo de una curva cúbica."""
    out = stem(p)
    for i in range(n):
        t = start + (1 - start) * i / max(1, n - 1)
        x, y, a = bez(p, t)
        L = (L0 + (L1 - L0) * t) * 1.55
        for k, s in enumerate(side):
            if alt and k == 1 and i % 2 == 0:
                continue
            ang = a + s * rnd.uniform(*spread)
            out += leaf(x, y, ang, L * rnd.uniform(.88, 1.1), ratio, rnd.choice(cols), op)
    if tip:
        x, y, a = bez(p, 1)
        out += leaf(x, y, a, L1 * 1.05, ratio, cols[0], op)
    return out


def olive(p, rnd, n=11, L0=18, L1=11):
    return branch(p, rnd, n, L0, L1, .24, [OLIVE, SAGE, FOREST, '#8FA085'], spread=(28, 50), op=.82)


def eucalyptus(p, rnd, n=9, L0=17, L1=9):
    """Hojas redondeadas en pares: el eucalipto 'silver dollar'."""
    out = stem(p, DEEP, 1.5, .75)
    for i in range(n):
        t = .1 + .9 * i / (n - 1)
        x, y, a = bez(p, t)
        L = (L0 + (L1 - L0) * t) * 1.5
        for s in (1, -1):
            ang = a + s * rnd.uniform(58, 80)
            out += leaf(x, y, ang, L * rnd.uniform(.9, 1.08), .52, rnd.choice([BLUE, '#B2C3B6', SAGE, '#88A090']), .82)
    x, y, a = bez(p, 1)
    out += leaf(x, y, a, L1 * 1.5, .55, BLUE, .82)
    return out


def fern(p, rnd, n=16, L=15):
    """Fronda: raquis con foliolos finos que decrecen hacia la punta."""
    out = stem(p, FOREST, 1.3, .85)
    for i in range(n):
        t = .06 + .94 * i / (n - 1)
        x, y, a = bez(p, t)
        l = L * 1.45 * (1 - .78 * t) * rnd.uniform(.92, 1.06)
        for s in (1, -1):
            out += leaf(x, y, a + s * (62 - 14 * t), l, .26, rnd.choice([FOREST, OLIVE, DEEP, '#6F876C']), .8, vein=False)
    x, y, a = bez(p, 1)
    return out + leaf(x, y, a, L * .24, .24, FOREST, .7, vein=False)


# ------------------------------------------------------------------ flores
def jasmine(x, y, s=1.0, rot=0, rnd=None):
    """Flor de jazmín: cinco pétalos largos marfil y centro amarillo verdoso."""
    rot = rot or 0
    s = s * 1.45
    pet = ''
    for k in range(5):
        a = rot + k * 72
        pet += (f"<ellipse cx='{r1(4.4*s)}' cy='0' rx='{r1(4.6*s)}' ry='{r1(2.2*s)}' fill='{PAPER}' fill-opacity='.95' "
                f"stroke='{PALE}' stroke-width='.4' transform='rotate({a})'/>")
    return (f"<g transform='translate({r1(x)} {r1(y)})'><circle r='{r1(7.4*s)}' fill='{PALE}' fill-opacity='.55' filter='url(#b)'/>"
            f"{pet}<circle r='{r1(1.5*s)}' fill='#D9D58A'/><circle r='{r1(.6*s)}' fill='#B3A94F'/></g>")


def bud(x, y, ang, s=1.0, col=BLUSH):
    return (f"<g transform='translate({r1(x)} {r1(y)}) rotate({r1(ang)})'><ellipse cx='{r1(3*s)}' cy='0' rx='{r1(3.2*s)}' ry='{r1(1.7*s)}' "
            f"fill='{col}' fill-opacity='.9'/><path d='M0,0 l{r1(-3*s)},{r1(1.4*s)}' stroke='{FOREST}' stroke-width='.6' fill='none'/></g>")


def rose(x, y, r=14, col=BLUSH, deep=ROSE, rnd=None):
    r = r * 1.35
    """Rosa de jardín: capas de pétalos redondeados y remolino central."""
    rnd = rnd or random.Random(1)
    o = f"<g transform='translate({r1(x)} {r1(y)}) rotate({r1(rnd.uniform(0, 70))})'>"
    o += f"<circle r='{r1(r*1.18)}' fill='{col}' fill-opacity='.38' filter='url(#b)'/>"
    for ring, (n, dist, rr, op, c) in enumerate([(7, .72, .5, .72, col), (6, .46, .44, .8, col), (5, .22, .36, .88, deep)]):
        for k in range(n):
            a = math.radians(k * 360 / n + ring * 21 + rnd.uniform(-6, 6))
            o += (f"<circle cx='{r1(math.cos(a)*r*dist)}' cy='{r1(math.sin(a)*r*dist)}' r='{r1(r*rr)}' fill='{c}' "
                  f"fill-opacity='{op}' stroke='{PAPER}' stroke-opacity='.55' stroke-width='.5' filter='url(#w)'/>")
    o += (f"<path d='M{r1(-r*.22)},{r1(r*.04)} q{r1(r*.2)},{r1(-r*.3)} {r1(r*.34)},{r1(-r*.02)} q{r1(-r*.06)},{r1(r*.26)} {r1(-r*.26)},{r1(r*.2)}' "
          f"fill='none' stroke='{deep}' stroke-opacity='.8' stroke-width='.6'/></g>")
    return o


def ranunculus(x, y, r=11, rnd=None):
    """Flor blanca de capas (peonía/ranúnculo): marfil con corazón verde."""
    return rose(x, y, r, PAPER, '#EBE3CF', rnd)


def wild(x, y, s=1.0, col=BLUSH):
    p = ''.join(f"<circle cx='{r1(math.cos(math.radians(a))*2.6*s)}' cy='{r1(math.sin(math.radians(a))*2.6*s)}' r='{r1(2*s)}' fill='{col}' fill-opacity='.9'/>" for a in range(0, 360, 72))
    return f"<g transform='translate({r1(x)} {r1(y)})'>{p}<circle r='{r1(1.2*s)}' fill='#C9A596'/></g>"


def dots(rnd, cx, cy, n, spread, col=BLUSH):
    """Racimo de florecillas diminutas (gypsophila / ruda)."""
    o = ''
    for _ in range(n):
        o += f"<circle cx='{r1(cx+rnd.uniform(-spread, spread))}' cy='{r1(cy+rnd.uniform(-spread, spread))}' r='{r1(rnd.uniform(.9, 1.9))}' fill='{col}' fill-opacity='{r1(rnd.uniform(.6, .95))}'/>"
    return o


def flowering_stem(p, rnd, n=9, size=1.0):
    """Rama de jazmín: tallo fino con flores y capullos alternos."""
    out = stem(p, FOREST, 1.3, .85)
    for i in range(n):
        t = .12 + .88 * i / (n - 1)
        x, y, a = bez(p, t)
        out += leaf(x, y, a + rnd.choice([-1, 1]) * 55, 12 * (1 - .35 * t) * size, .36, OLIVE, .8)
        if i % 2 == 0:
            out += jasmine(x + rnd.uniform(-3, 3), y + rnd.uniform(-3, 3), (1 - .28 * t) * size, rnd.uniform(0, 72))
        else:
            out += bud(x, y, a + rnd.choice([-1, 1]) * 40, size)
    return out


# ------------------------------------------------------------------ composiciones
def hero_top(seed=4):
    """Colgante superior derecho (360x330): eucalipto + olivo + jazmín + rosas."""
    rnd = random.Random(seed)
    o = ''
    o += fern([(372, -6), (326, 40), (276, 52), (236, 124)], rnd, 14, 17)
    o += eucalyptus([(380, 8), (330, 70), (292, 168), (262, 296)], rnd, 10, 19, 10)
    o += olive([(300, -8), (254, 22), (192, 28), (136, 86)], rnd, 12, 20, 11)
    o += flowering_stem([(352, 14), (338, 112), (360, 196), (330, 280)], rnd, 8, 1.15)
    o += rose(296, 108, 17, BLUSH, ROSE, rnd) + ranunculus(250, 62, 13, rnd) + rose(332, 178, 11, '#E3CDC2', ROSE, rnd)
    o += wild(224, 112, .9) + wild(280, 238, .8, '#E6D6C8') + dots(rnd, 214, 40, 9, 16)
    return svg(360, 330, o)


def hero_bottom(seed=9):
    """Pie de portada, esquina inferior izquierda (360x260): helecho + olivo + flores silvestres."""
    rnd = random.Random(seed)
    o = ''
    o += fern([(-8, 268), (40, 214), (98, 190), (176, 196)], rnd, 17, 19)
    o += olive([(-6, 232), (50, 190), (60, 120), (118, 68)], rnd, 12, 20, 11)
    o += eucalyptus([(8, 276), (80, 240), (160, 232), (236, 252)], rnd, 8, 17, 9)
    o += flowering_stem([(18, 250), (40, 170), (22, 110), (62, 40)], rnd, 8, 1.1)
    o += ranunculus(104, 212, 14, rnd) + rose(68, 152, 12, BLUSH, ROSE, rnd)
    o += wild(150, 222, .8) + dots(rnd, 118, 150, 8, 14, '#E3D0C4')
    return svg(360, 260, o)


def spray_left(seed=21):
    """Rama vertical para flanquear el escritorio (200x520): olivo + jazmín."""
    rnd = random.Random(seed)
    o = ''
    o += olive([(-6, -6), (70, 130), (30, 300), (96, 510)], rnd, 18, 24, 12)
    o += flowering_stem([(10, 40), (88, 150), (50, 290), (120, 420)], rnd, 10, 1.2)
    o += eucalyptus([(-6, 120), (60, 210), (30, 340), (74, 450)], rnd, 10, 20, 10)
    o += ranunculus(70, 190, 13, rnd) + rose(52, 330, 12, BLUSH, ROSE, rnd) + dots(rnd, 100, 270, 8, 16)
    return svg(200, 520, o)


def sprig_olive(seed=3, w=170, h=34):
    rnd = random.Random(seed)
    o = olive([(4, h*.7), (w*.3, h*.2), (w*.62, h*.9), (w-4, h*.34)], rnd, 12, 15, 9)
    return svg(w, h, o)


def sprig_jasmine(seed=5, w=170, h=40):
    rnd = random.Random(seed)
    o = flowering_stem([(6, h*.6), (w*.3, h*.1), (w*.62, h*.95), (w-6, h*.4)], rnd, 8, .95)
    return svg(w, h, o)


def sprig_fern(seed=7, w=170, h=34):
    rnd = random.Random(seed)
    o = fern([(6, h*.5), (w*.3, h*.9), (w*.62, h*.1), (w-6, h*.55)], rnd, 14, 12)
    return svg(w, h, o)


def sprig_euc(seed=8, w=170, h=36):
    rnd = random.Random(seed)
    o = eucalyptus([(6, h*.55), (w*.3, h*.05), (w*.64, h*.95), (w-6, h*.4)], rnd, 8, 14, 8)
    o += rose(w*.5, h*.5, 6, BLUSH, ROSE, rnd)
    return svg(w, h, o)


def corner_leaf(seed=12, w=150, h=150):
    """Esquina discreta para tarjetas (arriba izquierda)."""
    rnd = random.Random(seed)
    o = fern([(-4, 150), (22, 90), (62, 52), (140, 8)], rnd, 12, 15)
    o += jasmine(38, 76, .9, 20) + bud(58, 52, -30, .8) + wild(24, 122, .6)
    return svg(w, h, o)


def footer_big(seed=31):
    """Cierre de libro botánico (600x300): ramas que brotan desde abajo."""
    rnd = random.Random(seed)
    o = ''
    o += fern([(-10, 306), (110, 230), (230, 220), (330, 250)], rnd, 13, 22)
    o += fern([(610, 306), (500, 226), (390, 214), (300, 250)], rnd, 13, 22)
    o += olive([(70, 310), (110, 190), (66, 100), (130, 12)], rnd, 9, 24, 12)
    o += olive([(530, 310), (490, 186), (536, 96), (472, 10)], rnd, 9, 24, 12)
    o += eucalyptus([(210, 310), (240, 220), (200, 150), (250, 84)], rnd, 7, 21, 10)
    o += eucalyptus([(392, 310), (362, 220), (402, 150), (352, 84)], rnd, 7, 21, 10)
    o += flowering_stem([(150, 306), (176, 200), (146, 130), (176, 60)], rnd, 6, 1.2)
    o += flowering_stem([(450, 306), (424, 198), (454, 126), (426, 56)], rnd, 6, 1.2)
    o += rose(300, 262, 22, BLUSH, ROSE, rnd) + ranunculus(250, 244, 15, rnd) + ranunculus(350, 246, 15, rnd)
    o += rose(196, 226, 12, '#E3CDC2', ROSE, rnd) + rose(404, 228, 12, '#E3CDC2', ROSE, rnd)
    o += dots(rnd, 300, 218, 10, 40) + wild(262, 214, .8) + wild(338, 212, .8, '#E6D6C8')
    return svg(600, 300, o)


def envelope_liner(seed=17):
    """Forro botánico del sobre (320x200, pensado como patrón tenue)."""
    rnd = random.Random(seed)
    o = olive([(-6, 200), (90, 120), (140, 60), (210, 12)], rnd, 9, 22, 11)
    o += olive([(326, 200), (240, 130), (190, 70), (130, 20)], rnd, 9, 22, 11)
    o += flowering_stem([(160, 204), (150, 140), (172, 90), (160, 30)], rnd, 6, 1.1)
    o += ranunculus(160, 112, 12, rnd) + wild(120, 130, .7) + wild(204, 120, .7)
    return svg(320, 200, o)


def seal_mark(color='#EDF0E4'):
    """Rama de olivo en círculo para el lacre (64x64)."""
    o = f"<circle cx='32' cy='32' r='25' fill='none' stroke='{color}' stroke-width='.8' stroke-opacity='.8'/>"
    o += f"<circle cx='32' cy='32' r='22.5' fill='none' stroke='{color}' stroke-width='.4' stroke-opacity='.7'/>"
    o += f"<path d='M32,52 V16' stroke='{color}' stroke-width='.9' stroke-opacity='.9' fill='none'/>"
    for i, y in enumerate((46, 40, 34, 28, 22)):
        L = 9 - i * .6
        for s in (1, -1):
            o += (f"<path d='M32,{y} q{r1(s*L*.5)},{r1(-L*.55)} {r1(s*L)},{r1(-L*.35)} q{r1(-s*L*.4)},{r1(L*.5)} {r1(-s*L)},{r1(L*.35)}Z' "
                  f"fill='{color}' fill-opacity='.85'/>")
    o += f"<ellipse cx='32' cy='14.5' rx='2' ry='3.4' fill='{color}' fill-opacity='.9'/>"
    return svg(64, 64, o, False)


# ------------------------------------------------------------------ iconos (trazo fino)
def _icon(body, color, w=48):
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {w} {w}' fill='none' stroke='{color}' "
            f"stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'>{body}</svg>")


def icon_pin(c=FOREST):
    return _icon("<path d='M24 42 C15 31 11 25.5 11 19.5 A13 13 0 0 1 37 19.5 C37 25.5 33 31 24 42Z'/><path d='M24 14.5 q4.5 1.2 4.5 5.2 q-4 .9 -4.500 -5.2z M24 14.5 q-4.5 1.2 -4.5 5.2 q4 .9 4.5 -5.2z'/>", c)


def icon_dress(c=FOREST):
    return _icon("<path d='M24 8 c0 -2.2 3.2 -2.5 3.2 -.2 c0 1.600 -3.200 2.300 -3.200 4.700 V15'/><path d='M24 15 L6 29 a2.500 2.500 0 0 0 1.500 4.500 H40.500 A2.500 2.500 0 0 0 42 29 Z'/><path d='M12 38 H36'/>", c)


def icon_gift(c=FOREST):
    return _icon("<rect x='8' y='20' width='32' height='20' rx='1'/><path d='M6 14 H42 V20 H6Z M24 14 V40'/><path d='M24 14 c-3 -7 -10 -7 -10 -3 c0 3 6 3 10 3 c4 0 10 0 10 -3 c0 -4 -7 -4 -10 3'/>", c)


def icon_bus(c=FOREST):
    return _icon("<rect x='9' y='9' width='30' height='27' rx='4'/><path d='M9 24 H39 M9 17 H39'/><circle cx='16' cy='30' r='1.3'/><circle cx='32' cy='30' r='1.3'/><path d='M14 36 V41 M34 36 V41'/>", c)


def icon_check(c=FOREST):
    return _icon("<circle cx='24' cy='24' r='19'/><path d='M15.500 24.500 l6 6 l11 -12.500'/>", c)


def icon_alert(c='#B98779'):
    return _icon("<circle cx='24' cy='24' r='19'/><path d='M24 14 V26 M24 31.500 V32'/>", c)


def icon_glass(c=FOREST):
    return _icon("<path d='M17 8 H31 C32 20 29 25 24 26 C19 25 16 20 17 8Z M24 26 V39 M17 40 H31 M17.500 15 H30.500'/>", c)


def grain(opacity=.5):
    """Textura de papel de algodón muy sutil (no cuadriculada)."""
    return ("<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'>"
            "<feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' seed='4' stitchTiles='stitch'/>"
            "<feColorMatrix values='0 0 0 0 .25  0 0 0 0 .3  0 0 0 0 .22  0 0 0 " + str(opacity * 1.6) + " 0'/></filter>"
            "<rect width='100%' height='100%' filter='url(#n)'/></svg>")


def arrow(color='#405744'):
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8' fill='none' stroke='{color}' stroke-width='1.3' "
            "stroke-linecap='round' stroke-linejoin='round'><path d='M1 1.500 L6 6.500 L11 1.500'/></svg>")


def tick(color='#FFFDF8'):
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none' stroke='{color}' stroke-width='1.6' "
            "stroke-linecap='round' stroke-linejoin='round'><path d='M2.200 6.400 4.800 9 9.800 3.200'/></svg>")
