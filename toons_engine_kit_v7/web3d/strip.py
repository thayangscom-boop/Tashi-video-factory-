import sys, os
from PIL import Image, ImageDraw
a, b, st = int(sys.argv[1]), int(sys.argv[2]), int(sys.argv[3])
fs = [f for f in range(a, b, st) if os.path.exists(f'out/full/f_{f:04d}.jpg')][:26]
W, H = 166, 295
sh = Image.new('RGB', (W * 13, H * 2))
for i, f in enumerate(fs):
    im = Image.open(f'out/full/f_{f:04d}.jpg').resize((W, H)); d = ImageDraw.Draw(im); d.text((4, 3), str(f), fill=(255, 255, 0)); d.line((0, H * .672, W, H * .672), fill=(255, 0, 255)); sh.paste(im, ((i % 13) * W, (i // 13) * H))
sh.save('out/strip.jpg', quality=80)
