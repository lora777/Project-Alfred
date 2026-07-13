import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { cameraMediaRoot } from "@/lib/camera-snapshot-service";
import { getStoredCamera, getStoredCameraSnapshot } from "@/lib/cameras-db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!getStoredCamera(id)) {
    return Response.json({ error: `Camera ${id} was not found` }, { status: 404 });
  }

  const snapshot = getStoredCameraSnapshot(id);

  if (!snapshot) {
    return Response.json(
      { error: `Snapshot for camera ${id} was not found` },
      { status: 404 },
    );
  }

  const filePath = resolve(cameraMediaRoot, snapshot.filePath);
  const safeRoot = `${resolve(cameraMediaRoot)}${sep}`;

  if (!filePath.startsWith(safeRoot)) {
    return Response.json({ error: "Invalid snapshot path" }, { status: 400 });
  }

  try {
    const file = await readFile(filePath);

    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": snapshot.mimeType,
        "Content-Length": String(file.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Snapshot-Captured-At": snapshot.capturedAt,
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return Response.json(
        { error: `Snapshot file for camera ${id} is unavailable` },
        { status: 404 },
      );
    }

    throw error;
  }
}
