import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@ui/components/ui/card";

interface StatItem {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}

export function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.label} className="border-border/70 shadow-none">
            <CardContent className="flex items-start justify-between gap-4 px-6 py-5">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  {item.value}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {item.hint}
                </p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/25 p-3">
                <Icon className="size-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
