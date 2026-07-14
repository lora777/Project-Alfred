"use client";

import { useEffect, useState } from "react";
import {
  Camera as CameraIcon,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import type { Camera } from "@/data/mock-data";
import { getCameraConnectionLabel } from "@/lib/camera-connection";
import { CameraFeedVisual } from "@/components/camera-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function CameraDetailModal({
  camera,
  liveStream,
  onEdit,
  onSnapshotCaptured,
  onDeleted,
  onClose,
}: {
  camera: Camera;
  liveStream?: MediaStream;
  onEdit: (camera: Camera) => void;
  onSnapshotCaptured: () => Promise<void>;
  onDeleted: () => Promise<void>;
  onClose: () => void;
}) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOnline = camera.status === "online";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting && !isCapturing) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCapturing, isDeleting, onClose]);

  async function handleCaptureSnapshot() {
    if (isCapturing) return;

    setIsCapturing(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/cameras/${encodeURIComponent(camera.id)}/snapshot`,
        { method: "POST" },
      );
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(body?.error ?? `Snapshot API returned ${response.status}`);
      }

      await onSnapshotCaptured();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to capture snapshot",
      );
    } finally {
      setIsCapturing(false);
    }
  }

  async function handleDelete() {
    if (isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/cameras/${encodeURIComponent(camera.id)}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? `Camera API returned ${response.status}`);
      }

      await onDeleted();
      onClose();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete camera",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/85 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !isDeleting &&
          !isCapturing
        ) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="expanded-camera-title"
        className="w-full max-w-6xl overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl"
      >
        <header className="flex flex-col gap-4 border-b border-zinc-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-red-400">
              <CameraIcon className="h-3 w-3" /> Expanded live view
            </p>
            <div className="mt-2 flex items-center gap-3">
              <h2
                id="expanded-camera-title"
                className="truncate text-lg font-semibold text-zinc-100"
              >
                {camera.name}
              </h2>
              <Badge
                className={
                  isOnline
                    ? "border-emerald-900/70 bg-emerald-950/40 text-emerald-400"
                    : "border-zinc-700 bg-zinc-900 text-zinc-500"
                }
              >
                {camera.status}
              </Badge>
            </div>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-zinc-600">
              {camera.code} / {camera.location}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCaptureSnapshot}
              disabled={isCapturing || isDeleting || !camera.sourceConfigured}
            >
              <RefreshCw
                className={`mr-2 h-3.5 w-3.5 ${isCapturing ? "animate-spin" : ""}`}
              />
              {isCapturing
                ? "Capturing"
                : camera.snapshotAvailable
                  ? "Refresh snapshot"
                  : "Capture snapshot"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(camera)}
              disabled={isDeleting || isCapturing}
            >
              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setIsConfirmingDelete(true)}
              disabled={isDeleting || isCapturing}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close expanded camera"
              onClick={onClose}
              disabled={isDeleting || isCapturing}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <CameraFeedVisual camera={camera} liveStream={liveStream} expanded />

        <div className="grid gap-4 border-t border-zinc-800 p-5 sm:grid-cols-4 sm:p-6">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">
              Last detected
            </p>
            <p className="mt-2 text-sm font-semibold capitalize text-zinc-200">
              {camera.lastDetected.label}
            </p>
            <p className="mt-1 text-[10px] text-zinc-600">
              {camera.lastDetected.timestampLabel}
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">
              Detection confidence
            </p>
            <p className="mt-2 text-sm font-semibold text-zinc-200">
              {camera.lastDetected.confidence.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">
              Connection
            </p>
            <p className="mt-2 text-sm font-semibold text-zinc-200">
              {getCameraConnectionLabel(camera)}
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">
              Latest snapshot
            </p>
            <p className="mt-2 text-sm font-semibold text-zinc-200">
              {camera.snapshotCapturedAt
                ? new Date(camera.snapshotCapturedAt).toLocaleString()
                : "Not captured yet"}
            </p>
          </div>
        </div>

        {isConfirmingDelete && (
          <div className="border-t border-red-950 bg-red-950/20 px-5 py-4 sm:flex sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-sm font-semibold text-red-200">
                Delete {camera.name}?
              </p>
              <p className="mt-1 text-xs text-red-300/70">
                The camera will leave the live network. Historical events will remain.
              </p>
            </div>
            <div className="mt-3 flex gap-2 sm:mt-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isDeleting}
              >
                Keep camera
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                )}
                Confirm delete
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="border-t border-red-900/60 bg-red-950/25 px-5 py-3 text-xs text-red-300 sm:px-6">
            {error}
          </div>
        )}
      </section>
    </div>
  );
}
