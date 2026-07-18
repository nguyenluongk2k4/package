import bpy
import os
import sys


folder = sys.argv[sys.argv.index("--") + 1]
bpy.ops.import_scene.fbx(filepath=os.path.join(folder, "base_basic_pbr.fbx"))
obj = next(item for item in bpy.context.scene.objects if item.type == "MESH")
print("OBJECT", [round(value, 4) for value in obj.dimensions])
print("BOUNDS", [
    (round(min(vertex.co[axis] for vertex in obj.data.vertices), 4), round(max(vertex.co[axis] for vertex in obj.data.vertices), 4))
    for axis in range(3)
])
