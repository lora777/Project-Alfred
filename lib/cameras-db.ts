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
    feed_visual_focal_point TEXT NOT NULL,
    feed_visual_detection_zone TEXT NOT NULL,
    feed_visual_activity_region TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

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
        feed_visual_focal_point,
        feed_visual_detection_zone,
        feed_visual_activity_region
      FROM cameras
      ORDER BY code ASC
    `)
    .all() as CameraRow[];

  return rows.map(mapCamera);
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

export function createStoredCamera(input: CameraConfigurationInput): Camera {
  if (cameraCodeExists(input.code)) {
    throw new CameraCodeConflictError(input.code);
  }

  const id = getNextCameraId();
  const visual = seedCameras[(Number(id.replace("cam-", "")) - 1) % seedCameras.length]
    .feedVisual;
  const camera: Camera = {
    ...input,
    id,
    feedLabel: input.status === "online" ? "Live encrypted feed" : "Feed unavailable",
    currentTimeLabel: "Awaiting synchronization",
    signalStrength: input.status === "online" ? 100 : 0,
    lastDetected: {
      label: "No detections",
      confidence: 0,
      timestampLabel: "Awaiting first event",
    },
    recording: input.status === "online" && input.recording,
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

  const camera: Camera = {
    ...current,
    ...input,
    feedLabel: input.status === "online" ? "Live encrypted feed" : "Feed unavailable",
    signalStrength:
      input.status === "offline"
        ? 0
        : current.signalStrength > 0
          ? current.signalStrength
          : 100,
    recording: input.status === "online" && input.recording,
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
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `,
  ).run({
    ...camera,
    recording: camera.recording ? 1 : 0,
  });

  return camera;
}
