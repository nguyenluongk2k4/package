import bmesh
import bpy
import sys
from mathutils import Vector


FBX_PATH, PREVIEW_PATH = sys.argv[sys.argv.index("--") + 1 :]
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=FBX_PATH)
model = next(item for item in bpy.context.scene.objects if item.type == "MESH")
mesh = model.data
bm = bmesh.new()
bm.from_mesh(mesh)
remove = []
for face in bm.faces:
    center = face.calc_center_median()
    if center.z < -.70 and (abs(face.normal.z) > .78 or abs(center.x) > .65 or abs(center.y) > .47):
        remove.append(face)
bmesh.ops.delete(bm, geom=remove, context="FACES")
bm.to_mesh(mesh)
bm.free()
mesh.update()

source = mesh.materials[0]
image_node = next(node for node in source.node_tree.nodes if node.type == "TEX_IMAGE" and node.image)
material = bpy.data.materials.new("Nibi_Remake_Matte")
material.use_nodes = True
nodes, links = material.node_tree.nodes, material.node_tree.links
nodes.clear()
output = nodes.new("ShaderNodeOutputMaterial")
shader = nodes.new("ShaderNodeBsdfPrincipled")
shader.inputs["Metallic"].default_value = 0.0
shader.inputs["Roughness"].default_value = .82
shader.inputs["Specular IOR Level"].default_value = .16
texture = nodes.new("ShaderNodeTexImage")
texture.image = image_node.image
colour = nodes.new("ShaderNodeHueSaturation")
colour.inputs["Saturation"].default_value = 1.16
colour.inputs["Value"].default_value = .82
links.new(texture.outputs["Color"], colour.inputs["Color"])
links.new(colour.outputs["Color"], shader.inputs["Base Color"])
links.new(shader.outputs["BSDF"], output.inputs["Surface"])
mesh.materials.clear()
mesh.materials.append(material)

corners = [model.matrix_world @ Vector(corner) for corner in model.bound_box]
minimum = Vector((min(corner[i] for corner in corners) for i in range(3)))
maximum = Vector((max(corner[i] for corner in corners) for i in range(3)))
center = (minimum + maximum) / 2
height = maximum.z - minimum.z
bpy.context.scene.render.engine = "BLENDER_EEVEE"
bpy.context.scene.render.resolution_x = 768
bpy.context.scene.render.resolution_y = 768
bpy.context.scene.render.resolution_percentage = 100
bpy.context.scene.render.image_settings.file_format = "PNG"
bpy.context.scene.render.filepath = PREVIEW_PATH
bpy.context.scene.world.color = (.055, .055, .055)
camera_data = bpy.data.cameras.new("PreviewCamera")
camera = bpy.data.objects.new("PreviewCamera", camera_data)
bpy.context.collection.objects.link(camera)
camera.location = center + Vector((0, -height * 2.7, height * .25))
camera.rotation_euler = (center + Vector((0, 0, height * .08)) - camera.location).to_track_quat("-Z", "Y").to_euler()
camera.data.lens = 55
bpy.context.scene.camera = camera
for location, energy in [
    (center + Vector((height * 1.4, -height * 1.4, height * 1.8)), 1100),
    (center + Vector((-height * 1.2, -height * .6, height * 1.2)), 800),
]:
    data = bpy.data.lights.new("PreviewArea", "AREA")
    data.energy = energy
    data.size = height
    light = bpy.data.objects.new("PreviewArea", data)
    bpy.context.collection.objects.link(light)
    light.location = location
    light.rotation_euler = (center - light.location).to_track_quat("-Z", "Y").to_euler()
bpy.ops.render.render(write_still=True)
print("FLOOR_REMOVED", len(remove), PREVIEW_PATH)
