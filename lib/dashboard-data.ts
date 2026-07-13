import {
  type CreateDetectionEventInput,
  type DashboardData,
  type DashboardStats,
  type DetectionEventFilters,
  type EventStatus,
  type ReviewQueueItem,
} from "@/data/mock-data";
import { getStoredCameras } from "@/lib/cameras-db";
import {
  createStoredDetectionEvent,
  getFilteredStoredDetectionEvents,
  getStoredDetectionEventStats,
  getStoredDetectionEvents,
  updateStoredDetectionEventStatus,
} from "@/lib/detection-events-db";
import {
  ensureStoredEventSnapshots,
  getStoredEventMedia,
} from "@/lib/event-media-db";

export function getCameras() {
  return getStoredCameras();
}

export function getDetectionEvents(filters: DetectionEventFilters = {}) {
  return getFilteredStoredDetectionEvents(filters);
}

export function getReviewQueue() {
  ensureStoredEventSnapshots();

  return getStoredDetectionEvents()
    .filter((event) => event.status === "new")
    .map(
      (event): ReviewQueueItem => {
        const snapshot = getStoredEventMedia(event.id, "snapshot");
        const clip = getStoredEventMedia(event.id, "clip");

        return {
          id: event.id,
          title: `${event.label} detection`,
          cameraName: event.cameraName,
          timestampLabel: event.timeLabel,
          confidence: event.confidence,
          suggestedLabels: ["Cat", "Coyote", "Raccoon", "Unknown"],
          snapshotUrl: snapshot
            ? `/api/events/${encodeURIComponent(event.id)}/media/snapshot`
            : null,
          clipUrl: clip
            ? `/api/events/${encodeURIComponent(event.id)}/media/clip`
            : null,
          clipDurationSeconds: clip?.durationSeconds ?? null,
        };
      },
    );
}

export function getDashboardStats(): DashboardStats {
  const stats = getStoredDetectionEventStats();

  return {
    eventsToday: stats.eventsToday,
    pendingReview: stats.pendingReview,
    threatStateLabel: stats.activeThreats > 0 ? "Active" : "Clear",
  };
}

export function getActiveAlert() {
  const event = getStoredDetectionEvents().find(
    (candidate) =>
      candidate.status === "new" && candidate.severity === "threat",
  );

  if (!event) {
    return null;
  }

  return {
    active: true,
    label: event.label,
    camera: event.cameraName,
    detectedAt: event.timeLabel,
  };
}

export function getDashboardData(): DashboardData {
  return {
    cameras: getCameras(),
    detectionEvents: getDetectionEvents(),
    reviewQueue: getReviewQueue(),
    dashboardStats: getDashboardStats(),
    activeAlert: getActiveAlert(),
  };
}

export function createDetectionEvent(
  input: CreateDetectionEventInput,
) {
  return createStoredDetectionEvent(input);
}

export function updateDetectionEventStatus(
  id: string,
  status: EventStatus,
  reviewedLabel?: string,
) {
  return updateStoredDetectionEventStatus(id, status, reviewedLabel);
}
