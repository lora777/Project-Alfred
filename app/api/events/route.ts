import {
  createDetectionEvent,
  getDetectionEvents,
} from "@/lib/dashboard-data";
import type { CreateDetectionEventInput, DetectionEvent } from "@/data/mock-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(request: Request) {
  const includeDismissed =
    new URL(request.url).searchParams.get("includeDismissed") === "true";

  return Response.json(getDetectionEvents(includeDismissed));
}

function isDetectionSeverity(value: unknown): value is DetectionEvent["severity"] {
  return (
    value === "threat" ||
    value === "safe" ||
    value === "neutral" ||
    value === "unknown"
  );
}

function isCreateDetectionEventInput(
  value: unknown,
): value is CreateDetectionEventInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.label === "string" &&
    typeof candidate.cameraName === "string" &&
    typeof candidate.confidence === "number" &&
    typeof candidate.timeLabel === "string" &&
    isDetectionSeverity(candidate.severity)
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Malformed JSON request body" }, { status: 400 });
  }

  if (!isCreateDetectionEventInput(body)) {
    return Response.json(
      { error: "Invalid detection event payload" },
      { status: 400 },
    );
  }

  const event = createDetectionEvent(body);

  return Response.json(event, { status: 201 });
}
