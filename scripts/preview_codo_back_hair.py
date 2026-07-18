import bpy
import math
import os
import sys
from mathutils import Vector


SOURCE_FOLDER, PREVIEW_PATH = sys.argv[sys.argv.index("--") + 1 :]


def create_hair_cap():
    center = Vector((0.18, 0.02, 1.24))
    radius = Vector((0.36, 0.29, 0.34))
    rings, segments = 16, 36
    vertices, faces = [], []
    # Rear hemisphere with a very small side overlap, so the cap joins the
    # existing fringe but never paints across the face.
    start, end = -0.22, math.pi + 0.22
    for ring in range(rings + 1):
        theta = math.pi * ring / rings
        for segment in range(segments + 1):
            phi = start + (end - start) * segment / segments
            vertices.append(center + Vector((
                radius.x * math.sin(theta) * math.cos(phi),
                radius.y * math.sin(theta) * math.sin(phi),
                radius.z * math.cos(theta),
            )))
    for ring in range(rings):
        for segment in range(segments):
            first = ring * (segments + 1) + segment
            faces.append((first, first + 1, first + segments + 2, first + segments + 1))
    mesh = bpy.data.meshes.new("Nibi_CoDoHoaLu_BackHair")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    cap = bpy.data.objects.new("Nibi_CoDoHoaLu_BackHair", mesh)
    bpy.context.collection.objects.link(cap)
    material = bpy.data.materials.new("Nibi_CoDoHoaLu_Hair_Matte")
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (0.008, 0.012, 0.02, 1)
    shader.inputs["Metallic"].default_value = 0.0
    shader.inputs["Roughness"].default_value = 0.7
    shader.inputs["Specular IOR Level"].default_value = 0.12
    cap.data.materials.append(material)
    for polygon in cap.data.polygons:
        polygon.use_smooth = True
    return cap


bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=os.path.join(SOURCE_FOLDER, "base_basic_pbr.fbx"))
mesh_object = next(item for item in bpy.context.scene.objects if item.type == "MESH")
create_hair_cap()

corners = [mesh_object.matrix_world @ Vector(corner) for corner in mesh_object.bound_box]
minimum = Vector((min(corner[axis] for corner in corners) for axis in range(3)))
maximum = Vector((max(corner[axis] for corner in corners) for axis in range(3)))
center = (minimum + maximum) / 2
height = maximum.z - minimum.z
bpy.context.scene.render.engine = "BLENDER_EEVEE"
bpy.context.scene.render.resolution_x = 768
bpy.context.scene.render.resolution_y = 1024
bpy.context.scene.render.resolution_percentage = 100
bpy.context.scene.render.image_settings.file_format = "PNG"
bpy.context.scene.render.filepath = PREVIEW_PATH
bpy.context.scene.world.color = (0.055, 0.055, 0.055)
camera_data = bpy.data.cameras.new("PreviewCamera")
camera = bpy.data.objects.new("PreviewCamera", camera_data)
bpy.context.collection.objects.link(camera)
camera.location = center + Vector((0, height * 2.4, height * .08))
camera.rotation_euler = (center + Vector((0, 0, height * .1)) - camera.location).to_track_quat("-Z", "Y").to_euler()
camera.data.lens = 55
bpy.context.scene.camera = camera
for location, energy in [
    (center + Vector((height * 1.5, height * 1.5, height * 2.2)), 1200),
    (center + Vector((-height * 1.3, height * .7, height * 1.4)), 900),
]:
    light_data = bpy.data.lights.new("PreviewArea", "AREA")
    light_data.energy = energy
    light_data.shape = "DISK"
    light_data.size = height
    light = bpy.data.objects.new("PreviewArea", light_data)
    bpy.context.collection.objects.link(light)
    light.location = location
    light.rotation_euler = (center - location).to_track_quat("-Z", "Y").to_euler()
bpy.ops.render.render(write_still=True)
print("BACK_HAIR_PREVIEW", PREVIEW_PATH)
