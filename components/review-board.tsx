"use client";

import { useEffect, useState } from "react";
import {
  Camera,
  Expand,
  LoaderCircle,
  Pause,
  Play,
  ScanSearch,
  X,
} from "lucide-react";
import type { ReviewQueueItem } from "@/data/mock-data";
import { Button } from "@/components/ui/button";

export function ReviewBoard({
  item,
  isSaving,
  onClassify,
  onDismiss,
  onClose,
}: {
  item: ReviewQueueItem;
  isSaving: boolean;
  onClassify: (label: string) => void;
  onDismiss: () => void;
  onClose: () => void;
}) {
  const [mediaMode, setMediaMode] = useState<"clip" | "snapshot">(
    item.snapshotUrl ? "snapshot" : "clip",
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [snapshotError, setSnapshotError] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSaving, onClose]);

  useEffect(() => {
    if (!isPlaying || mediaMode !== "clip") return;

    const interval = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 100) {
          setIsPlaying(false);
          return 0;
        }

        return current + 2;
      });
    }, 100);

    return () => window.clearInterval(interval);
  }, [isPlaying, mediaMode]);

  function selectMediaMode(mode: "clip" | "snapshot") {
    setMediaMode(mode);
    setIsPlaying(false);
    setProgress(0);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-board-title"
        className="w-full max-w-5xl overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-red-400">
              <ScanSearch className="h-3.5 w-3.5" /> Human verification / {item.id}
            </div>
            <h2 id="review-board-title" className="mt-2 text-lg font-semibold capitalize text-zinc-100">
              {item.title}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {item.cameraName} / {item.timestampLabel} / {item.confidence.toFixed(1)}% AI confidence
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close review board"
            onClick={onClose}
            disabled={isSaving}
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="border-b border-zinc-800 p-5 sm:p-6 lg:border-b-0 lg:border-r">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <Button
                  variant={mediaMode === "clip" ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectMediaMode("clip")}
                >
                  <Play className="mr-1.5 h-3 w-3" /> 5-sec clip
                </Button>
                <Button
                  variant={mediaMode === "snapshot" ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectMediaMode("snapshot")}
                >
                  <Camera className="mr-1.5 h-3 w-3" /> Snapshot
                </Button>
              </div>
              <span className="hidden font-mono text-[9px] uppercase tracking-wider text-zinc-600 sm:block">
                {mediaMode === "snapshot" && item.snapshotUrl
                  ? "Stored event snapshot"
                  : "Clip preview scaffold"}
              </span>
            </div>

            <div className="camera-feed relative aspect-video overflow-hidden rounded-lg border border-zinc-800 bg-[#080909]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_48%,rgba(82,92,85,0.22),transparent_28%),linear-gradient(135deg,rgba(39,43,41,0.5),transparent_55%)]" />
              {mediaMode === "snapshot" && item.snapshotUrl && !snapshotError && (
                <img
                  src={item.snapshotUrl}
                  alt={`${item.cameraName} event snapshot for ${item.title}`}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={() => setSnapshotError(true)}
                />
              )}
              <div className="absolute left-[38%] top-[28%] h-[38%] w-[28%] border border-red-500/50">
                <span className="absolute -top-5 left-0 bg-red-950/90 px-1.5 py-0.5 font-mono text-[8px] uppercase text-red-300">
                  {item.title.replace(" detection", "")}
                </span>
              </div>
              <div
                className={`absolute inset-0 grid place-items-center ${
                  mediaMode === "snapshot" && item.snapshotUrl && !snapshotError
                    ? "pointer-events-none opacity-0"
                    : ""
                }`}
              >
                <button
                  type="button"
                  aria-label={isPlaying ? "Pause preview" : "Play preview"}
                  onClick={() => mediaMode === "clip" && setIsPlaying((current) => !current)}
                  className="grid h-14 w-14 place-items-center rounded-full border border-zinc-600 bg-black/60 text-zinc-300 transition-colors hover:border-zinc-400 hover:text-white disabled:cursor-default"
                  disabled={mediaMode === "snapshot"}
                >
                  {mediaMode === "clip" ? (
                    isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-4 pb-3 pt-10">
                <div className="h-1 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full bg-red-500 transition-[width] duration-100"
                    style={{ width: `${mediaMode === "clip" ? progress : 100}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between font-mono text-[8px] uppercase tracking-wider text-zinc-500">
                  <span>{mediaMode === "clip" ? `${(progress * 0.05).toFixed(1)}s` : "Event snapshot"}</span>
                  <span>{mediaMode === "clip" ? "5.0s" : item.cameraName}</span>
                </div>
              </div>
            </div>

            <p className="mt-3 flex items-center gap-2 text-[10px] text-zinc-600">
              <Expand className="h-3.5 w-3.5" />
              {mediaMode === "snapshot" && item.snapshotUrl && !snapshotError
                ? "Snapshot delivered through Alfred's protected event-media endpoint."
                : mediaMode === "snapshot"
                  ? "Snapshot unavailable; showing the event preview fallback."
                  : "Real clips will replace this simulated preview when camera buffering is connected."}
            </p>
          </div>

          <aside className="p-5 sm:p-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
              Confirm classification
            </p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Choose the label that best matches the evidence. This records the human decision and removes the event from the queue.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2">
              {item.suggestedLabels.map((label) => (
                <Button
                  key={label}
                  variant="outline"
                  className="w-full"
                  onClick={() => onClassify(label)}
                  disabled={isSaving}
                >
                  {label}
                </Button>
              ))}
            </div>

            <div className="mt-6 border-t border-zinc-800 pt-5">
              <Button
                variant="ghost"
                className="w-full text-zinc-500"
                onClick={onDismiss}
                disabled={isSaving}
              >
                {isSaving ? (
                  <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="mr-2 h-3.5 w-3.5" />
                )}
                Dismiss event
              </Button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
