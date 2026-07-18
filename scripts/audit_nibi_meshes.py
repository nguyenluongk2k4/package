import bpy
import json
import os
import sys


SOURCE_ROOT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else ""
MODEL_IDS = [
    "nibi-trang-an",
    "nibi-co-do-hoa-lu",
    "nibi-bai-dinh",
    "nibi-pho-co-hoa-lu",
    "nibi-tam-coc",
    "nibi-hang-mua",
]


def mesh_audit(mesh):
    vertex_count = len(mesh.vertices)
    parent = list(range(vertex_count))
    size = [1] * vertex_count
    connected_vertices = set()

    def find(vertex):
        while parent[vertex] != vertex:
            parent[vertex] = parent[parent[vertex]]
            vertex = parent[vertex]
        return vertex

    def union(first, second):
        first, second = find(first), find(second)
        if first == second:
            return
        if size[first] < size[second]:
            first, second = second, first
        parent[second] = first
        size[first] += size[second]

    for edge in mesh.edges:
        first, second = edge.vertices
        connected_vertices.update((first, second))
        union(first, second)

    component_vertices = {}
    for vertex in range(vertex_count):
        root = find(vertex)
        component_vertices[root] = component_vertices.get(root, 0) + 1

    component_faces = {root: 0 for root in component_vertices}
    edge_face_count = {}
    zero_area_faces = 0
    for polygon in mesh.polygons:
        component_faces[find(polygon.vertices[0])] += 1
        if polygon.area < 1e-10:
            zero_area_faces += 1
        for edge_key in polygon.edge_keys:
            edge_face_count[edge_key] = edge_face_count.get(edge_key, 0) + 1

    components = sorted(
        ((vertices, component_faces[root]) for root, vertices in component_vertices.items()),
        reverse=True,
    )
    return {
        "vertices": vertex_count,
        "edges": len(mesh.edges),
        "polygons": len(mesh.polygons),
        "connected_components": len(components),
        "components_over_100_vertices": sum(1 for vertices, _ in components if vertices >= 100),
        "largest_component_vertices": components[0][0],
        "largest_component_percent": round(components[0][0] * 100 / vertex_count, 2),
        "largest_components_vertices_faces": components[:8],
        "loose_vertices": vertex_count - len(connected_vertices),
        "boundary_edges": sum(1 for count in edge_face_count.values() if count == 1),
        "non_manifold_edges": sum(1 for count in edge_face_count.values() if count != 2),
        "zero_area_faces": zero_area_faces,
    }


report = {}
for model_id in MODEL_IDS:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    fbx_path = os.path.join(SOURCE_ROOT, model_id, "base_basic_pbr.fbx")
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    mesh_objects = [item for item in bpy.context.scene.objects if item.type == "MESH"]
    if len(mesh_objects) != 1:
        raise RuntimeError(f"{model_id}: expected one mesh, found {len(mesh_objects)}")
    report[model_id] = mesh_audit(mesh_objects[0].data)

print("NIBI_MESH_AUDIT=" + json.dumps(report, ensure_ascii=False))
