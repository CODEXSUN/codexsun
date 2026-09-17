import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../libs/utils";

const skeletonVariants = cva("animate-pulse rounded-md bg-muted", {
  variants: {
    variant: {
      default: "h-4 w-full",
      text: "h-4 w-3/4",
      card: "h-36 w-full",
      table: "h-9 w-full",
      page: "h-80 w-full",
    },
  },
  defaultVariants: { variant: "default" },
});

function Skeleton({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLDivElement> & VariantProps<typeof skeletonVariants>) {
  return <div aria-busy="true" className={cn(skeletonVariants({ variant, className }))} {...props} />;
}

export { Skeleton, skeletonVariants };
