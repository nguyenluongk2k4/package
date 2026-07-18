import bpy
import json
import os
import sys


FBX_PATH = sys.argv[sys.argv.index("--") + 1]
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=FBX_PATH)


def components(mesh):
    parent = list(range(len(mesh.vertices)))
    def find(index):
        while parent[index] != index:
            parent[index] = parent[parent[index]]
            index = parent[index]
        return index
    def union(first, second):
        first, second = find(first), find(second)
        if first != second:
            parent[second] = first
    for edge in mesh.edges:
        union(*edge.vertices)
    groups = {}
    for vertex in range(len(mesh.vertices)):
        groups.setdefault(find(vertex), []).append(vertex)
    return sorted(groups.values(), key=len, reverse=True)


result = []
for obj in [item for item in bpy.context.scene.objects if item.type == "MESH"]:
    mesh = obj.data
    for group in components(mesh)[:30]:
        vertices = [mesh.vertices[index].co for index in group]
        vertex_set = set(group)
        faces = sum(all(index in vertex_set for index in polygon.vertices) for polygon in mesh.polygons)
        result.append({
            "object": obj.name,
            "vertices": len(group),
            "faces": faces,
            "min": [round(min(vertex[axis] for vertex in vertices), 4) for axis in range(3)],
            "max": [round(max(vertex[axis] for vertex in vertices), 4) for axis in range(3)],
        })
print(json.dumps(result, ensure_ascii=False))
