"""Recursos SVG originales para 08 · Garden Wedding — THE BLOOMING GARDEN.

Flores a la acuarela hechas con pétalos reales (capas, volumen, luz y sombra):
peonía, rosa inglesa, ranúnculo, hortensia, flor de cerezo, margarita y jazmín,
más follaje (hoja con nervio, eucalipto, olivo, helecho).

Cada flor se define UNA vez por SVG (<g id>) y se reutiliza con <use>; el color
llega por currentColor, así una misma peonía sirve en rosa, crema o blanco.
Todo se incrusta como data URI (CSP: img-src 'self' data:), sin recursos externos.
"""
import math, random
from garden_art import r1, bez, stem, svg as _unused  # noqa: F401  (geometría común)

# paleta (ver brief): el verde identifica; las flores aportan romanticismo
FOREST = '#405B45'
DEEP = '#344A38'
SAGE = '#A5B59A'
IVORY = '#FAF7F0'
WHITE = '#FFFDF9'
PEONY = '#E9B6B5'      # rosa peonía
DUSTY = '#D99B9C'      # rosa empolvado
ANTIQUE = '#BC777E'    # rosa antiguo
SOFT = '#F1D8D5'       # rosa suave
CREAM = '#F1E2C7'      # crema floral
BUTTER = '#E9D9A8'     # amarillo mantequilla
CORAL = '#D98E7F'     # coral suave
MAUVE = '#B99AB5'
LAV = '#A99DBD'
EUC = '#9DB1A3'
OLIVE = '#7C8F74'
LEAFS = [FOREST, DEEP, OLIVE, '#5C7560', SAGE]

# ------------------------------------------------------------------ definiciones
PETAL_PEONY = "M0,0 C-.30,-.06 -.50,-.52 -.30,-.86 C-.22,-1 -.08,-.97 0,-.9 C.08,-.97 .22,-1 .30,-.86 C.50,-.52 .30,-.06 0,0Z"
PETAL_ROSE = "M0,0 C-.52,-.08 -.62,-.70 -.16,-.92 C-.06,-.97 .06,-.97 .16,-.92 C.62,-.70 .52,-.08 0,0Z"
PETAL_NARROW = "M0,0 C-.24,-.1 -.30,-.7 0,-.92 C.30,-.7 .24,-.1 0,0Z"
PETAL_CHERRY = "M0,0 C-.30,-.2 -.46,-.7 -.2,-.94 L0,-.8 L.2,-.94 C.46,-.7 .30,-.2 0,0Z"
SHADE = '#6B3A3F'


def _ring(ref, n, sc, rot0=0, jitter=0, seed=1):
    rnd = random.Random(seed)
    o = ''
    for k in range(n):
        a = rot0 + k * 360 / n + (rnd.uniform(-jitter, jitter) if jitter else 0)
        o += f"<use href='#{ref}' transform='rotate({r1(a)}) scale({r1(sc)})'/>"
    return o


def _defs_table():
    t = {}
    # pétalo de peonía: base + luz en la punta + sombra junto al centro
    t['pp'] = ("<g id='pp'><path d='%s' fill='currentColor' fill-opacity='.9' stroke='%s' stroke-opacity='.2' stroke-width='.012'/>"
               "<path d='M-.14,-.5 C-.2,-.7 -.12,-.88 0,-.9 C.12,-.88 .2,-.7 .14,-.5Z' fill='#fff' fill-opacity='.3'/>"
               "<path d='M0,0 C-.2,-.04 -.22,-.3 0,-.36 C.22,-.3 .2,-.04 0,0Z' fill='%s' fill-opacity='.2'/></g>") % (PETAL_PEONY, SHADE, SHADE)
    t['rp'] = ("<g id='rp'><path d='%s' fill='currentColor' fill-opacity='.92' stroke='%s' stroke-opacity='.22' stroke-width='.012'/>"
               "<path d='M-.3,-.8 Q0,-1 .3,-.8 Q0,-.86 -.3,-.8Z' fill='%s' fill-opacity='.18'/>"
               "<path d='M-.18,-.45 C-.22,-.66 -.1,-.8 0,-.8 C.1,-.8 .22,-.66 .18,-.45Z' fill='#fff' fill-opacity='.22'/></g>") % (PETAL_ROSE, SHADE, SHADE)
    t['np'] = ("<g id='np'><path d='%s' fill='currentColor' fill-opacity='.95' stroke='%s' stroke-opacity='.18' stroke-width='.012'/>"
               "<path d='M-.08,-.4 C-.1,-.6 -.05,-.8 0,-.82 C.05,-.8 .1,-.6 .08,-.4Z' fill='#fff' fill-opacity='.3'/></g>") % (PETAL_NARROW, SHADE)
    t['cp'] = ("<g id='cp'><path d='%s' fill='currentColor' fill-opacity='.95' stroke='%s' stroke-opacity='.3' stroke-width='.014'/>"
               "<path d='M0,0 L0,-.55' stroke='%s' stroke-opacity='.3' stroke-width='.014'/></g>") % (PETAL_CHERRY, ANTIQUE, ANTIQUE)
    # hoja con nervio (longitud 1 sobre +x)
    t['lf'] = ("<g id='lf'><path d='M0,0 C.25,-.36 .72,-.33 1,0 C.72,.33 .25,.36 0,0Z' fill='currentColor' fill-opacity='.92'/>"
               "<path d='M0,0 C.25,-.36 .72,-.33 1,0Z' fill='%s' fill-opacity='.16'/>"
               "<path d='M.04,0 H.9' stroke='%s' stroke-opacity='.5' stroke-width='.018' fill='none'/></g>") % (IVORY, IVORY)
    t['peony'] = ("<g id='peony'><circle r='.9' fill='%s' fill-opacity='.35'/>" + _ring('pp', 9, 1, 0, 6, 3) + _ring('pp', 8, .76, 20, 6, 4)
                  + _ring('pp', 7, .52, 8, 8, 5) + _ring('pp', 5, .28, 30, 8, 6)
                  + "<circle r='.1' fill='%s' fill-opacity='.9'/>" % BUTTER
                  + ''.join("<circle cx='%s' cy='%s' r='.025' fill='#B79B52'/>" % (r1(math.cos(a) * .07), r1(math.sin(a) * .07)) for a in [k * 1.1 for k in range(6)])
                  + "</g>")
    t['rose'] = ("<g id='rose'><circle r='.8' fill='currentColor' fill-opacity='.3'/>" + _ring('rp', 5, 1, 4, 5, 7) + _ring('rp', 5, .8, 40, 5, 8)
                 + _ring('rp', 5, .6, 15, 6, 9) + _ring('rp', 4, .42, 50, 6, 10) + _ring('rp', 3, .26, 20, 8, 11)
                 + "<path d='M-.07,.02 q.07,-.12 .14,-.02 q-.02,.1 -.11,.08' fill='none' stroke='%s' stroke-opacity='.55' stroke-width='.02'/></g>" % SHADE)
    t['ran'] = ("<g id='ran'><circle r='.8' fill='currentColor' fill-opacity='.3'/>" + _ring('np', 12, 1, 0, 3, 12) + _ring('np', 10, .82, 14, 4, 13)
                + _ring('np', 8, .64, 6, 5, 14) + _ring('np', 6, .46, 30, 6, 15) + _ring('np', 5, .3, 12, 8, 16)
                + "<circle r='.11' fill='#9DB08A' fill-opacity='.95'/><circle r='.05' fill='#C9D3A8'/></g>")
    t['cher'] = ("<g id='cher'>" + _ring('cp', 5, 1, 0) + ''.join(
        "<g transform='rotate(%s)'><path d='M0,0 L0,-.34' stroke='%s' stroke-width='.014' fill='none'/><circle cy='-.34' r='.03' fill='%s'/></g>" % (a, ANTIQUE, ANTIQUE)
        for a in range(0, 360, 45)) + "<circle r='.07' fill='%s' fill-opacity='.9'/></g>" % ANTIQUE)
    t['dai'] = ("<g id='dai'>" + ''.join(
        "<ellipse cy='-.58' rx='.1' ry='.42' fill='%s' stroke='%s' stroke-opacity='.4' stroke-width='.01' transform='rotate(%s)'/>" % (WHITE, CREAM, r1(a * 360 / 14))
        for a in range(14)) + "<circle r='.24' fill='%s'/><circle r='.14' fill='#C9AE5C' fill-opacity='.6'/></g>" % BUTTER)
    t['jas'] = ("<g id='jas'>" + ''.join(
        "<ellipse cy='-.55' rx='.17' ry='.5' fill='%s' stroke='%s' stroke-opacity='.5' stroke-width='.012' transform='rotate(%s)'/>" % (WHITE, CREAM, a * 72)
        for a in range(5)) + "<circle r='.12' fill='#D9D58A'/></g>")
    # hortensia: florete de cuatro pétalos y racimo hexagonal
    t['hf'] = ("<g id='hf'>" + ''.join("<ellipse cx='.11' rx='.11' ry='.075' transform='rotate(%s)' fill='currentColor' fill-opacity='.9' stroke='#fff' stroke-opacity='.45' stroke-width='.012'/>" % a
                                         for a in (20, 110, 200, 290)) + "<circle r='.03' fill='%s' fill-opacity='.8'/></g>" % BUTTER)
    pos = []
    for ring, n in ((0, 1), (.27, 6), (.53, 11), (.78, 15)):
        for k in range(n):
            a = k * 2 * math.pi / n + ring * 3
            pos.append((math.cos(a) * ring, math.sin(a) * ring))
    t['hyd'] = ("<g id='hyd'><circle r='.8' fill='currentColor' fill-opacity='.3'/>" + ''.join(
        "<use href='#hf' x='%s' y='%s' transform='rotate(%s)' opacity='%s'/>" % (r1(x), r1(y), (i * 37) % 90, r1(.78 + (i % 4) * .07)) for i, (x, y) in enumerate(pos)) + "</g>")
    t['bud'] = ("<g id='bud'><path d='M0,0 C-.3,-.2 -.3,-.7 0,-1 C.3,-.7 .3,-.2 0,0Z' fill='currentColor' fill-opacity='.95' stroke='%s' stroke-opacity='.25' stroke-width='.02'/>"
                "<path d='M-.12,-.5 C-.14,-.7 -.06,-.86 0,-.9' stroke='#fff' stroke-opacity='.4' stroke-width='.03' fill='none'/>"
                "<path d='M-.2,-.1 C-.3,.05 -.05,.1 0,0 C.05,.1 .3,.05 .2,-.1Z' fill='%s' fill-opacity='.9'/></g>") % (SHADE, FOREST)
    return t


DEFS = _defs_table()
DEPS = {'peony': ['pp'], 'rose': ['rp'], 'ran': ['np'], 'cher': ['cp'], 'hyd': ['hf']}


def _defs_for(body):
    need, out = [], []

    def want(n):
        if n in need:
            return
        for d in DEPS.get(n, []):
            want(d)
        need.append(n)
    for n in DEFS:
        if f"#{n}'" in body:
            want(n)
    return '<defs>' + ''.join(DEFS[n] for n in need) + '</defs>'


def svg(w, h, body, vb=None):
    vb = vb or (0, 0, w, h)
    return f"<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='{vb[0]} {vb[1]} {vb[2]} {vb[3]}'>{_defs_for(body)}{body}</svg>"


# ------------------------------------------------------------------ colocación
def fl(name, x, y, r, rot=0, color=PEONY, op=1):
    o = f" opacity='{op}'" if op != 1 else ''
    return f"<use href='#{name}' transform='translate({r1(x)} {r1(y)}) rotate({r1(rot)}) scale({r1(r)})' color='{color}'{o}/>"


def lf(x, y, ang, L, ratio=.34, color=FOREST, op=1):
    o = f" opacity='{op}'" if op != 1 else ''
    return f"<use href='#lf' transform='translate({r1(x)} {r1(y)}) rotate({r1(ang)}) scale({r1(L)} {r1(L*ratio/.34*.9)})' color='{color}'{o}/>"


def foliage(p, rnd, n, L0, L1, cols=LEAFS, ratio=.34, spread=(32, 66), sides=(1, -1), op=.95, stem_w=1.6):
    """Rama de hojas con nervio a lo largo de una curva cúbica."""
    out = stem(p, DEEP, stem_w, .85)
    for i in range(n):
        t = .06 + .94 * i / max(1, n - 1)
        x, y, a = bez(p, t)
        L = (L0 + (L1 - L0) * t) * rnd.uniform(.9, 1.1)
        for s in sides:
            out += lf(x, y, a + s * rnd.uniform(*spread), L, ratio, rnd.choice(cols), op)
    x, y, a = bez(p, 1)
    return out + lf(x, y, a, L1 * 1.1, ratio, cols[0], op)


def eucalyptus(p, rnd, n=9, L0=26, L1=14):
    out = stem(p, DEEP, 1.5, .8)
    cols = [EUC, '#B2C3B6', SAGE, '#88A090']
    for i in range(n):
        t = .1 + .9 * i / (n - 1)
        x, y, a = bez(p, t)
        L = L0 + (L1 - L0) * t
        for s in (1, -1):
            out += lf(x, y, a + s * rnd.uniform(56, 80), L * rnd.uniform(.9, 1.08), .62, rnd.choice(cols), .92)
    x, y, a = bez(p, 1)
    return out + lf(x, y, a, L1, .62, EUC, .92)


def blossom_stem(p, rnd, n=6, size=1.0, kinds=('cher', 'dai', 'jas')):
    """Tallo fino con florecillas y capullos alternos."""
    out = stem(p, DEEP, 1.3, .85)
    for i in range(n):
        t = .14 + .86 * i / max(1, n - 1)
        x, y, a = bez(p, t)
        out += lf(x, y, a + rnd.choice([-1, 1]) * 58, 15 * size, .34, OLIVE, .95)
        k = kinds[i % len(kinds)]
        col = {'cher': SOFT, 'dai': WHITE, 'jas': WHITE}[k]
        out += fl(k, x + rnd.uniform(-4, 4), y + rnd.uniform(-4, 4), 8.5 * size * (1 - .25 * t), rnd.uniform(0, 72), col)
    return out


def berries(rnd, cx, cy, n, spread, col=ANTIQUE):
    return ''.join("<circle cx='%s' cy='%s' r='%s' fill='%s' fill-opacity='%s'/>" % (
        r1(cx + rnd.uniform(-spread, spread)), r1(cy + rnd.uniform(-spread, spread)), r1(rnd.uniform(1.2, 2.4)), col, r1(rnd.uniform(.6, .95))) for _ in range(n))


# ------------------------------------------------------------------ composiciones
def garland_top(seed=4, w=480, h=330):
    """Guirnalda superior de portada: racimos densos en las esquinas, follaje colgante."""
    rnd = random.Random(seed)
    o = ''
    # follaje de fondo
    o += foliage([(500, -10), (430, 60), (380, 170), (400, 300)], rnd, 12, 52, 26)
    o += foliage([(-20, -10), (60, 50), (40, 160), (74, 260)], rnd, 10, 46, 24)
    o += eucalyptus([(240, -12), (330, 10), (390, 40), (450, 120)], rnd, 8, 34, 16)
    o += foliage([(120, -12), (180, 18), (236, 6), (290, -8)], rnd, 9, 34, 18, ratio=.3)
    o += eucalyptus([(-10, 60), (40, 120), (110, 150), (170, 118)], rnd, 7, 32, 15)
    o += foliage([(480, 150), (440, 230), (452, 300), (418, 340)], rnd, 8, 42, 22, cols=[OLIVE, FOREST, SAGE])
    # flores traseras
    o += fl('hyd', 335, 54, 50, 0, LAV, .95) + fl('hyd', 60, 128, 34, 0, MAUVE, .95)
    # peonías y rosas
    o += fl('peony', 412, 86, 78, 12, PEONY) + fl('peony', 118, 40, 56, 200, SOFT)
    o += fl('rose', 346, 152, 54, 30, DUSTY) + fl('rose', 46, 54, 52, 0, PEONY)
    o += fl('ran', 452, 200, 38, 0, CORAL) + fl('ran', 28, 150, 34, 0, WHITE)
    o += fl('rose', 262, 22, 30, 80, CORAL) + fl('peony', 410, 238, 34, 40, SOFT, .96)
    # flores medianas y pequeñas por delante
    o += fl('cher', 292, 98, 22, 12, SOFT) + fl('cher', 98, 128, 18, 30, WHITE) + fl('dai', 198, 36, 15, 0, WHITE)
    o += fl('dai', 376, 232, 17, 0, WHITE) + fl('jas', 214, 14, 14, 20, WHITE) + fl('jas', 22, 218, 15, 0, WHITE)
    o += fl('bud', 318, 188, 18, -30, ANTIQUE) + fl('bud', 76, 190, 15, 200, DUSTY) + fl('bud', 180, 52, 12, 160, ANTIQUE)
    o += berries(rnd, 300, 130, 8, 24) + berries(rnd, 70, 230, 6, 18, PEONY)
    return svg(w, h, o, (-60, 0, 540, 370))


def garland_bottom(seed=9, w=480, h=330):
    """Pie de portada: ramos que brotan de la esquina inferior izquierda y de la derecha."""
    rnd = random.Random(seed)
    o = ''
    o += foliage([(-20, 350), (60, 280), (60, 170), (130, 90)], rnd, 12, 52, 26)
    o += foliage([(500, 350), (440, 290), (430, 200), (370, 140)], rnd, 10, 44, 22, cols=[OLIVE, FOREST, SAGE])
    o += eucalyptus([(0, 330), (100, 290), (190, 300), (260, 336)], rnd, 8, 34, 16)
    o += foliage([(300, 350), (340, 318), (380, 322), (430, 346)], rnd, 7, 30, 16, ratio=.3)
    o += foliage([(-10, 250), (28, 190), (20, 100), (50, 40)], rnd, 8, 36, 20, cols=[FOREST, DEEP, OLIVE])
    o += fl('hyd', 112, 232, 48, 0, LAV, .95) + fl('hyd', 420, 232, 32, 0, MAUVE, .95)
    o += fl('peony', 74, 262, 80, 100, PEONY) + fl('peony', 404, 290, 52, 20, SOFT)
    o += fl('rose', 160, 296, 50, 10, DUSTY) + fl('rose', 40, 150, 44, 60, SOFT) + fl('rose', 340, 316, 40, 80, CORAL)
    o += fl('ran', 20, 306, 38, 0, CORAL) + fl('ran', 246, 322, 28, 0, WHITE) + fl('ran', 462, 214, 30, 0, WHITE)
    o += fl('cher', 140, 178, 20, 20, SOFT) + fl('cher', 216, 268, 16, 0, WHITE) + fl('dai', 24, 212, 17, 0, WHITE)
    o += fl('dai', 290, 290, 15, 0, WHITE) + fl('jas', 196, 214, 14, 10, WHITE) + fl('jas', 380, 250, 14, 40, WHITE)
    o += fl('bud', 90, 120, 18, -80, ANTIQUE) + fl('bud', 244, 244, 14, -40, DUSTY) + fl('bud', 454, 160, 14, 200, ANTIQUE)
    o += berries(rnd, 150, 216, 8, 22, PEONY) + berries(rnd, 430, 300, 6, 16)
    return svg(w, h, o, (0, -40, 540, 370))


def story_spray(seed=21, w=300, h=440):
    """Rosas y peonías en cascada (vertical) para acompañar el título de la historia."""
    rnd = random.Random(seed)
    o = ''
    o += foliage([(310, -10), (240, 120), (260, 270), (180, 440)], rnd, 14, 56, 26)
    o += eucalyptus([(300, 40), (230, 150), (250, 300), (200, 420)], rnd, 9, 40, 18)
    o += fl('hyd', 214, 120, 46, 0, SOFT) + fl('peony', 236, 56, 62, 20, PEONY) + fl('rose', 168, 168, 48, 10, DUSTY)
    o += fl('ran', 252, 228, 38, 0, CREAM) + fl('peony', 176, 276, 52, 70, SOFT) + fl('rose', 238, 330, 40, 40, PEONY)
    o += fl('cher', 120, 96, 20, 10, WHITE) + fl('dai', 140, 232, 16, 0, WHITE) + fl('jas', 122, 330, 15, 12, WHITE)
    o += fl('bud', 128, 154, 16, 200, ANTIQUE) + fl('bud', 196, 392, 14, 100, DUSTY)
    o += blossom_stem([(190, 440), (150, 350), (120, 250), (96, 150)], rnd, 5, 1.0)
    o += berries(rnd, 110, 200, 6, 18)
    return svg(w, h, o)


def hydrangea_cluster(seed=33, w=320, h=240):
    """Hortensias y follaje (composición horizontal) para el lugar y los regalos."""
    rnd = random.Random(seed)
    o = ''
    o += foliage([(-10, 232), (80, 160), (170, 130), (250, 150)], rnd, 12, 46, 24)
    o += foliage([(330, 240), (250, 180), (200, 120), (140, 90)], rnd, 12, 44, 22, cols=[OLIVE, FOREST, SAGE])
    o += eucalyptus([(150, 250), (170, 190), (150, 120), (190, 50)], rnd, 8, 36, 16)
    o += fl('hyd', 120, 140, 60, 0, LAV) + fl('hyd', 214, 116, 52, 0, MAUVE, .95) + fl('hyd', 168, 176, 44, 0, CREAM)
    o += fl('rose', 64, 190, 34, 10, DUSTY) + fl('ran', 262, 182, 30, 0, CORAL) + fl('cher', 166, 66, 18, 0, WHITE)
    o += fl('dai', 42, 128, 14, 0, WHITE) + fl('jas', 284, 120, 14, 20, WHITE) + fl('bud', 100, 76, 14, -50, ANTIQUE) + fl('bud', 236, 60, 14, -20, DUSTY)
    return svg(w, h, o, (-30, -30, 350, 270))


def wild_band(seed=41, w=360, h=120):
    """Franja de flores silvestres (margaritas, cerezo, jazmín, bayas)."""
    rnd = random.Random(seed)
    o = ''
    o += blossom_stem([(0, 80), (90, 20), (200, 100), (360, 30)], rnd, 9, 1.35, ('dai', 'cher', 'jas'))
    o += blossom_stem([(0, 40), (110, 110), (230, 24), (360, 96)], rnd, 8, 1.15, ('cher', 'jas', 'dai'))
    o += fl('rose', 180, 58, 22, 0, PEONY) + fl('ran', 86, 62, 16, 0, CREAM) + fl('ran', 280, 56, 16, 0, WHITE)
    o += berries(rnd, 130, 60, 8, 26) + berries(rnd, 240, 62, 7, 24, PEONY)
    return svg(w, h, o, (-14, -14, w + 28, h + 28))


def white_branch(seed=51, w=320, h=260):
    """Flores blancas con ramas verdes (dress code)."""
    rnd = random.Random(seed)
    o = ''
    o += foliage([(-10, 270), (60, 190), (130, 130), (230, 100)], rnd, 12, 48, 24)
    o += eucalyptus([(330, 270), (260, 200), (220, 130), (150, 70)], rnd, 10, 38, 17)
    o += foliage([(150, 270), (170, 180), (140, 100), (190, 20)], rnd, 10, 40, 20, cols=[OLIVE, FOREST, SAGE])
    o += fl('peony', 120, 170, 64, 20, WHITE) + fl('peony', 220, 130, 50, 70, CREAM) + fl('ran', 80, 90, 34, 0, WHITE) + fl('rose', 180, 220, 38, 10, WHITE)
    o += fl('cher', 260, 60, 20, 0, WHITE) + fl('jas', 150, 60, 16, 0, WHITE) + fl('dai', 40, 170, 16, 0, WHITE) + fl('jas', 284, 190, 15, 0, WHITE)
    o += fl('bud', 100, 30, 14, -70, SOFT) + berries(rnd, 200, 40, 6, 16, SOFT)
    return svg(w, h, o, (-8, -8, w + 30, h + 30))


def footer_bouquet(seed=61, w=760, h=380):
    """Ramo ilustrado de cierre: cúpula de flores, follaje en abanico y tallos que salen por abajo."""
    rnd = random.Random(seed)
    o = ''
    # abanico de follaje
    for i, ang in enumerate((-70, -48, -26, 154, 132, 110)):
        pass
    o += foliage([(380, 400), (200, 340), (90, 250), (10, 210)], rnd, 13, 56, 28)
    o += foliage([(380, 400), (560, 340), (670, 250), (750, 210)], rnd, 13, 56, 28, cols=[OLIVE, FOREST, SAGE])
    o += eucalyptus([(380, 400), (300, 300), (250, 190), (270, 90)], rnd, 10, 42, 18)
    o += eucalyptus([(380, 400), (460, 300), (510, 190), (490, 90)], rnd, 10, 42, 18)
    o += foliage([(380, 400), (340, 300), (380, 200), (380, 120)], rnd, 9, 38, 20, cols=[FOREST, DEEP, OLIVE])
    # flores traseras
    o += fl('hyd', 250, 190, 62, 0, LAV, .96) + fl('hyd', 510, 190, 62, 0, MAUVE, .96) + fl('hyd', 380, 130, 54, 0, PEONY, .95)
    # centro
    o += fl('peony', 380, 232, 88, 10, PEONY) + fl('peony', 270, 262, 66, 80, SOFT) + fl('peony', 494, 262, 66, 150, SOFT)
    o += fl('rose', 336, 160, 48, 0, DUSTY) + fl('rose', 428, 164, 46, 30, ANTIQUE) + fl('rose', 190, 280, 46, 20, PEONY) + fl('rose', 572, 282, 46, 50, DUSTY)
    o += fl('ran', 300, 330, 40, 0, CORAL) + fl('ran', 462, 332, 40, 0, WHITE) + fl('ran', 150, 214, 34, 0, WHITE) + fl('ran', 612, 214, 34, 0, CREAM)
    o += fl('cher', 232, 110, 22, 0, WHITE) + fl('cher', 534, 108, 22, 20, SOFT) + fl('dai', 380, 62, 18, 0, WHITE) + fl('dai', 110, 262, 17, 0, WHITE)
    o += fl('dai', 650, 266, 17, 0, WHITE) + fl('jas', 320, 88, 16, 0, WHITE) + fl('jas', 450, 92, 16, 30, WHITE) + fl('jas', 80, 190, 15, 0, WHITE) + fl('jas', 680, 190, 15, 0, WHITE)
    o += fl('bud', 200, 160, 18, -70, ANTIQUE) + fl('bud', 560, 152, 18, -110, DUSTY) + fl('bud', 380, 24, 16, -90, ANTIQUE)
    o += berries(rnd, 300, 250, 10, 34, PEONY) + berries(rnd, 470, 244, 10, 34)
    return svg(w, h, o, (-50, 0, w + 100, h))


def corner_bloom(seed=12, w=170, h=170):
    """Esquina floral para tarjetas (arriba izquierda): rosa, margaritas y hojas."""
    rnd = random.Random(seed)
    o = foliage([(-10, 176), (30, 110), (80, 60), (176, 10)], rnd, 9, 30, 16)
    o += foliage([(6, 176), (10, 110), (30, 60), (70, -4)], rnd, 7, 26, 14, cols=[OLIVE, FOREST, SAGE])
    o += fl('rose', 40, 52, 34, 10, PEONY) + fl('ran', 84, 24, 20, 0, WHITE) + fl('cher', 20, 114, 15, 0, SOFT) + fl('dai', 74, 82, 12, 0, WHITE)
    o += fl('bud', 112, 28, 11, -20, ANTIQUE) + berries(rnd, 62, 100, 4, 12)
    return svg(w, h, o)


def mini(kind, seed=3, w=60, h=60, color=None):
    """Flor aislada con dos hojas (motivo del itinerario)."""
    rnd = random.Random(seed)
    col = {'rose': PEONY, 'peony': SOFT, 'ran': CREAM, 'cher': SOFT, 'dai': WHITE, 'jas': WHITE, 'hyd': PEONY}[kind]
    col = color or col
    o = lf(30, 40, 150, 22, .34, FOREST) + lf(30, 40, 30, 22, .34, OLIVE) + lf(30, 40, 90, 18, .34, DEEP)
    o += fl(kind, 30, 30, 20 if kind in ('rose', 'peony', 'ran', 'hyd') else 15, rnd.uniform(0, 40), col)
    return svg(w, h, o)


def envelope_liner(seed=17):
    """Forro del sobre (320x200): dos ramilletes de rosas y hojas, pensado como patrón tenue."""
    rnd = random.Random(seed)
    o = foliage([(-6, 200), (90, 130), (140, 70), (210, 14)], rnd, 9, 40, 20)
    o += foliage([(326, 200), (240, 140), (190, 80), (130, 24)], rnd, 9, 40, 20, cols=[OLIVE, FOREST, SAGE])
    o += fl('rose', 90, 124, 34, 10, PEONY) + fl('rose', 236, 132, 34, 40, SOFT) + fl('ran', 160, 96, 28, 0, WHITE)
    o += fl('cher', 44, 168, 14, 0, SOFT) + fl('dai', 288, 170, 14, 0, WHITE) + fl('jas', 160, 36, 13, 0, WHITE)
    return svg(320, 200, o)


def ornament(w=150, h=44):
    """Ornamento del hero (se incrusta en js/invite.js): ramita con margarita, cerezo y jazmín."""
    rnd = random.Random(5)
    o = blossom_stem([(4, h * .7), (w * .3, h * .1), (w * .62, h * .95), (w - 4, h * .4)], rnd, 6, 1.1, ('cher', 'dai', 'jas'))
    return svg(w, h, o)


# ------------------------------------------------------------------ V4: composiciones nuevas
def vine_branch(seed=71, w=190, h=440):
    """Rama vertical asimétrica de rosas pequeñas, capullos y hojas (historia)."""
    rnd = random.Random(seed)
    p = [(150, 450), (60, 340), (170, 190), (80, -10)]
    o = foliage(p, rnd, 11, 34, 18, ratio=.32, sides=(1, -1))
    o += foliage([(190, 300), (150, 240), (150, 170), (120, 120)], rnd, 5, 24, 14, cols=[OLIVE, SAGE])
    for t, kind, r, col in ((.12, 'rose', 25, DUSTY), (.28, 'bud', 13, ANTIQUE), (.4, 'rose', 31, PEONY), (.56, 'ran', 22, CORAL),
                            (.68, 'bud', 12, MAUVE), (.8, 'rose', 22, SOFT), (.93, 'cher', 14, WHITE)):
        x, y, a = bez(p, t)
        dx = 14 if rnd.random() > .5 else -14
        o += fl(kind, x + dx, y, r, rnd.uniform(0, 60) if kind != 'bud' else a, col)
    o += fl('dai', 40, 250, 11, 0, WHITE) + fl('jas', 148, 120, 11, 20, WHITE) + berries(rnd, 120, 230, 5, 16, PEONY)
    return svg(w, h, o, (-10, -10, w + 20, h + 20))


def side_branch(seed=81, w=230, h=130):
    """Rama lateral ligera con una rosa destacada (cuenta atrás); se refleja con CSS."""
    rnd = random.Random(seed)
    p = [(-10, 100), (60, 120), (130, 40), (240, 60)]
    o = foliage(p, rnd, 8, 26, 14, ratio=.3)
    o += fl('rose', 150, 56, 34, 20, PEONY) + fl('bud', 70, 88, 13, 190, ANTIQUE) + fl('cher', 206, 52, 13, 0, SOFT) + fl('dai', 104, 44, 11, 0, WHITE)
    return svg(w, h, o, (-14, -14, w + 28, h + 28))


def ceremony_bouquet(seed=91, w=150, h=150):
    """Ramito blanco y crema (ceremonia): peonía, rosa blanca y jazmín."""
    rnd = random.Random(seed)
    o = foliage([(75, 156), (60, 110), (80, 60), (75, 20)], rnd, 7, 30, 16, ratio=.3)
    o += eucalyptus([(75, 156), (120, 110), (130, 60), (118, 22)], rnd, 6, 28, 13)
    o += fl('peony', 75, 82, 44, 20, WHITE) + fl('rose', 108, 112, 24, 0, CREAM) + fl('rose', 44, 114, 22, 40, SOFT)
    o += fl('jas', 52, 40, 11, 0, WHITE) + fl('jas', 110, 50, 11, 20, WHITE) + fl('bud', 90, 26, 10, -30, CREAM)
    return svg(w, h, o, (-8, -8, w + 16, h + 16))


def party_bouquet(seed=92, w=150, h=150):
    """Ramito vivo (celebración): ranúnculos coral, hortensia malva y cerezo."""
    rnd = random.Random(seed)
    o = foliage([(75, 156), (90, 110), (70, 60), (80, 20)], rnd, 7, 30, 16, ratio=.3, cols=[OLIVE, FOREST, SAGE])
    o += fl('hyd', 98, 70, 38, 0, MAUVE) + fl('ran', 54, 92, 34, 0, CORAL) + fl('ran', 84, 120, 24, 20, PEONY)
    o += fl('cher', 42, 48, 14, 0, SOFT) + fl('dai', 118, 118, 11, 0, WHITE) + fl('bud', 70, 22, 11, -20, DUSTY)
    return svg(w, h, o, (-8, -8, w + 16, h + 16))


def bud_branch(seed=93, w=170, h=120):
    """Rama con capullos y flores pequeñas (tarjeta de detalles)."""
    rnd = random.Random(seed)
    p = [(-8, 110), (50, 100), (100, 40), (180, 30)]
    o = foliage(p, rnd, 7, 22, 12, ratio=.3)
    for t, k, r, c in ((.3, 'bud', 12, ANTIQUE), (.5, 'bud', 13, MAUVE), (.68, 'cher', 12, SOFT), (.85, 'bud', 11, CORAL), (.98, 'dai', 9, WHITE)):
        x, y, a = bez(p, t)
        o += fl(k, x, y - 8, r, a if k == 'bud' else 0, c)
    return svg(w, h, o, (-12, -12, w + 24, h + 24))


def rose_corner(seed=94, w=200, h=200):
    """Esquina de formulario: rosa inglesa grande con capullo y follaje (arriba-izquierda)."""
    rnd = random.Random(seed)
    o = foliage([(-10, 206), (30, 130), (90, 70), (206, 20)], rnd, 9, 34, 17)
    o += foliage([(8, 206), (14, 130), (40, 60), (96, -6)], rnd, 7, 28, 14, cols=[OLIVE, FOREST, SAGE])
    o += fl('rose', 58, 66, 52, 10, DUSTY) + fl('rose', 120, 34, 26, 40, PEONY) + fl('ran', 30, 138, 22, 0, CORAL)
    o += fl('cher', 92, 110, 14, 0, SOFT) + fl('bud', 158, 24, 12, -20, ANTIQUE) + fl('dai', 24, 28, 11, 0, WHITE)
    return svg(w, h, o, (-4, -4, w + 8, h + 8))


def peony_corner(seed=95, w=200, h=200):
    """Esquina de formulario: peonía grande con hortensia y hojas (abajo-derecha, sin girar)."""
    rnd = random.Random(seed)
    o = foliage([(206, -10), (170, 70), (110, 130), (-6, 180)], rnd, 9, 34, 17, cols=[OLIVE, FOREST, SAGE])
    o += foliage([(190, -10), (186, 70), (160, 140), (104, 206)], rnd, 7, 28, 14)
    o += fl('hyd', 120, 128, 32, 0, LAV) + fl('peony', 142, 82, 52, 30, PEONY) + fl('peony', 80, 150, 28, 0, SOFT)
    o += fl('ran', 170, 150, 20, 0, CREAM) + fl('jas', 96, 70, 12, 0, WHITE) + fl('bud', 40, 164, 12, 200, DUSTY)
    return svg(w, h, o, (-4, -4, w + 8, h + 8))
