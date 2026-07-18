import bpy
import math
import os
import sys


INPUT_GLB, OUTPUT_FOLDER, ASSET_ID, OBJECT_NAME = sys.argv[sys.argv.index("--") + 1 :]


def create_back_hair_overlay(target):
    material = bpy.data.materials.new(OBJECT_NAME + "_BackHair_Matte")
    material.diffuse_color = (.008, .011, .014, 1.0)
    material.use_nodes = True
    shader = material.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (.008, .011, .014, 1.0)
    shader.inputs["Metallic"].default_value = 0.0
    shader.inputs["Roughness"].default_value = .8
    shader.inputs["Specular IOR Level"].default_value = .14
    segments, rings = 40, 5
    center_x, center_z = .19, 1.30
    radius_x, radius_z = .23, .20
    vertices = [(center_x, .50, center_z)]
    for ring in range(1, rings + 1):
        radius = ring / rings
        for segment in range(segments):
            angle = 2.0 * math.pi * segment / segments
            vertices.append((center_x + radius_x * radius * math.cos(angle), .50, center_z + radius_z * radius * math.sin(angle)))
    faces = []
    for segment in range(segments):
        faces.append((0, 1 + segment, 1 + (segment + 1) % segments))
    for ring in range(1, rings):
        current = 1 + (ring - 1) * segments
        following = 1 + ring * segments
        for segment in range(segments):
            next_segment = (segment + 1) % segments
            faces.append((current + segment, following + segment, following + next_segment, current + next_segment))
    mesh = bpy.data.meshes.new(OBJECT_NAME + "_BackHair")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    overlay = bpy.data.objects.new(OBJECT_NAME + "_BackHair", mesh)
    bpy.context.collection.objects.link(overlay)
    overlay.data.materials.append(material)
    shrinkwrap = overlay.modifiers.new("Fit_To_Head", "SHRINKWRAP")
    shrinkwrap.target = target
    shrinkwrap.wrap_method = "PROJECT"
    shrinkwrap.use_project_y = True
    shrinkwrap.use_negative_direction = True
    shrinkwrap.use_positive_direction = False
    shrinkwrap.project_limit = .6
    shrinkwrap.offset = .006
    bpy.context.view_layer.objects.active = overlay
    overlay.select_set(True)
    bpy.ops.object.modifier_apply(modifier=shrinkwrap.name)
    return overlay, len(faces)


bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=INPUT_GLB)
mesh_object = next(item for item in bpy.context.scene.objects if item.type == "MESH" and item.name.startswith("Nibi_CoDoHoaLu"))
mesh_object.name = OBJECT_NAME
mesh_object.animation_data_clear()
hair_overlay, hair_faces = create_back_hair_overlay(mesh_object)

# The prior GLB contains an unrelated helper mesh named Cube.  It is not part
# of Nibi and must not be carried into the mobile AR files.
for item in list(bpy.context.scene.objects):
    if item.type == "MESH" and item not in (mesh_object, hair_overlay):
        bpy.data.objects.remove(item, do_unlink=True)

for item in bpy.context.scene.objects:
    item.select_set(item == mesh_object or item == hair_overlay)
bpy.context.view_layer.objects.active = mesh_object
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
print("EXPORTED_CODO_BACK_HAIR", ASSET_ID, "hair_faces", hair_faces, "glb", os.path.getsize(glb_path), "usdz", os.path.getsize(usdz_path))
