"use client";

import { useState } from "react";
import { CheckCircle2, ScanSearch } from "lucide-react";
import type { ReviewQueueItem } from "@/data/mock-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/section-heading";

export function ReviewQueue({ items }: { items: ReviewQueueItem[] }) {
  const [reviewed, setReviewed] = useState<Record<string, string>>({});

  return (
    <section>
      <SectionHeading
        icon={ScanSearch}
        eyebrow="Human verification"
        title="Review queue"
        count={items.length}
      />
      <Card className="divide-y divide-zinc-800/80 overflow-hidden">
        {items.map((item) => {
          const classification = reviewed[item.id];
          return (
            <div key={item.id} className="p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="camera-feed grid h-12 w-16 place-items-center rounded-md border border-zinc-800 bg-zinc-900">
                    <ScanSearch className="h-4 w-4 text-zinc-700" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-300">
                      {item.title}
                    </p>
                    <p className="mt-1 font-mono text-[9px] text-zinc-600">
                      {item.cameraName} / {item.timestampLabel}
                    </p>
                  </div>
                </div>
                {classification && (
                  <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {classification}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {item.suggestedLabels.map((label) => (
                  <Button
                    key={label}
                    variant={classification === label ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setReviewed((current) => ({
                        ...current,
                        [item.id]: label,
                      }))
                    }
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          );
        })}
      </Card>
    </section>
  );
}
