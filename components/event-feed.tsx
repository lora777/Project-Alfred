import { Clock3, Footprints } from "lucide-react";
import { recentEvents, type DetectionLabel } from "@/data/mock-data";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/section-heading";

const labelStyles: Record<DetectionLabel, string> = {
  coyote: "border-red-900/70 bg-red-950/50 text-red-400",
  Bruce: "border-sky-900/70 bg-sky-950/40 text-sky-400",
  raccoon: "border-amber-900/70 bg-amber-950/30 text-amber-400",
  "unknown animal": "border-zinc-700 bg-zinc-900 text-zinc-400",
};

export function EventFeed() {
  return (
    <section>
      <SectionHeading
        icon={Clock3}
        eyebrow="Detection log"
        title="Recent events"
        count={recentEvents.length}
      />
      <Card className="divide-y divide-zinc-800/80 overflow-hidden">
        {recentEvents.map((event) => (
          <div
            key={event.id}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-900/60"
          >
            <div
              className={`grid h-9 w-9 place-items-center rounded-lg border ${labelStyles[event.label]}`}
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
                {event.camera} · {event.confidence.toFixed(1)}% confidence
              </p>
            </div>
            <time className="font-mono text-[10px] text-zinc-500">
              {event.timestamp}
            </time>
          </div>
        ))}
      </Card>
    </section>
  );
}
