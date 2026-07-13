import Link from "next/link";
import { Bell, History, Radio, ScanSearch, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DashboardView = "live" | "review" | "history";

export function SiteHeader({
  activeView,
  pendingReview = 0,
}: {
  activeView: DashboardView;
  pendingReview?: number;
}) {
  const links = [
    { href: "/", label: "Live", view: "live" as const, icon: Radio },
    {
      href: "/review",
      label: "Review",
      view: "review" as const,
      icon: ScanSearch,
    },
    {
      href: "/events",
      label: "History",
      view: "history" as const,
      icon: History,
    },
  ];

  return (
    <>
    <header className="flex flex-col gap-5 pb-6 sm:flex-row sm:items-center sm:justify-between">
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
    <nav
      aria-label="Primary"
      className="flex items-center gap-1 border-b border-zinc-800/80"
    >
      {links.map(({ href, label, view, icon: Icon }) => {
        const isActive = activeView === view;

        return (
          <Link
            key={view}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex h-11 items-center gap-2 px-3 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors sm:px-4",
              isActive
                ? "text-zinc-100"
                : "text-zinc-600 hover:text-zinc-300",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {view === "review" && pendingReview > 0 && (
              <span className="grid min-w-5 place-items-center rounded-full border border-red-900/80 bg-red-950/70 px-1.5 py-0.5 text-[9px] text-red-300">
                {pendingReview > 99 ? "99+" : pendingReview}
              </span>
            )}
            {isActive && (
              <span className="absolute inset-x-2 bottom-0 h-px bg-red-500" />
            )}
          </Link>
        );
      })}
    </nav>
    </>
  );
}
