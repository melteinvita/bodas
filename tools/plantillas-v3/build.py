#!/usr/bin/env python3
"""Genera css/plantillas-v3.css a partir de los fragmentos de este directorio.
Los SVG (marcos, ramas, follaje) se generan aquí y se incrustan como data URI
(permitido por la CSP: img-src 'self' data:)."""
import math, random, os, re, sys, json

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import french_art as FA
import blacktie_art as BA
import garden_art as GA
JS_INVITE = os.path.normpath(os.path.join(HERE, '..', '..', 'js', 'invite.js'))
OUT = os.path.normpath(os.path.join(HERE, '..', '..', 'css', 'plantillas-v3.css'))

T = 'body:is(.theme-timeless, .theme-french-romance, .theme-black-tie, .theme-garden)'


def raw(svg):
    return re.sub(r'\s*\n\s*', '', svg).replace('"', "'")


def uri(svg):
    s = raw(svg)
    s = s.replace('%', '%25').replace('<', '%3C').replace('>', '%3E').replace('#', '%23')
    return 'url("data:image/svg+xml;charset=utf-8,' + s + '")'


def r1(x):
    return ('%.1f' % x).rstrip('0').rstrip('.')


# ---------------------------------------------------------------- FRENCH ROMANCE
GOLD_FR = '#B59A62'


def fr_corner(fx=False, fy=False):
    """Florón de esquina: dos arcos finos y dos hojas. Va DENTRO del marco CSS."""
    c = GOLD_FR
    sg = '#7E8A6C'
    inner = f"""
<path d='M5,50 C5,24 24,5 50,5' stroke='{c}' stroke-width='1.3'/>
<path d='M12,42 C12,26 26,12 42,12' stroke='{c}' stroke-opacity='.7'/>
<path d='M50,5 c4.5,-4 11,-4 15,0 c-4.5,4 -11,4 -15,0z' stroke='{sg}' fill='{sg}' fill-opacity='.32'/>
<path d='M5,50 c-4,4.5 -4,11 0,15 c4,-4.5 4,-11 0,-15z' stroke='{sg}' fill='{sg}' fill-opacity='.32'/>
<circle cx='5' cy='5' r='1.6' fill='{c}' stroke='none'/>
"""
    sx = -1 if fx else 1
    sy = -1 if fy else 1
    tx = 72 if fx else 0
    ty = 72 if fy else 0
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 72' fill='none' "
            f"stroke-width='1' stroke-linecap='round' stroke-linejoin='round'>"
            f"<g transform='matrix({sx} 0 0 {sy} {tx} {ty})'>{inner}</g></svg>")


def sprig_line(width=200, leaves=6, stem='#7E8A6C', bud='#B59A62', sw=1.15, bud_fill='none'):
    """Rama horizontal fina con hojas a línea y un capullo central."""
    h = 28
    mid = h / 2
    parts = [f"<path d='M2,{mid} C{width*.3},{mid-5} {width*.7},{mid+5} {width-2},{mid}' stroke='{stem}'/>"]
    for i in range(leaves):
        t = (i + 1) / (leaves + 1)
        # evitar el centro (capullo)
        if abs(t - .5) < .08:
            continue
        x = 2 + (width - 4) * t
        y = mid + math.sin((t - .5) * math.pi) * 2.2
        side = 1 if i % 2 == 0 else -1
        ang = (-38 if t < .5 else 38) * side
        L = 16 - abs(t - .5) * 8
        parts.append(
            f"<g transform='translate({r1(x)} {r1(y)}) rotate({ang})'>"
            f"<path d='M0,0 C{r1(L*.3)},{r1(-L*.34)} {r1(L*.75)},{r1(-L*.34)} {r1(L)},0 "
            f"C{r1(L*.75)},{r1(L*.34)} {r1(L*.3)},{r1(L*.34)} 0,0Z' stroke='{stem}' stroke-width='.9' "
            f"fill='{stem}' fill-opacity='.3'/></g>")
    cx = width / 2
    parts.append(f"<circle cx='{cx}' cy='{mid}' r='3.2' stroke='{bud}' fill='{bud_fill}'/>")
    parts.append(f"<circle cx='{cx}' cy='{mid}' r='.9' fill='{bud}' stroke='none'/>")
    parts.append(f"<path d='M{cx-9},{mid} H{cx-4.6} M{cx+4.6},{mid} H{cx+9}' stroke='{bud}' stroke-width='.7'/>")
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 {width} {h}' fill='none' "
            f"stroke-width='{sw}' stroke-linecap='round' stroke-linejoin='round'>{''.join(parts)}</svg>")


def fr_fleuron():
    """Remate bajo los títulos: filetes, dos hojas y un punto."""
    c = GOLD_FR
    s = '#7E8A6C'
    return (f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 16' fill='none' stroke-linecap='round' stroke-linejoin='round'>"
            f"<path d='M4,8 H44 M76,8 H116' stroke='{c}' stroke-width='1'/>"
            f"<path d='M47,8 c3.5,-6 9,-6 12,0 c-3,6 -8.5,6 -12,0z' stroke='{s}' stroke-width='.9' fill='{s}' fill-opacity='.3'/>"
            f"<path d='M73,8 c-3.5,-6 -9,-6 -12,0 c3,6 8.5,6 12,0z' stroke='{s}' stroke-width='.9' fill='{s}' fill-opacity='.3'/>"
            f"<circle cx='60' cy='8' r='1.5' fill='{c}' stroke='none'/></svg>")


# ---------------------------------------------------------------- SELECT ARROWS
def arrow(color):
    return uri(f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'><path d='M1 1.5l5 5 5-5' fill='none' "
               f"stroke='{color}' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/></svg>")


def tick(color):
    return uri(f"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none' stroke='{color}' stroke-width='1.6' "
               f"stroke-linecap='round' stroke-linejoin='round'><path d='M2.2 6.4 4.8 9 9.8 3.2'/></svg>")


TOKENS = {
    'T': T,
    'fr_c_tl': uri(FA.hero_corner(False, False)), 'fr_c_tr': uri(FA.hero_corner(True, False)),
    'fr_c_bl': uri(FA.hero_corner(False, True)), 'fr_c_br': uri(FA.hero_corner(True, True)),
    'fr_sprig_bottom': uri(FA.sprig_bottom()),
    'fr_div_laurel': uri(FA.div_laurel()), 'fr_div_rose': uri(FA.div_rose()), 'fr_div_scroll': uri(FA.div_scroll()),
    'fr_div_berries': uri(FA.div_berries()), 'fr_div_wild': uri(FA.div_wild()), 'fr_band': uri(FA.div_band()),
    'fr_fl_title': uri(FA.fleuron_title()), 'fr_fl_script': uri(FA.fleuron_script()), 'fr_fl_dots': uri(FA.fleuron_dots()),
    'fr_cluster0': uri(FA.cluster(False, 0)), 'fr_cluster1': uri(FA.cluster(True, 1)),
    'fr_side': uri(FA.sprig_side(False)), 'fr_side_r': uri(FA.sprig_side(True)),
    'fr_mini_tl': uri(FA.mini_corner(False, False)), 'fr_mini_tr': uri(FA.mini_corner(True, False)),
    'fr_mini_bl': uri(FA.mini_corner(False, True)), 'fr_mini_br': uri(FA.mini_corner(True, True)),
    'fr_arch': uri(FA.arch_ornament()),
    'fr_i_dress': uri(FA.icon_dress()), 'fr_i_bus': uri(FA.icon_bus()), 'fr_i_gift': uri(FA.icon_gift()),
    'fr_i_pin': uri(FA.icon_pin()), 'fr_i_mail': uri(FA.icon_mail()),
    'fr_i_check': uri(FA.icon_check_rose()), 'fr_i_alert': uri(FA.icon_alert()),
    'fr_paper': uri(FA.paper()), 'fr_fibers': uri(FA.paper_fibers()),
    'bt_c_tl': uri(BA.corner(BA.GOLD, False, False)), 'bt_c_tr': uri(BA.corner(BA.GOLD, True, False)),
    'bt_c_bl': uri(BA.corner(BA.GOLD, False, True)), 'bt_c_br': uri(BA.corner(BA.GOLD, True, True)),
    'bt_badge': uri(BA.badge()), 'bt_fan': uri(BA.fan()), 'bt_keyline': uri(BA.keyline()),
    'bt_d_diamond': uri(BA.div_diamond()), 'bt_d_steps': uri(BA.div_steps()),
    'bt_d_triple': uri(BA.div_triple()), 'bt_d_zig': uri(BA.div_zig()),
    'bt_i_pin': uri(BA.icon_pin()), 'bt_i_bowtie': uri(BA.icon_bowtie()), 'bt_i_bus': uri(BA.icon_bus()),
    'bt_i_gift': uri(BA.icon_gift()), 'bt_i_check': uri(BA.icon_check(BA.GOLD)), 'bt_i_alert': uri(BA.icon_alert('#E0A89E')),
    'bt_i_pin_ink': uri(BA.icon_pin(BA.GOLD_INK)), 'bt_i_bus_ink': uri(BA.icon_bus(BA.GOLD_INK)),
    'bt_diamond': uri(BA.diamond(BA.GOLD)), 'bt_diamond_ink': uri(BA.diamond(BA.GOLD_INK)),
    'bt_seal': uri(BA.seal_mark()),
    'bt_grain_d': uri(BA.grain(True)), 'bt_grain_l': uri(BA.grain(False)),
    'bt_arrow_l': uri(BA.arrow('#F3EFE6')),
    'ga_top': uri(GA.hero_top()), 'ga_bottom': uri(GA.hero_bottom()), 'ga_spray': uri(GA.spray_left()),
    'ga_footer': uri(GA.footer_big()), 'ga_liner': uri(GA.envelope_liner()),
    'ga_s_olive': uri(GA.sprig_olive()), 'ga_s_jasmine': uri(GA.sprig_jasmine()),
    'ga_s_fern': uri(GA.sprig_fern()), 'ga_s_euc': uri(GA.sprig_euc()), 'ga_corner': uri(GA.corner_leaf()),
    'ga_seal': uri(GA.seal_mark()),
    'ga_i_pin': uri(GA.icon_pin()), 'ga_i_dress': uri(GA.icon_dress()), 'ga_i_gift': uri(GA.icon_gift()),
    'ga_i_bus': uri(GA.icon_bus()), 'ga_i_glass': uri(GA.icon_glass()),
    'ga_i_check': uri(GA.icon_check('#EDF0E4')), 'ga_i_alert': uri(GA.icon_alert()),
    'ga_i_pin_l': uri(GA.icon_pin('#DCE3D4')), 'ga_i_dress_l': uri(GA.icon_dress('#DCE3D4')),
    'ga_grain': uri(GA.grain(.13)),
    'ga_arrow': uri(GA.arrow()), 'ga_tick': uri(GA.tick()),
    'arrow_carbon': arrow('#1F1E1C'), 'arrow_fr': arrow('#7A6A5E'),
    'tick_light': tick('#FFFEFC'),
}

# SVG inline para js/invite.js (ORNAMENTS_SVG)
JS_ORN = {
    'french-romance': raw(FA.crest()),
    'black-tie': raw(BA.badge()),
    'garden': raw(GA.sprig_jasmine(5, 150, 38)),
}


def main():
    order = ['base', 'timeless', 'french', 'blacktie', 'garden']
    chunks = []
    for name in order:
        p = os.path.join(HERE, name + '.css')
        if not os.path.exists(p):
            continue
        chunks.append(open(p, encoding='utf-8').read())
    css = '\n'.join(chunks)
    for k, v in TOKENS.items():
        css = css.replace('@' + k + '@', v)
    left = re.findall(r'@[a-z_]+@', css)
    if left:
        print('TOKENS SIN RESOLVER:', sorted(set(left)))
        sys.exit(1)
    open(OUT, 'w', encoding='utf-8').write(css)
    # orn.json: SVG de los ornamentos del hero (ya incrustados en js/invite.js)
    json.dump(JS_ORN, open(os.path.join(HERE, 'orn.json'), 'w'))
    # Sincroniza los ornamentos del hero (French Romance y Black Tie) en js/invite.js
    js = open(JS_INVITE, encoding='utf-8').read()
    new_js = js
    for key in ('french-romance', 'black-tie', 'garden'):
        pat = re.compile(r"(ORNAMENTS_SVG\['" + key + r"'\] = )\"(?:[^\"\\]|\\.)*\";")
        new_js, n = pat.subn(lambda m: m.group(1) + json.dumps(JS_ORN[key]) + ';', new_js)
        if n != 1:
            print('NO SE ENCONTRO ORNAMENTS_SVG[' + key + '] en invite.js'); sys.exit(1)
    if new_js != js:
        open(JS_INVITE, 'w', encoding='utf-8').write(new_js)
    print('OK', OUT, len(css), 'bytes')


if __name__ == '__main__':
    main()
