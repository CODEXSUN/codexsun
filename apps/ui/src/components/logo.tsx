"use client";

import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider";
import { resolveRuntimeBrandLogoUrl } from "@/features/branding/runtime-brand-logo";
import { cn } from "@/lib/utils";

export const Logo = ({ className, ...props }: React.ComponentProps<"img">) => {
  const { brand } = useRuntimeBrand();

  return (
    <img
      alt="logo"
      className={cn("h-7 w-7", className)}
      src={resolveRuntimeBrandLogoUrl(brand)}
      {...props}
    />
  );
};
