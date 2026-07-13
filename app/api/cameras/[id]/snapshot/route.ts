import {
  CameraSnapshotError,
  captureCameraSnapshot,
} from "@/lib/camera-snapshot-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    return Response.json(await captureCameraSnapshot(id), { status: 201 });
  } catch (error) {
    if (error instanceof CameraSnapshotError) {
      return Response.json({ error: error.message }, { status: error.status });
    }

    throw error;
  }
}
