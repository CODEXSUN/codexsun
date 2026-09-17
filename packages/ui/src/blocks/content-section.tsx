import type { ReactNode } from "react";
import { Card } from "../components/card";
import { cn } from "../libs/utils";

export interface ContentSectionProps {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly variant?: "surface" | "flush" | "compact";
}

export function ContentSection({ title, description, children, variant = "surface" }: ContentSectionProps) {
  const content = (
    <>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      <div className={cn("mt-5", variant === "compact" && "mt-3")}>{children}</div>
    </>
  );

  if (variant === "flush") return <section>{content}</section>;
  return <Card variant="surface">{content}</Card>;
}
