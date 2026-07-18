import bpy
import json
import sys


FBX_PATH = sys.argv[sys.argv.index("--") + 1]
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=FBX_PATH)
mesh = next(item.data for item in bpy.context.scene.objects if item.type == "MESH")
report = []
for threshold in (-.85, -.75, -.65, -.55, -.45, -.35):
    faces = [polygon for polygon in mesh.polygons if polygon.center.z < threshold]
    flat = [polygon for polygon in faces if abs(polygon.normal.z) > .8]
    report.append({
        "below": threshold,
        "faces": len(faces),
        "flat_faces": len(flat),
        "flat_up": sum(polygon.normal.z > 0 for polygon in flat),
        "flat_down": sum(polygon.normal.z < 0 for polygon in flat),
        "area": round(sum(polygon.area for polygon in flat), 4),
    })
print(json.dumps(report))
