import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../libs/utils";

const cardVariants = cva("rounded-lg", {
  variants: {
    variant: {
      surface: "border border-border bg-surface p-5",
      flush: "bg-surface",
      outlined: "border border-border bg-transparent p-5",
      interactive: "border border-border bg-surface p-5 transition-colors hover:bg-surface-raised",
    },
  },
  defaultVariants: { variant: "surface" },
});

function Card({ className, variant, ...props }: HTMLAttributes<HTMLElement> & VariantProps<typeof cardVariants>) {
  return <section className={cn(cardVariants({ variant, className }))} {...props} />;
}

export { Card, cardVariants };
