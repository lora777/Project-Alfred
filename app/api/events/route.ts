import {
  createDetectionEvent,
  getDetectionEvents,
} from "@/lib/dashboard-data";
import type {
  CreateDetectionEventInput,
  DetectionEvent,
  DetectionEventFilters,
  EventStatus,
} from "@/data/mock-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const status = searchParams.get("status");
  const date = searchParams.get("date");

  if (status && !isEventStatus(status)) {
    return Response.json(
      { error: "Status must be new, reviewed, or dismissed" },
      { status: 400 },
    );
  }

  if (date && !isValidDateFilter(date)) {
    return Response.json(
      { error: "Date must use a valid YYYY-MM-DD value" },
      { status: 400 },
    );
  }

  const filters: DetectionEventFilters = {
    includeDismissed:
      searchParams.get("includeDismissed") === "true" || status === "dismissed",
    cameraName: searchParams.get("camera") || undefined,
    animal: searchParams.get("animal") || undefined,
    status: status as EventStatus | undefined,
    date: date || undefined,
  };

  return Response.json(getDetectionEvents(filters));
}

function isEventStatus(value: string): value is EventStatus {
  return value === "new" || value === "reviewed" || value === "dismissed";
}

function isValidDateFilter(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value)
  );
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
    return Response.json(
      { error: "Malformed JSON request body" },
      { status: 400 },
    );
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
