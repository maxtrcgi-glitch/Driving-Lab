"""Arrange and annotate matched Cycles outputs, leaving PNG source pixels intact."""
from pathlib import Path
import math
from PIL import Image, ImageDraw, ImageFont, ImageOps

root=Path(__file__).resolve().parent
after=root/"delivery"
before=root/"source"
repo=root/"review"
repo.mkdir(exist_ok=True)
font_path="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
pairs=[
    ("driver",before/"driver.png",after/"driver.png","Driver Eye"),
    ("roadside",before/"roadside.png",after/"roadside.png","Roadside"),
    ("overview",before/"overview.png",after/"overview.png","Overview"),
    ("raking",before/"diagnostic-after.png",after/"diagnostic-after.png","Raking-light close-up"),
    ("long",after/"long-overview-baseline.png",after/"long-overview.png","138 m repeat inspection"),
]
for name,path_a,path_b,title in pairs:
    for width,base,quality in ((1152,after,94),(666,repo,85)):
        h=width*(720 if name=="long" else 9)//(1536 if name=="long" else 16)
        stack=name=="long"
        canvas=Image.new("RGB",(width if stack else 2*width+8,(h+42)*(2 if stack else 1)),"#161d22")
        d=ImageDraw.Draw(canvas)
        font=ImageFont.truetype(font_path,22 if width>1000 else 18)
        for i,(p,label) in enumerate(((path_a,"A · R4.3c"),(path_b,"B · Stochastic"))):
            x=0 if stack else i*(width+8)
            y=i*(h+42) if stack else 0
            image=ImageOps.contain(Image.open(p).convert("RGB"),(width,h))
            canvas.paste(image,(x+(width-image.width)//2,y+42))
            d.text((x+10,y+8),f"{title} · {label}",font=font,fill="white")
        canvas.save(base/(name+"-comparison.jpg"),quality=quality,optimize=True)

def project(s,x):
    world_y=(630+x)*math.sin(s/630)
    world_x=(630+x)*math.cos(s/630)-630
    return round(768+(57-world_y)*1536/138),round(360-(world_x+4)*1536/138)

card=Image.new("RGB",(1080,372),"#161d22")
draw=ImageDraw.Draw(card)
font=ImageFont.truetype(font_path,18)
for i,p in enumerate((after/"long-overview-baseline.png",after/"long-overview.png")):
    img=Image.open(p).convert("RGB")
    px,py=project(53.3,-6.3)
    width,height=532,200
    x0,y0=px-width//2,py-height//2
    patch=img.crop((x0,y0,x0+width,y0+height))
    dx=i*540
    card.paste(patch,(dx,45))
    title=("A · 4 m phase markers","B · Same road positions")[i]
    draw.text((dx+9,10),title,fill="white",font=font)
    for s in (41.3,45.3,49.3,53.3,57.3,61.3,65.3):
        qx,qy=project(s,-6.3)
        xx,yy=dx+qx-x0,45+qy-y0
        draw.line((xx,yy+6,xx,yy+15),fill="#ffcc54",width=2)
    draw.text((dx+9,253),"Offsets from modeled centerline: −6.3 m",fill="white",font=font)
    qx,qy=project(41.2,5.6)
    repair=img.crop((qx-90,qy-40,qx+90,qy+40))
    card.paste(repair,(dx+10,282))
    draw.text((dx+203,307),"41 m light inlay",fill="white",font=font)
for basedir in (after,repo):
    card.save(basedir/"period-and-repair.jpg",quality=89,optimize=True)

crop = (100, 500, 560, 680)
width, height = crop[2] - crop[0], crop[3] - crop[1]
card = Image.new("RGB", (2 * width + 8, height + 42), "#161d22")
draw = ImageDraw.Draw(card)
for i, (path, label) in enumerate(((before / "diagnostic-after.png", "A · R4.3c"), (after / "diagnostic-after.png", "B · Stochastic"))):
    x = i * (width + 8)
    card.paste(Image.open(path).convert("RGB").crop(crop), (x, 42))
    draw.text((x + 10, 8), f"Raking light at 1:1 · {label}", fill="white", font=font)
for basedir in (after, repo):
    card.save(basedir / "raking-detail.jpg", quality=95, optimize=True)
