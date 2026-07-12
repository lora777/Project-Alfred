import Database from "better-sqlite3";
import { join } from "node:path";
import {
  detectionEvents,
  type CreateDetectionEventInput,
  type DetectionEvent,
} from "@/data/mock-data";

type DetectionEventRow = {
  id: string;
  label: string;
  camera_name: string;
  confidence: number;
  time_label: string;
  severity: DetectionEvent["severity"];
  created_at: string;
};

const databasePath = join(process.cwd(), "data", "alfred.db");

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
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

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
      severity
    )
    VALUES (
      @id,
      @label,
      @cameraName,
      @confidence,
      @timeLabel,
      @severity
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

export function getStoredDetectionEvents(): DetectionEvent[] {
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
          created_at
        FROM detection_events
        ORDER BY datetime(created_at) DESC, CAST(SUBSTR(id, 5) AS INTEGER) DESC
      `,
    )
    .all() as DetectionEventRow[];

  return rows.map(mapDetectionEvent);
}

export function createStoredDetectionEvent(
  input: CreateDetectionEventInput,
): DetectionEvent {
  const event: DetectionEvent = {
    ...input,
    id: getNextEventId(),
  };

  db.prepare(
    `
      INSERT INTO detection_events (
        id,
        label,
        camera_name,
        confidence,
        time_label,
        severity
      )
      VALUES (
        @id,
        @label,
        @cameraName,
        @confidence,
        @timeLabel,
        @severity
      )
    `,
  ).run(event);

  return event;
}
