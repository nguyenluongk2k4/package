# Blender MCP AR Export Handoff For GPT-5.6 Terra

This document is a direct handoff note for a future model session that needs to continue the Sac Co Do Blender MCP workflow.

Use it as operational context, not as a generic background note.

## Goal

Fix the Sac Co Do AR character export in Blender so the final AR asset is a single static waving pose instead of a two-frame swap effect, then export new versioned `.glb` and `.usdz` files.

## Working Context

- Blender MCP repo/context: `ahujasid/blender-mcp`
- Blender addon socket host: `localhost`
- Blender addon socket port: `9876`
- Blender was already opened by the user during the original working session
- Control style used before: direct MCP / addon code execution against the running Blender scene

## Scene Problem Summary

The scene did not contain a true skeletal animation.

Instead, the visible result behaved like a fake animation made from two separate mesh states:

- one mesh for the first idle pose
- one mesh for the later waving pose
- the scene swapped them by scaling one down and the other up

So when the user said:

- keep the later frame
- remove the first frame

that meant:

- keep the waving mesh only
- remove or fully disable the idle mesh from the export result
- make the export become a single static final pose

## Known Relevant Objects

At the time of the earlier pass, the important scene objects were:

- `CoDo_Frame01_Idle_Textured`
- `CoDo_Frame07_Wave_Textured`

The waving pose was the one to keep.

## Required Result

The final export should:

- contain only the waving pose
- not include the first idle pose
- not produce an AR result that appears to switch between two frames
- export both `.glb` and `.usdz`
- keep version numbers increasing over time

## Texture Source

Use the texture folder provided by the user:

- `C:\Users\Admin\Downloads\codo_frame07_extracted`

Expected maps:

- `texture_diffuse.png` -> Base Color
- `texture_roughness.png` -> Roughness
- `texture_metallic.png` -> Metallic
- `texture_normal.png` -> Normal

Secondary files that were not meant to be the primary material source in the earlier pass:

- `shaded.png`
- `texture_pbr.png`

## Versioning Rule

Do not overwrite the old export blindly.

Export names must keep increasing:

- `sac-co-do-guide-v3.glb`
- `sac-co-do-guide-v3.usdz`
- next export becomes `v4`
- then `v5`
- and so on

Rule:

1. scan `public/ar`
2. find the highest existing `sac-co-do-guide-vN`
3. export the next version number

## Default AR Asset Wiring

After a successful export, if the new files should become the default AR assets, update:

- `components/sac-co-do/WebArViewer.jsx`

Example prior default:

- `GLB`: `/ar/sac-co-do-guide-v3.glb`
- `USDZ`: `/ar/sac-co-do-guide-v3.usdz`

## Repeatable Execution Plan

Follow this sequence:

1. Connect to the already running Blender instance through MCP on `localhost:9876`.
2. Inspect the open scene and confirm whether the pose swap is still based on separate mesh objects rather than a real armature animation.
3. Identify the idle object and the waving object.
4. Move the scene to the later waving state if needed.
5. Remove, hide, or fully exclude the idle object from export.
6. Keep only the waving object visible and at correct scale.
7. Clear animation data from the kept waving object if the target output is a static pose.
8. Rebuild or verify the material using the texture folder `C:\Users\Admin\Downloads\codo_frame07_extracted`.
9. Export the next versioned `.glb`.
10. Export the matching `.usdz`.
11. If requested, point `components/sac-co-do/WebArViewer.jsx` to the new version.
12. Verify that the resulting AR asset behaves as a single-frame waving pose, not a 2-frame swap.

## Important Interpretation

Do not misread this as a timeline-edit task unless the scene truly uses animation keys.

The earlier issue was specifically:

- not a real motion clip
- not a normal skeletal timeline trim
- but a two-object pose swap

So “remove frame 1” most likely means:

- remove the idle mesh contribution from the final export

not:

- trim keyframes in a conventional animation stack

## Earlier Export Decision

The earlier successful logic was:

1. switch to the later waving state
2. remove `CoDo_Frame01_Idle_Textured`
3. keep `CoDo_Frame07_Wave_Textured`
4. ensure the kept wave mesh remains at scale `1, 1, 1`
5. clear animation on the kept mesh so export stays frozen in the waving pose

## Prior Output

Earlier generated files were:

- `public/ar/sac-co-do-guide-v3.glb`
- `public/ar/sac-co-do-guide-v3.usdz`

Those files represented the intended direction, but the user later reported that AR still seemed to load as if there were 2 frames, so the next session should verify carefully whether:

- the idle object was truly excluded
- there are hidden extra animated objects left in export
- shape keys, drivers, visibility tracks, or extra actions still remain
- Quick Look / viewer cache is showing an old asset version

## Verification Checklist

Before finishing, verify all of the following:

- only the waving mesh is exported
- no idle mesh survives in hidden/exported form
- no extra object animation still drives the result
- the material points to the intended texture set
- the exported filenames use the next version number
- both `.glb` and `.usdz` exist
- the web viewer path is updated only if explicitly desired
- AR playback appears as a single static waving pose

## Notes

- Blender MCP in this workflow was used mainly to inspect scene state, manipulate objects, and automate export.
- glTF export previously produced a warning about multiple shader image nodes for a texture, but export still completed.
- If the future goal changes from static pose to true animation preservation, do not clear animation data. That would be a different task.
