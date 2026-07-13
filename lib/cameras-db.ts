import Database from "better-sqlite3";
import { join } from "node:path";
import { cameras as seedCameras, type Camera } from "@/data/mock-data";

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

const databasePath = join(process.cwd(), "data", "alfred.db");
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
