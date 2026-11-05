"""Ilustraciones SVG originales para 06 · French Romance.
Todo es vectorial y se incrusta como data URI (CSP: img-src 'self' data:).
Estilo: acuarela suave (capas translúcidas + borde irregular) y filete dorado
envejecido como estampación."""
import math
import random

ROSE = '#D8B9B4'      # rosa antiguo
ROSE_D = '#C49991'
ROSE_DD = '#A97A74'
POWDER = '#E9D8D3'    # rosa empolvado
BLUSH = '#EBCFC6'
PEACH = '#E4C2AE'
PEACH_D = '#CFA088'
IVORY = '#F8F4EC'
CREAM = '#F1E6D3'
SAGE = '#A4AA91'
SAGE_L = '#BFC4AE'
OLIVE = '#777C63'
GOLD = '#B39A70'
GOLD_L = '#CDB993'
INK = '#62564F'


def r1(x):
    return ('%.1f' % x).rstrip('0').rstrip('.') if abs(x) >= .05 else '0'


def bez(p, t):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = p
    mt = 1 - t
    x = mt**3*x0 + 3*mt*mt*t*x1 + 3*mt*t*t*x2 + t**3*x3
    y = mt**3*y0 + 3*mt*mt*t*y1 + 3*mt*t*t*y2 + t**3*y3
    dx = 3*mt*mt*(x1-x0) + 6*mt*t*(x2-x1) + 3*t*t*(x3-x2)
    dy = 3*mt*mt*(y1-y0) + 6*mt*t*(y2-y1) + 3*t*t*(y3-y2)
    return x, y, math.degrees(math.atan2(dy, dx))


DEFS = ("<defs>"
        "<filter id='wc' x='-25%' y='-25%' width='150%' height='150%'>"
        "<feTurbulence type='fractalNoise' baseFrequency='.07' numOctaves='2' seed='4' result='n'/>"
        "<feDisplacementMap in='SourceGraphic' in2='n' scale='2.4'/>"
        "<feGaussianBlur stdDeviation='.28'/></filter>"
        "<filter id='soft' x='-60%' y='-60%' width='220%' height='220%'><feGaussianBlur stdDeviation='2.2'/></filter>"
        "</defs>")


def svg(w, h, body, extra=''):
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {w} {h}' {extra}>"
            f"{DEFS}{body}</svg>")


# ------------------------------------------------------------------ piezas
def leaf(x, y, ang, L, W, fill, op=.7, vein=True, wash=False):
    d = (f"M0,0 C{r1(L*.25)},{r1(-W)} {r1(L*.72)},{r1(-W)} {r1(L)},0 "
         f"C{r1(L*.72)},{r1(W)} {r1(L*.25)},{r1(W)} 0,0Z")
    o = f"<g transform='translate({r1(x)} {r1(y)}) rotate({r1(ang)})'>"
    o += f"<path d='{d}' fill='{fill}' fill-opacity='{op}'/>"
    if vein:
        o += f"<path d='M{r1(L*.1)},0 H{r1(L*.86)}' stroke='{IVORY}' stroke-opacity='.55' stroke-width='.45' fill='none'/>"
    return o + "</g>"


def rose(cx, cy, R, base=ROSE, mid=ROSE_D, dark=ROSE_DD, rot=0, seed=1):
    """Rosa de acuarela: halo, pétalos exteriores, anillo medio y espiral."""
    rnd = random.Random(seed)
    g = [f"<g transform='translate({r1(cx)} {r1(cy)}) rotate({r1(rot)})'>"]
    g.append(f"<circle r='{r1(R*1.08)}' fill='{mid}' fill-opacity='.30' filter='url(#soft)'/>")
    g.append("<g filter='url(#wc)'>")
    n = 6
    for i in range(n):
        a = i * 360 / n + rnd.uniform(-9, 9)
        px = math.cos(math.radians(a)) * R * .44
        py = math.sin(math.radians(a)) * R * .44
        g.append(f"<ellipse cx='{r1(px)}' cy='{r1(py)}' rx='{r1(R*.62)}' ry='{r1(R*.48)}' "
                 f"transform='rotate({r1(a)} {r1(px)} {r1(py)})' fill='{base}' fill-opacity='.8' "
                 f"stroke='{mid}' stroke-opacity='.5' stroke-width='.55'/>")
    for i in range(5):
        a = i * 72 + 20 + rnd.uniform(-10, 10)
        px = math.cos(math.radians(a)) * R * .27
        py = math.sin(math.radians(a)) * R * .27
        g.append(f"<ellipse cx='{r1(px)}' cy='{r1(py)}' rx='{r1(R*.42)}' ry='{r1(R*.34)}' "
                 f"transform='rotate({r1(a)} {r1(px)} {r1(py)})' fill='{mid}' fill-opacity='.62' "
                 f"stroke='{dark}' stroke-opacity='.38' stroke-width='.5'/>")
    g.append("</g>")
    # espiral del corazón
    r = R * .3
    g.append(f"<path d='M{r1(-r)},{r1(r*.1)} a{r1(r)},{r1(r)} 0 1 1 {r1(r*1.3)},{r1(-r*.7)} "
             f"a{r1(r*.6)},{r1(r*.6)} 0 1 1 {r1(-r*.9)},{r1(r*.55)}' fill='none' stroke='{dark}' "
             f"stroke-opacity='.6' stroke-width='.65' stroke-linecap='round'/>")
    g.append(f"<circle r='{r1(R*.1)}' fill='{dark}' fill-opacity='.55'/>")
    # pétalo exterior con luz
    g.append(f"<path d='M{r1(-R*.8)},{r1(-R*.1)} a{r1(R*.85)},{r1(R*.85)} 0 0 1 {r1(R*.7)},{r1(-R*.62)}' "
             f"fill='none' stroke='{IVORY}' stroke-opacity='.6' stroke-width='.8' stroke-linecap='round'/>")
    g.append("</g>")
    return ''.join(g)


def daisy(cx, cy, r, col=IVORY, edge=ROSE_D, rot=0):
    g = [f"<g transform='translate({r1(cx)} {r1(cy)}) rotate({r1(rot)})' filter='url(#wc)'>"]
    for i in range(6):
        a = i * 60
        g.append(f"<ellipse cx='{r1(r*.55)}' cy='0' rx='{r1(r*.55)}' ry='{r1(r*.3)}' transform='rotate({a})' "
                 f"fill='{col}' fill-opacity='.92' stroke='{edge}' stroke-opacity='.5' stroke-width='.5'/>")
    g.append(f"<circle r='{r1(r*.2)}' fill='{GOLD}' fill-opacity='.95'/></g>")
    return ''.join(g)


def bud(cx, cy, s=1, rot=0, col=ROSE, edge=ROSE_D):
    return (f"<g transform='translate({r1(cx)} {r1(cy)}) rotate({r1(rot)}) scale({r1(s)})' filter='url(#wc)'>"
            f"<path d='M0,0 C-5,-3 -5,-10 0,-14 C5,-10 5,-3 0,0Z' fill='{col}' fill-opacity='.85' stroke='{edge}' stroke-opacity='.5' stroke-width='.6'/>"
            f"<path d='M0,-1 C-3,-5 -2,-9 0,-12' fill='none' stroke='{edge}' stroke-opacity='.6' stroke-width='.5'/>"
            f"<path d='M-4,-2 C-7,-5 -6,-8 -3,-9 M4,-2 C7,-5 6,-8 3,-9' fill='none' stroke='{OLIVE}' stroke-opacity='.6' stroke-width='.6'/></g>")


def berries(cx, cy, rot=0, s=1):
    pts = [(0, 0), (6, -4), (11, 2), (4, 6), (13, -7)]
    g = [f"<g transform='translate({r1(cx)} {r1(cy)}) rotate({r1(rot)}) scale({r1(s)})'>",
         f"<path d='M-8,8 C-2,4 4,0 10,-8' stroke='{OLIVE}' stroke-opacity='.6' stroke-width='.7' fill='none'/>"]
    for x, y in pts:
        g.append(f"<circle cx='{x}' cy='{y}' r='2.3' fill='{ROSE_DD}' fill-opacity='.75'/>"
                 f"<circle cx='{x-.7}' cy='{y-.7}' r='.7' fill='{IVORY}' fill-opacity='.7'/>")
    g.append("</g>")
    return ''.join(g)


def specks(rnd, area, n, col=GOLD, rmax=1.3):
    x0, y0, x1, y1 = area
    return ''.join(
        f"<circle cx='{r1(rnd.uniform(x0, x1))}' cy='{r1(rnd.uniform(y0, y1))}' r='{r1(rnd.uniform(.4, rmax))}' "
        f"fill='{col}' fill-opacity='{r1(rnd.uniform(.5, .9))}'/>" for _ in range(n))


def foliage(P, n, rnd, L0=26, spread=40, pal=None, taper=.4, both=True, stem=True, sw=1.0):
    pal = pal or [(OLIVE, .6), (SAGE, .72), (SAGE_L, .75), (OLIVE, .5)]
    out = []
    if stem:
        d = f"M{r1(P[0][0])},{r1(P[0][1])} C{r1(P[1][0])},{r1(P[1][1])} {r1(P[2][0])},{r1(P[2][1])} {r1(P[3][0])},{r1(P[3][1])}"
        out.append(f"<path d='{d}' fill='none' stroke='{OLIVE}' stroke-opacity='.65' stroke-width='{sw}' stroke-linecap='round'/>")
    for i in range(n):
        t = .06 + .92 * i / max(1, n - 1)
        x, y, a = bez(P, t)
        tp = 1 - taper * t
        for side in ((1, -1) if both else (1 if i % 2 == 0 else -1,)):
            if side == -1 and both and rnd.random() < .35:
                continue
            L = (L0 + rnd.uniform(-5, 7)) * tp * (1 if side == 1 else .78)
            f, o = pal[rnd.randrange(len(pal))]
            out.append(leaf(x, y, a + side * (spread + rnd.uniform(-9, 9)), L, L * (.2 + rnd.uniform(0, .05)), f, o,
                            wash=rnd.random() < .3))
    x, y, a = bez(P, 1)
    out.append(leaf(x, y, a, L0 * .8, L0 * .17, OLIVE, .6))
    return "<g filter='url(#wc)'>" + ''.join(out) + "</g>"


def gold_arc(d, w=1.1, op=1, dash=None):
    ds = f" stroke-dasharray='{dash}'" if dash else ''
    return f"<path d='{d}' fill='none' stroke='{GOLD}' stroke-opacity='{op}' stroke-width='{w}' stroke-linecap='round'{ds}/>"


# ------------------------------------------------------------------ ESQUINA DE PORTADA
def hero_corner(fx=False, fy=False, size=170):
    """Esquina floral (origen arriba-izquierda). Dos filetes dorados curvos, rosas, follaje."""
    rnd = random.Random(21)
    b = []
    # filetes dorados curvos que continúan el marco
    b.append(gold_arc('M3,168 C3,70 70,3 168,3', 1.1, .9))
    b.append(gold_arc('M11,150 C11,76 76,11 150,11', .7, .55))
    # follaje: dos ramas largas siguiendo los bordes
    b.append(foliage([(8, 18), (60, 6), (110, 22), (160, 18)], 11, rnd, 24, 42))
    b.append(foliage([(18, 8), (6, 60), (22, 108), (16, 162)], 11, rnd, 23, 42))
    # rama diagonal interior
    b.append(foliage([(30, 30), (60, 52), (80, 80), (112, 104)], 7, rnd, 20, 46, both=True))
    # flores
    b.append(rose(44, 44, 25, ROSE, ROSE_D, ROSE_DD, rot=15, seed=3))
    b.append(rose(96, 24, 16, IVORY, '#E6D9C4', '#C7B493', rot=-20, seed=5))
    b.append(rose(24, 98, 15, PEACH, PEACH_D, '#B47C66', rot=40, seed=8))
    b.append(rose(78, 70, 11, BLUSH, ROSE, ROSE_D, rot=70, seed=9))
    b.append(daisy(130, 34, 7, IVORY, ROSE_D, 10))
    b.append(daisy(30, 138, 6.5, IVORY, ROSE_D, 30))
    b.append(bud(66, 14, .9, 80))
    b.append(bud(13, 70, .85, 190, PEACH, PEACH_D))
    b.append(berries(112, 16, -10, .9))
    b.append(berries(14, 122, 80, .9))
    b.append(specks(rnd, (6, 6, 150, 150), 22, GOLD, 1.5))
    s = size / 170
    body = ''.join(b)
    t = 'matrix(%d 0 0 %d %d %d)' % (-1 if fx else 1, -1 if fy else 1, 170 if fx else 0, 170 if fy else 0)
    return svg(170, 170, f"<g transform='{t}'>{body}</g>")


# ------------------------------------------------------------------ EMBLEMA CENTRAL
def crest():
    """Corona de laurel abierta, dos alianzas entrelazadas y una rosa."""
    rnd = random.Random(5)
    b = []
    for sx in (1, -1):
        def X(x):
            return 110 + sx * x
        P = [(X(2), 112), (X(34), 108), (X(70), 80), (X(74), 36)]
        pts = [(X(2), 112), (X(34), 108), (X(70), 80), (X(74), 36)]
        b.append(foliage(pts, 9, rnd, 15, 52, taper=.35, sw=.9))
        P2 = [(X(74), 36), (X(78), 22), (X(66), 8), (X(48), 4)]
        b.append(foliage(P2, 5, rnd, 11, 50, taper=.2, sw=.8))
    # filete dorado de la elipse
    b.append(gold_arc('M110,6 C168,6 190,44 190,66 C190,96 150,118 110,118 C70,118 30,96 30,66 C30,44 52,6 110,6', .5, .35, '1 3'))
    # alianzas
    b.append(f"<circle cx='96' cy='60' r='17' fill='none' stroke='{GOLD}' stroke-width='1.4'/>"
             f"<circle cx='124' cy='60' r='17' fill='none' stroke='{GOLD}' stroke-width='1.4'/>"
             f"<path d='M110,47.6 A17,17 0 0 1 110,72.4' fill='none' stroke='{GOLD_L}' stroke-width='3.4' stroke-opacity='.0'/>"
             f"<path d='M110,47.6 A17,17 0 0 0 110,72.4' fill='none' stroke='{GOLD}' stroke-width='1.4'/>")
    b.append(f"<circle cx='96' cy='60' r='13.6' fill='none' stroke='{GOLD_L}' stroke-width='.5' stroke-opacity='.8'/>"
             f"<circle cx='124' cy='60' r='13.6' fill='none' stroke='{GOLD_L}' stroke-width='.5' stroke-opacity='.8'/>")
    # rosa pequeña en la base y brotes
    b.append(rose(110, 108, 11, ROSE, ROSE_D, ROSE_DD, rot=10, seed=2))
    b.append(bud(110, 8, .8, 0))
    b.append(daisy(40, 94, 4.6, IVORY, ROSE_D))
    b.append(daisy(180, 94, 4.6, IVORY, ROSE_D, 20))
    b.append(specks(rnd, (30, 6, 190, 118), 14, GOLD, 1.2))
    return svg(220, 124, ''.join(b))


# ------------------------------------------------------------------ SEPARADORES
def div_laurel():
    """Rama doble con rombo central."""
    rnd = random.Random(31)
    b = []
    for sx in (1, -1):
        def X(x):
            return 130 + sx * x
        b.append(foliage([(X(10), 17), (X(40), 11), (X(80), 23), (X(118), 15)], 7, rnd, 11, 44, taper=.4, sw=.85))
    b.append(f"<path d='M130,9 L137,17 L130,25 L123,17Z' fill='none' stroke='{GOLD}' stroke-width='1.1'/>"
             f"<circle cx='130' cy='17' r='1.6' fill='{GOLD}'/>")
    b.append(gold_arc('M96,17 H116 M144,17 H164', .8, .8))
    return svg(260, 34, ''.join(b))


def div_rose():
    rnd = random.Random(41)
    b = [gold_arc('M8,17 H92 M168,17 H252', .8, .8),
         f"<circle cx='6' cy='17' r='1.7' fill='{GOLD}'/><circle cx='254' cy='17' r='1.7' fill='{GOLD}'/>"]
    for sx in (1, -1):
        def X(x):
            return 130 + sx * x
        b.append(foliage([(X(26), 17), (X(44), 9), (X(62), 23), (X(86), 15)], 5, rnd, 9, 48, taper=.3, sw=.8))
    b.append(rose(130, 17, 13, ROSE, ROSE_D, ROSE_DD, seed=4))
    return svg(260, 34, ''.join(b))


def div_scroll():
    """Voluta caligráfica dorada con capullo."""
    b = []
    for sx in (1, -1):
        def X(x):
            return 130 + sx * x
        b.append(gold_arc(f"M{X(14)},17 C{X(34)},17 {X(40)},6 {X(56)},7 C{X(66)},8 {X(68)},19 {X(58)},20 "
                          f"C{X(52)},21 {X(50)},14 {X(57)},13 M{X(66)},17 C{X(86)},17 {X(100)},12 {X(120)},17", .95, .95))
        b.append(leaf(X(94), 15, -150 if sx == 1 else -30, 11, 2.6, SAGE, .75))
        b.append(leaf(X(76), 19, 28 if sx == 1 else 152, 9, 2.2, OLIVE, .55))
    b.append(bud(130, 25, 1.05, 0, ROSE, ROSE_D))
    return svg(260, 34, ''.join(b))


def div_berries():
    rnd = random.Random(51)
    b = [foliage([(10, 18), (60, 8), (130, 28), (200, 14)], 11, rnd, 10, 46, taper=.2, sw=.8),
         berries(170, 22, 0, .85), berries(70, 10, 170, .75),
         daisy(130, 17, 5.2, IVORY, ROSE_D), gold_arc('M206,15 H250', .8, .8),
         f"<circle cx='252' cy='15' r='1.6' fill='{GOLD}'/>"]
    return svg(260, 34, ''.join(b))


def div_wild():
    rnd = random.Random(61)
    b = [gold_arc('M20,19 C70,12 190,26 240,19', .7, .7)]
    for i, (x, y, c) in enumerate([(62, 15, IVORY), (130, 18, BLUSH), (198, 20, IVORY)]):
        b.append(leaf(x - 18, y + 3, -22, 13, 2.7, SAGE, .75))
        b.append(leaf(x + 18, y + 2, 202, 13, 2.7, OLIVE, .55))
        b.append(daisy(x, y, 7 if i == 1 else 5.5, c, ROSE_D, i * 20))
    return svg(260, 34, ''.join(b))


def div_band():
    """Cinta botánica horizontal para las juntas entre secciones (largo)."""
    rnd = random.Random(71)
    b = []
    P = [(6, 24), (110, 12), (210, 34), (314, 22)]
    b.append(foliage(P, 20, rnd, 13, 46, taper=0, sw=.9))
    for x, y, r, s in ((66, 21, 9, 3), (160, 25, 12, 6), (254, 29, 9, 7)):
        b.append(rose(x, y, r, ROSE if s != 7 else PEACH, ROSE_D if s != 7 else PEACH_D, ROSE_DD if s != 7 else '#B47C66', seed=s))
    b.append(daisy(110, 17, 4.6, IVORY, ROSE_D)); b.append(daisy(208, 30, 4.6, IVORY, ROSE_D, 25))
    b.append(bud(30, 22, .7, 100)); b.append(bud(296, 28, .7, 80, PEACH, PEACH_D))
    b.append(specks(rnd, (10, 10, 310, 40), 12, GOLD, 1.1))
    return svg(320, 46, ''.join(b))


def fleuron_title():
    """Remate bajo los títulos: filetes + hojas + capullo."""
    b = [gold_arc('M4,10 H46 M94,10 H136', .9, .9),
         leaf(52, 10, -30, 10, 2.5, SAGE, .8), leaf(88, 10, 210, 10, 2.5, SAGE, .8),
         f"<path d='M70,3.5 L74,10 L70,16.5 L66,10Z' fill='none' stroke='{GOLD}' stroke-width='1'/>",
         f"<circle cx='4' cy='10' r='1.4' fill='{GOLD}'/><circle cx='136' cy='10' r='1.4' fill='{GOLD}'/>"]
    return svg(140, 20, ''.join(b))


def fleuron_script():
    """Remate alternativo: dos volutas y un punto."""
    b = []
    for sx in (1, -1):
        def X(x):
            return 70 + sx * x
        b.append(gold_arc(f"M{X(10)},10 C{X(22)},10 {X(26)},3 {X(36)},4 C{X(44)},5 {X(44)},13 {X(37)},13 C{X(32)},13 {X(32)},8 {X(37)},8 M{X(46)},10 H{X(66)}", .95, .95))
    b.append(f"<circle cx='70' cy='10' r='2' fill='{GOLD}'/>")
    return svg(140, 20, ''.join(b))


def fleuron_dots():
    b = [gold_arc('M6,10 H50 M90,10 H134', .8, .85),
         f"<circle cx='60' cy='10' r='1.3' fill='{GOLD}'/><circle cx='70' cy='10' r='2.1' fill='{GOLD}'/><circle cx='80' cy='10' r='1.3' fill='{GOLD}'/>"]
    return svg(140, 20, ''.join(b))


# ------------------------------------------------------------------ RAMOS / RACIMOS
def cluster(flip=False, variant=0, w=190, h=190):
    """Racimo de flores que asoma de un borde (esquina inferior-izquierda por defecto)."""
    rnd = random.Random(91 + variant)
    b = []
    b.append(foliage([(4, 186), (40, 150), (80, 140), (130, 92)], 9, rnd, 26, 44, both=True))
    b.append(foliage([(4, 186), (20, 120), (60, 80), (84, 22)], 8, rnd, 24, 44, both=True))
    if variant == 0:
        b.append(rose(36, 140, 24, ROSE, ROSE_D, ROSE_DD, seed=12, rot=20))
        b.append(rose(88, 122, 15, IVORY, '#E6D9C4', '#C7B493', seed=13))
        b.append(rose(60, 88, 12, PEACH, PEACH_D, '#B47C66', seed=14))
        b.append(daisy(112, 150, 7, IVORY, ROSE_D)); b.append(berries(50, 60, -60, 1))
    else:
        b.append(rose(40, 146, 20, PEACH, PEACH_D, '#B47C66', seed=15, rot=-10))
        b.append(rose(70, 112, 17, ROSE, ROSE_D, ROSE_DD, seed=16, rot=60))
        b.append(rose(106, 134, 11, IVORY, '#E6D9C4', '#C7B493', seed=17))
        b.append(daisy(28, 98, 6.5, IVORY, ROSE_D)); b.append(bud(96, 80, 1, 30)); b.append(berries(118, 104, 20, .9))
    b.append(specks(rnd, (4, 20, 150, 186), 16, GOLD, 1.4))
    body = ''.join(b)
    if flip:
        body = f"<g transform='matrix(-1 0 0 1 {w} 0)'>{body}</g>"
    return svg(w, h, body)


def sprig_side(flip=False):
    """Rama vertical fina para márgenes (espiga de salvia con capullos)."""
    rnd = random.Random(101)
    b = [foliage([(30, 150), (10, 110), (46, 62), (24, 6)], 12, rnd, 17, 46, both=True, taper=.3),
         bud(24, 8, .9, -10), daisy(44, 66, 5.2, IVORY, ROSE_D), berries(14, 100, 190, .8),
         specks(rnd, (4, 4, 60, 150), 8, GOLD, 1.1)]
    body = ''.join(b)
    if flip:
        body = f"<g transform='matrix(-1 0 0 1 60 0)'>{body}</g>"
    return svg(60, 156, body)


def sprig_bottom():
    """Pequeña guirnalda para el centro inferior de la portada."""
    rnd = random.Random(111)
    b = []
    for sx in (1, -1):
        def X(x):
            return 90 + sx * x
        b.append(foliage([(X(3), 20), (X(26), 14), (X(50), 24), (X(80), 17)], 6, rnd, 10, 46, taper=.3, sw=.8))
    b.append(rose(90, 20, 9, ROSE, ROSE_D, ROSE_DD, seed=22))
    b.append(gold_arc('M20,20 H34 M146,20 H160', .8, .8))
    return svg(180, 40, ''.join(b))


def mini_corner(fx=False, fy=False):
    """Esquina pequeña para tarjetas (doble filete y hoja)."""
    b = [gold_arc('M2,34 V12 Q2,2 12,2 H34', 1, .95), gold_arc('M8,34 V15 Q8,8 15,8 H34', .6, .5),
         leaf(15, 15, 45, 14, 3, SAGE, .8), leaf(10, 24, 80, 9, 2.2, OLIVE, .55),
         f"<circle cx='2' cy='2' r='1.5' fill='{GOLD}'/>"]
    t = 'matrix(%d 0 0 %d %d %d)' % (-1 if fx else 1, -1 if fy else 1, 36 if fx else 0, 36 if fy else 0)
    return svg(36, 36, f"<g transform='{t}'>{''.join(b)}</g>")


def arch_ornament():
    """Pequeña corona floral para sobre la foto de la historia."""
    rnd = random.Random(121)
    b = []
    for sx in (1, -1):
        def X(x):
            return 80 + sx * x
        b.append(foliage([(X(6), 40), (X(30), 38), (X(56), 20), (X(66), 4)], 6, rnd, 12, 46, taper=.2, sw=.8))
    b.append(rose(80, 36, 12, ROSE, ROSE_D, ROSE_DD, seed=7)); b.append(bud(80, 24, .8, 0))
    return svg(160, 60, ''.join(b))


# ------------------------------------------------------------------ ICONOS (línea fina dorada)
def _icon(body, size=48):
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' fill='none' stroke='{GOLD}' stroke-width='1.1' "
            f"stroke-linecap='round' stroke-linejoin='round'>{body}</svg>")


def icon_dress():
    # percha + pajarita
    return _icon("<path d='M24 9a3 3 0 1 1 3 3c-1.6 0-3 1-3 2.6V18'/><path d='M24 18 6 30.5a2 2 0 0 0 1.2 3.6h33.6a2 2 0 0 0 1.2-3.6z'/>"
                 "<path d='M16 38h16M20 34l4 4 4-4' stroke-opacity='.7'/>")


def icon_bus():
    return _icon("<rect x='9' y='9' width='30' height='26' rx='4'/><path d='M9 22h30M9 16h30'/><circle cx='16' cy='29' r='1.3'/><circle cx='32' cy='29' r='1.3'/>"
                 "<path d='M14 35v4M34 35v4M20 12.5h8' />")


def icon_gift():
    return _icon("<rect x='8' y='20' width='32' height='20' rx='1.5'/><path d='M6 14h36v6H6zM24 14v26'/>"
                 "<path d='M24 14c-3-6-11-6-11-1.5S21 14 24 14zM24 14c3-6 11-6 11-1.5S27 14 24 14z'/>")


def icon_pin():
    return _icon("<path d='M24 42s12-11.2 12-20a12 12 0 1 0-24 0c0 8.8 12 20 12 20z'/><circle cx='24' cy='22' r='4.3'/>")


def icon_mail():
    return _icon("<rect x='7' y='11' width='34' height='26' rx='2'/><path d='M7 13l17 13 17-13'/>")


def icon_check_rose():
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' fill='none' stroke='{OLIVE}' stroke-width='1.6' "
            f"stroke-linecap='round' stroke-linejoin='round'><circle cx='24' cy='24' r='19' stroke='{GOLD}' stroke-width='1'/>"
            f"<path d='M15 24.5l6.5 6.5L33.5 17'/></svg>")


def icon_alert():
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' fill='none' stroke='{ROSE_DD}' stroke-width='1.6' "
            f"stroke-linecap='round' stroke-linejoin='round'><circle cx='24' cy='24' r='19' stroke-width='1'/>"
            f"<path d='M24 13v14M24 33.5v.5'/></svg>")


# ------------------------------------------------------------------ TEXTURA DE PAPEL
def paper(tint='#8a7660', op=.07):
    """Grano de papel de algodón: ruido fractal muy sutil, en mosaico."""
    return (f"<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'>"
            f"<filter id='n' x='0' y='0' width='100%' height='100%'>"
            f"<feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' seed='9' stitchTiles='stitch'/>"
            f"<feColorMatrix values='0 0 0 0 .54  0 0 0 0 .46  0 0 0 0 .38  0 0 0 {op*2.2} 0'/></filter>"
            f"<rect width='100%' height='100%' filter='url(#n)'/></svg>")


def paper_fibers():
    rnd = random.Random(7)
    parts = []
    for _ in range(46):
        x, y = rnd.uniform(0, 300), rnd.uniform(0, 300)
        l, a = rnd.uniform(6, 22), rnd.uniform(0, 180)
        parts.append(f"<path d='M{r1(x)},{r1(y)} q{r1(l/2)},{r1(rnd.uniform(-3, 3))} {r1(l)},0' "
                     f"transform='rotate({r1(a)} {r1(x)} {r1(y)})' stroke='#9c8466' stroke-opacity='{r1(rnd.uniform(.05, .14))}' "
                     f"stroke-width='.45' fill='none'/>")
    return f"<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>{''.join(parts)}</svg>"
