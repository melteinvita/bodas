#!/usr/bin/env python3
"""Genera las imágenes de ambiente de las demos de las plantillas v3.

No son fotografías de personas: son composiciones de luz, textura y follaje
creadas por código para que las demos del catálogo tengan un tratamiento
fotográfico coherente con cada plantilla. Sustituyen a las fotos reales de la
pareja, que cada cliente sube desde el panel.

Salida: img/demo/<plantilla>-<hero|1|2|3>.jpg
Uso:    python3 tools/plantillas-v3/demo-media.py
"""
import math
import os
import random

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'img', 'demo'))

PORTRAIT = (900, 1125)      # 4:5
TALL = (840, 1120)          # 3:4
WIDE = (1400, 875)          # 16:10


# ------------------------------------------------------------------ primitivas
def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def lerp(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def gradient(size, stops, angle=90):
    """Degradado lineal. stops: [(pos 0..1, '#hex'), ...]. angle en grados (90 = arriba→abajo)."""
    w, h = size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    a = math.radians(angle)
    d = (xx - w / 2) * math.cos(a) + (yy - h / 2) * math.sin(a)
    d = (d - d.min()) / (d.max() - d.min() + 1e-6)
    out = np.zeros((h, w, 3), np.float32)
    pos = [s[0] for s in stops]
    cols = [hexrgb(s[1]) for s in stops]
    for c in range(3):
        out[..., c] = np.interp(d, pos, [col[c] for col in cols])
    return Image.fromarray(out.clip(0, 255).astype(np.uint8), 'RGB')


def radial(size, center, radius, inner, outer, power=1.0):
    w, h = size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt((xx - center[0] * w) ** 2 + (yy - center[1] * h) ** 2) / (radius * max(w, h))
    d = np.clip(d, 0, 1) ** power
    ci, co = hexrgb(inner), hexrgb(outer)
    out = np.zeros((h, w, 3), np.float32)
    for c in range(3):
        out[..., c] = ci[c] + (co[c] - ci[c]) * d
    return Image.fromarray(out.clip(0, 255).astype(np.uint8), 'RGB')


def layer(size):
    return Image.new('RGBA', size, (0, 0, 0, 0))


def blur_rgba(lay, radius):
    a = np.asarray(lay).astype(np.float32) / 255.0
    al = a[..., 3:4]
    pm = np.concatenate([a[..., :3] * al, al], -1)
    chans = [Image.fromarray((pm[..., i] * 255).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius))
             for i in range(4)]
    b = np.stack([np.asarray(c).astype(np.float32) / 255.0 for c in chans], -1)
    alpha = b[..., 3:4]
    rgb = np.where(alpha > 1e-4, b[..., :3] / np.maximum(alpha, 1e-4), 0)
    out = np.concatenate([rgb, alpha], -1)
    return Image.fromarray((out * 255).clip(0, 255).astype(np.uint8), 'RGBA')


def merge(base, lay, blur=0):
    if blur:
        lay = blur_rgba(lay, blur)
    b = base.convert('RGBA')
    b.alpha_composite(lay)
    return b.convert('RGB')


def grain(img, amount=7, seed=1):
    rng = np.random.default_rng(seed)
    a = np.asarray(img).astype(np.float32)
    n = rng.normal(0, amount, a.shape[:2])[..., None]
    return Image.fromarray((a + n).clip(0, 255).astype(np.uint8), 'RGB')


def vignette(img, strength=.35, power=2.2):
    w, h = img.size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2) / 1.414
    m = 1 - strength * np.clip(d, 0, 1) ** power
    a = np.asarray(img).astype(np.float32) * m[..., None]
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGB')


def tint(img, rgb, amount):
    return Image.blend(img, Image.new('RGB', img.size, rgb), amount)


def mono_warm(img, warm=('#1b1a18', '#f2eee6'), contrast=1.0):
    g = np.asarray(img.convert('L')).astype(np.float32) / 255.0
    g = np.clip((g - .5) * contrast + .5, 0, 1)
    lo, hi = hexrgb(warm[0]), hexrgb(warm[1])
    out = np.zeros(g.shape + (3,), np.float32)
    for c in range(3):
        out[..., c] = lo[c] + (hi[c] - lo[c]) * g
    return Image.fromarray(out.astype(np.uint8), 'RGB')


def rot(pt, ang, ox=0, oy=0):
    c, s = math.cos(ang), math.sin(ang)
    return (ox + pt[0] * c - pt[1] * s, oy + pt[0] * s + pt[1] * c)


def leaf_poly(x, y, ang, L, W, bend=0.0):
    pts_up, pts_dn = [], []
    n = 14
    for i in range(n + 1):
        t = i / n
        w = W * (math.sin(math.pi * t) ** .85) * (1 - .25 * t)
        cy = bend * L * (t ** 2)
        pts_up.append(rot((t * L, -w + cy), ang, x, y))
        pts_dn.append(rot((t * L, w + cy), ang, x, y))
    return pts_up + pts_dn[::-1]


def draw_leaf(d, x, y, ang, L, W, fill, bend=0.0):
    d.polygon(leaf_poly(x, y, ang, L, W, bend), fill=fill)


def bezier(p, t):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = p
    mt = 1 - t
    x = mt ** 3 * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t ** 3 * x3
    y = mt ** 3 * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t ** 3 * y3
    dx = 3 * mt * mt * (x1 - x0) + 6 * mt * t * (x2 - x1) + 3 * t * t * (x3 - x2)
    dy = 3 * mt * mt * (y1 - y0) + 6 * mt * t * (y2 - y1) + 3 * t * t * (y3 - y2)
    return x, y, math.atan2(dy, dx)


def branch(lay, p, n, Lrange, Wratio, colors, rnd, stem=None, spread=(.5, 1.0), alpha=255):
    d = ImageDraw.Draw(lay)
    if stem:
        pts = [bezier(p, i / 40)[:2] for i in range(41)]
        d.line(pts, fill=stem, width=max(2, int(Lrange[1] * .06)))
    for i in range(n):
        t = .06 + .92 * i / max(1, n - 1)
        x, y, a = bezier(p, t)
        for side in (1, -1):
            if rnd.random() < .12:
                continue
            L = rnd.uniform(*Lrange) * (1 - .35 * t)
            ang = a + side * rnd.uniform(*spread)
            col = rnd.choice(colors)
            col = col[:3] + (alpha,) if len(col) == 3 else col
            draw_leaf(d, x, y, ang, L, L * Wratio, col, bend=rnd.uniform(-.08, .08))
    x, y, a = bezier(p, 1)
    L = Lrange[1] * .8
    col = rnd.choice(colors)
    col = col[:3] + (alpha,) if len(col) == 3 else col
    draw_leaf(d, x, y, a, L, L * Wratio, col)


def bokeh(base, n, colors, rmin, rmax, amin, amax, rnd, blur=2.0, ring=True, box=None):
    w, h = base.size
    x0, y0, x1, y1 = box or (0, 0, w, h)
    lay = layer(base.size)
    d = ImageDraw.Draw(lay)
    for _ in range(n):
        r = rnd.uniform(rmin, rmax)
        x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
        c = hexrgb(rnd.choice(colors))
        a = int(rnd.uniform(amin, amax))
        d.ellipse([x - r, y - r, x + r, y + r], fill=c + (a,))
        if ring:
            d.ellipse([x - r, y - r, x + r, y + r], outline=c + (min(255, int(a * 1.7)),), width=max(1, int(r * .05)))
    return merge(base, lay, blur)


def rose(lay, cx, cy, R, c_in, c_out, rnd, petals=34):
    """Flor tipo rosa/peonía vista de frente: pétalos elípticos superpuestos."""
    d = ImageDraw.Draw(lay)
    ci, co = hexrgb(c_in), hexrgb(c_out)
    for i in range(petals):
        t = i / (petals - 1)                  # 0 = exterior, 1 = centro
        r = R * (1 - .86 * t)
        ang = i * 2.399 + rnd.uniform(-.2, .2)  # ángulo áureo
        off = r * .38
        px, py = cx + math.cos(ang) * off * (1 - t * .6), cy + math.sin(ang) * off * (1 - t * .6)
        pw, ph = r * rnd.uniform(.72, .95), r * rnd.uniform(.5, .72)
        col = tuple(int(lerp(co, ci, t)[k] * rnd.uniform(.94, 1.04)) for k in range(3))
        pts = []
        for j in range(28):
            a = j / 28 * math.tau
            pts.append(rot((math.cos(a) * pw, math.sin(a) * ph), ang, px, py))
        d.polygon(pts, fill=tuple(min(255, c) for c in col) + (205,))


def save(img, name):
    os.makedirs(OUT, exist_ok=True)
    img.save(os.path.join(OUT, name + '.jpg'), 'JPEG', quality=76, optimize=True, progressive=True)


# ------------------------------------------------------------------ TIMELESS
# Luz y arquitectura en blanco y negro cálido: la estética de una revista de moda.
def tl_hero():
    w, h = PORTRAIT
    img = gradient((w, h), [(0, '#cfc9be'), (1, '#8d877c')], 80)
    lay = layer((w, h))
    d = ImageDraw.Draw(lay)
    # vano en arco con luz
    aw, ax, top = int(w * .5), int(w * .25), int(h * .14)
    d.rectangle([ax, top + aw // 2, ax + aw, int(h * .96)], fill=(250, 246, 236, 255))
    d.pieslice([ax, top, ax + aw, top + aw], 180, 360, fill=(250, 246, 236, 255))
    img = merge(img, lay, 6)
    # sombras diagonales de la ventana sobre el muro
    sh = layer((w, h))
    d = ImageDraw.Draw(sh)
    for k in range(4):
        x0 = -w * .1 + k * w * .26
        d.polygon([(x0, 0), (x0 + w * .09, 0), (x0 + w * .09 + h * .42, h), (x0 + h * .42, h)], fill=(40, 37, 33, 70))
    img = merge(img, sh, 10)
    # jambas
    lay = layer((w, h))
    d = ImageDraw.Draw(lay)
    d.rectangle([ax - 26, top + aw // 2, ax, int(h * .96)], fill=(70, 66, 60, 150))
    d.rectangle([ax + aw, top + aw // 2, ax + aw + 26, int(h * .96)], fill=(210, 204, 192, 140))
    img = merge(img, lay, 4)
    img = vignette(img, .38)
    img = mono_warm(img, ('#171614', '#f4f0e8'), 1.08)
    return grain(img, 6, 11)


def tl_g1():
    w, h = WIDE
    img = gradient((w, h), [(0, '#efeadf'), (.6, '#d6d0c3'), (.6, '#9a9488'), (1, '#c3bdb0')], 90)
    n = 6
    for i in range(n):
        cx = w * (.12 + .76 * i / (n - 1))
        cw = 78 + 30 * math.sin(i / (n - 1) * math.pi)
        col = gradient((int(cw), int(h * .6)), [(0, '#7d776b'), (.35, '#f7f3e8'), (.62, '#e6e0d3'), (1, '#6a645a')], 0)
        img.paste(col, (int(cx - cw / 2), 0))
        sh = layer((w, h))
        d = ImageDraw.Draw(sh)
        d.polygon([(cx + cw / 2, h * .6), (cx + cw / 2 + cw * 1.9, h), (cx + cw / 2 + cw * 2.7, h), (cx + cw / 2 + cw * .4, h * .6)],
                  fill=(40, 37, 33, 105))
        img = merge(img, sh, 9)
    lay = layer((w, h))
    d = ImageDraw.Draw(lay)
    d.rectangle([0, h * .58, w, h * .62], fill=(255, 250, 238, 70))
    img = merge(img, lay, 6)
    img = vignette(img, .34)
    img = mono_warm(img, ('#181715', '#f3efe6'), 1.07)
    return grain(img, 6, 12)


def tl_g2():
    w, h = PORTRAIT
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    f = (np.sin(xx / w * 14.0 + np.sin(yy / h * 3.0) * 2.8) * .5 + np.sin(xx / w * 31.0 - yy / h * 2.4) * .2 + np.sin(xx / w * 6.0 + yy / h * 1.4) * .3)
    f = (f - f.min()) / (f.max() - f.min())
    base = 150 + 95 * f
    a = np.stack([base, base * .985, base * .955], -1)
    img = Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGB').filter(ImageFilter.GaussianBlur(.8))
    img = vignette(img, .3)
    img = mono_warm(img, ('#1a1917', '#f6f2ea'), 1.1)
    return grain(img, 5, 13)


def tl_g3():
    w, h = TALL
    rnd = random.Random(21)
    img = gradient((w, h), [(0, '#f1ede3'), (1, '#cdc7ba')], 70)
    lay = layer((w, h))
    for k in range(3):
        p = [(-30, h * (.22 + k * .3)), (w * .3, h * (.12 + k * .3)), (w * .62, h * (.4 + k * .3)), (w + 40, h * (.28 + k * .3))]
        branch(lay, p, 15, (70, 120), .24, [(38, 35, 31, 235)], rnd, stem=(38, 35, 31, 235), spread=(.45, 1.0))
    img = merge(img, lay, 7)
    img = vignette(img, .3)
    img = mono_warm(img, ('#1b1a18', '#f6f2e9'), 1.05)
    return grain(img, 6, 14)


# ------------------------------------------------------------------ FRENCH ROMANCE
def fr_hero():
    w, h = PORTRAIT
    rnd = random.Random(31)
    img = gradient((w, h), [(0, '#f6ece3'), (.55, '#efdfd3'), (1, '#e3cdbf')], 70)
    img = bokeh(img, 26, ['#f9efe6', '#e8c6bd', '#c9a09a', '#b9bfa4'], 40, 110, 40, 90, rnd, 18, ring=False)
    lay = layer((w, h))
    d = ImageDraw.Draw(lay)
    # hojas de salvia detrás
    for _ in range(28):
        x, y = rnd.uniform(w * .1, w * .9), rnd.uniform(h * .5, h * 1.0)
        draw_leaf(d, x, y, rnd.uniform(-2.8, -.3), rnd.uniform(110, 190), rnd.uniform(24, 40),
                  rnd.choice([(140, 152, 120, 215), (166, 176, 146, 215), (120, 134, 104, 215)]))
    img = merge(img, lay, 1.4)
    lay = layer((w, h))
    for (cx, cy, R, ci, co) in [(w * .44, h * .56, 190, '#d89c97', '#f1d3cb'), (w * .72, h * .74, 150, '#e0aaa4', '#f6e0d8'),
                                (w * .26, h * .78, 135, '#cf8f8c', '#eec8c0'), (w * .62, h * .34, 120, '#e8bdb5', '#f8e8e0')]:
        rose(lay, cx, cy, R, ci, co, rnd)
    img = merge(img, lay, 1.6)
    img = bokeh(img, 14, ['#fff7ec', '#e9d3a2'], 14, 40, 40, 95, rnd, 3, ring=True)
    img = vignette(img, .2)
    return grain(img, 4, 31)


def fr_g1():
    w, h = WIDE
    rnd = random.Random(32)
    img = gradient((w, h), [(0, '#f7efe5'), (1, '#eadccd')], 20)
    img = bokeh(img, 34, ['#fff7ee', '#e9cfc6', '#b9c0a4', '#e5d2a6'], 30, 95, 35, 85, rnd, 12, ring=False)
    lay = layer((w, h))
    d = ImageDraw.Draw(lay)
    for _ in range(46):  # pétalos sueltos
        x, y = rnd.uniform(0, w), rnd.uniform(h * .3, h)
        L = rnd.uniform(40, 90)
        draw_leaf(d, x, y, rnd.uniform(0, math.tau), L * 1.15, L * .36, rnd.choice([(232, 186, 178, 225), (242, 208, 198, 225), (214, 162, 156, 215)]), .16)
    img = merge(img, lay, 3.2)
    img = bokeh(img, 20, ['#fff4e0', '#e8d29f'], 8, 26, 50, 110, rnd, 2.4)
    img = vignette(img, .18)
    return grain(img, 4, 32)


def fr_g2():
    w, h = PORTRAIT
    rnd = random.Random(33)
    img = radial((w, h), (.5, .46), .75, '#f6dfc9', '#8a5e52', .9)
    img = bokeh(img, 30, ['#ffe9c4', '#f1c9a3', '#e7b4a8'], 30, 120, 40, 105, rnd, 9, ring=False)
    lay = layer((w, h))
    d = ImageDraw.Draw(lay)
    cx, cy = w * .5, h * .46
    for r, a in [(190, 60), (120, 95), (62, 190)]:
        d.ellipse([cx - r, cy - r * 1.15, cx + r, cy + r * 1.15], fill=(255, 226, 168, a))
    img = merge(img, lay, 26)
    lay = layer((w, h))
    d = ImageDraw.Draw(lay)
    d.rounded_rectangle([cx - 38, cy + 20, cx + 38, h * .93], 10, fill=(247, 236, 220, 255))
    d.ellipse([cx - 8, cy - 74, cx + 8, cy + 28], fill=(255, 238, 190, 255))
    img = merge(img, lay, 1.6)
    img = bokeh(img, 18, ['#fff0cf'], 10, 34, 55, 120, rnd, 2.4)
    img = vignette(img, .3)
    return grain(img, 4, 33)


def fr_g3():
    w, h = TALL
    rnd = random.Random(34)
    img = gradient((w, h), [(0, '#fbf6ec'), (1, '#f1e7d8')], 80)
    lay = layer((w, h))
    d = ImageDraw.Draw(lay)
    m = 54
    d.rectangle([m, m, w - m, h - m], outline=(181, 154, 98, 190), width=2)
    d.rectangle([m + 14, m + 14, w - m - 14, h - m - 14], outline=(181, 154, 98, 90), width=1)
    img = merge(img, lay)
    lay = layer((w, h))
    p = [(w * .5, h * .9), (w * .34, h * .66), (w * .66, h * .44), (w * .52, h * .12)]
    branch(lay, p, 12, (80, 130), .28, [(142, 154, 122, 235), (160, 170, 140, 235), (122, 136, 106, 235)], rnd,
           stem=(110, 122, 96, 240), spread=(.5, .95))
    for _ in range(7):
        x, y, a = bezier(p, rnd.uniform(.2, .9))
        d = ImageDraw.Draw(lay)
        r = rnd.uniform(9, 15)
        d.ellipse([x + 26 - r, y - r, x + 26 + r, y + r], fill=(214, 160, 154, 235))
    img = merge(img, lay, .9)
    return grain(img, 3, 34)


# ------------------------------------------------------------------ BLACK TIE
CH = ['#c9b27c', '#e4d2a2', '#f2e6c4', '#a88f58']


def bt_hero():
    w, h = PORTRAIT
    rnd = random.Random(41)
    img = radial((w, h), (.5, .42), .8, '#2a2619', '#070707', 1.1)
    img = bokeh(img, 52, CH, 24, 100, 55, 120, rnd, 6)
    img = bokeh(img, 40, ['#fff3d2', '#e8d6a0'], 5, 18, 70, 170, rnd, 1.6)
    lay = layer((w, h))
    d = ImageDraw.Draw(lay)
    cx = w / 2
    for i, a in enumerate(range(0, 360, 30)):
        L = rnd.uniform(90, 200)
        x1, y1 = cx + math.cos(math.radians(a)) * L, h * .28 + math.sin(math.radians(a)) * L
        d.line([cx, h * .28, x1, y1], fill=(255, 236, 180, 30), width=3)
    d.ellipse([cx - 22, h * .28 - 22, cx + 22, h * .28 + 22], fill=(255, 244, 214, 255))
    img = merge(img, lay, 5)
    img = vignette(img, .5, 2.0)
    return grain(img, 4, 41)


def bt_g1():
    w, h = WIDE
    rnd = random.Random(42)
    img = radial((w, h), (.5, .2), .9, '#2d281a', '#060606', 1.0)
    lay = layer((w, h))
    d = ImageDraw.Draw(lay)
    cx = w / 2
    for i in range(18):  # araña de luces: hilos y puntos
        a = math.radians(200 + i * 8.2)
        L = rnd.uniform(160, 300)
        x1, y1 = cx + math.cos(a) * L, 40 + abs(math.sin(a)) * L * .9
        d.line([cx, 30, x1, y1], fill=(222, 200, 140, 90), width=2)
        d.ellipse([x1 - 6, y1 - 6, x1 + 6, y1 + 6], fill=(255, 238, 190, 255))
    d.ellipse([cx - 28, 4, cx + 28, 60], fill=(255, 244, 214, 255))
    img = merge(img, lay, 3)
    img = bokeh(img, 52, CH, 24, 88, 55, 125, rnd, 7, box=(0, h * .3, w, h))
    img = bokeh(img, 30, ['#fff3d2'], 4, 14, 80, 180, rnd, 1.4, box=(0, h * .3, w, h))
    img = vignette(img, .48, 2.0)
    return grain(img, 4, 42)


def bt_g2():
    w, h = PORTRAIT
    rnd = random.Random(43)
    img = radial((w, h), (.5, .55), .85, '#241f14', '#050505', 1.0)
    img = bokeh(img, 40, CH, 26, 105, 50, 110, rnd, 8)
    lay = layer((w, h))
    d = ImageDraw.Draw(lay)
    for fx, tilt in [(w * .36, -.06), (w * .64, .06)]:
        top, bot = h * .26, h * .8
        # copa: cuenco + tallo + base
        bowl = [(fx - 54, top), (fx + 54, top), (fx + 40, top + h * .24), (fx + 7, top + h * .31), (fx - 7, top + h * .31), (fx - 40, top + h * .24)]
        bowl = [rot((x - fx, y - top), tilt, fx, top) for x, y in bowl]
        d.polygon(bowl, fill=(236, 214, 150, 70))
        d.line(bowl + [bowl[0]], fill=(255, 240, 196, 210), width=3)
        sx, sy = rot((0, top + h * .31 - top), tilt, fx, top)
        ex, ey = rot((0, bot - top), tilt, fx, top)
        d.line([sx, sy, ex, ey], fill=(250, 232, 178, 220), width=5)
        d.ellipse([ex - 62, ey - 6, ex + 62, ey + 10], fill=(250, 232, 178, 200))
        # champán dentro
        liq = [rot((x - fx, y - top), tilt, fx, top) for x, y in
               [(fx - 46, top + h * .06), (fx + 46, top + h * .06), (fx + 36, top + h * .24), (fx + 6, top + h * .3), (fx - 6, top + h * .3), (fx - 36, top + h * .24)]]
        d.polygon(liq, fill=(224, 190, 100, 150))
        for _ in range(26):
            bx, by = rnd.uniform(-26, 26), rnd.uniform(top + h * .1 - top, h * .27)
            px, py = rot((bx, by), tilt, fx, top)
            d.ellipse([px - 3, py - 3, px + 3, py + 3], fill=(255, 245, 210, 190))
    img = merge(img, lay, 1.4)
    img = bokeh(img, 26, ['#fff3d2'], 4, 14, 80, 180, rnd, 1.4)
    img = vignette(img, .5, 2.0)
    return grain(img, 4, 43)


def bt_g3():
    """Motivo art déco: abanico de arcos concéntricos en champagne sobre negro."""
    w, h = TALL
    img = radial((w, h), (.5, .62), .9, '#23201a', '#050505', 1.0)
    lay = layer((w, h))
    d = ImageDraw.Draw(lay)
    cx, cy = w / 2, h * .7
    for i in range(1, 14):
        r = i * 46
        d.arc([cx - r, cy - r, cx + r, cy + r], 180, 360, fill=(212, 190, 136, 235 if i % 3 == 0 else 150), width=3 if i % 3 == 0 else 2)
    for k in range(-6, 7):
        a = math.radians(270 + k * 13)
        d.line([cx, cy, cx + math.cos(a) * 640, cy + math.sin(a) * 640], fill=(212, 190, 136, 120), width=2)
    d.rectangle([cx - 330, cy, cx + 330, cy + 3], fill=(212, 190, 136, 230))
    d.rectangle([cx - 330, cy + 26, cx + 330, cy + 28], fill=(212, 190, 136, 120))
    img = merge(img, lay, 5)
    img = merge(img, lay, .7)
    img = vignette(img, .42, 2.0)
    return grain(img, 4, 44)


# ------------------------------------------------------------------ GARDEN
GREENS = [(70, 98, 78), (94, 114, 96), (120, 140, 108), (150, 166, 130), (180, 192, 156)]


def foliage_field(size, rnd, n, Lrange, depth_blur, colors, ang_range=(0, math.tau), box=None):
    w, h = size
    x0, y0, x1, y1 = box or (0, 0, w, h)
    lay = layer(size)
    d = ImageDraw.Draw(lay)
    for _ in range(n):
        x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
        L = rnd.uniform(*Lrange)
        c = rnd.choice(colors)
        draw_leaf(d, x, y, rnd.uniform(*ang_range), L, L * rnd.uniform(.26, .36), c + (rnd.randint(170, 235),), rnd.uniform(-.12, .12))
    return blur_rgba(lay, depth_blur)


def ga_hero():
    w, h = PORTRAIT
    rnd = random.Random(51)
    img = gradient((w, h), [(0, '#e7ecd6'), (.5, '#a9b88f'), (1, '#4a6150')], 75)
    for blur, n, L, cols, a in [(22, 40, (260, 420), GREENS[:3], None), (11, 70, (170, 280), GREENS[1:], None), (3.2, 90, (110, 190), GREENS[2:], None)]:
        lay = foliage_field((w, h), rnd, n, L, blur, cols, box=(-100, -80, w + 100, h + 80))
        img = Image.alpha_composite(img.convert('RGBA'), lay).convert('RGB')
    img = bokeh(img, 30, ['#fff8dc', '#f4f0c4', '#eef2cc'], 30, 110, 30, 80, rnd, 10, ring=False)
    lay = layer((w, h))
    for (cx, cy, R, ci, co) in [(w * .74, h * .3, 60, '#dba79d', '#f2d6cb'), (w * .2, h * .72, 48, '#e2b3a8', '#f4dfd5')]:
        rose(lay, cx, cy, R, ci, co, rnd, 22)
    img = merge(img, lay, 2.0)
    img = bokeh(img, 24, ['#fffbe6'], 5, 18, 60, 150, rnd, 1.6)
    img = vignette(img, .22)
    return grain(img, 4, 51)


def ga_g1():
    w, h = WIDE
    rnd = random.Random(52)
    img = gradient((w, h), [(0, '#f2f4df'), (.45, '#cfdab4'), (1, '#6c8467')], 90)
    # setos que convergen hacia un fondo luminoso
    for side in (-1, 1):
        for k in range(4):
            lay = layer((w, h))
            d = ImageDraw.Draw(lay)
            x0 = w * .5 + side * w * (.48 - k * .09)
            x1 = w * .5 + side * w * (.62 - k * .11)
            col = GREENS[min(4, k + 1)] if k else GREENS[0]
            d.polygon([(x0, h * (.42 + k * .035)), (x1, 0), (w * .5 + side * w * 1.2, 0), (w * .5 + side * w * 1.2, h), (x1 + side * 20, h)],
                      fill=col + (235 - k * 30,))
            img = merge(img, lay, 6 + k)
    lay = foliage_field((w, h), rnd, 100, (60, 130), 2.6, GREENS, box=(0, 0, w, h * .75))
    img = Image.alpha_composite(img.convert('RGBA'), lay).convert('RGB')
    img = bokeh(img, 34, ['#fffbe6', '#f1f3cf'], 20, 80, 30, 80, rnd, 7, ring=False)
    img = vignette(img, .25)
    return grain(img, 4, 52)


def ga_g2():
    w, h = PORTRAIT
    rnd = random.Random(53)
    img = gradient((w, h), [(0, '#b9c79e'), (1, '#4f6753')], 70)
    lay = foliage_field((w, h), rnd, 70, (180, 320), 16, GREENS, box=(-60, -60, w + 60, h + 60))
    img = Image.alpha_composite(img.convert('RGBA'), lay).convert('RGB')
    img = bokeh(img, 26, ['#f7f1c8', '#fff9e0'], 30, 100, 30, 70, rnd, 12, ring=False)
    lay = layer((w, h))
    rose(lay, w * .5, h * .5, 270, '#cf8f86', '#f6e2d8', rnd, 44)
    img = merge(img, lay, 1.4)
    lay = layer((w, h))
    d = ImageDraw.Draw(lay)
    for _ in range(6):
        draw_leaf(d, w * .5 + rnd.uniform(-60, 60), h * .5 + 250, rnd.uniform(.8, 2.3), 190, 52, (74, 100, 80, 235))
    img = merge(img, lay, 1.2)
    img = vignette(img, .3)
    return grain(img, 4, 53)


def ga_g3():
    w, h = TALL
    rnd = random.Random(54)
    img = gradient((w, h), [(0, '#fbf8ee'), (1, '#efe9d6')], 80)
    lay = layer((w, h))
    for k, p in enumerate([[(w * .9, h * .05), (w * .6, h * .22), (w * .5, h * .5), (w * .16, h * .74)],
                           [(w * .08, h * .95), (w * .3, h * .7), (w * .62, h * .78), (w * .88, h * .56)]]):
        branch(lay, p, 12, (70, 120), .27, [(94, 114, 96, 215), (120, 140, 108, 205), (150, 166, 130, 205), (74, 100, 80, 225)], rnd,
               stem=(94, 114, 96, 230), spread=(.45, 1.0))
    wash = layer((w, h))
    d = ImageDraw.Draw(wash)
    d.ellipse([w * .1, h * .3, w * .95, h * .85], fill=(169, 180, 155, 55))
    img = merge(img, wash, 38)
    img = merge(img, lay, 1.1)
    lay = layer((w, h))
    d = ImageDraw.Draw(lay)
    for _ in range(9):
        x, y = rnd.uniform(w * .15, w * .85), rnd.uniform(h * .2, h * .85)
        r = rnd.uniform(9, 17)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(221, 185, 174, 220))
    img = merge(img, lay, 1.4)
    return grain(img, 3, 54)


JOBS = {
    'timeless': [('hero', tl_hero), ('1', tl_g1), ('2', tl_g2), ('3', tl_g3)],
    'french-romance': [('hero', fr_hero), ('1', fr_g1), ('2', fr_g2), ('3', fr_g3)],
    'black-tie': [('hero', bt_hero), ('1', bt_g1), ('2', bt_g2), ('3', bt_g3)],
    'garden': [('hero', ga_hero), ('1', ga_g1), ('2', ga_g2), ('3', ga_g3)],
}

if __name__ == '__main__':
    import sys
    only = set(sys.argv[1:])
    for tpl, items in JOBS.items():
        if only and tpl not in only:
            continue
        for key, fn in items:
            save(fn(), f'{tpl}-{key}')
            print('ok', f'{tpl}-{key}')
