import { SparklesIcon } from "lucide-react";

import type { EcommerceHeaderProps } from "./ecommerce-header-types";

type EcommerceAnnouncementProps = {
  announcement: NonNullable<EcommerceHeaderProps["announcement"]>;
};

export function EcommerceAnnouncement({ announcement }: EcommerceAnnouncementProps) {
  const progress = Math.min(100, Math.max(0, announcement.freeShippingProgress ?? 75));

  return (
    <div className="relative border-b border-border/40 bg-muted/60 px-4 py-1.5 text-xs text-muted-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="size-3.5 text-primary" />
          <span>{announcement.message}</span>
          {announcement.actionLabel ? (
            <a
              className="font-semibold text-primary underline underline-offset-2 hover:opacity-80"
              href={announcement.actionHref ?? "#"}
            >
              {announcement.actionLabel}
            </a>
          ) : null}
        </div>
        {announcement.showFreeShippingMeter ? <ShippingMeter progress={progress} /> : null}
      </div>
    </div>
  );
}

function ShippingMeter({ progress }: { progress: number }) {
  return (
    <div className="hidden items-center gap-2 sm:flex">
      <span>Free shipping on orders over $50</span>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <span className="font-semibold text-foreground">{progress}%</span>
    </div>
  );
}
