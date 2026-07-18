import bpy
import sys
from mathutils import Vector


model_path, preview_path = sys.argv[sys.argv.index("--") + 1 :]
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=model_path)
model = next(item for item in bpy.context.scene.objects if item.type == "MESH" and item.name.startswith("Nibi_CoDoHoaLu"))
corners = [model.matrix_world @ Vector(corner) for corner in model.bound_box]
minimum = Vector((min(corner[i] for corner in corners) for i in range(3)))
maximum = Vector((max(corner[i] for corner in corners) for i in range(3)))
center = (minimum + maximum) / 2
height = maximum.z - minimum.z
bpy.context.scene.render.engine = "BLENDER_EEVEE"
bpy.context.scene.render.resolution_x = 512
bpy.context.scene.render.resolution_y = 768
bpy.context.scene.render.resolution_percentage = 100
bpy.context.scene.render.image_settings.file_format = "PNG"
bpy.context.scene.render.filepath = preview_path
bpy.context.scene.world.color = (.055, .055, .055)
camera_data = bpy.data.cameras.new("PreviewCamera")
camera = bpy.data.objects.new("PreviewCamera", camera_data)
bpy.context.collection.objects.link(camera)
camera.location = center + Vector((0, height * 2.4, height * .08))
camera.rotation_euler = (center + Vector((0, 0, height * .1)) - camera.location).to_track_quat("-Z", "Y").to_euler()
camera.data.lens = 55
bpy.context.scene.camera = camera
for lateral, energy in ((1.45, 1100), (-1.25, 850)):
    data = bpy.data.lights.new("PreviewArea", "AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = height
    light = bpy.data.objects.new("PreviewArea", data)
    bpy.context.collection.objects.link(light)
    light.location = center + Vector((lateral * height, height * 1.35, height * 1.7))
    light.rotation_euler = (center - light.location).to_track_quat("-Z", "Y").to_euler()
bpy.ops.render.render(write_still=True)
