import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
  count,
  action,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  count?: number;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div>
        <p className="mb-1 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-600">
          <Icon className="h-3 w-3" /> {eyebrow}
        </p>
        <h2 className="text-base font-semibold tracking-tight text-zinc-200">
          {title}
        </h2>
      </div>
      <div className="flex items-center gap-3">
        {typeof count === "number" && (
          <span className="font-mono text-[10px] text-zinc-600">
            {String(count).padStart(2, "0")} ITEMS
          </span>
        )}
        {action}
      </div>
    </div>
  );
}
