"""TikTok / YouTube cover: one full-size engine frame + title in the caption type.
   python3 cover.py frame.jpg out.jpg "Title line in bold" "accent word(s)" ["True story" "1995"]
   The top tag is optional (leave it out for a story that is not verified as true)."""
import sys, os, numpy as np, skia, cv2
ROOT = os.path.dirname(os.path.abspath(__file__)); os.chdir(ROOT); sys.path.insert(0, ROOT)
from captions import tblob, ink_text
W, H = 1080, 1920
im = cv2.imread(sys.argv[1]); im = cv2.resize(im, (W, H), interpolation=cv2.INTER_LANCZOS4) if im.shape[1] != W else im
arr = np.ascontiguousarray(cv2.cvtColor(im, cv2.COLOR_BGR2RGBA)); surf = skia.Surface(arr); c = surf.getCanvas()
y2 = 1540; y1 = y2 - 86 * 1.3 * 1.42
shd = skia.GradientShader.MakeLinear([skia.Point(0, y1 - 330), skia.Point(0, y2 + 300)], [skia.Color(0, 0, 0, 0), skia.Color(0, 0, 0, 135), skia.Color(0, 0, 0, 135), skia.Color(0, 0, 0, 0)], [0, 0.42, 0.66, 1])
p = skia.Paint(AntiAlias=True); p.setShader(shd); c.drawRect(skia.Rect.MakeLTRB(0, y1 - 330, W, y2 + 300), p)
def line(parts, cx, y, maxw=990):
    bl = []; tw = 0.0
    for i, (text, kind, size) in enumerate(parts):
        if i: tw += size * 0.2
        b, wd = tblob(text, kind, size); bl.append((b, tw)); tw += wd
    k = min(1.0, maxw / tw)
    c.save(); c.translate(cx, y); c.scale(k, k)
    for b, bx in bl: ink_text(c, b, -tw / 2 + bx, 0, tone='white')
    c.restore()
line([(sys.argv[3], 'l2', 86 * 1.05)], W / 2, y1)
line([(sys.argv[4], 'acc', 128 * 1.75)], W / 2, y2 + 40)
if len(sys.argv) > 6: line([(sys.argv[5], 'l2', 86 * 0.62), (sys.argv[6], 'acc', 128 * 0.62)], W / 2, 312)
surf.flushAndSubmit(); cv2.imwrite(sys.argv[2], cv2.cvtColor(arr, cv2.COLOR_RGBA2BGR), [cv2.IMWRITE_JPEG_QUALITY, 93]); print('wrote', sys.argv[2])
