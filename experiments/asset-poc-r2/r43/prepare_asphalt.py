"""Create reusable daylight-independent tiles from the packed Asphalt Track maps."""
from pathlib import Path
import sys
import numpy as np
from PIL import Image

root = Path(sys.argv[1])
def source(channel):
    image = Image.open(root / f'asphalt_track_{channel}_2k.jpg')
    return image.resize((1024,1024),Image.Resampling.LANCZOS)

rgb = np.asarray(source('diff').convert('RGB'),dtype=np.float32)
luminance = rgb @ np.array([.2126,.7152,.0722],dtype=np.float32)
# Compress aggregate contrast and remove the source's warm tint.
detail = np.clip(luminance, 10, 78) - 29
gray = 43.5 + detail * .53
base = np.stack((gray+.8,gray+.5,gray),axis=-1)
Image.fromarray(np.rint(base).astype('uint8')).save(root/'asphalt-base.png')
roughness = np.asarray(source('rough').convert('L'),dtype=np.float32)
roughness = np.rint(np.clip(210 + (roughness - 212)*.62, 181, 230)).astype('uint8')
Image.fromarray(roughness).save(root/'asphalt-rough.png')
source('nor_gl').convert('RGB').save(root/'asphalt-normal.png')
