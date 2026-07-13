import Database from "better-sqlite3";
import { statSync } from "node:fs";
import { join } from "node:path";

export type EventMediaKind = "snapshot" | "clip";

export type StoredEventMedia = {
  id: number;
  eventId: string;
  kind: EventMediaKind;
  filePath: string;
  mimeType: string;
  durationSeconds: number | null;
  fileSizeBytes: number | null;
  createdAt: string;
};

type EventMediaRow = {
  id: number;
  event_id: string;
  kind: EventMediaKind;
  file_path: string;
  mime_type: string;
  duration_seconds: number | null;
  file_size_bytes: number | null;
  created_at: string;
};

const databasePath =
  process.env.ALFRED_DATABASE_PATH ?? join(process.cwd(), "data", "alfred.db");

const db = new Database(databasePath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS event_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('snapshot', 'clip')),
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    duration_seconds REAL,
    file_size_bytes INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES detection_events(id) ON DELETE CASCADE,
    UNIQUE (event_id, kind)
  );

  CREATE INDEX IF NOT EXISTS idx_event_media_event_id
  ON event_media(event_id);
`);

function mapEventMedia(row: EventMediaRow): StoredEventMedia {
  return {
    id: row.id,
    eventId: row.event_id,
    kind: row.kind,
    filePath: row.file_path,
    mimeType: row.mime_type,
    durationSeconds: row.duration_seconds,
    fileSizeBytes: row.file_size_bytes,
    createdAt: row.created_at,
  };
}

export function ensureStoredEventSnapshots() {
  db.prepare(
    `
      INSERT OR IGNORE INTO event_media (
        event_id,
        kind,
        file_path,
        mime_type
      )
      SELECT
        id,
        'snapshot',
        CASE camera_name
          WHEN 'Front Porch' THEN 'snapshots/front-porch.svg'
          WHEN 'Backyard' THEN 'snapshots/backyard.svg'
          WHEN 'Driveway' THEN 'snapshots/driveway.svg'
          WHEN 'Side Gate' THEN 'snapshots/side-gate.svg'
        END,
        'image/svg+xml'
      FROM detection_events
      WHERE camera_name IN ('Front Porch', 'Backyard', 'Driveway', 'Side Gate')
    `,
  ).run();

  const updateFileSize = db.prepare(`
    UPDATE event_media
    SET file_size_bytes = ?
    WHERE kind = 'snapshot' AND file_path = ? AND file_size_bytes IS NULL
  `);
  const snapshotPaths = [
    "snapshots/front-porch.svg",
    "snapshots/backyard.svg",
    "snapshots/driveway.svg",
    "snapshots/side-gate.svg",
  ];

  const saveFileSizes = db.transaction(() => {
    for (const filePath of snapshotPaths) {
      const absolutePath = join(process.cwd(), "data", "media", filePath);
      updateFileSize.run(statSync(absolutePath).size, filePath);
    }
  });

  saveFileSizes();
}

export function getStoredEventMedia(
  eventId: string,
  kind: EventMediaKind,
): StoredEventMedia | null {
  const row = db
    .prepare(
      `
        SELECT
          id,
          event_id,
          kind,
          file_path,
          mime_type,
          duration_seconds,
          file_size_bytes,
          created_at
        FROM event_media
        WHERE event_id = ? AND kind = ?
      `,
    )
    .get(eventId, kind) as EventMediaRow | undefined;

  return row ? mapEventMedia(row) : null;
}
