import bpy
import math
import os
import sys


INPUT_GLB, OUTPUT_FOLDER, ASSET_ID, OBJECT_NAME = sys.argv[sys.argv.index("--") + 1 :]


def smoothstep(value):
    value = max(0.0, min(1.0, value))
    return value * value * (3.0 - 2.0 * value)


def apply_soft_back_hair(mesh_object):
    source = mesh_object.data.materials[0]
    image_node = next(node for node in source.node_tree.nodes if node.type == "TEX_IMAGE" and node.image)
    mask = mesh_object.data.color_attributes.get("BackHairMask")
    if not mask:
        mask = mesh_object.data.color_attributes.new("BackHairMask", "FLOAT_COLOR", "POINT")
    for vertex in mesh_object.data.vertices:
        point = vertex.co
        ellipse = math.sqrt(((point.x - .19) / .20) ** 2 + ((point.z - 1.30) / .24) ** 2)
        cap = smoothstep((1.0 - ellipse) / .42)
        rear = smoothstep((point.y + .02) / .12)
        amount = cap * rear
        mask.data[vertex.index].color = (amount, amount, amount, 1.0)

    material = bpy.data.materials.new(OBJECT_NAME + "_SoftBackHair")
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
    attribute = nodes.new("ShaderNodeVertexColor")
    attribute.layer_name = "BackHairMask"
    mix = nodes.new("ShaderNodeMixRGB")
    mix.blend_type = "MIX"
    hair = nodes.new("ShaderNodeRGB")
    hair.outputs[0].default_value = (.008, .011, .014, 1.0)
    links.new(attribute.outputs["Color"], mix.inputs[0])
    links.new(texture.outputs["Color"], mix.inputs[1])
    links.new(hair.outputs[0], mix.inputs[2])
    links.new(mix.outputs["Color"], shader.inputs["Base Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    baked = bpy.data.images.new(OBJECT_NAME + "_BackHairBaked", width=image_node.image.size[0], height=image_node.image.size[1], alpha=True)
    bake_target = nodes.new("ShaderNodeTexImage")
    bake_target.image = baked
    nodes.active = bake_target
    bpy.context.scene.render.engine = "CYCLES"
    bpy.context.scene.cycles.samples = 1
    bpy.context.scene.render.bake.margin = 12
    bpy.context.view_layer.objects.active = mesh_object
    mesh_object.select_set(True)
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"COLOR"}, use_clear=True)
    baked.filepath_raw = os.path.join(OUTPUT_FOLDER, ASSET_ID + "-back-hair.png")
    baked.file_format = "PNG"
    baked.save()

    final = bpy.data.materials.new(OBJECT_NAME + "_BakedSoftBackHair")
    final.use_nodes = True
    final_nodes, final_links = final.node_tree.nodes, final.node_tree.links
    final_output = final_nodes.new("ShaderNodeOutputMaterial")
    final_shader = final_nodes.new("ShaderNodeBsdfPrincipled")
    final_shader.inputs["Metallic"].default_value = 0.0
    final_shader.inputs["Roughness"].default_value = .82
    final_shader.inputs["Specular IOR Level"].default_value = .16
    final_texture = final_nodes.new("ShaderNodeTexImage")
    final_texture.image = baked
    final_links.new(final_texture.outputs["Color"], final_shader.inputs["Base Color"])
    final_links.new(final_shader.outputs["BSDF"], final_output.inputs["Surface"])
    mesh_object.data.materials.clear()
    mesh_object.data.materials.append(final)


bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=INPUT_GLB)
mesh_object = next(item for item in bpy.context.scene.objects if item.type == "MESH" and item.name.startswith("Nibi_CoDoHoaLu"))
mesh_object.name = OBJECT_NAME
mesh_object.animation_data_clear()
apply_soft_back_hair(mesh_object)
for item in list(bpy.context.scene.objects):
    if item.type == "MESH" and item != mesh_object:
        bpy.data.objects.remove(item, do_unlink=True)
for item in bpy.context.scene.objects:
    item.select_set(item == mesh_object)
bpy.context.view_layer.objects.active = mesh_object
glb_path = os.path.join(OUTPUT_FOLDER, ASSET_ID + ".glb")
usdz_path = os.path.join(OUTPUT_FOLDER, ASSET_ID + ".usdz")
if os.path.exists(glb_path) or os.path.exists(usdz_path):
    raise RuntimeError("Refusing to overwrite existing versioned export")
bpy.ops.export_scene.gltf(filepath=glb_path, export_format="GLB", use_selection=True, export_animations=False, export_image_format="AUTO", export_materials="EXPORT")
bpy.ops.wm.usd_export(filepath=usdz_path, selected_objects_only=True, export_animation=False, export_materials=True, generate_preview_surface=True, export_uvmaps=True, export_normals=True, export_shapekeys=False, convert_scene_units="METERS", meters_per_unit=1.0, export_textures_mode="NEW")
print("EXPORTED_CODO_SOFT_BACK_HAIR", ASSET_ID, os.path.getsize(glb_path), os.path.getsize(usdz_path))
