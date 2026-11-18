"""Caption style v6, measured from the user's reference image: a smaller bold line, a larger bold line, and the last word in a big italic serif;
black type, tracking -0.05, soft shadow, on a pale paper card with a faint grid. Each part appears as it is spoken."""
import os, re
import skia
from lib import W, H, P, ease, ease_out, back_out, clamp
import timing

ROOT = os.path.dirname(os.path.abspath(__file__))

# light words | bold words *accent words*   — one caption per " / " ; every caption has all three parts; every script word appears once, in order
MARKUP = {
    1: "a young engineer | is sawing *gaps* / into a brand new | *railroad* / on | *purpose*",
    2: "two companies | are *racing* / to build a line | along the same desert *canyon* / first to finish | wins every *customer*",
    3: "his boss | finds a *gap* / between | every *rail* / as wide | as a *finger*",
    4: "are you trying | to *ruin me?*",
    5: "the kid | just keeps *sawing*",
    6: "the rival lays its rails | tight *together* / smooth | as *glass* / and wins | the *race*",
    7: "their trains whisper | along the *cliffs* / his rattle | over every single *gap*",
    8: "people nickname | his line *the rattler* / and they all ride | the quiet *one*",
    9: "then summer | *arrives* / and his gaps | begin to *shrink*",
    10: "in spring, | a coin fits *inside* / by july, | not even a playing *card*",
    11: "ha! even the steel | is fixing your *mistake*",
    12: "but across the canyon, | the smooth rails start *to creak* / steel grows | in the *heat* / and theirs has | nowhere *to go*",
    13: "on the hottest day | of the *year* / his gaps | *close* / rail | meets *rail* / a perfect | *fit*",
    14: "on the other side, | the track kicks *sideways* / like | a *snake* / just as a train | comes around *the bend*",
    15: "the driver | slams the *brakes* / and stops | a few feet *short*",
    16: "by autumn, | the rival is sawing *gaps* / into | every *mile*",
    17: "and that clickety-clack | on old *railroads?* / that is the sound | of room *to grow*",
}



# ---------------------------------------------------------------- type (sizes measured on the reference, scaled to a 1080-wide frame)
_F = f'{ROOT}/fonts/inter/InterDisplay-Bold.otf' if os.path.exists(f'{ROOT}/fonts/inter/InterDisplay-Bold.otf') else '/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf'
_FS = _F.replace('Bold', 'SemiBold')
_FA = f'{ROOT}/fonts/InstrumentSerif-Italic.ttf'
KS = 1.15                                   # the reference sizes x 1.15 so they read on a phone
S1, S2, SA = 61.0 * KS, 71.6 * KS, 110.0 * KS
LEAD = 98.5 * KS                            # baseline to baseline
TRACK = {'l1': -0.048, 'l2': -0.05, 'acc': -0.012, 'sub': -0.03}
INK = skia.Color(17, 17, 17)
PAPER = skia.Color(228, 228, 224)
MAXW = 880
BASE2 = 1470                                # baseline of the second line
_TF = {}
def tblob(text, kind, size):
    path = _FA if kind == 'acc' else (_FS if kind == 'sub' else _F)
    if path not in _TF:
        _TF[path] = skia.Typeface.MakeFromFile(path)
    f = skia.Font(_TF[path], size); f.setSubpixel(True); f.setEdging(skia.Font.Edging.kAntiAlias)
    gl = f.textToGlyphs(text); ws = f.getWidths(gl); xs = []; x = 0.0; tr = TRACK[kind] * size
    for w in ws:
        xs.append(x); x += w + tr
    b = skia.TextBlobBuilder(); b.allocRunPosH(f, gl, xs, 0)
    return b.make(), x - tr

BOOST = False      # set per shot by the caption pass: white captions over a bright picture get a stronger halo
TONE = None        # 'ink' | 'white' for the current shot (set by the caption pass); None = decide from the frame
def _blur(col, r):
    p = skia.Paint(AntiAlias=True, Color=col); p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, r)); return p
def ink_text(c, b, x, y, a=1.0, shadow=True, tone='ink'):
    """Caption text with no background: near-black on bright scenes, white on dark ones, each with a soft halo for contrast."""
    if tone == 'white':
        if shadow and BOOST:        # white text over a bright picture: a tighter, darker halo so it still reads
            c.drawTextBlob(b, x, y + 2, _blur(skia.Color(0, 0, 0, int(225 * a)), 3.2))
            c.drawTextBlob(b, x, y + 3, _blur(skia.Color(0, 0, 0, int(200 * a)), 8))
        if shadow:
            c.drawTextBlob(b, x, y + 8, _blur(skia.Color(0, 0, 0, int(190 * a)), 13))
            c.drawTextBlob(b, x, y + 3, _blur(skia.Color(0, 0, 0, int(175 * a)), 5))
            c.drawTextBlob(b, x, y + 1, _blur(skia.Color(0, 0, 0, int(120 * a)), 1.6))
        c.drawTextBlob(b, x, y, skia.Paint(AntiAlias=True, Color=skia.Color(255, 255, 255, int(255 * a))))
    else:
        if shadow:
            c.drawTextBlob(b, x, y + 2, _blur(skia.Color(255, 255, 255, int(150 * a)), 11))
            c.drawTextBlob(b, x, y + 1, _blur(skia.Color(255, 255, 255, int(110 * a)), 4))
        c.drawTextBlob(b, x, y, skia.Paint(AntiAlias=True, Color=skia.Color(17, 17, 17, int(255 * a))))

def tone_of(rgb):
    """'ink' if the picture behind the caption is bright enough for black text, else 'white'. rgb = uint8 array (h, w, 3+) of the full frame."""
    import numpy as np
    h, w = rgb.shape[:2]
    reg = rgb[int(h * 0.672):int(h * 0.802), int(w * 0.11):int(w * 0.89), :3].astype(np.float32) / 255.0
    lum = 0.2126 * reg[..., 0] + 0.7152 * reg[..., 1] + 0.0722 * reg[..., 2]
    return 'ink' if (float(lum.mean()) > 0.58 and float(np.percentile(lum, 25)) > 0.42) else 'white'

def paper_card(c, cx, cy, w, h, a=1.0, r=30, grid=300):
    """The reference's pale paper with its faint grid, as a soft-shadowed card."""
    rect = skia.Rect.MakeXYWH(cx - w / 2, cy - h / 2, w, h); rr = skia.RRect.MakeRectXY(rect, r, r)
    ps = skia.Paint(AntiAlias=True, Color=skia.Color(0, 0, 0, int(105 * a))); ps.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 24))
    c.drawRRect(skia.RRect.MakeRectXY(rect.makeOffset(0, 13), r, r), ps)
    pf = skia.Paint(AntiAlias=True)
    pf.setShader(skia.GradientShader.MakeLinear([skia.Point(0, rect.top()), skia.Point(0, rect.bottom())], [skia.Color(233, 233, 229, int(255 * a)), skia.Color(222, 222, 218, int(255 * a))]))
    c.drawRRect(rr, pf)
    c.save(); c.clipRRect(rr, True)
    gl = skia.Paint(Color=skia.Color(246, 246, 243, int(210 * a)), StrokeWidth=2.5, AntiAlias=True)
    x = cx - grid / 2
    while x > rect.left():
        x -= grid
    x += grid
    while x < rect.right():
        c.drawLine(x, rect.top(), x, rect.bottom(), gl); x += grid
    c.drawLine(rect.left(), rect.top() + h * 0.56, rect.right(), rect.top() + h * 0.56, gl)
    c.restore()
    c.drawRRect(rr, skia.Paint(AntiAlias=True, Style=skia.Paint.kStroke_Style, StrokeWidth=1.5, Color=skia.Color(255, 255, 255, int(120 * a))))

def show(tok):
    return re.sub(r'[.,;]+$', '', tok)

CARD_H = 286
def build():
    caps = []
    for lid, mk in MARKUP.items():
        toks = timing.TOK[lid]; k = 0
        for part in mk.split(' / '):
            left, right = part.split('|')
            m = re.search(r'\*([^*]+)\*', right)
            groups = [('l1', left.split()), ('l2', (right[:m.start()] if m else right).split()), ('acc', m.group(1).split() if m else [])]
            words = []
            for kind, ws in groups:
                for wtxt in ws:
                    stok, t = toks[k]
                    assert timing.norm(stok) == timing.norm(wtxt), (lid, stok, wtxt)
                    words.append((show(stok), kind, t)); k += 1
            caps.append(dict(lid=lid, words=words))
        assert k == len(toks), (lid, k, len(toks))
    for i, cp in enumerate(caps):
        ws = cp['words']
        cp['t0'] = ws[0][2] - 0.04
        nxt = caps[i + 1]['words'][0][2] - 0.04 if i + 1 < len(caps) else 1e9
        cp['t1'] = min(nxt, max(ws[-1][2] + 0.7, timing.le(cp['lid']) + 0.3))
        g = {kd: (' '.join(tx for tx, k2, _ in ws if k2 == kd), min([t for _, k2, t in ws if k2 == kd] or [0])) for kd in ('l1', 'l2', 'acc')}
        def lay(sc):
            b1, w1 = tblob(g['l1'][0], 'l1', S1 * sc) if g['l1'][0] else (None, 0)
            b2, w2 = tblob(g['l2'][0], 'l2', S2 * sc) if g['l2'][0] else (None, 0)
            b3, w3 = tblob(g['acc'][0], 'acc', SA * sc) if g['acc'][0] else (None, 0)
            gap = S2 * sc * 0.2 if (b2 and b3) else 0
            return (b1, w1), (b2, w2), (b3, w3), gap
        (b1, w1), (b2, w2), (b3, w3), gap = lay(1.0)
        sc = min(1.0, MAXW / max(w1, w2 + gap + w3, 1))
        if sc < 1.0:
            (b1, w1), (b2, w2), (b3, w3), gap = lay(sc)
        tw = w2 + gap + w3
        cp['items'] = [it for it in [(b1, W / 2 - w1 / 2, BASE2 - LEAD * sc, g['l1'][1]), (b2, W / 2 - tw / 2, BASE2, g['l2'][1]), (b3, W / 2 - tw / 2 + w2 + gap, BASE2, g['acc'][1])] if it[0] is not None]
        cp['w'] = max(max(w1, tw) + 150, 560)
    for i, cp in enumerate(caps):
        cp['chain_in'] = i > 0 and cp['t0'] - caps[i - 1]['t1'] < 0.3
        cp['chain_out'] = i + 1 < len(caps) and caps[i + 1]['t0'] - cp['t1'] < 0.3
        cp['prev_w'] = caps[i - 1]['w'] if cp['chain_in'] else cp['w']
    return caps

CAPS = build()
CARD_CY = BASE2 - 61

def reset():
    pass

def draw_caption(c, gt, arr=None):
    cur = None
    for cp in CAPS:
        if cp['t0'] <= gt:
            cur = cp
        else:
            break
    if cur is None:
        return
    after = gt - cur['t1']
    if after > 0 and not cur['chain_out'] and after > 0.12:
        return
    a = 1.0; pop = 1.0
    if not cur['chain_in']:
        k = clamp((gt - cur['t0']) / 0.16, 0, 1); a = k; pop = 0.93 + 0.07 * back_out(k)
    if after > 0 and not cur['chain_out']:
        a = clamp(1 - after / 0.12, 0, 1)
    tone = TONE or (tone_of(arr) if arr is not None else 'white')
    c.save()
    if after <= 0 or not cur['chain_out']:
        for b, x, y, t in cur['items']:
            k = clamp((gt - t + 0.03) / 0.13, 0, 1)
            if k <= 0:
                continue
            e = ease_out(k) * a * (clamp(1 - after / 0.08, 0, 1) if after > 0 else 1.0)
            ink_text(c, b, x, y + (1 - ease_out(k)) * 16, e, tone=tone)
    c.restore()

# ---------------------------------------------------------------- labels in the same paper style
def chip(c, parts, x, y, age, align='left', scale=0.62, out=None, tone='ink'):
    """A small label (plain text, no card): parts = [(text, 'l2' | 'acc' | 'sub')]; (x, y) = left edge (or centre) and baseline."""
    if age < 0 or (out is not None and out > 0.15):
        return
    k = ease_out(clamp(age / 0.25, 0, 1)); a = k * (clamp(1 - out / 0.15, 0, 1) if out is not None and out > 0 else 1.0)
    sizes = {'l2': S2 * scale, 'acc': SA * scale, 'sub': S1 * scale * 0.78, 'l1': S1 * scale}
    bl = []; tw = 0.0; prev = None
    for text, kind in parts:
        if prev is not None:
            tw += sizes['l2'] * 0.22
        b, wd = tblob(text, kind, sizes[kind]); bl.append((b, tw)); tw += wd; prev = kind
    hh = sizes['l2'] * 1.75; ww = tw + sizes['l2'] * 1.3
    cx = x + ww / 2 if align == 'left' else x
    cy = y - sizes['l2'] * 0.36
    c.save(); c.translate(-(1 - k) * 60 if align == 'left' else 0, (1 - k) * 18 if align != 'left' else 0)
    for b, bx in bl:
        ink_text(c, b, cx - tw / 2 + bx, y, a, tone=tone)
    c.restore()

if __name__ == '__main__':
    for cp in CAPS:
        print(f"{cp['t0']:6.2f} {cp['t1']:6.2f} w={cp['w']:.0f} " + ' '.join(f"{'' if k == 'l1' else '**' if k == 'l2' else '*'}{w}" for w, k, t in cp['words']))
