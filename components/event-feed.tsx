import { Check, Clock3, Footprints, Plus, X } from "lucide-react";
import type { DetectionEvent, EventStatus } from "@/data/mock-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/section-heading";

const severityStyles: Record<DetectionEvent["severity"], string> = {
  threat: "border-red-900/70 bg-red-950/50 text-red-400",
  safe: "border-sky-900/70 bg-sky-950/40 text-sky-400",
  neutral: "border-amber-900/70 bg-amber-950/30 text-amber-400",
  unknown: "border-zinc-700 bg-zinc-900 text-zinc-400",
};

export function EventFeed({
  events,
  isCreatingEvent,
  onCreateEvent,
  pendingUpdates,
  onUpdateStatus,
}: {
  events: DetectionEvent[];
  isCreatingEvent?: boolean;
  onCreateEvent?: () => void;
  pendingUpdates?: Record<string, EventStatus>;
  onUpdateStatus?: (event: DetectionEvent, status: EventStatus) => void;
}) {
  return (
    <section>
      <SectionHeading
        icon={Clock3}
        eyebrow="Detection log"
        title="Recent events"
        count={events.length}
        action={
          onCreateEvent ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateEvent}
              disabled={isCreatingEvent}
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              {isCreatingEvent ? "Posting" : "Simulate"}
            </Button>
          ) : null
        }
      />
      <Card className="divide-y divide-zinc-800/80 overflow-hidden">
        {events.map((event) => (
          <div
            key={event.id}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-900/60"
          >
            <div
              className={`grid h-9 w-9 place-items-center rounded-lg border ${severityStyles[event.severity]}`}
            >
              <Footprints className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium capitalize text-zinc-200">
                  {event.label}
                </p>
                <span className="font-mono text-[9px] text-zinc-700">
                  {event.id}
                </span>
              </div>
              <p className="mt-1 truncate text-[11px] text-zinc-600">
                {event.cameraName}{" \u00b7 "}{event.confidence.toFixed(1)}%
                confidence
              </p>
            </div>
            <div className="text-right">
              <time className="font-mono text-[10px] text-zinc-500">
                {event.timeLabel}
              </time>
              {onUpdateStatus && (
                <div className="mt-2 flex justify-end gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateStatus(event, "reviewed")}
                    disabled={Boolean(pendingUpdates?.[event.id]) || event.status === "reviewed"}
                  >
                    <Check className="mr-1.5 h-3 w-3" />
                    {pendingUpdates?.[event.id] === "reviewed"
                      ? "Saving"
                      : event.status === "reviewed"
                        ? "Reviewed"
                        : "Mark reviewed"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdateStatus(event, "dismissed")}
                    disabled={Boolean(pendingUpdates?.[event.id])}
                  >
                    <X className="mr-1.5 h-3 w-3" />
                    {pendingUpdates?.[event.id] === "dismissed" ? "Saving" : "Dismiss"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </Card>
    </section>
  );
}
