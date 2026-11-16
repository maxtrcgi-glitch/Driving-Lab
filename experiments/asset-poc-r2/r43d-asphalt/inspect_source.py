"""Extract the existing packed scan channels and inventory the saved material graph."""
from pathlib import Path
import sys
import bpy
root=Path(sys.argv[sys.argv.index("--")+1])
root.mkdir(parents=True,exist_ok=True)
mat=bpy.data.materials["C_FINAL_CANDIDATE"]
print("BASELINE NODES",len(mat.node_tree.nodes))
for n in mat.node_tree.nodes:
    if n.type=="TEX_IMAGE":
        im=n.image
        print(n.label or n.name,im.name,tuple(im.size),im.colorspace_settings.name)
        if im.name.startswith(("asphalt_04_","asphalt_01_")):
            (root/im.name).write_bytes(im.packed_file.data)
