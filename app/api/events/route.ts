import {
  createDetectionEvent,
  getDetectionEvents,
} from "@/lib/dashboard-data";
import type { CreateDetectionEventInput, DetectionEvent } from "@/data/mock-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return Response.json(getDetectionEvents());
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
  const body = (await request.json()) as unknown;

  if (!isCreateDetectionEventInput(body)) {
    return Response.json(
      { error: "Invalid detection event payload" },
      { status: 400 },
    );
  }

  const event = createDetectionEvent(body);

  return Response.json(event, { status: 201 });
}
