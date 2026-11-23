import sys,glob
from PIL import Image, ImageDraw
fs=sorted(glob.glob(sys.argv[1]+'/t*.jpg'),key=lambda f:float(f.split('/t')[-1][:-4]))
cols=int(sys.argv[3]) if len(sys.argv)>3 else 6; w=270; h=480
rows=(len(fs)+cols-1)//cols; S=Image.new('RGB',(cols*w,rows*(h+22)),(30,30,30)); d=ImageDraw.Draw(S)
for i,f in enumerate(fs):
    im=Image.open(f).resize((w,h)); x=(i%cols)*w; y=(i//cols)*(h+22); S.paste(im,(x,y+22)); d.text((x+4,y+4),f.split('/')[-1],fill=(255,255,0))
S.save(sys.argv[2],quality=88)
