"use client";

import { cn } from "@/lib/utils";

export const Logo = ({ className, ...props }: React.ComponentProps<"img">) => {
  return (
    <img
      alt="logo"
      className={cn("h-7 w-7", className)}
      src="/logo.svg"
      {...props}
    />
  );
};
