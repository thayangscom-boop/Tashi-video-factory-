"""Drawing library for the Diamond Hoax short: skia-based flat cartoon characters on lit 2.5D sets."""
import math, random
import numpy as np
import skia

W, H, FPS = 1080, 1920, 30
HERE = __file__.rsplit('/', 1)[0]

# ---------------------------------------------------------------- basics
def C(hexstr, a=255):
    h = hexstr.lstrip('#')
    return skia.Color(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

def P(color='#000000', stroke=None, a=255, cap='round', blur=0, shader=None, blend=None):
    p = skia.Paint(AntiAlias=True)
    p.setColor(C(color, a) if isinstance(color, str) else color)
    if stroke:
        p.setStyle(skia.Paint.kStroke_Style)
        p.setStrokeWidth(stroke)
        p.setStrokeCap(skia.Paint.kRound_Cap if cap == 'round' else skia.Paint.kButt_Cap)
        p.setStrokeJoin(skia.Paint.kRound_Join)
    if blur:
        p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    if shader is not None:
        p.setShader(shader)
    if blend:
        p.setBlendMode(blend)
    return p

def lin(x0, y0, x1, y1, cols, pos=None):
    return skia.GradientShader.MakeLinear([skia.Point(x0, y0), skia.Point(x1, y1)], [C(c) if isinstance(c, str) else c for c in cols], pos)

def rad(cx, cy, r, cols, pos=None):
    return skia.GradientShader.MakeRadial(skia.Point(cx, cy), r, [C(c) if isinstance(c, str) else c for c in cols], pos)

def path(pts, close=True):
    p = skia.Path()
    p.moveTo(*pts[0])
    for q in pts[1:]:
        p.lineTo(*q)
    if close:
        p.close()
    return p

def rrect(c, x, y, w, h, r, paint):
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r), paint)

def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)

def ease_out(t):
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3

def back_out(t, s=1.7):
    t = max(0.0, min(1.0, t)) - 1
    return t * t * ((s + 1) * t + s) + 1

def clamp(v, a, b):
    return max(a, min(b, v))

def outline(c, pth, fill, w=6, col='#1b1410'):
    c.drawPath(pth, P(fill) if isinstance(fill, str) else fill)
    c.drawPath(pth, P(col, stroke=w))

# ---------------------------------------------------------------- fonts
_TF = {}
def _fp(local, system):
    import os
    p = f'{HERE}/fonts/{local}'
    return p if os.path.exists(p) else system
def typeface(weight=850, family='Montserrat'):
    key = (family, weight)
    if key not in _TF:
        if family == 'Montserrat':
            wsel = 900 if weight >= 870 else (800 if weight >= 700 else 600)
            _TF[key] = skia.Typeface.MakeFromFile(f'{HERE}/fonts/Montserrat-{wsel}.ttf')
        elif family == 'serif':
            _TF[key] = skia.Typeface.MakeFromFile(_fp('DejaVuSerif-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'))
        elif family == 'slab':
            _TF[key] = skia.Typeface.MakeFromFile(_fp('texgyrebonum-bold.otf', '/usr/share/texmf/fonts/opentype/public/tex-gyre/texgyrebonum-bold.otf'))
        elif family == 'hand':
            _TF[key] = skia.Typeface.MakeFromFile(_fp('texgyrechorus-mediumitalic.otf', '/usr/share/texmf/fonts/opentype/public/tex-gyre/texgyrechorus-mediumitalic.otf'))
        elif family == 'mono':
            _TF[key] = skia.Typeface.MakeFromFile(_fp('texgyrecursor-bold.otf', '/usr/share/texmf/fonts/opentype/public/tex-gyre/texgyrecursor-bold.otf'))
    return _TF[key]

def text(c, s, x, y, size, color='#ffffff', family='Montserrat', weight=850, align='center', stroke=0, stroke_col='#000000', a=255, spacing=0):
    f = skia.Font(typeface(weight, family), size)
    if spacing:
        # manual letter spacing
        ws = [f.measureText(ch) for ch in s]
        tw = sum(ws) + spacing * (len(s) - 1)
        x0 = x - tw / 2 if align == 'center' else (x - tw if align == 'right' else x)
        for ch, wch in zip(s, ws):
            if stroke:
                c.drawString(ch, x0, y, f, P(stroke_col, stroke=stroke, a=a))
            c.drawString(ch, x0, y, f, P(color, a=a))
            x0 += wch + spacing
        return tw
    tw = f.measureText(s)
    x0 = x - tw / 2 if align == 'center' else (x - tw if align == 'right' else x)
    if stroke:
        c.drawString(s, x0, y, f, P(stroke_col, stroke=stroke, a=a))
    c.drawString(s, x0, y, f, P(color, a=a))
    return tw

# ---------------------------------------------------------------- textures
_RNG = np.random.default_rng(7)
def noise_image(w, h, amp=40, seed=0, scale=1):
    rng = np.random.default_rng(seed)
    n = rng.normal(0, 1, (h // scale + 1, w // scale + 1))
    if scale > 1:
        n = np.kron(n, np.ones((scale, scale)))[:h, :w]
    v = np.clip(128 + n * amp, 0, 255).astype(np.uint8)
    arr = np.dstack([v, v, v, np.full_like(v, 255)])
    return skia.Image.fromarray(np.ascontiguousarray(arr), colorType=skia.kRGBA_8888_ColorType)

GRAIN = None
def grain_frames():
    global GRAIN
    if GRAIN is None:
        GRAIN = [noise_image(W, H, amp=22, seed=s) for s in range(6)]
    return GRAIN

def texture_overlay(c, rect, seed=1, amp=30, alpha=40, scale=2, mode=skia.BlendMode.kOverlay):
    img = noise_image(int(rect.width()) + 2, int(rect.height()) + 2, amp=amp, seed=seed, scale=scale)
    p = skia.Paint(); p.setBlendMode(mode); p.setAlphaf(alpha / 255)
    c.drawImage(img, rect.left(), rect.top(), skia.SamplingOptions(), p)

def speckles(c, x, y, w, h, n, cols, rmin=2, rmax=6, seed=0, a=255):
    rnd = random.Random(seed)
    for _ in range(n):
        cx, cy = x + rnd.random() * w, y + rnd.random() * h
        r = rmin + rnd.random() * (rmax - rmin)
        c.drawCircle(cx, cy, r, P(rnd.choice(cols), a=a))

def rocks(c, x, y, w, h, n, base='#8a6a4a', seed=0, rmin=10, rmax=40):
    rnd = random.Random(seed)
    items = []
    for _ in range(n):
        items.append((y + rnd.random() * h, x + rnd.random() * w, rmin + rnd.random() * (rmax - rmin), rnd.random()))
    items.sort()
    for cy, cx, r, k in items:
        pts = []
        m = 7
        for i in range(m):
            ang = i / m * 2 * math.pi + k
            rr = r * (0.75 + 0.35 * rnd.random())
            pts.append((cx + math.cos(ang) * rr, cy + math.sin(ang) * rr * 0.62))
        pth = path(pts)
        c.drawOval(skia.Rect.MakeXYWH(cx - r, cy + r * 0.2, r * 2.1, r * 0.6), P('#000000', a=60, blur=r * 0.25))
        sh = lin(cx - r, cy - r, cx + r, cy + r, [lighten(base, 0.25), base, darken(base, 0.35)])
        c.drawPath(pth, P(shader=sh))
        c.drawPath(pth, P(darken(base, 0.5), stroke=max(1.5, r * 0.06), a=160))

def mix(c1, c2, t):
    a = [int(c1.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4)]
    b = [int(c2.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4)]
    return '#%02x%02x%02x' % tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def lighten(c, t):
    return mix(c, '#ffffff', t)

def darken(c, t):
    return mix(c, '#000000', t)

def vignette(c, strength=170, inner=0.45):
    c.drawRect(skia.Rect.MakeWH(W, H), P(shader=rad(W / 2, H * 0.48, H * 0.75, [skia.Color(0, 0, 0, 0), skia.Color(0, 0, 0, 0), skia.Color(0, 0, 0, strength)], [0, inner, 1])))

def glow(c, x, y, r, color='#ffcf7a', a=120):
    col = C(color)
    c.drawCircle(x, y, r, P(shader=rad(x, y, r, [skia.Color(skia.ColorGetR(col), skia.ColorGetG(col), skia.ColorGetB(col), a), skia.Color(skia.ColorGetR(col), skia.ColorGetG(col), skia.ColorGetB(col), 0)]), blend=skia.BlendMode.kScreen))

def light_beam(c, x, y_top, w_top, w_bot, y_bot, a=60, color='#ffe2a8'):
    col = C(color)
    sh = lin(x, y_top, x, y_bot, [skia.Color(skia.ColorGetR(col), skia.ColorGetG(col), skia.ColorGetB(col), a), skia.Color(skia.ColorGetR(col), skia.ColorGetG(col), skia.ColorGetB(col), 0)])
    c.drawPath(path([(x - w_top / 2, y_top), (x + w_top / 2, y_top), (x + w_bot / 2, y_bot), (x - w_bot / 2, y_bot)]), P(shader=sh, blur=18, blend=skia.BlendMode.kScreen))

# ---------------------------------------------------------------- gems
GEM_COLS = {'diamond': ('#e9fbff', '#9fd9ef', '#ffffff'), 'ruby': ('#ff3355', '#9e0b25', '#ffb3c0'),
            'sapphire': ('#2f6dff', '#0c2a8a', '#a9c6ff'), 'emerald': ('#29d17a', '#0b6b3a', '#b4ffd6'),
            'rough': ('#d9d2c2', '#9a917f', '#f5f0e6')}

def gem(c, x, y, r, kind='diamond', cut=True, rot=0, sparkle=0.0, t=0.0):
    hi, lo, sp = GEM_COLS[kind]
    c.save(); c.translate(x, y); c.rotate(rot)
    if cut:
        top = [(-r, -r * 0.15), (-r * 0.55, -r * 0.6), (r * 0.55, -r * 0.6), (r, -r * 0.15)]
        body = top + [(0, r * 0.85)]
        c.drawPath(path(body), P(shader=lin(-r, -r, r, r, [hi, lo, hi, lo], [0, 0.4, 0.7, 1])))
        c.drawPath(path([(-r * 0.55, -r * 0.6), (-r * 0.2, -r * 0.15), (r * 0.2, -r * 0.15), (r * 0.55, -r * 0.6)]), P(sp, a=170))
        c.drawPath(path([(-r, -r * 0.15), (r, -r * 0.15)], close=False), P(lo, stroke=r * 0.06, a=200))
        c.drawPath(path([(-r * 0.2, -r * 0.15), (0, r * 0.85), (r * 0.2, -r * 0.15)], close=False), P(lo, stroke=r * 0.05, a=160))
        c.drawPath(path(body), P('#1b1410', stroke=max(2, r * 0.08)))
    else:
        rnd = random.Random(int(x * 13 + y * 7))
        pts = [(math.cos(i / 8 * 6.283) * r * (0.75 + 0.3 * rnd.random()), math.sin(i / 8 * 6.283) * r * (0.7 + 0.3 * rnd.random())) for i in range(8)]
        c.drawPath(path(pts), P(shader=lin(-r, -r, r, r, [hi, lo])))
        inner = [(px * 0.5 - r * 0.08, py * 0.5 - r * 0.1) for px, py in pts]
        c.drawPath(path(inner), P(sp, a=125))
        for q0, q1 in zip(inner, pts):
            c.drawLine(q0[0], q0[1], q1[0], q1[1], P(lo, stroke=max(1.2, r * 0.035), a=170))
        c.drawPath(path(inner), P(lo, stroke=max(1.2, r * 0.035), a=170))
        c.drawPath(path(pts), P('#1b1410', stroke=max(2, r * 0.08)))
    c.restore()
    if sparkle > 0:
        star(c, x + r * 0.45, y - r * 0.45, r * 0.9 * sparkle * (0.75 + 0.25 * math.sin(t * 9 + x)), a=int(255 * min(1, sparkle)))

def star(c, x, y, s, a=255, color='#ffffff'):
    if s <= 0.5:
        return
    glow(c, x, y, s * 1.4, '#fff6d8', a=int(a * 0.5))
    pth = path([(x, y - s), (x + s * 0.14, y - s * 0.14), (x + s, y), (x + s * 0.14, y + s * 0.14), (x, y + s), (x - s * 0.14, y + s * 0.14), (x - s, y), (x - s * 0.14, y - s * 0.14)])
    c.drawPath(pth, P(color, a=a))

# ---------------------------------------------------------------- money
def cash_stack(c, x, y, w=150, h=60, layers=4):
    for i in range(layers):
        yy = y - i * h * 0.28
        rrect(c, x, yy, w, h * 0.32, 6, P('#5b8f47'))
        rrect(c, x, yy, w, h * 0.32, 6, P('#1b1410', stroke=3))
        rrect(c, x + w * 0.42, yy - 1, w * 0.16, h * 0.32 + 2, 2, P('#e8dcb0'))
    c.drawCircle(x + w / 2, y - (layers - 1) * h * 0.28 + h * 0.16, h * 0.09, P('#2f5a2a'))

def bill(c, x, y, w=260, rot=0):
    h = w * 0.43
    c.save(); c.translate(x, y); c.rotate(rot)
    rrect(c, -w / 2, -h / 2, w, h, 8, P(shader=lin(-w / 2, 0, w / 2, 0, ['#8fc27a', '#6fa65a', '#8fc27a'])))
    rrect(c, -w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 6, P('#2f5a2a', stroke=3))
    c.drawCircle(0, 0, h * 0.28, P('#d8ecc8'))
    c.drawCircle(0, 0, h * 0.28, P('#2f5a2a', stroke=3))
    text(c, '$', 0, h * 0.13, h * 0.38, '#2f5a2a', weight=900)
    rrect(c, -w / 2, -h / 2, w, h, 8, P('#1b1410', stroke=4))
    c.restore()

def money_bag(c, x, y, s=1.0, label='$'):
    c.save(); c.translate(x, y); c.scale(s, s)
    c.drawOval(skia.Rect.MakeXYWH(-95, 70, 190, 34), P('#000000', a=70, blur=10))
    body = skia.Path(); body.moveTo(-30, -60); body.cubicTo(-120, -20, -110, 95, 0, 95); body.cubicTo(110, 95, 120, -20, 30, -60); body.close()
    outline(c, body, P(shader=lin(-100, -60, 100, 95, ['#d9b884', '#b48a52', '#8a6234'])), 7)
    neck = skia.Path(); neck.moveTo(-34, -60); neck.lineTo(-48, -95); neck.lineTo(48, -95); neck.lineTo(34, -60); neck.close()
    outline(c, neck, '#c19a62', 7)
    c.drawLine(-38, -62, 38, -62, P('#5a3a1a', stroke=12))
    text(c, label, 0, 50, 90, '#4a2f12', weight=900)
    c.restore()

# ---------------------------------------------------------------- characters
INK = '#1b1410'
SKIN = '#f7f2ea'

class Char:
    def __init__(self, **k):
        self.hat = k.get('hat', None)          # cowboy, slouch, top, top_white, bowler, explorer, none
        self.hat_col = k.get('hat_col', '#6b4a2b')
        self.shirt = k.get('shirt', '#3fa08a')
        self.vest = k.get('vest', None)
        self.suit = k.get('suit', None)        # jacket colour (open jacket over shirt)
        self.tie = k.get('tie', None)
        self.mustache = k.get('mustache', None)  # handlebar, walrus, none
        self.beard = k.get('beard', False)
        self.stubble = k.get('stubble', False)
        self.glasses = k.get('glasses', False)
        self.monocle = k.get('monocle', False)
        self.hair = k.get('hair', None)        # tuft colour (sideburns)
        self.sideburns = k.get('sideburns', None)
        self.flower = k.get('flower', False)
        self.plaid = k.get('plaid', False)
        self.patch = k.get('patch', False)
        self.belly = k.get('belly', 1.0)
        self.seed = k.get('seed', 0)
        self.loupe = k.get('loupe', False)
        self.slick = k.get('slick', None)        # slicked-back hair colour (no hat)
        self.badge = k.get('badge', False)
        self.sash = k.get('sash', None)
        self.epaul = k.get('epaul', False)

def _eye(c, x, y, R, kind, look=(0, 0), blink=0.0):
    if blink > 0.5 and kind not in ('happy', 'closed'):
        c.drawLine(x - R * 0.09, y, x + R * 0.09, y, P(INK, stroke=R * 0.05))
        return
    lx, ly = look
    if kind == 'dot':
        c.drawOval(skia.Rect.MakeXYWH(x - R * 0.06 + lx * R * 0.04, y - R * 0.085 + ly * R * 0.04, R * 0.12, R * 0.17), P(INK))
    elif kind == 'big':
        c.drawCircle(x, y, R * 0.17, P('#ffffff'))
        c.drawCircle(x, y, R * 0.17, P(INK, stroke=R * 0.045))
        c.drawCircle(x + lx * R * 0.06, y + ly * R * 0.06, R * 0.055, P(INK))
    elif kind == 'happy':
        p = skia.Path(); p.moveTo(x - R * 0.1, y + R * 0.03); p.quadTo(x, y - R * 0.11, x + R * 0.1, y + R * 0.03)
        c.drawPath(p, P(INK, stroke=R * 0.05))
    elif kind == 'closed':
        p = skia.Path(); p.moveTo(x - R * 0.1, y - R * 0.01); p.quadTo(x, y + R * 0.08, x + R * 0.1, y - R * 0.01)
        c.drawPath(p, P(INK, stroke=R * 0.05))
    elif kind == 'half':
        c.drawOval(skia.Rect.MakeXYWH(x - R * 0.07 + lx * R * 0.04, y - R * 0.03, R * 0.14, R * 0.1), P(INK))
        c.drawLine(x - R * 0.12, y - R * 0.035, x + R * 0.12, y - R * 0.035, P(INK, stroke=R * 0.045))
    elif kind == 'squint':
        c.drawLine(x - R * 0.11, y, x + R * 0.11, y, P(INK, stroke=R * 0.055))

LIGHT = None      # (hex colour, alpha) scene light tint for characters; set per shot by the renderer
FRONT_ARMS = ('shh', 'chin', 'visor')

def draw_char(c, ch, x, y, R=110, expr='neutral', talk=0.0, t=0.0, arms='down', face=0.0, blind=False,
              bob=True, legs=True, body=True, look=(0, 0), lean=0.0, walk=0.0, jump=0.0, squash=1.0, tilt=0.0, shadow=True):
    """x,y = feet position (ground). R = head radius. face: -1..1 turn of facial features."""
    lw = R * 0.065
    bobv = math.sin(t * 2.6 + ch.seed) * R * 0.025 if bob else 0
    torso_h = R * 1.15
    leg_len = R * 1.25
    hip_y = y - leg_len
    neck_y = hip_y - torso_h
    head_cy = neck_y - R * 0.82 + bobv
    tw = R * 1.0 * ch.belly
    if shadow:
        ks = 1 / (1 + jump / (R * 1.5))
        c.drawOval(skia.Rect.MakeXYWH(x - R * 0.9 * ks, y - R * 0.1, R * 1.8 * ks, R * 0.26), P('#000000', a=int(70 * ks), blur=R * 0.08))
    lit = LIGHT is not None
    bw_ = R * (6.6 if abs(lean) > 15 else 3.4)
    bounds = skia.Rect.MakeLTRB(x - bw_, y - jump - R * 6.5, x + bw_, y + R * 0.5)
    if lit:
        c.saveLayer(bounds, None)
    else:
        c.save()
    c.translate(0, -jump)
    if lean:
        c.rotate(lean, x, y)
    if squash != 1.0:
        c.translate(x, y); c.scale(1 + (1 - squash) * 0.7, squash); c.translate(-x, -y)
    # legs
    if legs:
        sw = math.sin(walk * 2 * math.pi) * R * 0.35 if walk else 0
        for i, sx in enumerate((-0.22, 0.22)):
            fx = x + sx * R + (sw if i == 0 else -sw)
            c.drawLine(x + sx * R, hip_y - R * 0.05, fx, y - R * 0.05, P(INK, stroke=lw))
            c.drawOval(skia.Rect.MakeXYWH(fx - R * 0.02 + (R * 0.0 if sx < 0 else 0), y - R * 0.11, R * 0.24 if sx > 0 else R * 0.24, R * 0.12), P(INK))
    # arms behind torso (drawn first for some poses)
    sh_y = neck_y + R * 0.25
    def arm(side, kind):
        sx = x + side * tw * 0.45
        if kind == 'down':
            pts = [(sx, sh_y), (sx + side * R * 0.25, sh_y + R * 0.55), (sx + side * R * 0.18, sh_y + R * 1.0)]
        elif kind == 'up':
            pts = [(sx, sh_y), (sx + side * R * 0.45, sh_y - R * 0.45 + math.sin(t * 8) * R * 0.05), (sx + side * R * 0.55, sh_y - R * 1.0 + math.sin(t * 8) * R * 0.08)]
        elif kind == 'wave':
            pts = [(sx, sh_y), (sx + side * R * 0.6, sh_y - R * 0.2), (sx + side * R * 0.75 + math.sin(t * 10) * R * 0.15, sh_y - R * 0.75)]
        elif kind == 'point':
            pts = [(sx, sh_y), (sx + side * R * 0.55, sh_y + R * 0.05), (sx + side * R * 1.1, sh_y - R * 0.12)]
        elif kind == 'hip':
            pts = [(sx, sh_y), (sx + side * R * 0.45, sh_y + R * 0.4), (sx + side * R * 0.12, sh_y + R * 0.8)]
        elif kind == 'hold':  # holding something in front of chest
            pts = [(sx, sh_y), (sx + side * R * 0.3, sh_y + R * 0.55), (x + side * R * 0.18, sh_y + R * 0.5)]
        elif kind == 'raise':  # holding object up high in front
            pts = [(sx, sh_y), (sx + side * R * 0.35, sh_y - R * 0.2), (x + side * R * 0.25, sh_y - R * 0.75)]
        elif kind == 'chin':
            pts = [(sx, sh_y), (sx + side * R * 0.3, sh_y + R * 0.5), (x + side * R * 0.15, neck_y - R * 0.05)]
        elif kind == 'shh':   # hand under the chin, finger across the lips
            pts = [(sx, sh_y), (sx + side * R * 0.5, sh_y + R * 0.45), (x + side * R * 0.04, head_cy + R * 0.8)]
        elif kind == 'shrug':
            pts = [(sx, sh_y), (sx + side * R * 0.55, sh_y + R * 0.15), (sx + side * R * 0.85, sh_y - R * 0.3)]
        elif kind == 'give':
            pts = [(sx, sh_y), (sx + side * R * 0.5, sh_y + R * 0.4), (sx + side * R * 1.0, sh_y + R * 0.35)]
        elif kind == 'show':   # holding something up beside the head
            pts = [(sx, sh_y), (sx + side * R * 0.55, sh_y + R * 0.2), (sx + side * R * 0.75, sh_y - R * 0.35)]
        elif kind == 'visor':  # hand shading the eyes
            pts = [(sx, sh_y), (sx + side * R * 0.8, sh_y - R * 0.3), (x + side * R * 0.55, head_cy - R * 0.3)]
        else:
            pts = [(sx, sh_y), (sx + side * R * 0.25, sh_y + R * 0.55), (sx + side * R * 0.18, sh_y + R * 1.0)]
        p = skia.Path(); p.moveTo(*pts[0]); p.quadTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1])
        c.drawPath(p, P(INK, stroke=lw))
        c.drawCircle(pts[2][0], pts[2][1], R * 0.075, P(INK))
        if kind == 'shh':
            c.drawLine(pts[2][0], pts[2][1], pts[2][0], pts[2][1] - R * 0.52, P(INK, stroke=lw * 1.5))
        return pts[2]
    akind = arms if isinstance(arms, tuple) else (arms, arms)
    # torso
    if body:
        tp = skia.Path()
        tp.moveTo(x - tw * 0.42, neck_y + R * 0.05)
        tp.cubicTo(x - tw * 0.62, neck_y + R * 0.4, x - tw * 0.6, hip_y + R * 0.02, x - tw * 0.38, hip_y + R * 0.06)
        tp.lineTo(x + tw * 0.38, hip_y + R * 0.06)
        tp.cubicTo(x + tw * 0.6, hip_y + R * 0.02, x + tw * 0.62, neck_y + R * 0.4, x + tw * 0.42, neck_y + R * 0.05)
        tp.close()
        shirt_sh = lin(x - tw, neck_y, x + tw, hip_y, [lighten(ch.shirt, 0.12), ch.shirt, darken(ch.shirt, 0.18)])
        c.drawPath(tp, P(shader=shirt_sh))
        if ch.plaid:
            c.save(); c.clipPath(tp, doAntiAlias=True)
            for i in range(-6, 7):
                c.drawLine(x + i * R * 0.16, neck_y, x + i * R * 0.16, hip_y + R * 0.1, P(darken(ch.shirt, 0.35), stroke=R * 0.035, a=150))
            for j in range(0, 9):
                c.drawLine(x - tw, neck_y + j * R * 0.16, x + tw, neck_y + j * R * 0.16, P(darken(ch.shirt, 0.35), stroke=R * 0.03, a=120))
            c.restore()
        if ch.suit:
            c.save(); c.clipPath(tp, doAntiAlias=True)
            for side in (-1, 1):
                jp = path([(x + side * tw * 0.7, neck_y - R * 0.1), (x + side * R * 0.1, neck_y + R * 0.05), (x + side * R * 0.02, hip_y + R * 0.2), (x + side * tw * 0.75, hip_y + R * 0.2)])
                c.drawPath(jp, P(shader=lin(x - tw, neck_y, x + tw, hip_y, [lighten(ch.suit, 0.1), ch.suit, darken(ch.suit, 0.2)])))
                c.drawPath(path([(x + side * R * 0.1, neck_y + R * 0.05), (x + side * R * 0.32, neck_y + R * 0.4), (x + side * R * 0.05, hip_y - R * 0.2)], close=False), P(INK, stroke=lw * 0.6))
            for k in range(3):
                c.drawCircle(x + R * 0.12, neck_y + R * (0.55 + k * 0.2), R * 0.035, P(INK))
            c.restore()
        if ch.sash:
            c.save(); c.clipPath(tp, doAntiAlias=True)
            c.drawLine(x - tw * 0.6, neck_y - R * 0.05, x + tw * 0.55, hip_y + R * 0.1, P(ch.sash, stroke=R * 0.2))
            c.drawLine(x - tw * 0.6, neck_y - R * 0.05, x + tw * 0.55, hip_y + R * 0.1, P(lighten(ch.sash, 0.3), stroke=R * 0.05))
            c.drawCircle(x - tw * 0.18, neck_y + R * 0.42, R * 0.09, P('#e2c25a')); c.drawCircle(x - tw * 0.18, neck_y + R * 0.42, R * 0.09, P(INK, stroke=R * 0.03))
            c.restore()
        if ch.epaul:
            for side in (-1, 1):
                c.drawOval(skia.Rect.MakeXYWH(x + side * tw * 0.42 - R * 0.17, neck_y - R * 0.02, R * 0.34, R * 0.17), P('#e2c25a'))
                c.drawOval(skia.Rect.MakeXYWH(x + side * tw * 0.42 - R * 0.17, neck_y - R * 0.02, R * 0.34, R * 0.17), P(INK, stroke=R * 0.035))
        if ch.vest:
            c.save(); c.clipPath(tp, doAntiAlias=True)
            for side in (-1, 1):
                vp = path([(x + side * tw * 0.7, neck_y), (x + side * R * 0.12, neck_y + R * 0.3), (x + side * R * 0.02, hip_y + R * 0.2), (x + side * tw * 0.75, hip_y + R * 0.2)])
                c.drawPath(vp, P(ch.vest))
            c.restore()
        if ch.patch:
            rrect(c, x - tw * 0.38, hip_y - R * 0.45, R * 0.25, R * 0.22, R * 0.03, P(darken(ch.shirt, 0.2)))
            rrect(c, x - tw * 0.38, hip_y - R * 0.45, R * 0.25, R * 0.22, R * 0.03, P(INK, stroke=lw * 0.5))
        if ch.tie:
            c.drawPath(path([(x - R * 0.06, neck_y + R * 0.05), (x + R * 0.06, neck_y + R * 0.05), (x + R * 0.09, neck_y + R * 0.6), (x, neck_y + R * 0.72), (x - R * 0.09, neck_y + R * 0.6)]), P(ch.tie))
        if ch.flower:
            for k in range(5):
                a = k / 5 * 6.283
                c.drawCircle(x - R * 0.28 + math.cos(a) * R * 0.05, neck_y + R * 0.3 + math.sin(a) * R * 0.05, R * 0.05, P('#d8203a'))
        c.drawPath(tp, P(INK, stroke=lw))
    # arms (poses that touch the face are drawn after the head)
    hands = [None, None]
    for i_, side_ in enumerate((-1, 1)):
        if akind[i_] not in FRONT_ARMS:
            hands[i_] = arm(side_, akind[i_])
    # head
    hx = x
    hy = head_cy
    c.save()
    if tilt:
        c.rotate(tilt, x, neck_y)
    c.drawCircle(hx + R * 0.05, hy + R * 0.08, R, P('#000000', a=40, blur=R * 0.06))
    c.drawCircle(hx, hy, R, P(shader=rad(hx - R * 0.35, hy - R * 0.4, R * 1.6, [lighten(SKIN, 0.4), SKIN, mix(SKIN, '#d8c9b5', 0.6)], [0, 0.55, 1])))
    if ch.sideburns:
        for side in (-1, 1):
            c.drawPath(path([(hx + side * R * 0.93, hy - R * 0.3), (hx + side * R * 0.98, hy + R * 0.05), (hx + side * R * 0.7, hy + R * 0.55), (hx + side * R * 0.62, hy + R * 0.1)]), P(ch.sideburns))
    if ch.beard:
        bp = skia.Path(); bp.moveTo(hx - R * 0.95, hy + R * 0.05); bp.cubicTo(hx - R * 0.9, hy + R * 1.05, hx + R * 0.9, hy + R * 1.05, hx + R * 0.95, hy + R * 0.05)
        bp.cubicTo(hx + R * 0.6, hy + R * 0.45, hx - R * 0.6, hy + R * 0.45, hx - R * 0.95, hy + R * 0.05); bp.close()
        c.save(); c.clipPath(skia.Path().addCircle(hx, hy, R), doAntiAlias=True)
        c.drawPath(bp, P('#5a3b22'))
        c.restore()
    if ch.stubble:
        rnd = random.Random(ch.seed + 3)
        for _ in range(55):
            a = rnd.uniform(0.15, math.pi - 0.15)
            rr = rnd.uniform(0.45, 0.92)
            c.drawCircle(hx + math.cos(a) * R * rr * (1 if rnd.random() > 0.5 else -1) * 0.95, hy + math.sin(a) * R * rr * 0.9 + R * 0.08, R * 0.022, P('#6b5a4a', a=170))
    if ch.hat:
        dy_, hh_ = {'cowboy': (-0.2, 0.32), 'slouch': (-0.16, 0.34), 'top': (-0.58, 0.46), 'top_white': (-0.58, 0.46),
                    'bowler': (-0.52, 0.46), 'explorer': (-0.48, 0.5), 'fedora': (-0.42, 0.42), 'kepi': (-0.5, 0.4), 'bicorne': (-0.45, 0.42), 'bonnet': (-0.3, 0.3), 'wig': (-0.4, 0.3)}[ch.hat]
        c.save(); c.clipPath(skia.Path().addCircle(hx, hy, R), doAntiAlias=True)
        c.drawOval(skia.Rect.MakeXYWH(hx - R * 1.15, hy + R * dy_ - R * hh_ / 2, R * 2.3, R * hh_), P('#3a2a1a', a=80, blur=R * 0.09))
        c.restore()
    c.drawCircle(hx, hy, R, P(INK, stroke=lw))
    # face
    fx = hx + face * R * 0.25
    ey = hy - R * 0.05
    sep = R * 0.32
    blink = 1.0 if (t * 1.0 + ch.seed * 0.37) % 3.3 < 0.1 else 0.0
    ek = {'neutral': 'dot', 'happy': 'happy', 'shock': 'big', 'smug': 'half', 'sus': 'half', 'talk': 'dot',
          'worried': 'dot', 'grin': 'happy', 'angry': 'dot', 'dazed': 'big', 'wide': 'big', 'squint': 'squint'}.get(expr, 'dot')
    if blind:
        rrect(c, hx - R * 1.02, ey - R * 0.2, R * 2.04, R * 0.36, R * 0.08, P('#2b2b33'))
        c.drawLine(hx + R * 0.95, ey, hx + R * 1.35, ey + R * 0.35, P('#2b2b33', stroke=R * 0.1))
        c.drawLine(hx + R * 0.95, ey, hx + R * 1.25, ey + R * 0.5, P('#2b2b33', stroke=R * 0.08))
    else:
        _eye(c, fx - sep, ey, R, ek, look, blink)
        _eye(c, fx + sep, ey, R, ek, look, blink)
        if ch.glasses:
            for s in (-1, 1):
                c.drawCircle(fx + s * sep, ey, R * 0.2, P(INK, stroke=R * 0.04))
            c.drawLine(fx - sep + R * 0.2, ey, fx + sep - R * 0.2, ey, P(INK, stroke=R * 0.04))
        if ch.monocle:
            c.drawCircle(fx + sep, ey, R * 0.21, P('#cfe8ff', a=90))
            c.drawCircle(fx + sep, ey, R * 0.21, P('#b08d3a', stroke=R * 0.05))
            c.drawLine(fx + sep + R * 0.15, ey + R * 0.15, fx + sep + R * 0.35, ey + R * 0.75, P('#b08d3a', stroke=R * 0.02))
        if ch.loupe:
            c.drawCircle(fx + sep, ey, R * 0.27, P(INK)); c.drawCircle(fx + sep, ey, R * 0.2, P('#9fd0e8', a=220))
            c.drawCircle(fx + sep - R * 0.07, ey - R * 0.07, R * 0.05, P('#ffffff', a=210))
        # brows
        by = ey - R * 0.27
        if expr in ('angry',):
            c.drawLine(fx - sep - R * 0.14, by - R * 0.04, fx - sep + R * 0.12, by + R * 0.06, P(INK, stroke=R * 0.06))
            c.drawLine(fx + sep + R * 0.14, by - R * 0.04, fx + sep - R * 0.12, by + R * 0.06, P(INK, stroke=R * 0.06))
        elif expr in ('sus',):
            c.drawLine(fx - sep - R * 0.13, by + R * 0.05, fx - sep + R * 0.13, by + R * 0.07, P(INK, stroke=R * 0.06))
            pb = skia.Path(); pb.moveTo(fx + sep - R * 0.14, by); pb.quadTo(fx + sep, by - R * 0.14, fx + sep + R * 0.16, by - R * 0.04)
            c.drawPath(pb, P(INK, stroke=R * 0.06))
        elif expr in ('worried', 'shock', 'dazed', 'wide'):
            c.drawLine(fx - sep - R * 0.13, by - R * 0.02, fx - sep + R * 0.12, by - R * 0.1, P(INK, stroke=R * 0.05))
            c.drawLine(fx + sep + R * 0.13, by - R * 0.02, fx + sep - R * 0.12, by - R * 0.1, P(INK, stroke=R * 0.05))
        elif expr in ('smug',):
            c.drawLine(fx - sep - R * 0.13, by + R * 0.02, fx - sep + R * 0.13, by - R * 0.02, P(INK, stroke=R * 0.05))
            c.drawLine(fx + sep - R * 0.13, by - R * 0.02, fx + sep + R * 0.13, by + R * 0.02, P(INK, stroke=R * 0.05))
    # mouth
    my = hy + R * 0.42
    mx = fx
    open_amt = 0.0
    if talk > 0:
        open_amt = clamp(talk, 0, 1)
    if expr in ('shock', 'dazed') and talk == 0:
        c.drawOval(skia.Rect.MakeXYWH(mx - R * 0.12, my - R * 0.12, R * 0.24, R * 0.28), P('#5a1a16'))
        c.drawOval(skia.Rect.MakeXYWH(mx - R * 0.12, my - R * 0.12, R * 0.24, R * 0.28), P(INK, stroke=R * 0.045))
    elif expr in ('happy', 'grin') and talk == 0:
        mp = skia.Path(); mp.moveTo(mx - R * 0.32, my - R * 0.05); mp.quadTo(mx, my + R * 0.42, mx + R * 0.32, my - R * 0.05); mp.close()
        c.drawPath(mp, P('#5a1a16'))
        c.save(); c.clipPath(mp, doAntiAlias=True)
        c.drawRect(skia.Rect.MakeXYWH(mx - R * 0.35, my - R * 0.1, R * 0.7, R * 0.12), P('#ffffff'))
        c.restore()
        c.drawPath(mp, P(INK, stroke=R * 0.045))
    elif open_amt > 0.08:
        hgt = R * (0.06 + 0.24 * open_amt)
        c.drawOval(skia.Rect.MakeXYWH(mx - R * 0.17, my - hgt * 0.4, R * 0.34, hgt), P('#5a1a16'))
        c.drawOval(skia.Rect.MakeXYWH(mx - R * 0.17, my - hgt * 0.4, R * 0.34, hgt), P(INK, stroke=R * 0.045))
        c.drawRect(skia.Rect.MakeXYWH(mx - R * 0.11, my - hgt * 0.4 + R * 0.01, R * 0.22, R * 0.05), P('#ffffff'))
    elif expr in ('smug', 'sus'):
        mp = skia.Path(); mp.moveTo(mx - R * 0.18, my + R * 0.02); mp.quadTo(mx + R * 0.05, my + R * 0.06, mx + R * 0.2, my - R * 0.06)
        c.drawPath(mp, P(INK, stroke=R * 0.05))
    elif expr in ('worried', 'angry'):
        mp = skia.Path(); mp.moveTo(mx - R * 0.16, my + R * 0.05); mp.quadTo(mx, my - R * 0.06, mx + R * 0.16, my + R * 0.05)
        c.drawPath(mp, P(INK, stroke=R * 0.05))
    elif expr == 'wide':
        rrect(c, mx - R * 0.25, my - R * 0.06, R * 0.5, R * 0.14, R * 0.04, P('#ffffff'))
        rrect(c, mx - R * 0.25, my - R * 0.06, R * 0.5, R * 0.14, R * 0.04, P(INK, stroke=R * 0.04))
        for k in range(1, 5):
            c.drawLine(mx - R * 0.25 + k * R * 0.1, my - R * 0.06, mx - R * 0.25 + k * R * 0.1, my + R * 0.08, P(INK, stroke=R * 0.02))
    else:
        mp = skia.Path(); mp.moveTo(mx - R * 0.14, my); mp.quadTo(mx, my + R * 0.05, mx + R * 0.14, my)
        c.drawPath(mp, P(INK, stroke=R * 0.05))
    if ch.mustache == 'pencil':
        for s in (-1, 1):
            mp = skia.Path(); mp.moveTo(mx + s * R * 0.035, my - R * 0.105); mp.quadTo(mx + s * R * 0.15, my - R * 0.16, mx + s * R * 0.29, my - R * 0.085)
            c.drawPath(mp, P('#2a1c14', stroke=R * 0.05))
    elif ch.mustache:
        for s in (-1, 1):
            mp = skia.Path(); mp.moveTo(mx, my - R * 0.1)
            if ch.mustache == 'handlebar':
                mp.cubicTo(mx + s * R * 0.15, my - R * 0.2, mx + s * R * 0.35, my - R * 0.05, mx + s * R * 0.42, my - R * 0.22)
                mp.cubicTo(mx + s * R * 0.4, my + R * 0.02, mx + s * R * 0.15, my + R * 0.0, mx, my - R * 0.04)
            else:
                mp.cubicTo(mx + s * R * 0.2, my - R * 0.2, mx + s * R * 0.38, my - R * 0.1, mx + s * R * 0.36, my + R * 0.06)
                mp.cubicTo(mx + s * R * 0.2, my - R * 0.02, mx + s * R * 0.1, my - R * 0.02, mx, my - R * 0.04)
            mp.close()
            c.drawPath(mp, P('#2a1c14' if not ch.beard else '#4a2f1a'))
    if ch.slick and not ch.hat:
        c.save(); hp = skia.Path(); hp.addCircle(hx, hy, R); c.clipPath(hp, doAntiAlias=True)
        hair = skia.Path(); hair.moveTo(hx - R * 1.05, hy - R * 0.2); hair.cubicTo(hx - R * 0.9, hy - R * 0.62, hx - R * 0.45, hy - R * 0.58, hx - R * 0.18, hy - R * 0.66)
        hair.cubicTo(hx + R * 0.2, hy - R * 0.52, hx + R * 0.7, hy - R * 0.62, hx + R * 1.05, hy - R * 0.25); hair.lineTo(hx + R * 1.1, hy - R * 1.2); hair.lineTo(hx - R * 1.1, hy - R * 1.2); hair.close()
        c.drawPath(hair, P(shader=lin(hx - R, hy - R, hx + R, hy - R * 0.4, [lighten(ch.slick, 0.18), ch.slick, darken(ch.slick, 0.2)])))
        for k in range(4):
            sp_ = skia.Path(); sp_.moveTo(hx - R * (0.6 - k * 0.3), hy - R * 0.95); sp_.quadTo(hx - R * (0.45 - k * 0.3), hy - R * 0.75, hx - R * (0.3 - k * 0.3), hy - R * 0.62)
            c.drawPath(sp_, P(lighten(ch.slick, 0.35), stroke=R * 0.03, a=150))
        c.restore()
        c.drawCircle(hx, hy, R, P(INK, stroke=R * 0.065))
    # hat
    draw_hat(c, ch, hx, hy, R, t)
    c.restore()
    for i_, side_ in enumerate((-1, 1)):
        if akind[i_] in FRONT_ARMS:
            hands[i_] = arm(side_, akind[i_])
    if lit:
        big_ = bounds.makeOutset(R * 7, R * 7)
        c.drawRect(big_, P(LIGHT, blend=skia.BlendMode.kModulate))          # light colour multiplies: whites pick it up, ink stays black
        c.drawRect(big_, P(shader=lin(0, y - R * 4.4, 0, y, ['#ffffff', '#cfc4b8']), blend=skia.BlendMode.kModulate))
    c.restore()
    return dict(head=(hx, hy - jump), hands=[(h_[0], h_[1] - jump) for h_ in hands], neck=(x, neck_y - jump), R=R)

def draw_hat(c, ch, hx, hy, R, t):
    hc = ch.hat_col
    lw = R * 0.06
    if ch.hat == 'cowboy':
        brim = skia.Path(); brim.moveTo(hx - R * 1.45, hy - R * 0.45); brim.quadTo(hx, hy - R * 0.05, hx + R * 1.45, hy - R * 0.45)
        brim.quadTo(hx + R * 1.2, hy - R * 0.72, hx, hy - R * 0.62); brim.quadTo(hx - R * 1.2, hy - R * 0.72, hx - R * 1.45, hy - R * 0.45); brim.close()
        crown = skia.Path(); crown.moveTo(hx - R * 0.72, hy - R * 0.6); crown.cubicTo(hx - R * 0.8, hy - R * 1.45, hx - R * 0.3, hy - R * 1.3, hx, hy - R * 1.2)
        crown.cubicTo(hx + R * 0.3, hy - R * 1.3, hx + R * 0.8, hy - R * 1.45, hx + R * 0.72, hy - R * 0.6); crown.close()
        outline(c, crown, P(shader=lin(hx - R, hy - R * 1.4, hx + R, hy - R * 0.6, [lighten(hc, 0.15), hc, darken(hc, 0.25)])), lw)
        c.drawRect(skia.Rect.MakeXYWH(hx - R * 0.74, hy - R * 0.78, R * 1.48, R * 0.16), P(darken(hc, 0.45)))
        outline(c, brim, P(shader=lin(hx - R, hy - R * 0.7, hx + R, hy - R * 0.3, [lighten(hc, 0.1), darken(hc, 0.1)])), lw)
    elif ch.hat == 'slouch':
        crown = skia.Path(); crown.moveTo(hx - R * 0.98, hy - R * 0.25); crown.cubicTo(hx - R * 1.0, hy - R * 1.35, hx + R * 1.0, hy - R * 1.35, hx + R * 0.98, hy - R * 0.25)
        crown.quadTo(hx, hy - R * 0.42, hx - R * 0.98, hy - R * 0.25); crown.close()
        outline(c, crown, P(shader=lin(hx, hy - R * 1.3, hx, hy - R * 0.2, [lighten(hc, 0.15), hc])), lw)
        for k in range(-3, 4):
            c.drawLine(hx + k * R * 0.22, hy - R * 0.38, hx + k * R * 0.26, hy - R * 1.0, P(darken(hc, 0.3), stroke=R * 0.03, a=140))
        band = skia.Path(); band.moveTo(hx - R * 1.02, hy - R * 0.3); band.quadTo(hx, hy - R * 0.5, hx + R * 1.02, hy - R * 0.3)
        band.lineTo(hx + R * 1.0, hy - R * 0.12); band.quadTo(hx, hy - R * 0.32, hx - R * 1.0, hy - R * 0.12); band.close()
        outline(c, band, darken(hc, 0.15), lw)
    elif ch.hat in ('top', 'top_white'):
        col = '#f2efe8' if ch.hat == 'top_white' else '#26232b'
        crown = path([(hx - R * 0.62, hy - R * 0.68), (hx - R * 0.66, hy - R * 1.95), (hx + R * 0.66, hy - R * 1.95), (hx + R * 0.62, hy - R * 0.68)])
        outline(c, crown, P(shader=lin(hx - R * 0.7, 0, hx + R * 0.7, 0, [darken(col, 0.12), lighten(col, 0.12), col, darken(col, 0.2)], [0, 0.3, 0.6, 1])), lw)
        c.drawRect(skia.Rect.MakeXYWH(hx - R * 0.63, hy - R * 0.95, R * 1.26, R * 0.2), P('#1b1410' if ch.hat == 'top_white' else '#6b1c24'))
        brim = skia.Path(); brim.addOval(skia.Rect.MakeXYWH(hx - R * 1.05, hy - R * 0.82, R * 2.1, R * 0.3))
        outline(c, brim, col, lw)
    elif ch.hat == 'bowler':
        crown = skia.Path(); crown.moveTo(hx - R * 0.78, hy - R * 0.55); crown.cubicTo(hx - R * 0.85, hy - R * 1.55, hx + R * 0.85, hy - R * 1.55, hx + R * 0.78, hy - R * 0.55); crown.close()
        outline(c, crown, P(shader=rad(hx - R * 0.3, hy - R * 1.2, R * 1.3, [lighten(hc, 0.25), hc, darken(hc, 0.3)])), lw)
        c.drawRect(skia.Rect.MakeXYWH(hx - R * 0.8, hy - R * 0.72, R * 1.6, R * 0.14), P(darken(hc, 0.5)))
        brim = skia.Path(); brim.addOval(skia.Rect.MakeXYWH(hx - R * 1.1, hy - R * 0.68, R * 2.2, R * 0.28))
        outline(c, brim, hc, lw)
    elif ch.hat == 'fedora':
        crown = skia.Path(); crown.moveTo(hx - R * 0.72, hy - R * 0.62)
        crown.cubicTo(hx - R * 0.8, hy - R * 1.22, hx - R * 0.55, hy - R * 1.44, hx - R * 0.18, hy - R * 1.4)
        crown.quadTo(hx, hy - R * 1.27, hx + R * 0.18, hy - R * 1.4)
        crown.cubicTo(hx + R * 0.55, hy - R * 1.44, hx + R * 0.8, hy - R * 1.22, hx + R * 0.72, hy - R * 0.62); crown.close()
        outline(c, crown, P(shader=lin(hx - R * 0.8, hy - R * 1.4, hx + R * 0.8, hy - R * 0.6, [lighten(hc, 0.22), hc, darken(hc, 0.3)])), lw)
        crease = skia.Path(); crease.moveTo(hx, hy - R * 1.28); crease.quadTo(hx + R * 0.04, hy - R * 1.05, hx, hy - R * 0.9)
        c.drawPath(crease, P(darken(hc, 0.4), stroke=R * 0.04, a=160))
        c.drawRect(skia.Rect.MakeXYWH(hx - R * 0.74, hy - R * 0.82, R * 1.48, R * 0.17), P('#7a1c24' if hc in ('#2b2a33',) else darken(hc, 0.5)))
        brim = skia.Path(); brim.moveTo(hx - R * 1.2, hy - R * 0.55); brim.quadTo(hx, hy - R * 0.3, hx + R * 1.2, hy - R * 0.55)
        brim.quadTo(hx + R * 1.02, hy - R * 0.74, hx, hy - R * 0.72); brim.quadTo(hx - R * 1.02, hy - R * 0.74, hx - R * 1.2, hy - R * 0.55); brim.close()
        outline(c, brim, P(shader=lin(hx - R, hy - R * 0.7, hx + R, hy - R * 0.35, [lighten(hc, 0.12), darken(hc, 0.12)])), lw)
    elif ch.hat == 'kepi':
        crown = path([(hx - R * 0.58, hy - R * 0.6), (hx - R * 0.67, hy - R * 1.42), (hx + R * 0.67, hy - R * 1.42), (hx + R * 0.58, hy - R * 0.6)])
        outline(c, crown, P(shader=lin(hx - R * 0.7, 0, hx + R * 0.7, 0, [darken(hc, 0.1), lighten(hc, 0.18), hc, darken(hc, 0.25)], [0, 0.3, 0.6, 1])), lw)
        top = skia.Path(); top.addOval(skia.Rect.MakeXYWH(hx - R * 0.67, hy - R * 1.52, R * 1.34, R * 0.2))
        outline(c, top, lighten(hc, 0.12), lw)
        c.drawRect(skia.Rect.MakeXYWH(hx - R * 0.6, hy - R * 0.84, R * 1.2, R * 0.13), P('#c9a24a'))
        c.drawCircle(hx, hy - R * 1.1, R * 0.13, P('#e2c25a')); c.drawCircle(hx, hy - R * 1.1, R * 0.13, P(INK, stroke=R * 0.035))
        visor = skia.Path(); visor.moveTo(hx - R * 0.64, hy - R * 0.64); visor.quadTo(hx, hy - R * 0.28, hx + R * 0.64, hy - R * 0.64)
        visor.quadTo(hx, hy - R * 0.5, hx - R * 0.64, hy - R * 0.64); visor.close()
        outline(c, visor, '#121418', lw)
    elif ch.hat == 'bicorne':
        hat = skia.Path(); hat.moveTo(hx - R * 1.45, hy - R * 0.5); hat.quadTo(hx - R * 0.75, hy - R * 0.62, hx - R * 0.5, hy - R * 1.25)
        hat.quadTo(hx, hy - R * 1.75, hx + R * 0.5, hy - R * 1.25); hat.quadTo(hx + R * 0.75, hy - R * 0.62, hx + R * 1.45, hy - R * 0.5)
        hat.quadTo(hx, hy - R * 0.9, hx - R * 1.45, hy - R * 0.5); hat.close()
        outline(c, hat, P(shader=lin(hx - R, hy - R * 1.6, hx + R, hy - R * 0.5, [lighten(hc, 0.2), hc, darken(hc, 0.3)])), lw)
        trim = skia.Path(); trim.moveTo(hx - R * 1.3, hy - R * 0.56); trim.quadTo(hx, hy - R * 0.92, hx + R * 1.3, hy - R * 0.56)
        c.drawPath(trim, P('#e2c25a', stroke=R * 0.07))
        c.drawCircle(hx, hy - R * 1.12, R * 0.15, P('#f4f0e6')); c.drawCircle(hx, hy - R * 1.12, R * 0.08, P('#3f8a4a')); c.drawCircle(hx, hy - R * 1.12, R * 0.15, P(INK, stroke=R * 0.035))
        fe = skia.Path(); fe.moveTo(hx + R * 0.1, hy - R * 1.4); fe.cubicTo(hx + R * 0.2, hy - R * 2.1, hx + R * 0.8, hy - R * 2.2, hx + R * 0.95, hy - R * 1.7)
        fe.cubicTo(hx + R * 0.7, hy - R * 1.9, hx + R * 0.45, hy - R * 1.8, hx + R * 0.3, hy - R * 1.38); fe.close()
        outline(c, fe, '#f4f0e6', lw * 0.8)
    elif ch.hat == 'bonnet':
        bn = skia.Path(); bn.moveTo(hx - R * 1.08, hy + R * 0.25); bn.cubicTo(hx - R * 1.35, hy - R * 1.3, hx + R * 1.35, hy - R * 1.3, hx + R * 1.08, hy + R * 0.25)
        bn.cubicTo(hx + R * 0.95, hy - R * 0.75, hx - R * 0.95, hy - R * 0.75, hx - R * 1.08, hy + R * 0.25); bn.close()
        outline(c, bn, P(shader=lin(hx, hy - R * 1.2, hx, hy, [lighten(hc, 0.2), hc])), lw)
        rb = skia.Path(); rb.moveTo(hx - R * 1.0, hy - R * 0.35); rb.cubicTo(hx - R * 0.8, hy - R * 0.95, hx + R * 0.8, hy - R * 0.95, hx + R * 1.0, hy - R * 0.35)
        c.drawPath(rb, P(darken(hc, 0.35), stroke=R * 0.09))
    elif ch.hat == 'wig':
        wg = skia.Path(); wg.moveTo(hx - R * 1.12, hy + R * 0.75)
        wg.cubicTo(hx - R * 1.5, hy - R * 0.3, hx - R * 1.1, hy - R * 1.25, hx, hy - R * 1.22); wg.cubicTo(hx + R * 1.1, hy - R * 1.25, hx + R * 1.5, hy - R * 0.3, hx + R * 1.12, hy + R * 0.75)
        wg.lineTo(hx + R * 0.8, hy + R * 0.6); wg.cubicTo(hx + R * 1.05, hy - R * 0.2, hx + R * 0.7, hy - R * 0.72, hx, hy - R * 0.7); wg.cubicTo(hx - R * 0.7, hy - R * 0.72, hx - R * 1.05, hy - R * 0.2, hx - R * 0.8, hy + R * 0.6); wg.close()
        outline(c, wg, P(shader=lin(hx, hy - R * 1.2, hx, hy + R * 0.7, ['#f6f3ea', '#d9d4c6'])), lw)
        for k in range(3):
            for sgn in (-1, 1):
                c.drawArc(skia.Rect.MakeXYWH(hx + sgn * R * 1.02 - R * 0.14, hy - R * 0.2 + k * R * 0.3, R * 0.28, R * 0.24), 0, 300, False, P('#a8a294', stroke=R * 0.035))
    elif ch.hat == 'explorer':
        brim = skia.Path(); brim.addOval(skia.Rect.MakeXYWH(hx - R * 1.5, hy - R * 0.75, R * 3.0, R * 0.5))
        outline(c, brim, P(shader=lin(hx - R * 1.5, 0, hx + R * 1.5, 0, [lighten(hc, 0.1), hc, darken(hc, 0.2)])), lw)
        crown = skia.Path(); crown.moveTo(hx - R * 0.75, hy - R * 0.55); crown.lineTo(hx - R * 0.68, hy - R * 1.25); crown.quadTo(hx, hy - R * 1.45, hx + R * 0.68, hy - R * 1.25); crown.lineTo(hx + R * 0.75, hy - R * 0.55); crown.close()
        outline(c, crown, P(shader=lin(hx - R, 0, hx + R, 0, [lighten(hc, 0.15), hc, darken(hc, 0.2)])), lw)
        c.drawRect(skia.Rect.MakeXYWH(hx - R * 0.74, hy - R * 0.8, R * 1.48, R * 0.18), P('#3a2a1a'))

# ---------------------------------------------------------------- cast
ARNOLD = Char(hat='cowboy', hat_col='#7a5532', shirt='#b8332b', plaid=True, vest='#5a3b22', stubble=True, seed=1, patch=False)
SLACK = Char(hat='slouch', hat_col='#c99a3a', shirt='#3f9a86', stubble=True, seed=4, patch=True)
BANKER = Char(hat='top', shirt='#f4efe6', suit='#2d2a35', mustache='handlebar', monocle=True, tie='#7a1c2a', seed=2, belly=1.15)
JEWELER = Char(hat=None, shirt='#efe9df', suit='#3b3a4a', sideburns='#b9b2a6', glasses=True, tie='#2a2a6a', seed=6)
INV1 = Char(hat='top_white', shirt='#ffffff', suit='#f2efe8', mustache='handlebar', flower=True, seed=7, belly=1.2)
INV2 = Char(hat='bowler', hat_col='#2b2630', shirt='#f4efe6', suit='#5b2a3a', glasses=True, seed=9)
INV3 = Char(hat='top', shirt='#f4efe6', suit='#26302e', mustache='walrus', seed=11)
EXPERT = Char(hat='bowler', hat_col='#6a5a48', shirt='#efe9df', suit='#7a6a4a', glasses=True, mustache='walrus', tie='#3a5a3a', seed=5)
BANKER_NM = Char(hat='top', shirt='#f4efe6', suit='#2d2a35', mustache='handlebar', tie='#7a1c2a', seed=2, belly=1.15)
JEWELER_L = Char(hat=None, shirt='#efe9df', suit='#3b3a4a', sideburns='#b9b2a6', glasses=True, tie='#2a2a6a', seed=6, loupe=True)
SURV = Char(hat='slouch', hat_col='#8a6a4a', shirt='#6a7a8a', seed=13)
KING = Char(hat='explorer', hat_col='#a88b5e', shirt='#c7b38a', vest='#6e5a3a', beard=True, mustache='walrus', seed=8)
ARNOLD_RICH = Char(hat='top', shirt='#f4efe6', suit='#2f4a3a', tie='#c9a227', stubble=True, flower=True, seed=1)

# ---------------------------------------------------------------- cast: the Eiffel Tower con (1925)
LUSTIG = Char(hat='fedora', hat_col='#2b2a33', shirt='#f4efe6', suit='#23283a', tie='#9c2430', mustache='pencil', flower=True, seed=21)
LUSTIG_CON = Char(hat='fedora', hat_col='#2b2a33', shirt='#f4efe6', suit='#23283a', tie='#9c2430', mustache='pencil', seed=21)
LUSTIG_PRISON = Char(hat=None, slick='#2a2420', shirt='#8796a8', mustache='pencil', seed=21)
POISSON = Char(hat='bowler', hat_col='#5e4430', shirt='#efe6d6', suit='#7a5a3a', vest='#5a3a24', mustache='walrus', belly=1.25, seed=22)
DEAL1 = Char(hat='top', shirt='#f4efe6', suit='#3a3a44', mustache='handlebar', tie='#2a3a6a', seed=23, belly=1.15)
DEAL2 = Char(hat='bowler', hat_col='#2b2630', shirt='#f4efe6', suit='#4a3a5a', glasses=True, seed=24)
DEAL3 = Char(hat='slouch', hat_col='#6a6a72', shirt='#8a8f99', vest='#4a4a52', stubble=True, seed=25)
DEAL4 = Char(hat=None, shirt='#efe9df', suit='#3a5a4a', sideburns='#b9b2a6', glasses=True, tie='#6a2a2a', seed=26)
DEAL5 = Char(hat='top', shirt='#f4efe6', suit='#5a3a2a', mustache='walrus', seed=27)
GENDARME = Char(hat='kepi', hat_col='#1f2740', shirt='#26304f', suit='#1f2740', mustache='handlebar', tie='#c9a24a', seed=28)

# ---------------------------------------------------------------- cast: Poyais (1822)
MAC = Char(hat='bicorne', hat_col='#1d2233', shirt='#a8242c', sash='#2f7a44', epaul=True, sideburns='#5a3a22', seed=41, belly=1.08)
MAC_PLAIN = Char(hat='top', shirt='#f4efe6', suit='#2a2a36', tie='#2f7a44', sideburns='#5a3a22', seed=41, belly=1.08)
SET_M = Char(hat='slouch', hat_col='#7a6a52', shirt='#c9b48a', vest='#6a5236', stubble=True, seed=42)
SET_W = Char(hat='bonnet', hat_col='#e6d8c0', shirt='#6a8fb0', seed=43)
SET_K = Char(hat=None, slick='#8a5a2e', shirt='#b8563a', seed=44)
SET_2 = Char(hat='bowler', hat_col='#4a4038', shirt='#e8e0d0', suit='#5a6a4a', mustache='walrus', seed=45)
SET_3 = Char(hat='bonnet', hat_col='#d9b8b0', shirt='#8a5a7a', seed=46)
JUDGE = Char(hat='wig', shirt='#1b1b1f', suit='#1b1b1f', glasses=True, seed=47)
FR1 = Char(hat='top', shirt='#f4efe6', suit='#2a3a5a', mustache='handlebar', tie='#b8222c', seed=48, belly=1.15)
FR2 = Char(hat='bowler', hat_col='#3a3030', shirt='#f4efe6', suit='#5a3a3a', mustache='pencil', seed=49)

# ---------------------------------------------------------------- captions
def caption(c, s, age, y=1360):
    if not s:
        return
    size = 78 if len(s) <= 13 else (70 if len(s) <= 17 else 62)
    pop = 1.0 + 0.18 * (1 - ease_out(age / 0.12)) if age < 0.12 else 1.0
    c.save(); c.translate(W / 2, y); c.scale(pop, pop)
    f = skia.Font(typeface(850), size)
    tw = f.measureText(s)
    blob = skia.TextBlob.MakeFromString(s, f)
    c.drawTextBlob(blob, -tw / 2 + 4, 6, P('#000000', a=120, blur=6))
    c.drawTextBlob(blob, -tw / 2, 0, P('#000000', stroke=size * 0.15))
    c.drawTextBlob(blob, -tw / 2, 0, P('#ffffff'))
    c.restore()

def label_card(c, s, x, y, size=46, a=255, bg='#f3e6c4', fg='#2a1c12'):
    f = skia.Font(typeface(800, 'Montserrat'), size)
    tw = f.measureText(s)
    pad = size * 0.45
    c.save()
    rrect(c, x - tw / 2 - pad, y - size * 0.95, tw + pad * 2, size * 1.35, 10, P('#000000', a=int(a * 0.35), blur=8))
    rrect(c, x - tw / 2 - pad, y - size * 1.0, tw + pad * 2, size * 1.35, 10, P(bg, a=a))
    rrect(c, x - tw / 2 - pad, y - size * 1.0, tw + pad * 2, size * 1.35, 10, P(fg, stroke=4, a=a))
    c.drawString(s, x - tw / 2, y, f, P(fg, a=a))
    c.restore()
