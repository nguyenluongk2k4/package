import bpy
import os
import sys


args = sys.argv[sys.argv.index("--") + 1 :]
SOURCE_FOLDER, OUTPUT_FOLDER, ASSET_ID, OBJECT_NAME = args

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=os.path.join(SOURCE_FOLDER, "base_basic_pbr.fbx"))
meshes = [item for item in bpy.context.scene.objects if item.type == "MESH"]
if len(meshes) != 1:
    raise RuntimeError(f"Expected one mesh, found {len(meshes)}")

mesh_object = meshes[0]
mesh_object.name = OBJECT_NAME
mesh_object.animation_data_clear()

material = bpy.data.materials.new(OBJECT_NAME + "_Matte")
material.use_nodes = True
nodes, links = material.node_tree.nodes, material.node_tree.links
nodes.clear()
output = nodes.new("ShaderNodeOutputMaterial")
shader = nodes.new("ShaderNodeBsdfPrincipled")
shader.inputs["Metallic"].default_value = 0.0
shader.inputs["Roughness"].default_value = 0.82
shader.inputs["Specular IOR Level"].default_value = 0.18
if "Coat Weight" in shader.inputs:
    shader.inputs["Coat Weight"].default_value = 0.0
image = bpy.data.images.load(os.path.join(SOURCE_FOLDER, "texture_diffuse.png"), check_existing=False)
image.colorspace_settings.name = "sRGB"
texture = nodes.new("ShaderNodeTexImage")
texture.image = image
links.new(texture.outputs["Color"], shader.inputs["Base Color"])
links.new(shader.outputs["BSDF"], output.inputs["Surface"])
mesh_object.data.materials.clear()
mesh_object.data.materials.append(material)

for item in bpy.context.scene.objects:
    item.select_set(item == mesh_object)
bpy.context.view_layer.objects.active = mesh_object
bpy.context.scene.frame_set(1)

glb_path = os.path.join(OUTPUT_FOLDER, ASSET_ID + ".glb")
usdz_path = os.path.join(OUTPUT_FOLDER, ASSET_ID + ".usdz")
if os.path.exists(glb_path) or os.path.exists(usdz_path):
    raise RuntimeError("Refusing to overwrite existing versioned export")

bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format="GLB",
    use_selection=True,
    export_animations=False,
    export_image_format="AUTO",
    export_materials="EXPORT",
)
bpy.ops.wm.usd_export(
    filepath=usdz_path,
    selected_objects_only=True,
    export_animation=False,
    export_materials=True,
    generate_preview_surface=True,
    export_uvmaps=True,
    export_normals=True,
    export_shapekeys=False,
    convert_scene_units="METERS",
    meters_per_unit=1.0,
    export_textures_mode="NEW",
)

print(
    "EXPORTED",
    ASSET_ID,
    "vertices",
    len(mesh_object.data.vertices),
    "polygons",
    len(mesh_object.data.polygons),
    "glb",
    os.path.getsize(glb_path),
    "usdz",
    os.path.getsize(usdz_path),
)
