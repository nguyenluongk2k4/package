import bpy
import os
import sys
from mathutils import Vector


SOURCE_FOLDER = sys.argv[sys.argv.index("--") + 1]
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=os.path.join(SOURCE_FOLDER, "base_basic_pbr.fbx"))
mesh = next(item.data for item in bpy.context.scene.objects if item.type == "MESH")
image = bpy.data.images.load(os.path.join(SOURCE_FOLDER, "texture_diffuse.png"), check_existing=False)
width, height = image.size
pixels = [0.0] * (width * height * 4)
image.pixels.foreach_get(pixels)
uvs = mesh.uv_layers.active.data


def colour(uv):
    x = min(width - 1, max(0, int(uv.x * width)))
    y = min(height - 1, max(0, int(uv.y * height)))
    pixel = (y * width + x) * 4
    return pixels[pixel:pixel + 3]


candidates = set()
for face in mesh.polygons:
    if face.center.z < 1.16:
        continue
    uv = sum((uvs[i].uv for i in face.loop_indices), Vector((0, 0))) / len(face.loop_indices)
    red, green, blue = colour(uv)
    if (red < .78 and green < .42 and blue < .35 and red > green * 1.2) or (red < .16 and green < .16 and blue < .16):
        candidates.add(face.index)

edge_faces = {}
for face in mesh.polygons:
    for edge in face.edge_keys:
        edge_faces.setdefault(tuple(sorted(edge)), []).append(face.index)
adjacency = {index: set() for index in candidates}
for faces in edge_faces.values():
    selected = [face for face in faces if face in candidates]
    if len(selected) > 1:
        adjacency[selected[0]].update(selected[1:])
        adjacency[selected[1]].add(selected[0])

components, visited = [], set()
for start in candidates:
    if start in visited:
        continue
    queue, part = [start], []
    while queue:
        face_index = queue.pop()
        if face_index in visited:
            continue
        visited.add(face_index)
        part.append(face_index)
        queue.extend(adjacency[face_index] - visited)
    centers = [mesh.polygons[index].center for index in part]
    components.append({
        "faces": len(part),
        "min": [round(min(point[i] for point in centers), 3) for i in range(3)],
        "max": [round(max(point[i] for point in centers), 3) for i in range(3)],
        "sample": sorted(part)[:8],
    })
components.sort(key=lambda part: part["faces"], reverse=True)
print("HAIR_COMPONENTS", components[:30])
