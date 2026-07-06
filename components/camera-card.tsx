import { Camera as CameraIcon, Radio, Signal } from "lucide-react";
import type { Camera } from "@/data/mock-data";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function CameraCard({ camera, index }: { camera: Camera; index: number }) {
  const isOnline = camera.status === "online";
  const isThreat = camera.lastDetected === "coyote";

  return (
    <Card className="group overflow-hidden transition-colors hover:border-zinc-700">
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <CameraIcon className="h-3.5 w-3.5 text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-100">{camera.name}</h3>
          </div>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-zinc-600">
            CAM-{String(index + 1).padStart(2, "0")} / {camera.location}
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

      <div className="camera-feed relative aspect-[16/9] overflow-hidden bg-[#080909]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_56%_45%,rgba(82,92,85,0.16),transparent_35%),linear-gradient(135deg,rgba(39,43,41,0.45),transparent_50%)]" />
        <div className="absolute left-[18%] top-[22%] h-[44%] w-[36%] border border-zinc-600/30 bg-zinc-800/10" />
        <div className="absolute bottom-[16%] right-[10%] h-[25%] w-[32%] rounded-full bg-zinc-800/20 blur-sm" />
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center gap-2 text-zinc-700 transition-colors group-hover:text-zinc-600">
            <Radio className="h-7 w-7" strokeWidth={1} />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em]">
              Live encrypted feed
            </span>
          </div>
        </div>
        <div className="absolute left-3 top-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> REC
        </div>
        <div className="absolute right-3 top-3 font-mono text-[9px] text-zinc-600">
          1080P / IR
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between font-mono text-[9px] text-zinc-600">
          <span>{camera.timestamp.split(", ").at(-1)}</span>
          <span className="flex items-center gap-1">
            <Signal className="h-3 w-3" /> {camera.signal}%
          </span>
        </div>
      </div>

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
              {camera.lastDetected}
            </span>
            <span className="font-mono text-[10px] text-zinc-600">
              {camera.confidence.toFixed(1)}% confidence
            </span>
          </div>
        </div>
        <p className="max-w-[90px] text-right font-mono text-[9px] leading-4 text-zinc-600">
          {camera.timestamp}
        </p>
      </div>
    </Card>
  );
}
