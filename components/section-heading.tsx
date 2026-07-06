import type { LucideIcon } from "lucide-react";

export function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
  count,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  count?: number;
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
      {typeof count === "number" && (
        <span className="font-mono text-[10px] text-zinc-600">
          {String(count).padStart(2, "0")} ITEMS
        </span>
      )}
    </div>
  );
}
