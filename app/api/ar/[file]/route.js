import { readFile } from "node:fs/promises";
import path from "node:path";

const AR_FILES = {
  "sac-co-do-guide.glb": {
    contentType: "model/gltf-binary",
  },
  "sac-co-do-guide.usdz": {
    contentType: "model/vnd.usdz+zip",
  },
};

export async function GET(_request, { params }) {
  const { file } = await params;
  const metadata = AR_FILES[file];

  if (!metadata) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", "ar", file);
  const body = await readFile(filePath);

  return new Response(body, {
    headers: {
      "Content-Type": metadata.contentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
