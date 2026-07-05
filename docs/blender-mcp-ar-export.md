# Blender MCP AR Export Notes

This note captures the working Blender MCP flow used for the Sac Co Do AR guide model so future sessions can pick up quickly.

## Current MCP Setup

- Blender MCP repo/context: `ahujasid/blender-mcp`
- Blender addon socket host: `localhost`
- Blender addon socket port: `9876`
- Control method used: direct JSON socket calls to the Blender addon through the repo's `execute_code` command

## Current Blender Scene Snapshot

At the time of this export, the open Blender file was:

- `C:\Users\Admin\Downloads\Untitled2222.blend`

The relevant objects in scene were:

- `CoDo_Frame01_Idle_Textured`
- `CoDo_Frame07_Wave_Textured`

The existing "animation" was not a true skeletal animation. It was a visibility/pose swap effect made by scaling two separate mesh objects:

- frame 1 / idle mesh shown large
- frame 7 / wave mesh shown tiny
- later the idle mesh scaled down and the wave mesh scaled up

## Export Decision For This Pass

The requested result was:

- keep only the later waving pose
- remove the first idle frame from the final export
- export versioned AR assets as `v3`, then continue increasing versions on later exports

For this pass, the scene was converted to a single static waving model by:

1. Setting the scene to the wave frame state at frame `30`
2. Removing `CoDo_Frame01_Idle_Textured`
3. Keeping the wave mesh visible at scale `1, 1, 1`
4. Clearing animation from the wave object so the export stays in the waving pose

## Texture Source Used

Texture set used for the waving frame:

- `C:\Users\Admin\Downloads\codo_frame07_extracted`

Mapped files:

- `texture_diffuse.png` -> Base Color
- `texture_roughness.png` -> Roughness
- `texture_metallic.png` -> Metallic
- `texture_normal.png` -> Normal

Not used as the primary exported material maps in this pass:

- `shaded.png`
- `texture_pbr.png`

## Versioning Rule

Export names must keep increasing:

- `sac-co-do-guide-v3.glb`
- `sac-co-do-guide-v3.usdz`
- next time: `v4`
- then `v5`, etc.

Rule:

- scan `public/ar`
- find the highest existing `sac-co-do-guide-vN`
- export the next number

## Files Exported In This Pass

Generated files:

- `public/ar/sac-co-do-guide-v3.glb`
- `public/ar/sac-co-do-guide-v3.usdz`

These were then set as the default WebAR viewer assets in:

- `components/sac-co-do/WebArViewer.jsx`

Current defaults after this change:

- `GLB`: `/ar/sac-co-do-guide-v3.glb`
- `USDZ`: `/ar/sac-co-do-guide-v3.usdz`

## Repeatable Workflow

Use this sequence next time:

1. Open Blender and ensure the Blender MCP addon is running on `localhost:9876`
2. Inspect scene objects and identify the idle mesh and the target final-pose mesh
3. If the scene uses mesh-scale swapping instead of real animation, move to the desired final frame
4. Remove or hide the unused mesh
5. Clear animation from the kept mesh if the export should be static
6. Rebuild or update the material using the intended texture folder
7. Export both `.glb` and `.usdz` with the next version number
8. Update `components/sac-co-do/WebArViewer.jsx` if the new version should become the new default

## Notes And Caveats

- The Blender MCP addon accepts direct JSON commands and supports `execute_code`, which was used here for inspection and export automation.
- The scene used separate mesh objects for different poses, so "remove frame 1 and keep frame 7" meant keeping the second mesh, not trimming a skeletal animation track.
- glTF export emitted a warning about more than one shader image node being used for a texture. The export still completed successfully.
- If a future pass should preserve real animation instead of freezing a pose, do not clear animation data before export.
