"""Measure periodicity of the packed scans and of matched projected Cycles pixels."""
import argparse
from pathlib import Path
import json
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter1d, map_coordinates

parser=argparse.ArgumentParser()
parser.add_argument("maps",type=Path)
parser.add_argument("images",type=Path,nargs="+")
args=parser.parse_args()

def stats(file):
    with Image.open(file) as im:
        a=np.array(im.convert("RGB").resize((512,512),Image.Resampling.BOX),dtype=float)/255
    if "_diff_" in file.name:
        a=np.where(a<.04045,a/12.92,((a+.055)/1.055)**2.4)
        a=a @ [.2126,.7152,.0722]
    elif "_nor_" in file.name:
        # Tangential components, signed OpenGL samples.
        a=2*a[:,:,:2]-1
    else:
        a=a.mean(axis=-1)
    a=a-a.mean(axis=(0,1))
    p=abs(np.fft.fft2(a,axes=(0,1)))**2
    k=np.fft.fftfreq(a.shape[0])*a.shape[0]
    low=((k[:,None]**2+k[None,:]**2)<=16)
    return {"variance":float(a.var()),"low_band_energy_fraction":float(p[low].sum()/p.sum())}

def station_metrics(file):
    a=np.asarray(Image.open(file).convert("RGB"),dtype=float) @ [.2126,.7152,.0722]
    h,w=a.shape
    s=np.arange(4,113,.10)
    # Six independent traversals between the white lines in the saved rig.
    lateral=np.array([-13.2,-9.8,-6.3,1.7,5.1,8.6])[:,None]
    y=(630+lateral)*np.sin(s/630)
    x=(630+lateral)*np.cos(s/630)-630
    px=(w/2+(57-y)*w/138)-.5
    py=(h/2-(x+4)*w/138)-.5
    v=map_coordinates(a,[py,px],order=1,mode="nearest")
    residual=v-gaussian_filter1d(v,21,axis=1)
    # Variation at the fundamental, projected jointly along the six paths.
    def amplitude(period):
        term=np.exp(-2j*np.pi*s/period)
        return float(np.sqrt(np.mean(abs(2*np.mean(residual*term,axis=1))**2)))
    periods=np.arange(1.6,6.01,.01)
    peaks=sorted([(round(float(t),2),amplitude(t)) for t in periods],key=lambda x:-x[1])
    distinct=[]
    for peak in peaks:
        if all(abs(peak[0]-p[0])>.3 for p in distinct):
            distinct.append(peak)
        if len(distinct)==4:
            break
    phase=2*np.mean(residual*np.exp(-2j*np.pi*s/4),axis=1)
    strongest=int(np.argmax(abs(phase)))
    return {"4m_amplitude_8bit":amplitude(4),"2m_amplitude_8bit":amplitude(2),
            "2_1m_amplitude_8bit":amplitude(2.1),"peaks":distinct,
            "4m_per_traverse_amplitude":dict(zip(map(str,lateral.ravel()),map(float,abs(phase)))),
            "strongest_traverse_m":float(lateral[strongest,0]),
            "strongest_bright_phase_station_mod4_m":float((-np.angle(phase[strongest])*4/(2*np.pi))%4)}

result={"source_maps":{p.name:stats(p) for p in sorted(args.maps.glob("*.jpg"))},
        "orthographic_measurements":{str(p):station_metrics(p) for p in args.images}}
print(json.dumps(result,indent=2))
