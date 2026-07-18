import bpy
import json
import os
import sys


SOURCE_ROOT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else ""
MODEL_IDS = ["nibi-trang-an", "nibi-co-do-hoa-lu"]


def bounds(vertices):
    coordinates = [vertices[index].co for index in vertices]
    return {
        "min": [round(min(point[axis] for point in coordinates), 5) for axis in range(3)],
        "max": [round(max(point[axis] for point in coordinates), 5) for axis in range(3)],
        "center": [round(sum(point[axis] for point in coordinates) / len(coordinates), 5) for axis in range(3)],
    }


def connected_components(mesh):
    vertex_count = len(mesh.vertices)
    parent = list(range(vertex_count))

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
        union(*edge.vertices)

    groups = {}
    for vertex in range(vertex_count):
        groups.setdefault(find(vertex), []).append(vertex)
    return sorted(groups.values(), key=len, reverse=True)


def boundary_groups(mesh, boundary_edges):
    adjacent = {}
    for edge_index in boundary_edges:
        first, second = mesh.edges[edge_index].vertices
        adjacent.setdefault(first, set()).add(second)
        adjacent.setdefault(second, set()).add(first)

    groups = []
    visited = set()
    for first in adjacent:
        if first in visited:
            continue
        queue = [first]
        group = set()
        while queue:
            vertex = queue.pop()
            if vertex in visited:
                continue
            visited.add(vertex)
            group.add(vertex)
            queue.extend(adjacent[vertex] - visited)
        groups.append(group)
    return sorted(groups, key=len, reverse=True)


report = {}
for model_id in MODEL_IDS:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.fbx(filepath=os.path.join(SOURCE_ROOT, model_id, "base_basic_pbr.fbx"))
    mesh = next(item.data for item in bpy.context.scene.objects if item.type == "MESH")

    edge_face_counts = [0] * len(mesh.edges)
    edge_index_by_key = {tuple(sorted(edge.vertices)): edge.index for edge in mesh.edges}
    for polygon in mesh.polygons:
        for edge_index in polygon.edge_keys:
            edge_face_counts[edge_index_by_key[tuple(sorted(edge_index))]] += 1

    boundary_edges = [index for index, count in enumerate(edge_face_counts) if count == 1]
    unusual_edges = [index for index, count in enumerate(edge_face_counts) if count != 2]
    connected = {vertex for edge in mesh.edges for vertex in edge.vertices}
    report[model_id] = {
        "components": [
            {"vertices": len(group), "bounds": bounds({index: mesh.vertices[index] for index in group})}
            for group in connected_components(mesh)
        ],
        "loose_vertices": [
            {"index": vertex.index, "position": [round(value, 5) for value in vertex.co]}
            for vertex in mesh.vertices
            if vertex.index not in connected
        ],
        "boundary_groups": [
            {"vertices": len(group), "bounds": bounds({index: mesh.vertices[index] for index in group})}
            for group in boundary_groups(mesh, boundary_edges)
        ],
        "unusual_edge_face_counts": sorted({edge_face_counts[index] for index in unusual_edges}),
    }

print("NIBI_TOPOLOGY_INSPECTION=" + json.dumps(report, ensure_ascii=False))
