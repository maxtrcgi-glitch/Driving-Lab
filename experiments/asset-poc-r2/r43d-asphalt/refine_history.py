"""Revise just the 41 m inlay in the packed R4.3c history mask."""
import argparse
import json
from pathlib import Path
import numpy as np
from PIL import Image

p=argparse.ArgumentParser()
p.add_argument("source",type=Path)
p.add_argument("measurements",type=Path)
p.add_argument("recipe",type=Path)
p.add_argument("output",type=Path)
a=p.parse_args()
m=json.loads(a.measurements.read_text())
r=json.loads(a.recipe.read_text())
density=m["mask_density_px_per_m"]
origin=np.array(m["uv_extent_m"][0])
pixels=np.array(Image.open(a.source).convert("RGBA"))[::-1].copy()
# Enclose the old and new polygons. All pixels outside this window stay exact.
lo=np.floor((np.array([3.3,39.1])-origin)*density).astype(int)
hi=np.ceil((np.array([7.9,43.1])-origin)*density).astype(int)
xs,ys=slice(lo[0],hi[0]),slice(lo[1],hi[1])
x=origin[0]+(np.arange(lo[0],hi[0])[None,:]+.5)/density
y=origin[1]+(np.arange(lo[1],hi[1])[:,None]+.5)/density
tile=pixels[ys,xs]

def smooth(x):
    t=np.clip(x,0,1)
    return t*t*(3-2*t)

def dist(a,b):
    dx,dy=b[0]-a[0],b[1]-a[1]
    t=np.clip(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy),0,1)
    return np.hypot(x-a[0]-t*dx,y-a[1]-t*dy)

poly=r["polygon"]
inside=np.zeros(tile.shape[:2],bool)
distance=np.full(tile.shape[:2],np.inf)
for a0,b0 in zip(poly,poly[1:]+poly[:1]):
    if a0[1]!=b0[1]:
        inside^=((a0[1]>y)!=(b0[1]>y)) & (x<(b0[0]-a0[0])*(y-a0[1])/(b0[1]-a0[1])+a0[0])
    distance=np.minimum(distance,dist(a0,b0))
tile[:,:,2]=np.rint(255*smooth(.5+np.where(inside,distance,-distance)/(2*r["feather_m"])))
line=np.minimum.reduce([dist(v,w) for v,w in zip(r["seal"],r["seal"][1:])])
rim=1-smooth(line/r["seal_half_width_m"])
tile[:,:,3]=np.maximum(tile[:,:,3],np.rint(255*r["seal_strength"]*rim))
Image.fromarray(pixels[::-1]).save(a.output)
