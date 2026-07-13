"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, History, RotateCcw } from "lucide-react";
import type {
  Camera,
  DetectionEvent,
  EventStatus,
} from "@/data/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/section-heading";

const statusStyles: Record<EventStatus, string> = {
  new: "border-amber-900/70 bg-amber-950/30 text-amber-400",
  reviewed: "border-emerald-900/70 bg-emerald-950/30 text-emerald-400",
  dismissed: "border-zinc-700 bg-zinc-900 text-zinc-500",
};

const fieldClassName =
  "h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-xs text-zinc-300 outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-red-900";
const pageSize = 25;

function parseStoredDate(value: string) {
  return new Date(
    value.includes("T") ? value : `${value.replace(" ", "T")}Z`,
  );
}

function formatEventDate(value: string) {
  const date = parseStoredDate(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatAnimalLabel(value: string) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function EventHistory({
  cameras,
  refreshKey,
}: {
  cameras: Camera[];
  refreshKey: string;
}) {
  const [camera, setCamera] = useState("");
  const [animal, setAnimal] = useState("");
  const [status, setStatus] = useState<EventStatus | "">("");
  const [date, setDate] = useState("");
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const [animalOptions, setAnimalOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const hasFilters = Boolean(camera || animal || status || date);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvents() {
      setIsLoading(true);

      const query = new URLSearchParams({ includeDismissed: "true" });
      if (camera) query.set("camera", camera);
      if (animal) query.set("animal", animal);
      if (status) query.set("status", status);
      if (date) query.set("date", date);

      try {
        const response = await fetch(`/api/events?${query.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(body?.error ?? `Event API returned ${response.status}`);
        }

        const data = (await response.json()) as DetectionEvent[];
        setEvents(data);
        setError(null);

        if (!hasFilters) {
          setAnimalOptions(
            Array.from(
              new Set(
                data.flatMap((event) =>
                  event.reviewedLabel
                    ? [event.label, event.reviewedLabel]
                    : [event.label],
                ),
              ),
            ).sort((left, right) => left.localeCompare(right)),
          );
        }
      } catch (caughtError) {
        if ((caughtError as Error).name !== "AbortError") {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load event history",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadEvents();
    return () => controller.abort();
  }, [animal, camera, date, hasFilters, refreshKey, status]);

  const visibleCameras = useMemo(
    () => [...cameras].sort((left, right) => left.name.localeCompare(right.name)),
    [cameras],
  );
  const pageCount = Math.max(1, Math.ceil(events.length / pageSize));
  const visibleEvents = useMemo(
    () => events.slice((page - 1) * pageSize, page * pageSize),
    [events, page],
  );

  useEffect(() => {
    setPage(1);
  }, [animal, camera, date, status]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function clearFilters() {
    setCamera("");
    setAnimal("");
    setStatus("");
    setDate("");
  }

  return (
    <section className="mt-10">
      <SectionHeading
        icon={History}
        eyebrow="Searchable archive"
        title="Event history"
        count={events.length}
        action={
          hasFilters ? (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <RotateCcw className="mr-1.5 h-3 w-3" /> Clear filters
            </Button>
          ) : null
        }
      />

      <Card className="overflow-hidden">
        <div className="grid gap-3 border-b border-zinc-800/80 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              Camera
            </span>
            <select
              className={fieldClassName}
              value={camera}
              onChange={(event) => setCamera(event.target.value)}
            >
              <option value="">All cameras</option>
              {visibleCameras.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              Animal
            </span>
            <select
              className={fieldClassName}
              value={animal}
              onChange={(event) => setAnimal(event.target.value)}
            >
              <option value="">All animals</option>
              {animalOptions.map((item) => (
                <option key={item} value={item}>
                  {formatAnimalLabel(item)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              Status
            </span>
            <select
              className={fieldClassName}
              value={status}
              onChange={(event) => setStatus(event.target.value as EventStatus | "")}
            >
              <option value="">All statuses</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              Date
            </span>
            <input
              type="date"
              className={fieldClassName}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
        </div>

        {error && (
          <div className="border-b border-red-900/50 bg-red-950/20 px-4 py-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-zinc-800/80 bg-zinc-950/80 font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-medium">Detection</th>
                <th className="px-4 py-3 font-medium">Camera</th>
                <th className="px-4 py-3 font-medium">Confidence</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {visibleEvents.map((event) => (
                <tr key={event.id} className="transition-colors hover:bg-zinc-900/40">
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium capitalize text-zinc-200">
                      {event.reviewedLabel ?? event.label}
                    </p>
                    <p className="mt-1 font-mono text-[9px] text-zinc-600">
                      {event.id}
                      {event.reviewedLabel && event.reviewedLabel !== event.label
                        ? ` / AI: ${event.label}`
                        : ""}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-zinc-400">
                    {event.cameraName}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[10px] text-zinc-500">
                    {event.confidence.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge className={statusStyles[event.status]}>{event.status}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-[10px] text-zinc-500">
                    {formatEventDate(event.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && events.length === 0 && !error && (
          <div className="px-4 py-10 text-center text-xs text-zinc-600">
            No events match the selected filters.
          </div>
        )}

        {isLoading && (
          <div className="border-t border-zinc-800/70 px-4 py-3 font-mono text-[9px] uppercase tracking-wider text-zinc-600">
            Loading event history...
          </div>
        )}

        {!isLoading && events.length > pageSize && (
          <div className="flex items-center justify-between border-t border-zinc-800/70 px-4 py-3">
            <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              Page {page} of {pageCount} / {events.length} events
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="mr-1 h-3 w-3" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((current) => Math.min(pageCount, current + 1))
                }
                disabled={page === pageCount}
              >
                Next <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}
