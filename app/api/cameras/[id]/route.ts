import { deleteCamera, updateCamera } from "@/lib/dashboard-data";
import {
  CameraCodeConflictError,
  CameraSourceConfigurationError,
} from "@/lib/cameras-db";
import { parseCameraConfigurationInput } from "@/lib/camera-input";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Malformed JSON request body" },
      { status: 400 },
    );
  }

  const result = parseCameraConfigurationInput(body);

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  const { id } = await params;

  try {
    const camera = updateCamera(id, result.data);

    if (!camera) {
      return Response.json({ error: `Camera ${id} was not found` }, { status: 404 });
    }

    return Response.json(camera);
  } catch (error) {
    if (error instanceof CameraCodeConflictError) {
      return Response.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof CameraSourceConfigurationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!deleteCamera(id)) {
    return Response.json({ error: `Camera ${id} was not found` }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
