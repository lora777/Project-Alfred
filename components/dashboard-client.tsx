"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Grid2X2, Settings2 } from "lucide-react";
import type { DashboardData, DetectionEvent, EventStatus } from "@/data/mock-data";
import { AlertBanner } from "@/components/alert-banner";
import { CameraCard } from "@/components/camera-card";
import { CameraManager } from "@/components/camera-manager";
import { EventFeed } from "@/components/event-feed";
import { EventHistory } from "@/components/event-history";
import { ReviewQueue } from "@/components/review-queue";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import {
  SiteHeader,
  type DashboardView,
} from "@/components/site-header";

export function DashboardClient({ view = "live" }: { view?: DashboardView }) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isCameraManagerOpen, setIsCameraManagerOpen] = useState(false);
  const [pendingEventUpdates, setPendingEventUpdates] = useState<
    Record<string, EventStatus>
  >({});
  const pendingEventIds = useRef(new Set<string>());

  const loadDashboardData = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard");

      if (!response.ok) {
        throw new Error(`Dashboard API returned ${response.status}`);
      }

      const data = (await response.json()) as DashboardData;
      setDashboardData(data);
      setError(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load dashboard data",
      );
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  async function handleCreateEvent() {
    setIsCreatingEvent(true);
    setError(null);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: "coyote",
          cameraName: "Front Porch",
          confidence: 94.8,
          timeLabel: "Just now",
          severity: "threat",
        }),
      });

      if (!response.ok) {
        throw new Error(`Event API returned ${response.status}`);
      }

      await loadDashboardData();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create detection event",
      );
    } finally {
      setIsCreatingEvent(false);
    }
  }

  async function handleUpdateEventStatus(
    event: DetectionEvent,
    status: EventStatus,
    reviewedLabel?: string,
  ) {
    if (pendingEventIds.current.has(event.id)) {
      return;
    }

    pendingEventIds.current.add(event.id);
    setPendingEventUpdates((current) => ({ ...current, [event.id]: status }));
    setError(null);

    const previousIndex =
      dashboardData?.detectionEvents.findIndex(({ id }) => id === event.id) ?? -1;
    const previousQueueIndex =
      dashboardData?.reviewQueue.findIndex(({ id }) => id === event.id) ?? -1;
    const previousQueueItem = dashboardData?.reviewQueue.find(
      ({ id }) => id === event.id,
    );

    setDashboardData((current) => {
      if (!current) return current;

      return {
        ...current,
        detectionEvents:
          status === "dismissed"
            ? current.detectionEvents.filter(({ id }) => id !== event.id)
            : current.detectionEvents.map((currentEvent) =>
                currentEvent.id === event.id
                  ? { ...currentEvent, status }
                  : currentEvent,
              ),
        reviewQueue: current.reviewQueue.filter(({ id }) => id !== event.id),
        dashboardStats: {
          ...current.dashboardStats,
          pendingReview: Math.max(
            0,
            current.dashboardStats.pendingReview - (previousQueueItem ? 1 : 0),
          ),
        },
      };
    });

    try {
      const response = await fetch(`/api/events/${encodeURIComponent(event.id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, reviewedLabel }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? `Event API returned ${response.status}`);
      }

      const updatedEvent = (await response.json()) as DetectionEvent;

      if (status !== "dismissed") {
        setDashboardData((current) =>
          current
            ? {
                ...current,
                detectionEvents: current.detectionEvents.map((currentEvent) =>
                  currentEvent.id === updatedEvent.id ? updatedEvent : currentEvent,
                ),
              }
            : current,
        );
      }

      await loadDashboardData();
    } catch (caughtError) {
      setDashboardData((current) => {
        if (!current) return current;

        const existingIndex = current.detectionEvents.findIndex(
          ({ id }) => id === event.id,
        );
        const restoredEvents = [...current.detectionEvents];

        if (existingIndex >= 0) {
          restoredEvents[existingIndex] = event;
        } else {
          restoredEvents.splice(
            Math.max(0, Math.min(previousIndex, restoredEvents.length)),
            0,
            event,
          );
        }

        const restoredQueue = [...current.reviewQueue];

        if (
          previousQueueItem &&
          !restoredQueue.some(({ id }) => id === previousQueueItem.id)
        ) {
          restoredQueue.splice(
            Math.max(0, Math.min(previousQueueIndex, restoredQueue.length)),
            0,
            previousQueueItem,
          );
        }

        return {
          ...current,
          detectionEvents: restoredEvents,
          reviewQueue: restoredQueue,
          dashboardStats: {
            ...current.dashboardStats,
            pendingReview: previousQueueItem
              ? current.dashboardStats.pendingReview + 1
              : current.dashboardStats.pendingReview,
          },
        };
      });
      setError(
        caughtError instanceof Error
          ? `Unable to update ${event.id}: ${caughtError.message}`
          : `Unable to update ${event.id}`,
      );
    } finally {
      pendingEventIds.current.delete(event.id);
      setPendingEventUpdates((current) => {
        const next = { ...current };
        delete next[event.id];
        return next;
      });
    }
  }

  async function handleClassifyReviewItem(id: string, label: string) {
    const event = dashboardData?.detectionEvents.find(
      (candidate) => candidate.id === id,
    );

    if (!event) {
      setError(`Unable to review ${id}: event was not found in the dashboard`);
      return;
    }

    await handleUpdateEventStatus(event, "reviewed", label.toLowerCase());
  }

  async function handleDismissReviewItem(id: string) {
    const event = dashboardData?.detectionEvents.find(
      (candidate) => candidate.id === id,
    );

    if (!event) {
      setError(`Unable to dismiss ${id}: event was not found in the dashboard`);
      return;
    }

    await handleUpdateEventStatus(event, "dismissed");
  }

  const cameras = dashboardData?.cameras ?? [];
  const dashboardStats = dashboardData?.dashboardStats;
  const activeAlert = dashboardData?.activeAlert;
  const detectionEvents = dashboardData?.detectionEvents ?? [];
  const reviewQueue = dashboardData?.reviewQueue ?? [];

  const statCards = dashboardStats
    ? [
        {
          label: "Cameras online",
          value: `${cameras.filter((camera) => camera.status === "online").length}/${cameras.length}`,
        },
        { label: "Events today", value: String(dashboardStats.eventsToday) },
        {
          label: "Pending review",
          value: String(dashboardStats.pendingReview),
        },
        { label: "Threat state", value: dashboardStats.threatStateLabel },
      ]
    : [];

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="pointer-events-none fixed left-1/2 top-[-20rem] h-[38rem] w-[60rem] -translate-x-1/2 rounded-full bg-red-950/10 blur-[120px]" />

      <div className="relative mx-auto max-w-[1440px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
        <SiteHeader
          activeView={view}
          pendingReview={dashboardStats?.pendingReview ?? 0}
        />

        <div className={view === "live" ? "mt-6" : ""}>
          {view === "live" && activeAlert && (
            <AlertBanner activeAlert={activeAlert} />
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-900/70 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {!dashboardData && !error && (
          <div className="mt-8 rounded-lg border border-zinc-800/80 bg-zinc-950/45 px-4 py-3 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
            Loading dashboard data...
          </div>
        )}

        {dashboardData && (
          <>
            {view === "live" && (
            <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
              <section>
              <SectionHeading
                icon={Grid2X2}
                eyebrow="Live surveillance"
                title="Camera network"
                count={cameras.length}
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCameraManagerOpen(true)}
                  >
                    <Settings2 className="mr-2 h-3.5 w-3.5" />
                    Manage
                  </Button>
                }
              />
              <div className="grid gap-4 md:grid-cols-2">
                {cameras.map((camera) => (
                  <CameraCard key={camera.id} camera={camera} />
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {statCards.map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-lg border border-zinc-800/80 bg-zinc-950/45 px-4 py-3"
                  >
                    <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
                      {label}
                    </p>
                    <p
                      className={`mt-2 text-sm font-semibold ${
                        label === "Threat state" && value === "Active"
                          ? "text-red-400"
                          : "text-zinc-300"
                      }`}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              </section>

              <aside className="grid content-start gap-8 lg:grid-cols-2 xl:grid-cols-1">
              <EventFeed
                events={detectionEvents.slice(0, 5)}
                isCreatingEvent={isCreatingEvent}
                onCreateEvent={handleCreateEvent}
                pendingUpdates={pendingEventUpdates}
                onUpdateStatus={handleUpdateEventStatus}
              />
              </aside>
            </div>
            )}
            {view === "review" && (
              <div className="mx-auto mt-8 max-w-4xl">
                <ReviewQueue
                  items={reviewQueue}
                  pendingUpdates={pendingEventUpdates}
                  onClassify={handleClassifyReviewItem}
                  onDismiss={handleDismissReviewItem}
                />
              </div>
            )}
            {view === "history" && (
            <EventHistory
              cameras={cameras}
              refreshKey={detectionEvents
                .map((event) => `${event.id}:${event.status}`)
                .join("|")}
            />
            )}
          </>
        )}

        <footer className="mt-10 flex flex-col gap-2 border-t border-zinc-900 pt-5 font-mono text-[9px] uppercase tracking-widest text-zinc-700 sm:flex-row sm:items-center sm:justify-between">
          <span>Alfred monitoring node / residential perimeter</span>
          <span>Local processing enabled · Data encrypted</span>
        </footer>

        {isCameraManagerOpen && dashboardData && (
          <CameraManager
            cameras={cameras}
            onSaved={loadDashboardData}
            onClose={() => setIsCameraManagerOpen(false)}
          />
        )}
      </div>
    </main>
  );
}
