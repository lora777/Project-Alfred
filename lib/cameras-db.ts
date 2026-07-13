import Database from "better-sqlite3";
import { join } from "node:path";
import {
  cameras as seedCameras,
  type Camera,
  type CameraConfigurationInput,
} from "@/data/mock-data";

type CameraRow = {
  id: string;
  name: string;
  location: string;
  code: string;
  status: Camera["status"];
  feed_label: string;
  quality_label: string;
  current_time_label: string;
  signal_strength: number;
  last_detected_label: string;
  last_detected_confidence: number;
  last_detected_timestamp_label: string;
  recording: number;
  source_type: Camera["sourceType"];
  source_url: string | null;
  snapshot_file_path: string | null;
  snapshot_mime_type: string | null;
  snapshot_captured_at: string | null;
  feed_visual_focal_point: string;
  feed_visual_detection_zone: string;
  feed_visual_activity_region: string;
};

const databasePath =
  process.env.ALFRED_DATABASE_PATH ?? join(process.cwd(), "data", "alfred.db");
const db = new Database(databasePath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS cameras (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('online', 'offline')),
    feed_label TEXT NOT NULL,
    quality_label TEXT NOT NULL,
    current_time_label TEXT NOT NULL,
    signal_strength INTEGER NOT NULL CHECK (signal_strength BETWEEN 0 AND 100),
    last_detected_label TEXT NOT NULL,
    last_detected_confidence REAL NOT NULL,
    last_detected_timestamp_label TEXT NOT NULL,
    recording INTEGER NOT NULL CHECK (recording IN (0, 1)),
    source_type TEXT NOT NULL DEFAULT 'simulated' CHECK (source_type IN ('simulated', 'http_snapshot')),
    source_url TEXT,
    snapshot_file_path TEXT,
    snapshot_mime_type TEXT,
    snapshot_captured_at TEXT,
    feed_visual_focal_point TEXT NOT NULL,
    feed_visual_detection_zone TEXT NOT NULL,
    feed_visual_activity_region TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const cameraColumns = new Set(
  (db.prepare("PRAGMA table_info(cameras)").all() as Array<{ name: string }>).map(
    ({ name }) => name,
  ),
);

const cameraMigrations = [
  ["source_type", "ALTER TABLE cameras ADD COLUMN source_type TEXT NOT NULL DEFAULT 'simulated'"],
  ["source_url", "ALTER TABLE cameras ADD COLUMN source_url TEXT"],
  ["snapshot_file_path", "ALTER TABLE cameras ADD COLUMN snapshot_file_path TEXT"],
  ["snapshot_mime_type", "ALTER TABLE cameras ADD COLUMN snapshot_mime_type TEXT"],
  ["snapshot_captured_at", "ALTER TABLE cameras ADD COLUMN snapshot_captured_at TEXT"],
] as const;

for (const [column, migration] of cameraMigrations) {
  if (!cameraColumns.has(column)) db.exec(migration);
}

const countCameras = db
  .prepare("SELECT COUNT(*) AS count FROM cameras")
  .get() as { count: number };

if (countCameras.count === 0) {
  const insertCamera = db.prepare(`
    INSERT INTO cameras (
      id,
      name,
      location,
      code,
      status,
      feed_label,
      quality_label,
      current_time_label,
      signal_strength,
      last_detected_label,
      last_detected_confidence,
      last_detected_timestamp_label,
      recording,
      source_type,
      feed_visual_focal_point,
      feed_visual_detection_zone,
      feed_visual_activity_region
    )
    VALUES (
      @id,
      @name,
      @location,
      @code,
      @status,
      @feedLabel,
      @qualityLabel,
      @currentTimeLabel,
      @signalStrength,
      @lastDetectedLabel,
      @lastDetectedConfidence,
      @lastDetectedTimestampLabel,
      @recording,
      @sourceType,
      @feedVisualFocalPoint,
      @feedVisualDetectionZone,
      @feedVisualActivityRegion
    )
  `);

  const seed = db.transaction((cameras: Camera[]) => {
    for (const camera of cameras) {
      insertCamera.run({
        id: camera.id,
        name: camera.name,
        location: camera.location,
        code: camera.code,
        status: camera.status,
        feedLabel: camera.feedLabel,
        qualityLabel: camera.qualityLabel,
        currentTimeLabel: camera.currentTimeLabel,
        signalStrength: camera.signalStrength,
        lastDetectedLabel: camera.lastDetected.label,
        lastDetectedConfidence: camera.lastDetected.confidence,
        lastDetectedTimestampLabel: camera.lastDetected.timestampLabel,
        recording: camera.recording ? 1 : 0,
        sourceType: camera.sourceType,
        feedVisualFocalPoint: camera.feedVisual.focalPoint,
        feedVisualDetectionZone: camera.feedVisual.detectionZone,
        feedVisualActivityRegion: camera.feedVisual.activityRegion,
      });
    }
  });

  seed(seedCameras);
}

function mapCamera(row: CameraRow): Camera {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    code: row.code,
    status: row.status,
    feedLabel: row.feed_label,
    qualityLabel: row.quality_label,
    currentTimeLabel: row.current_time_label,
    signalStrength: row.signal_strength,
    lastDetected: {
      label: row.last_detected_label,
      confidence: row.last_detected_confidence,
      timestampLabel: row.last_detected_timestamp_label,
    },
    recording: row.recording === 1,
    sourceType: row.source_type,
    sourceConfigured: row.source_type === "simulated" || Boolean(row.source_url),
    snapshotAvailable: Boolean(row.snapshot_file_path),
    snapshotCapturedAt: row.snapshot_captured_at,
    feedVisual: {
      focalPoint: row.feed_visual_focal_point,
      detectionZone: row.feed_visual_detection_zone,
      activityRegion: row.feed_visual_activity_region,
    },
  };
}

export function getStoredCameras(): Camera[] {
  const rows = db
    .prepare(`
      SELECT
        id,
        name,
        location,
        code,
        status,
        feed_label,
        quality_label,
        current_time_label,
        signal_strength,
        last_detected_label,
        last_detected_confidence,
        last_detected_timestamp_label,
        recording,
        source_type,
        source_url,
        snapshot_file_path,
        snapshot_mime_type,
        snapshot_captured_at,
        feed_visual_focal_point,
        feed_visual_detection_zone,
        feed_visual_activity_region
      FROM cameras
      ORDER BY code ASC
    `)
    .all() as CameraRow[];

  return rows.map(mapCamera);
}

export function getStoredCamera(id: string): Camera | null {
  return getStoredCameras().find((camera) => camera.id === id) ?? null;
}

export type StoredCameraSource = {
  sourceType: Camera["sourceType"];
  sourceUrl: string | null;
};

export function getStoredCameraSource(id: string): StoredCameraSource | null {
  const row = db
    .prepare("SELECT source_type, source_url FROM cameras WHERE id = ?")
    .get(id) as Pick<CameraRow, "source_type" | "source_url"> | undefined;

  return row
    ? { sourceType: row.source_type, sourceUrl: row.source_url }
    : null;
}

export type StoredCameraSnapshot = {
  filePath: string;
  mimeType: string;
  capturedAt: string;
};

export function getStoredCameraSnapshot(id: string): StoredCameraSnapshot | null {
  const row = db
    .prepare(
      `
        SELECT snapshot_file_path, snapshot_mime_type, snapshot_captured_at
        FROM cameras
        WHERE id = ? AND snapshot_file_path IS NOT NULL
      `,
    )
    .get(id) as
    | Pick<CameraRow, "snapshot_file_path" | "snapshot_mime_type" | "snapshot_captured_at">
    | undefined;

  if (!row?.snapshot_file_path || !row.snapshot_mime_type || !row.snapshot_captured_at) {
    return null;
  }

  return {
    filePath: row.snapshot_file_path,
    mimeType: row.snapshot_mime_type,
    capturedAt: row.snapshot_captured_at,
  };
}

export function updateStoredCameraSnapshot(
  id: string,
  snapshot: StoredCameraSnapshot,
) {
  const result = db
    .prepare(
      `
        UPDATE cameras
        SET
          snapshot_file_path = @filePath,
          snapshot_mime_type = @mimeType,
          snapshot_captured_at = @capturedAt,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = @id
      `,
    )
    .run({ id, ...snapshot });

  return result.changes > 0;
}

function getNextCameraId() {
  const row = db
    .prepare(
      `
        SELECT id
        FROM cameras
        WHERE id LIKE 'cam-%'
        ORDER BY CAST(SUBSTR(id, 5) AS INTEGER) DESC
        LIMIT 1
      `,
    )
    .get() as { id: string } | undefined;
  const currentNumber = row ? Number(row.id.replace("cam-", "")) : 0;

  return `cam-${String(currentNumber + 1).padStart(2, "0")}`;
}

function cameraCodeExists(code: string, excludingId?: string) {
  const row = db
    .prepare(
      `
        SELECT id
        FROM cameras
        WHERE code = @code AND (@excludingId IS NULL OR id != @excludingId)
        LIMIT 1
      `,
    )
    .get({ code, excludingId: excludingId ?? null }) as { id: string } | undefined;

  return Boolean(row);
}

export class CameraCodeConflictError extends Error {
  constructor(code: string) {
    super(`Camera code ${code} is already in use`);
    this.name = "CameraCodeConflictError";
  }
}

export class CameraSourceConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CameraSourceConfigurationError";
  }
}

export function createStoredCamera(input: CameraConfigurationInput): Camera {
  if (cameraCodeExists(input.code)) {
    throw new CameraCodeConflictError(input.code);
  }

  const id = getNextCameraId();
  const sourceUrl = input.snapshotUrl?.trim() || null;

  if (input.sourceType === "http_snapshot" && !sourceUrl) {
    throw new CameraSourceConfigurationError(
      "An HTTP snapshot URL is required for this camera source",
    );
  }

  const visual = seedCameras[(Number(id.replace("cam-", "")) - 1) % seedCameras.length]
    .feedVisual;
  const camera: Camera = {
    id,
    name: input.name,
    location: input.location,
    code: input.code,
    status: input.status,
    qualityLabel: input.qualityLabel,
    feedLabel: input.status === "online" ? "Live encrypted feed" : "Feed unavailable",
    currentTimeLabel: "Awaiting synchronization",
    signalStrength: input.status === "online" ? 100 : 0,
    lastDetected: {
      label: "No detections",
      confidence: 0,
      timestampLabel: "Awaiting first event",
    },
    recording: input.status === "online" && input.recording,
    sourceType: input.sourceType,
    sourceConfigured: input.sourceType === "simulated" || Boolean(sourceUrl),
    snapshotAvailable: false,
    snapshotCapturedAt: null,
    feedVisual: visual,
  };

  db.prepare(
    `
      INSERT INTO cameras (
        id,
        name,
        location,
        code,
        status,
        feed_label,
        quality_label,
        current_time_label,
        signal_strength,
        last_detected_label,
        last_detected_confidence,
        last_detected_timestamp_label,
        recording,
        source_type,
        source_url,
        feed_visual_focal_point,
        feed_visual_detection_zone,
        feed_visual_activity_region
      )
      VALUES (
        @id,
        @name,
        @location,
        @code,
        @status,
        @feedLabel,
        @qualityLabel,
        @currentTimeLabel,
        @signalStrength,
        @lastDetectedLabel,
        @lastDetectedConfidence,
        @lastDetectedTimestampLabel,
        @recording,
        @sourceType,
        @sourceUrl,
        @feedVisualFocalPoint,
        @feedVisualDetectionZone,
        @feedVisualActivityRegion
      )
    `,
  ).run({
    ...camera,
    lastDetectedLabel: camera.lastDetected.label,
    lastDetectedConfidence: camera.lastDetected.confidence,
    lastDetectedTimestampLabel: camera.lastDetected.timestampLabel,
    recording: camera.recording ? 1 : 0,
    sourceUrl,
    feedVisualFocalPoint: camera.feedVisual.focalPoint,
    feedVisualDetectionZone: camera.feedVisual.detectionZone,
    feedVisualActivityRegion: camera.feedVisual.activityRegion,
  });

  return camera;
}

export function updateStoredCamera(
  id: string,
  input: CameraConfigurationInput,
): Camera | null {
  const current = getStoredCameras().find((camera) => camera.id === id);

  if (!current) return null;

  if (cameraCodeExists(input.code, id)) {
    throw new CameraCodeConflictError(input.code);
  }

  const currentSource = getStoredCameraSource(id);
  const sourceUrl =
    input.sourceType === "http_snapshot"
      ? input.snapshotUrl?.trim() || currentSource?.sourceUrl || null
      : null;

  if (input.sourceType === "http_snapshot" && !sourceUrl) {
    throw new CameraSourceConfigurationError(
      "An HTTP snapshot URL is required for this camera source",
    );
  }

  const clearSnapshot =
    current.sourceType !== input.sourceType || Boolean(input.snapshotUrl?.trim());

  const camera: Camera = {
    ...current,
    name: input.name,
    location: input.location,
    code: input.code,
    status: input.status,
    qualityLabel: input.qualityLabel,
    feedLabel: input.status === "online" ? "Live encrypted feed" : "Feed unavailable",
    signalStrength:
      input.status === "offline"
        ? 0
        : current.signalStrength > 0
          ? current.signalStrength
          : 100,
    recording: input.status === "online" && input.recording,
    sourceType: input.sourceType,
    sourceConfigured: input.sourceType === "simulated" || Boolean(sourceUrl),
    snapshotAvailable: clearSnapshot ? false : current.snapshotAvailable,
    snapshotCapturedAt: clearSnapshot ? null : current.snapshotCapturedAt,
  };

  db.prepare(
    `
      UPDATE cameras
      SET
        name = @name,
        location = @location,
        code = @code,
        status = @status,
        feed_label = @feedLabel,
        quality_label = @qualityLabel,
        signal_strength = @signalStrength,
        recording = @recording,
        source_type = @sourceType,
        source_url = @sourceUrl,
        snapshot_file_path = CASE WHEN @clearSnapshot = 1 THEN NULL ELSE snapshot_file_path END,
        snapshot_mime_type = CASE WHEN @clearSnapshot = 1 THEN NULL ELSE snapshot_mime_type END,
        snapshot_captured_at = CASE WHEN @clearSnapshot = 1 THEN NULL ELSE snapshot_captured_at END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `,
  ).run({
    ...camera,
    recording: camera.recording ? 1 : 0,
    sourceUrl,
    clearSnapshot: clearSnapshot ? 1 : 0,
  });

  return camera;
}

export function deleteStoredCamera(id: string): boolean {
  const result = db.prepare("DELETE FROM cameras WHERE id = ?").run(id);

  return result.changes > 0;
}
