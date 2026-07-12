import {
  activeAlert,
  cameras,
  dashboardStats,
  detectionEvents,
  reviewQueue,
  type CreateDetectionEventInput,
  type DashboardData,
} from "@/data/mock-data";
import {
  createStoredDetectionEvent,
  getStoredDetectionEvents,
} from "@/lib/detection-events-db";

export function getCameras() {
  return cameras;
}

export function getDetectionEvents() {
  return getStoredDetectionEvents();
}

export function getReviewQueue() {
  return reviewQueue;
}

export function getDashboardStats() {
  const storedEvents = getStoredDetectionEvents();

  return {
    ...dashboardStats,
    eventsToday: dashboardStats.eventsToday + storedEvents.length - detectionEvents.length,
  };
}

export function getActiveAlert() {
  return activeAlert;
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
