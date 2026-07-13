import { createCamera, getCameras } from "@/lib/dashboard-data";
import {
  CameraCodeConflictError,
  CameraSourceConfigurationError,
} from "@/lib/cameras-db";
import { parseCameraConfigurationInput } from "@/lib/camera-input";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return Response.json(getCameras());
}

export async function POST(request: Request) {
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

  try {
    return Response.json(createCamera(result.data), { status: 201 });
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
