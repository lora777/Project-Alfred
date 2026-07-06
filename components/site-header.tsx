import { Bell, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="flex flex-col gap-5 border-b border-zinc-800/80 pb-7 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-lg border border-zinc-700 bg-zinc-900 shadow-inner">
          <ShieldCheck className="h-5 w-5 text-zinc-100" />
        </div>
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-red-500">
              Alfred // Control
            </span>
            <span className="h-px w-8 bg-red-800" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
            Project Alfred
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Home wildlife monitoring system
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right md:block">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
            System status
          </p>
          <p className="mt-1 flex items-center justify-end gap-2 text-xs text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            All systems operational
          </p>
        </div>
        <Button variant="outline" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
