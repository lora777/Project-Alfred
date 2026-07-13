"use client";

import { useState } from "react";
import { LoaderCircle, Maximize2, ScanSearch } from "lucide-react";
import type { EventStatus, ReviewQueueItem } from "@/data/mock-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReviewBoard } from "@/components/review-board";
import { SectionHeading } from "@/components/section-heading";

export function ReviewQueue({
  items,
  pendingUpdates,
  onClassify,
  onDismiss,
}: {
  items: ReviewQueueItem[];
  pendingUpdates?: Record<string, EventStatus>;
  onClassify?: (id: string, label: string) => void;
  onDismiss?: (id: string) => void;
}) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const selectedItem = items.find(({ id }) => id === selectedItemId);

  return (
    <>
      <section>
        <SectionHeading
          icon={ScanSearch}
          eyebrow="Human verification"
          title="Review queue"
          count={items.length}
        />
        <Card className="divide-y divide-zinc-800/80 overflow-hidden">
          {items.map((item) => {
            const isSaving = Boolean(pendingUpdates?.[item.id]);
            return (
              <div key={item.id} className="p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                  <div className="camera-feed relative grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-md border border-zinc-800 bg-zinc-900">
                    <ScanSearch className="h-4 w-4 text-zinc-700" />
                    {item.snapshotUrl && (
                      <img
                        src={item.snapshotUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-75"
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-zinc-300">
                      {item.title}
                    </p>
                    <p className="mt-1 truncate font-mono text-[9px] text-zinc-600">
                      {item.cameraName} / {item.timestampLabel} /{" "}
                      {item.confidence.toFixed(1)}%
                    </p>
                  </div>
                </div>
                {isSaving ? (
                  <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                    Saving
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedItemId(item.id)}
                  >
                    <Maximize2 className="mr-1.5 h-3 w-3" /> Review
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {item.suggestedLabels.map((label) => (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    onClick={() => onClassify?.(item.id, label)}
                    disabled={isSaving || !onClassify}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            );
          })}
          {items.length === 0 && (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-medium text-zinc-400">Queue clear</p>
              <p className="mt-2 text-xs text-zinc-600">
                New uncertain or threat detections will appear here.
              </p>
            </div>
          )}
        </Card>
      </section>

      {selectedItem && (
        <ReviewBoard
          item={selectedItem}
          isSaving={Boolean(pendingUpdates?.[selectedItem.id])}
          onClassify={(label) => onClassify?.(selectedItem.id, label)}
          onDismiss={() => onDismiss?.(selectedItem.id)}
          onClose={() => setSelectedItemId(null)}
        />
      )}
    </>
  );
}
