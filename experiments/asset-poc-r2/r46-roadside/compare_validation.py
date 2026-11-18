"""Fail on changes outside the permitted verge and added roadside detail."""
import json
import sys
from pathlib import Path
root = Path(sys.argv[1])
before = json.loads((root / 'before-audit.json').read_text())
after = json.loads((root / 'after-audit.json').read_text())
checks = {}
for field in ['cameras', 'lights', 'exposure', 'world', 'terrain_boundary']:
    checks[field] = before[field] == after[field]
changed_meshes = [name for name, value in before['geometry'].items() if value != after['geometry'].get(name)]
checks['only_verge_mesh_changes'] = set(changed_meshes) == {'Outer verge and drainage swale', 'Outer verge and drainage swale.001'}
checks['uv_preserved'] = all(after['uv'].get(name) == value for name, value in before['uv'].items())
changed_objects = [name for name, value in before['objects'].items() if value != after['objects'].get(name)]
checks['only_verge_assignment_changes'] = set(changed_objects) == {'Outer verge and drainage swale', 'Outer verge and drainage swale.001'}
checks['protected_materials_preserved'] = all(after['materials'].get(name) == value for name, value in before['materials'].items())
checks['original_image_properties_preserved'] = all(after['images'].get(name) == value for name, value in before['images'].items())
checks['packed_dependencies'] = all(item['packed'] for item in after['images'].values())
checks['instance_contact'] = not after['contact']['floating_or_fully_buried'] and not after['contact']['paved_overlap']
budget = json.loads((root / 'R4_6_Hybrid_Roadside.json').read_text())
repeat = json.loads((root / 'deterministic-repeat.json').read_text())
checks['deterministic_placement'] = budget['placement_sha256'] == repeat['placement_sha256'] and budget['instances'] == repeat['instances']
result = {'checks': checks, 'changed_meshes': changed_meshes, 'changed_original_objects': changed_objects,
          'contact': after['contact'], 'budget': budget,
          'new_images': {name: item for name, item in after['images'].items() if name not in before['images']}}
(root / 'validation.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
assert all(checks.values()), 'Protected-state or contact verification failed'
