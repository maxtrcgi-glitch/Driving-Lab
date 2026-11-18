"""R4.5.1 ground-only correction, starting from the packed R4.5 candidate."""
import bpy
from pathlib import Path
import sys
s = bpy.data.scenes['C_STOCHASTIC_FINAL']
bpy.context.window.scene = s

def build(old_name, kind):
    old = bpy.data.materials[old_name]
    old.use_fake_user = True
    mat = bpy.data.materials.new('R451 | ' + kind)
    mat.use_nodes = True
    n = mat.node_tree.nodes
    l = mat.node_tree.links
    n.clear()

    def node(t, label):
        v = n.new(t)
        v.label = label
        return v

    def math(op, a, b=None):
        v = node('ShaderNodeMath', op)
        v.operation = op
        for i, x in enumerate([a, b]):
            if x is None:
                continue
            if isinstance(x, (int, float)):
                v.inputs[i].default_value = x
            else:
                l.new(x, v.inputs[i])
        return v.outputs[0]

    def vector(op, a, b=None):
        v = node('ShaderNodeVectorMath', op)
        v.operation = op
        for i, x in enumerate([a, b]):
            if x is None:
                continue
            if isinstance(x, tuple):
                v.inputs[i].default_value = x
            else:
                l.new(x, v.inputs[i])
        return v.outputs['Value' if op == 'LENGTH' else 'Vector']

    def scale(a, f):
        v = node('ShaderNodeVectorMath', 'Weighted tangent vector')
        v.operation = 'SCALE'
        l.new(a, v.inputs[0])
        if isinstance(f, (float, int)):
            v.inputs['Scale'].default_value = f
        else:
            l.new(f, v.inputs['Scale'])
        return v.outputs[0]

    def blend(a, b, w, normal=False):
        result = vector('ADD', scale(a, math('SUBTRACT', 1, w)), scale(b, w))
        return vector('NORMALIZE', result) if normal else result

    def ramp(f, lo, hi):
        v = node('ShaderNodeMapRange', 'Bounded material selection')
        v.clamp = True
        l.new(f, v.inputs['Value'])
        v.inputs['From Min'].default_value = lo
        v.inputs['From Max'].default_value = hi
        v.interpolation_type = 'SMOOTHSTEP'
        return v.outputs[0]
    uv = node('ShaderNodeUVMap', 'Original surface metres')
    uv.uv_map = 'Surface metres'
    pos = node('ShaderNodeNewGeometry', 'World position')
    xyz = node('ShaderNodeSeparateXYZ', 'Plan coordinates')
    l.new(pos.outputs['Position'], xyz.inputs[0])
    xy = node('ShaderNodeCombineXYZ', 'Horizontal coordinates')
    l.new(xyz.outputs['X'], xy.inputs['X'])
    l.new(xyz.outputs['Y'], xy.inputs['Y'])
    radius = vector('LENGTH', vector('ADD', xy.outputs[0], (630, 0, 0)))
    lateral = math('SUBTRACT', radius, 630)
    distance = math('MAXIMUM', math('SUBTRACT', lateral, 13.8), math('SUBTRACT', -17, lateral))
    noise = node('ShaderNodeTexNoise', 'Roadside cover variation, 1.7 m')
    noise.inputs['Scale'].default_value = 0.6
    noise.inputs['Detail'].default_value = 2
    l.new(pos.outputs['Position'], noise.inputs['Vector'])
    fringe = math('ADD', distance, math('MULTIPLY', math('SUBTRACT', noise.outputs['Fac'], 0.5), 0.9))
    cover = ramp(fringe, 0.35, 1.8) if kind == 'verge transition' else ramp(noise.outputs['Fac'], 0.28, 0.64)
    if kind == 'median gravel':
        cover = math('MULTIPLY', noise.outputs['Fac'], 0)
    broad = node('ShaderNodeTexNoise', 'Non-periodic scan selection, 10 m')
    broad.inputs['Scale'].default_value = 0.1
    broad.inputs['Detail'].default_value = 1
    l.new(pos.outputs['Position'], broad.inputs['Vector'])
    choice = ramp(broad.outputs['Fac'], 0.46, 0.54)
    uv2 = vector('ADD', uv.outputs[0], (0.371, 0.619, 0))

    def sample(stem, coords):
        out = []
        names = ['grass-diff.jpg', 'grass-rough.jpg', 'grass-nor_gl.jpg'] if stem == 'grass' else ['gravel_road_diff_1k.jpg', 'gravel_road_rough_1k.jpg', 'gravel_road_nor_gl_1k.jpg']
        for i, name in enumerate(names):
            t = node('ShaderNodeTexImage', name)
            t.image = bpy.data.images[name]
            if i > 0:
                assert t.image.colorspace_settings.name == 'Non-Color', name
            l.new(coords, t.inputs['Vector'])
            value = t.outputs['Color']
            if i == 2:
                value = vector('NORMALIZE', vector('ADD', scale(value, 2), (-1, -1, -1)))
            out.append(value)
        return out

    def scan(stem):
        a = sample(stem, uv.outputs[0])
        b = sample(stem, uv2)
        return [blend(a[i], b[i], choice, i == 2) for i in range(3)]
    gravel = scan('gravel')
    grass = scan('grass')
    mineral_color = vector('MULTIPLY', gravel[0], (.74, .76, .64))
    cover_color = vector('MULTIPLY', grass[0], (.58, .95, .58))
    color = blend(mineral_color, cover_color, cover)
    normal = blend(gravel[2], grass[2], cover, True)
    encoded = vector('ADD', scale(normal, 0.5), (0.5, 0.5, 0.5))
    decoder = node('ShaderNodeNormalMap', 'Normalized tangent normal in original UV basis')
    decoder.uv_map = 'Surface metres'
    decoder.inputs['Strength'].default_value = 0.65
    l.new(encoded, decoder.inputs['Color'])
    shader = node('ShaderNodeBsdfPrincipled', 'Ground PBR')
    l.new(color, shader.inputs['Base Color'])
    l.new(blend(gravel[1], grass[1], cover), shader.inputs['Roughness'])
    l.new(decoder.outputs[0], shader.inputs['Normal'])
    output = node('ShaderNodeOutputMaterial', 'Output')
    l.new(shader.outputs[0], output.inputs['Surface'])
    for o in bpy.data.objects:
        for slot in o.material_slots:
            if slot.material == old:
                slot.material = mat
    for i, v in enumerate(n):
        v.location = (i % 8 * 230, -(i // 8) * 250)
    mat['normal_method'] = 'decode 2c-1; normalize; weighted tangent-vector interpolation; normalize; encode; tangent-to-world once'
for name, kind in [('R45 | Verge | compacted gravel, muted', 'median gravel'), ('R45 | Verge | gravel to leafy grass', 'verge transition'), ('R45 | Verge | leafy grass', 'distant ground')]:
    build(name, kind)
out = Path(sys.argv[sys.argv.index('--') + 1])
out.parent.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out.resolve()))
