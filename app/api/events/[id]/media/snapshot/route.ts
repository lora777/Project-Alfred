import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { getStoredEventMedia } from "@/lib/event-media-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const mediaRoot = resolve(process.cwd(), "data", "media");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const media = getStoredEventMedia(id, "snapshot");

  if (!media) {
    return Response.json(
      { error: `Snapshot for event ${id} was not found` },
      { status: 404 },
    );
  }

  const filePath = resolve(mediaRoot, media.filePath);
  const safeRoot = `${mediaRoot}${sep}`;

  if (!filePath.startsWith(safeRoot)) {
    return Response.json({ error: "Invalid media path" }, { status: 400 });
  }

  try {
    const file = await readFile(filePath);

    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": media.mimeType,
        "Content-Length": String(file.byteLength),
        "Cache-Control": "private, max-age=60",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return Response.json(
        { error: `Snapshot file for event ${id} is unavailable` },
        { status: 404 },
      );
    }

    throw error;
  }
}
