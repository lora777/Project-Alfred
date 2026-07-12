"use client";

import { useCallback, useEffect, useState } from "react";
import { Grid2X2 } from "lucide-react";
import type { DashboardData } from "@/data/mock-data";
import { AlertBanner } from "@/components/alert-banner";
import { CameraCard } from "@/components/camera-card";
import { EventFeed } from "@/components/event-feed";
import { ReviewQueue } from "@/components/review-queue";
import { SectionHeading } from "@/components/section-heading";
import { SiteHeader } from "@/components/site-header";

export function DashboardClient() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

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
        { label: "Storage", value: dashboardStats.storageLabel },
        { label: "Threat state", value: dashboardStats.threatStateLabel },
      ]
    : [];

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="pointer-events-none fixed left-1/2 top-[-20rem] h-[38rem] w-[60rem] -translate-x-1/2 rounded-full bg-red-950/10 blur-[120px]" />

      <div className="relative mx-auto max-w-[1440px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
        <SiteHeader />

        <div className="mt-6">
          {activeAlert && <AlertBanner activeAlert={activeAlert} />}
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
          <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
            <section>
              <SectionHeading
                icon={Grid2X2}
                eyebrow="Live surveillance"
                title="Camera network"
                count={cameras.length}
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
                events={detectionEvents}
                isCreatingEvent={isCreatingEvent}
                onCreateEvent={handleCreateEvent}
              />
              <ReviewQueue items={reviewQueue} />
            </aside>
          </div>
        )}

        <footer className="mt-10 flex flex-col gap-2 border-t border-zinc-900 pt-5 font-mono text-[9px] uppercase tracking-widest text-zinc-700 sm:flex-row sm:items-center sm:justify-between">
          <span>Alfred monitoring node / residential perimeter</span>
          <span>Local processing enabled · Data encrypted</span>
        </footer>
      </div>
    </main>
  );
}
