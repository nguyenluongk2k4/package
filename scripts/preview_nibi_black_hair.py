import bpy
import os
import sys
from mathutils import Vector


SOURCE_FOLDER = sys.argv[sys.argv.index("--") + 1]
PREVIEW_PATH = sys.argv[sys.argv.index("--") + 2]


def make_matte_material(name, image):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes, links = material.node_tree.nodes, material.node_tree.links
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    shader = nodes.new("ShaderNodeBsdfPrincipled")
    shader.inputs["Metallic"].default_value = 0.0
    shader.inputs["Roughness"].default_value = 0.82
    shader.inputs["Specular IOR Level"].default_value = 0.18
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material


def sample_colour(pixels, width, height, uv):
    x = min(width - 1, max(0, int(uv.x * width)))
    y = min(height - 1, max(0, int(uv.y * height)))
    offset = (y * width + x) * 4
    return pixels[offset : offset + 3]


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

    # Slightly expand the painted island, preventing filtered texture pixels from
    # leaking the former brown colour along its UV seam.
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
        # Keep skin, the beige hat and the gold trim untouched.  Only the
        # brown atlas tones used by the hair are recoloured.
        if not (red < 0.74 and green < 0.42 and blue < 0.36 and red > green * 1.12):
            continue
        luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722
        value = min(0.11, 0.025 + luminance * 0.09)
        result[offset : offset + 3] = (value * 0.72, value * 0.86, value)

    image = bpy.data.images.new("Nibi_CoDoHoaLu_Hair_Black_Baked", width=width, height=height, alpha=True)
    image.colorspace_settings.name = "sRGB"
    image.pixels.foreach_set(result)
    image.update()
    return image


bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.fbx(filepath=os.path.join(SOURCE_FOLDER, "base_basic_pbr.fbx"))
mesh_object = next(item for item in bpy.context.scene.objects if item.type == "MESH")
source_image = bpy.data.images.load(os.path.join(SOURCE_FOLDER, "texture_diffuse.png"), check_existing=False)
source_image.colorspace_settings.name = "sRGB"
width, height = source_image.size
pixels = [0.0] * (width * height * 4)
source_image.pixels.foreach_get(pixels)
uv_data = mesh_object.data.uv_layers.active.data
hair_faces = []
for polygon in mesh_object.data.polygons:
    # Use the complete raised hair volume instead of judging face-by-face from
    # a single texture sample; this prevents fragmented black patches.
    if 1.24 <= polygon.center.z <= 1.54:
        hair_faces.append(polygon)

baked_image = make_hair_black_texture(source_image, mesh_object.data, hair_faces)
mesh_object.data.materials.clear()
mesh_object.data.materials.append(make_matte_material("Nibi_Base_Matte", baked_image))

corners = [mesh_object.matrix_world @ Vector(corner) for corner in mesh_object.bound_box]
minimum = Vector((min(corner[axis] for corner in corners) for axis in range(3)))
maximum = Vector((max(corner[axis] for corner in corners) for axis in range(3)))
center = (minimum + maximum) / 2
height_3d = maximum.z - minimum.z
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
camera.location = center + Vector((0, -height_3d * 2.4, height_3d * 0.08))
camera.rotation_euler = (Vector(center + Vector((0, 0, height_3d * 0.1))) - camera.location).to_track_quat("-Z", "Y").to_euler()
camera.data.lens = 55
bpy.context.scene.camera = camera
for location, energy, size in [
    (center + Vector((height_3d * 1.5, -height_3d * 1.5, height_3d * 2.2)), 1200, height_3d),
    (center + Vector((-height_3d * 1.3, -height_3d * 0.7, height_3d * 1.4)), 900, height_3d),
]:
    light_data = bpy.data.lights.new("PreviewArea", "AREA")
    light_data.energy = energy
    light_data.shape = "DISK"
    light_data.size = size
    light = bpy.data.objects.new("PreviewArea", light_data)
    bpy.context.collection.objects.link(light)
    light.location = location
    light.rotation_euler = (center - light.location).to_track_quat("-Z", "Y").to_euler()

bpy.ops.render.render(write_still=True)
print("HAIR_BAKED_PREVIEW", "faces", len(hair_faces), "path", PREVIEW_PATH)
