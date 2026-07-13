import { Camera as CameraIcon, Maximize2, Radio } from "lucide-react";
import Image from "next/image";
import type { Camera } from "@/data/mock-data";
import { getCameraConnectionLabel } from "@/lib/camera-connection";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function CameraFeedVisual({
  camera,
  expanded = false,
}: {
  camera: Camera;
  expanded?: boolean;
}) {
  return (
    <div
      className={`camera-feed relative aspect-video overflow-hidden bg-[#080909] ${
        expanded ? "min-h-[260px] sm:min-h-[380px]" : ""
      }`}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(${camera.feedVisual.focalPoint}, rgba(82,92,85,0.16), transparent 35%), linear-gradient(135deg, rgba(39,43,41,0.45), transparent 50%)`,
        }}
      />
      <div
        className={`absolute border border-zinc-600/30 bg-zinc-800/10 ${camera.feedVisual.detectionZone}`}
      />
      <div
        className={`absolute rounded-full bg-zinc-800/20 blur-sm ${camera.feedVisual.activityRegion}`}
      />
      {camera.snapshotAvailable && (
        <Image
          src={`/api/cameras/${encodeURIComponent(camera.id)}/snapshot/latest?capturedAt=${encodeURIComponent(camera.snapshotCapturedAt ?? "")}`}
          alt={`Latest snapshot from ${camera.name}`}
          fill
          unoptimized
          sizes={expanded ? "(min-width: 1024px) 1100px, 95vw" : "(min-width: 768px) 50vw, 100vw"}
          className="object-cover"
        />
      )}
      {!camera.snapshotAvailable && (
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex flex-col items-center gap-2 text-zinc-700 transition-colors group-hover:text-zinc-600">
          <Radio className={expanded ? "h-10 w-10" : "h-7 w-7"} strokeWidth={1} />
          <span className="font-mono text-[9px] uppercase tracking-[0.2em]">
            {camera.feedLabel}
          </span>
        </div>
      </div>
      )}
      {camera.recording && (
        <div className="absolute left-3 top-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> REC
        </div>
      )}
      <div className="absolute right-3 top-3 font-mono text-[9px] text-zinc-600">
        {camera.qualityLabel}
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between font-mono text-[9px] text-zinc-600">
        <span>{camera.currentTimeLabel}</span>
        <span>{getCameraConnectionLabel(camera)}</span>
      </div>
    </div>
  );
}

export function CameraCard({
  camera,
  onOpen,
}: {
  camera: Camera;
  onOpen: (camera: Camera) => void;
}) {
  const isOnline = camera.status === "online";
  const isThreat = camera.lastDetected.label.toLowerCase() === "coyote";

  return (
    <button
      type="button"
      className="group block w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      onClick={() => onOpen(camera)}
      aria-label={`Expand ${camera.name} live camera`}
    >
    <Card className="overflow-hidden transition-colors group-hover:border-zinc-700">
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <CameraIcon className="h-3.5 w-3.5 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-100">{camera.name}</h3>
          </div>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-zinc-600">
            {camera.code} / {camera.location}
          </p>
        </div>
        <Badge
          className={
            isOnline
              ? "border-emerald-900/70 bg-emerald-950/40 text-emerald-400"
              : "border-zinc-700 bg-zinc-900 text-zinc-500"
          }
        >
          <span
            className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
              isOnline ? "bg-emerald-400" : "bg-zinc-600"
            }`}
          />
          {camera.status}
        </Badge>
      </div>

      <CameraFeedVisual camera={camera} />

      <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-t border-zinc-800/80 px-4 py-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">
            Last detected
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className={`text-sm font-semibold capitalize ${
                isThreat ? "text-red-400" : "text-zinc-200"
              }`}
            >
              {camera.lastDetected.label}
            </span>
            <span className="font-mono text-[10px] text-zinc-600">
              {camera.lastDetected.confidence.toFixed(1)}% confidence
            </span>
          </div>
        </div>
        <p className="max-w-[90px] text-right font-mono text-[9px] leading-4 text-zinc-600">
          <span className="mb-1 flex items-center justify-end gap-1 text-zinc-500">
            <Maximize2 className="h-3 w-3" /> Expand
          </span>
          {camera.lastDetected.timestampLabel}
        </p>
      </div>
    </Card>
    </button>
  );
}
