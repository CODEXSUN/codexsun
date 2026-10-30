import { BellRing } from "lucide-react";

export function ClosurePendingBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-900 dark:border-orange-700 dark:bg-orange-950/40 dark:text-orange-200">
      <BellRing className="size-3.5" />
      Closure pending
    </span>
  );
}
