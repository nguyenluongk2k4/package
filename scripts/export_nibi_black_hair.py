import bpy
import os
import sys


SOURCE_FOLDER, OUTPUT_FOLDER, ASSET_ID, OBJECT_NAME = sys.argv[sys.argv.index("--") + 1 :]


def make_matte_material(image):
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
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material


def mark_triangle(mask, width, height, first, second, third):
    points = [(point.x * width, point.y * height) for point in (first, second, third)]
    minimum_x = max(0, int(min(point[0] for point in points)))
    maximum_x = min(width - 1, int(max(point[0] for point in points)) + 1)
    minimum_y = max(0, int(min(point[1] for point in points)))
    maximum_y = min(height - 1, int(max(point[1] for point in points)) + 1)
    (ax, ay), (bx, by), (cx, cy) = points
    denominator = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
    if abs(denominator) < 1e-9:
        return
    for y in range(minimum_y, maximum_y + 1):
        for x in range(minimum_x, maximum_x + 1):
            px, py = x + 0.5, y + 0.5
            first_weight = ((by - cy) * (px - cx) + (cx - bx) * (py - cy)) / denominator
            second_weight = ((cy - ay) * (px - cx) + (ax - cx) * (py - cy)) / denominator
            third_weight = 1.0 - first_weight - second_weight
            if first_weight >= -1e-5 and second_weight >= -1e-5 and third_weight >= -1e-5:
                mask[y * width + x] = 1


def make_hair_black_texture(source, mesh, hair_faces):
    width, height = source.size
    source_pixels = [0.0] * (width * height * 4)
    source.pixels.foreach_get(source_pixels)
    mask = bytearray(width * height)
    uvs = mesh.uv_layers.active.data
    for face in hair_faces:
        corners = [uvs[index].uv.copy() for index in face.loop_indices]
        for index in range(1, len(corners) - 1):
            mark_triangle(mask, width, height, corners[0], corners[index], corners[index + 1])

    expanded = bytearray(mask)
    for y in range(1, height - 1):
        row = y * width
        for x in range(1, width - 1):
            if mask[row + x]:
                for neighbor in (-1, 0, 1):
                    expanded[row - width + x + neighbor] = 1
                    expanded[row + x + neighbor] = 1
                    expanded[row + width + x + neighbor] = 1

    result = source_pixels[:]
    for pixel_index, included in enumerate(expanded):
        if not included:
            continue
        offset = pixel_index * 4
        red, green, blue = source_pixels[offset : offset + 3]
        if not (red < 0.74 and green < 0.42 and blue < 0.36 and red > green * 1.12):
            continue
        luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722
        value = min(0.11, 0.025 + luminance * 0.09)
        result[offset : offset + 3] = (value * 0.72, value * 0.86, value)

    image = bpy.data.images.new(OBJECT_NAME + "_HairBlack", width=width, height=height, alpha=True)
    image.colorspace_settings.name = "sRGB"
    image.pixels.foreach_set(result)
    image.update()
    texture_folder = os.path.join(os.path.dirname(OUTPUT_FOLDER), "generated-textures")
    os.makedirs(texture_folder, exist_ok=True)
    image.filepath_raw = os.path.join(texture_folder, ASSET_ID + "-hair-black.png")
    image.file_format = "PNG"
    image.save()
    return image


bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=os.path.join(SOURCE_FOLDER, "base_basic_pbr.fbx"))
mesh_object = next(item for item in bpy.context.scene.objects if item.type == "MESH")
mesh_object.name = OBJECT_NAME
mesh_object.animation_data_clear()
source_image = bpy.data.images.load(os.path.join(SOURCE_FOLDER, "texture_diffuse.png"), check_existing=False)
source_image.colorspace_settings.name = "sRGB"
hair_faces = [
    polygon for polygon in mesh_object.data.polygons
    if 1.24 <= polygon.center.z <= 1.54
]
baked_image = make_hair_black_texture(source_image, mesh_object.data, hair_faces)
mesh_object.data.materials.clear()
mesh_object.data.materials.append(make_matte_material(baked_image))

for item in bpy.context.scene.objects:
    item.select_set(item == mesh_object)
bpy.context.view_layer.objects.active = mesh_object
bpy.context.scene.frame_set(1)
glb_path = os.path.join(OUTPUT_FOLDER, ASSET_ID + ".glb")
usdz_path = os.path.join(OUTPUT_FOLDER, ASSET_ID + ".usdz")
if os.path.exists(glb_path) or os.path.exists(usdz_path):
    raise RuntimeError("Refusing to overwrite an existing versioned export")

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
print("EXPORTED_BLACK_HAIR", ASSET_ID, "hair_faces", len(hair_faces), "glb", os.path.getsize(glb_path), "usdz", os.path.getsize(usdz_path))
