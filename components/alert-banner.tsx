import { AlertTriangle, ArrowRight } from "lucide-react";
import type { ActiveAlert } from "@/data/mock-data";
import { Button } from "@/components/ui/button";

export function AlertBanner({ activeAlert }: { activeAlert: ActiveAlert }) {
  if (!activeAlert.active) return null;

  return (
    <section className="relative overflow-hidden rounded-xl border border-red-900/80 bg-gradient-to-r from-red-950/80 via-red-950/35 to-zinc-950 px-5 py-4 shadow-alert">
      <div className="absolute inset-y-0 left-0 w-1 bg-red-500" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-red-800 bg-red-950">
            <AlertTriangle className="h-5 w-5 animate-pulse text-red-400" />
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-red-400">
              Active wildlife alert
            </p>
            <p className="mt-1 text-sm text-zinc-200">
              <strong className="font-semibold text-white">{activeAlert.label}</strong>{" "}
              detected at {activeAlert.camera}
              <span className="mx-2 text-zinc-700">/</span>
              <span className="font-mono text-xs text-zinc-400">
                {activeAlert.detectedAt}
              </span>
            </p>
          </div>
        </div>
        <Button variant="danger" size="sm">
          View live <ArrowRight className="ml-2 h-3.5 w-3.5" />
        </Button>
      </div>
    </section>
  );
}
