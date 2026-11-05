# ROAD_COORDINATES — contract1.0.0 / A.4.2

## Подтверждённые координаты

Three.js world is right-handed: +Y up; unrotated vehicle/front +Z, right+X. Distances in metres, speeds m/s, angles radians. Renderer camera looks along its own −Z; asset fronts use +Z. Do not copy camera convention into asset meshes. Default vehicle/player moves toward increasing `s`, on the negative-offset carriageway. Other carriageway moves toward decreasing `s`.

**`s` is global centreline Z parameter, not distance along arc.** `t` is horizontal perpendicular offset, positive right when looking toward increasing s, regardless of travel direction. With C(s)=road.center(s), g=C′(s), n=√(1+g²), H(s)=road.height(s), origin=road.origin:

```
x = C(s) + t/n
y = H(s)
z_render = s - t*g/n - origin
yaw = atan(g)
```

These are exact current Highway.point equations. `Highway.curvature(s)` returns C″(s), not geometric curvature. Horizontal curvature is C″/(1+g²)^(3/2). Centreline arc differential is √(1+g²+H′²)ds. Current NPC integration compensates the horizontal gradient only. Do not reinterpret any of these signals or modify AI in this stage.

| Lane index | Offset t, m | Direction in s | Player start |
|---|---:|---:|---|
| 0 | −3.8 | +1 | |
| 1 | −7.4 | +1 | default |
| 2 | −11 | +1 | |
| 3 | +3.8 | −1 | |
| 4 | +7.4 | −1 | |
| 5 | +11 | −1 | |

Lane width3.6m. Asphalt t−14…14, grass median−1.6…1.6, shoulders14…16 on both sides. Physics surface mask: asphalt1.6≤|t|≤14; gravel beyond that up to16; grass elsewhere, with boundary details in reference/highway.js. Visual grass/line overlays have small lifts that are not collision heights.

## Frame for assets

The adapter returns position, right, up, forward, quaternion. Orientation only, no scale. Quaternion maps local asset+X/+Y/+Z to these orthonormal axes.

`alignment:'upright'`: R=(1,0,−g)/n, F=(g,0,1)/n, U=(0,1,0). Posts, trees and signs remain vertical; this matches A.4.2 instances' yaw-only orientation.

`alignment:'surface'`: use the actual derivative of the offset surface:

```
P_s = (g - t*g*C″/n³, H′, 1 - t*C″/n³)
H′ = 5/950*cos(s/950) + 2/380*cos(s/380)
F = normalize(P_s)
R = (1,0,-g)/n
U = normalize(F × R)
```

This frame follows existing rises/descents, no bank. For facing−1 reverse R and F, keep U. Position still uses the same global t, never negate t simply because traffic is oncoming. Sign text face has normal local+Z: facing=−travelDirection. Lamps usually face inward through their authored shape/local part transform, not negative object scale.

## Chunk local space — important legacy detail

CHUNK200; key=floor(s/200), including negative s. Range[s0,s1), s0=key*200. Current Group transform is translation `(0,0,s0-origin)`. Child geometry still contains global-like X and absolute Y; only Z is chunk-local:

```
P_chunk = (P_render.x, P_render.y, P_render.z + origin - s0)
P_render = Group.matrixWorld * P_chunk
```

It is **not** a rigid tangent frame centred at the segment start. Do not subtract C(s0), H(s0), or apply yaw to the entire chunk: curved strips would be misplaced/double rotated. Instance orientation samples local s; repeat anchors need individual transforms. Span meshes sweep samples rather than stretching a straight200m rectangle.

Highway.rebase triggers when |vehicle.z|≥2000; shift=trunc(vehicle.z/1000)*1000. origin+=shift, all physical node/NPC worldZ subtract shift, caches/cameras notified by app. Global s/key/seed stay unchanged. Visual host updates chunk Group.z exactly once. Child matrices/vertices stay unchanged. Do not subtract shift again per child or change global anchor s. Example rebase uses the current origin as an idempotent absolute assignment.

## Future-compatible extension, not implemented

Adapter identifier is `legacy-global-z-v1`. Future spline/arc-length/banked road must provide a new parameterization ID, position/right/up/forward frame, a full segment world transform, toSegmentLocal conversion and explicit conversion of progress data. It cannot silently change the meaning of s, terrain/project/traffic/camera-road queries. Road graph later needs roadId/branchId plus longitudinal progress; assets must never select a neighbouring branch from nearest-world-point distance. In the current single highway branch roadId is highway-main. Persistent anchors are `{roadId, segmentKey, globalS, t, slot, seed}`; world coordinates are transient.
