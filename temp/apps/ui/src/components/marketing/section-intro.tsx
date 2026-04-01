import type * as React from "react";

import { Badge } from "@ui/components/ui/badge";
import { cn } from "@ui/lib/utils";

interface SectionIntroProps {
  badge?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionIntro({
  badge,
  title,
  description,
  action,
  className,
}: SectionIntroProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-4 md:flex-row md:items-end",
        className
      )}
    >
      <div className="space-y-3">
        {badge ? <Badge variant="outline">{badge}</Badge> : null}
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h2>
          {description ? (
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
