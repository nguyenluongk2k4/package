import bmesh
import bpy
import os
import sys


SOURCE_ROOT = sys.argv[sys.argv.index("--") + 1]
OUTPUT_ROOT = sys.argv[sys.argv.index("--") + 2]
MODELS = [
    ("nibi-trang-an", "Nibi_TrangAn"),
    ("nibi-co-do-hoa-lu", "Nibi_CoDoHoaLu"),
]


def connected_components(mesh):
    mesh.verts.ensure_lookup_table()
    parent = list(range(len(mesh.verts)))

    def find(vertex):
        while parent[vertex] != vertex:
            parent[vertex] = parent[parent[vertex]]
            vertex = parent[vertex]
        return vertex

    def union(first, second):
        first, second = find(first), find(second)
        if first != second:
            parent[second] = first

    for edge in mesh.edges:
        union(edge.verts[0].index, edge.verts[1].index)

    groups = {}
    for vertex in mesh.verts:
        groups.setdefault(find(vertex.index), []).append(vertex)
    return list(groups.values())


def clean_geometry(mesh, model_id):
    working = bmesh.new()
    working.from_mesh(mesh)
    working.verts.ensure_lookup_table()

    removed_vertices = 0
    if model_id == "nibi-trang-an":
        fragments = [group for group in connected_components(working) if len(group) <= 3]
        for fragment in fragments:
            removed_vertices += len(fragment)
            bmesh.ops.delete(working, geom=fragment, context="VERTS")
    elif model_id == "nibi-co-do-hoa-lu":
        loose_vertices = [vertex for vertex in working.verts if not vertex.link_edges]
        removed_vertices = len(loose_vertices)
        if loose_vertices:
            bmesh.ops.delete(working, geom=loose_vertices, context="VERTS")

    if working.faces:
        bmesh.ops.recalc_face_normals(working, faces=list(working.faces))

    working.to_mesh(mesh)
    working.free()
    mesh.update()
    return removed_vertices


def make_matte_material(folder, name):
    material = bpy.data.materials.new(name + "_Matte_v3")
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
    image = bpy.data.images.load(os.path.join(folder, "texture_diffuse.png"), check_existing=False)
    image.colorspace_settings.name = "sRGB"
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = image
    links.new(texture.outputs["Color"], shader.inputs["Base Color"])
    links.new(shader.outputs["BSDF"], output.inputs["Surface"])
    return material


for model_id, object_name in MODELS:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    source_folder = os.path.join(SOURCE_ROOT, model_id)
    bpy.ops.import_scene.fbx(filepath=os.path.join(source_folder, "base_basic_pbr.fbx"))
    mesh_object = next(item for item in bpy.context.scene.objects if item.type == "MESH")
    removed = clean_geometry(mesh_object.data, model_id)
    mesh_object.name = object_name + "_Clean_v3"
    mesh_object.animation_data_clear()
    mesh_object.data.materials.clear()
    mesh_object.data.materials.append(make_matte_material(source_folder, object_name))
    for item in bpy.context.scene.objects:
        item.select_set(item == mesh_object)
    bpy.context.view_layer.objects.active = mesh_object

    glb_path = os.path.join(OUTPUT_ROOT, model_id + "-v3.glb")
    usdz_path = os.path.join(OUTPUT_ROOT, model_id + "-v3.usdz")
    if os.path.exists(glb_path) or os.path.exists(usdz_path):
        raise RuntimeError("Refusing to overwrite existing versioned exports for " + model_id)
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
    print("CLEANED", model_id, "removed_vertices", removed, "glb", os.path.getsize(glb_path), "usdz", os.path.getsize(usdz_path))
