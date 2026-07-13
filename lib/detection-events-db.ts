import Database from "better-sqlite3";
import { join } from "node:path";
import {
  detectionEvents,
  type CreateDetectionEventInput,
  type DetectionEvent,
  type DetectionEventFilters,
  type EventStatus,
} from "@/data/mock-data";

type DetectionEventRow = {
  id: string;
  label: string;
  camera_name: string;
  confidence: number;
  time_label: string;
  severity: DetectionEvent["severity"];
  status: EventStatus;
  reviewed_label: string | null;
  created_at: string;
};

const databasePath =
  process.env.ALFRED_DATABASE_PATH ?? join(process.cwd(), "data", "alfred.db");

const db = new Database(databasePath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS detection_events (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    camera_name TEXT NOT NULL,
    confidence REAL NOT NULL,
    time_label TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('threat', 'safe', 'neutral', 'unknown')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'dismissed')),
    reviewed_label TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const eventColumns = db
  .prepare("PRAGMA table_info(detection_events)")
  .all() as Array<{ name: string }>;

if (!eventColumns.some((column) => column.name === "status")) {
  db.exec(`
    ALTER TABLE detection_events
    ADD COLUMN status TEXT NOT NULL DEFAULT 'new'
      CHECK (status IN ('new', 'reviewed', 'dismissed'));
  `);
}

if (!eventColumns.some((column) => column.name === "reviewed_label")) {
  db.exec("ALTER TABLE detection_events ADD COLUMN reviewed_label TEXT;");
}

const countEvents = db
  .prepare("SELECT COUNT(*) AS count FROM detection_events")
  .get() as { count: number };

if (countEvents.count === 0) {
  const seedEvent = db.prepare(`
    INSERT INTO detection_events (
      id,
      label,
      camera_name,
      confidence,
      time_label,
      severity,
      status,
      reviewed_label,
      created_at
    )
    VALUES (
      @id,
      @label,
      @cameraName,
      @confidence,
      @timeLabel,
      @severity,
      @status,
      @reviewedLabel,
      @createdAt
    )
  `);

  const seedEvents = db.transaction((events: DetectionEvent[]) => {
    for (const event of events) {
      seedEvent.run(event);
    }
  });

  seedEvents(detectionEvents);
}

function mapDetectionEvent(row: DetectionEventRow): DetectionEvent {
  return {
    id: row.id,
    label: row.label,
    cameraName: row.camera_name,
    confidence: row.confidence,
    timeLabel: row.time_label,
    severity: row.severity,
    status: row.status,
    reviewedLabel: row.reviewed_label,
    createdAt: row.created_at,
  };
}

function getNextEventId() {
  const row = db
    .prepare(
      `
        SELECT id
        FROM detection_events
        WHERE id LIKE 'EVT-%'
        ORDER BY CAST(SUBSTR(id, 5) AS INTEGER) DESC
        LIMIT 1
      `,
    )
    .get() as { id: string } | undefined;

  const currentNumber = row ? Number(row.id.replace("EVT-", "")) : 2047;

  return `EVT-${currentNumber + 1}`;
}

export function getStoredDetectionEvents(
  includeDismissed = false,
): DetectionEvent[] {
  const rows = db
    .prepare(
      `
        SELECT
          id,
          label,
          camera_name,
          confidence,
          time_label,
          severity,
          status,
          reviewed_label,
          created_at
        FROM detection_events
        ${includeDismissed ? "" : "WHERE status != 'dismissed'"}
        ORDER BY datetime(created_at) DESC, CAST(SUBSTR(id, 5) AS INTEGER) DESC
      `,
    )
    .all() as DetectionEventRow[];

  return rows.map(mapDetectionEvent);
}

export function getFilteredStoredDetectionEvents(
  filters: DetectionEventFilters,
): DetectionEvent[] {
  const conditions: string[] = [];
  const parameters: Record<string, string> = {};

  if (!filters.includeDismissed) {
    conditions.push("status != 'dismissed'");
  }

  if (filters.cameraName) {
    conditions.push("camera_name = @cameraName");
    parameters.cameraName = filters.cameraName;
  }

  if (filters.animal) {
    conditions.push(
      "(LOWER(label) = LOWER(@animal) OR LOWER(reviewed_label) = LOWER(@animal))",
    );
    parameters.animal = filters.animal;
  }

  if (filters.status) {
    conditions.push("status = @status");
    parameters.status = filters.status;
  }

  if (filters.date) {
    conditions.push("date(created_at, 'localtime') = @date");
    parameters.date = filters.date;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `
        SELECT
          id,
          label,
          camera_name,
          confidence,
          time_label,
          severity,
          status,
          reviewed_label,
          created_at
        FROM detection_events
        ${whereClause}
        ORDER BY datetime(created_at) DESC, CAST(SUBSTR(id, 5) AS INTEGER) DESC
      `,
    )
    .all(parameters) as DetectionEventRow[];

  return rows.map(mapDetectionEvent);
}

export function createStoredDetectionEvent(
  input: CreateDetectionEventInput,
): DetectionEvent {
  const event: DetectionEvent = {
    ...input,
    id: getNextEventId(),
    status: "new",
    reviewedLabel: null,
    createdAt: new Date().toISOString(),
  };

  db.prepare(
    `
      INSERT INTO detection_events (
        id,
        label,
        camera_name,
        confidence,
        time_label,
        severity,
        status,
        reviewed_label,
        created_at
      )
      VALUES (
        @id,
        @label,
        @cameraName,
        @confidence,
        @timeLabel,
        @severity,
        @status,
        @reviewedLabel,
        @createdAt
      )
    `,
  ).run(event);

  return event;
}

export function updateStoredDetectionEventStatus(
  id: string,
  status: EventStatus,
  reviewedLabel?: string,
): DetectionEvent | null {
  const result = db
    .prepare(
      `
        UPDATE detection_events
        SET
          status = @status,
          reviewed_label = CASE
            WHEN @hasReviewedLabel = 1 THEN @reviewedLabel
            ELSE reviewed_label
          END
        WHERE id = @id
      `,
    )
    .run({
      id,
      status,
      hasReviewedLabel: reviewedLabel === undefined ? 0 : 1,
      reviewedLabel: reviewedLabel ?? null,
    });

  if (result.changes === 0) {
    return null;
  }

  const row = db
    .prepare(
      `
        SELECT
          id,
          label,
          camera_name,
          confidence,
          time_label,
          severity,
          status,
          reviewed_label,
          created_at
        FROM detection_events
        WHERE id = ?
      `,
    )
    .get(id) as DetectionEventRow;

  return mapDetectionEvent(row);
}

export function getStoredDetectionEventStats() {
  const row = db
    .prepare(
      `
        SELECT
          SUM(
            CASE
              WHEN date(created_at, 'localtime') = date('now', 'localtime') THEN 1
              ELSE 0
            END
          ) AS events_today,
          SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) AS pending_review,
          SUM(
            CASE WHEN status = 'new' AND severity = 'threat' THEN 1 ELSE 0 END
          ) AS active_threats
        FROM detection_events
      `,
    )
    .get() as {
      events_today: number | null;
      pending_review: number | null;
      active_threats: number | null;
    };

  return {
    eventsToday: row.events_today ?? 0,
    pendingReview: row.pending_review ?? 0,
    activeThreats: row.active_threats ?? 0,
  };
}
