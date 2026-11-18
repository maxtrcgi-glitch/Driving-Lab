"""Arrange unretouched same-camera renders and 1:1 material crops."""
from pathlib import Path
import sys
from PIL import Image, ImageDraw
root = Path(sys.argv[1])
regions = [
    ('Concrete', 'driver', (0,310,430,410)),
    ('Galvanized steel', 'roadside', (650,300,1152,450)),
    ('Compacted gravel', 'overview', (320,400,570,600)),
    ('Ground and grass', 'roadside', (680,450,1100,630)),
    ('Marking paint', 'roadside', (100,425,500,625)),
]
sheet = Image.new('RGB', (1040, 1240), '#202327')
draw = ImageDraw.Draw(sheet)
for i, (label, view, box) in enumerate(regions):
    y=i*248
    draw.text((12,y+8), label + ' — before / after, source pixels 1:1', fill='white')
    for j, state in enumerate(['before','after']):
        im=Image.open(root/state/(view+'.png')).convert('RGB').crop(box)
        sheet.paste(im,(j*520+8,y+35))
sheet.save(root/'material-contact-sheet.png')
for view in ['driver','roadside','overview']:
    pair=Image.new('RGB',(2304,676),'#202327'); d=ImageDraw.Draw(pair)
    for i,state in enumerate(['before','after']):
        d.text((i*1152+8,7),state+' — '+view,fill='white')
        pair.paste(Image.open(root/state/(view+'.png')).convert('RGB'),(i*1152,28))
    pair.save(root/(view+'-comparison.png'))
