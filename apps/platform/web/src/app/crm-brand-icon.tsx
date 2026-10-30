import { forwardRef } from "react";
import type { LucideIcon, LucideProps } from "lucide-react";

export const CrmBrandIcon: LucideIcon = forwardRef<SVGSVGElement, LucideProps>(
  function CrmBrandIcon({ size = 24, className, ...props }, ref) {
    return (
      <svg
        ref={ref}
        aria-hidden="true"
        className={className}
        height={size}
        viewBox="0 0 512 512"
        width={size}
        {...props}
      >
        <image height="512" href="/logo/app-icon.png" width="512" />
      </svg>
    );
  }
);
