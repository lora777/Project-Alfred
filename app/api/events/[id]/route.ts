import { updateDetectionEventStatus } from "@/lib/dashboard-data";
import type { EventStatus } from "@/data/mock-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isEventStatus(value: unknown): value is EventStatus {
  return value === "new" || value === "reviewed" || value === "dismissed";
}

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

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json(
      { error: "Request body must contain a valid event status" },
      { status: 400 },
    );
  }

  const status = (body as Record<string, unknown>).status;
  const reviewedLabel = (body as Record<string, unknown>).reviewedLabel;

  if (!isEventStatus(status)) {
    return Response.json(
      { error: "Status must be new, reviewed, or dismissed" },
      { status: 400 },
    );
  }

  if (
    reviewedLabel !== undefined &&
    (status !== "reviewed" ||
      typeof reviewedLabel !== "string" ||
      reviewedLabel.trim().length === 0 ||
      reviewedLabel.length > 100)
  ) {
    return Response.json(
      { error: "A reviewed label must be a non-empty string of 100 characters or fewer" },
      { status: 400 },
    );
  }

  const { id } = await params;
  const event = updateDetectionEventStatus(
    id,
    status,
    typeof reviewedLabel === "string" ? reviewedLabel.trim() : undefined,
  );

  if (!event) {
    return Response.json({ error: `Event ${id} was not found` }, { status: 404 });
  }

  return Response.json(event);
}
