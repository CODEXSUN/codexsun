import { useState } from "react";
import type { StorefrontBranding } from "./storefront.types";

export function StorefrontCompanyBrand({
  branding,
  dark = false,
  className
}: {
  branding: StorefrontBranding | null;
  dark?: boolean;
  className: string;
}) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const preferred = dark ? branding?.logoDarkUrl : branding?.logoUrl;
  const fallback = dark ? branding?.logoUrl : branding?.logoDarkUrl;
  const source = [preferred, fallback].find((url) => url && !failedSources.includes(url));
  const name = branding?.brandName.trim() || "Store";

  return (
    <a className={className} href="/shop" aria-label={`${name} home`}>
      {source ? (
        <img
          alt=""
          aria-hidden="true"
          className="cx-store__brand-mark"
          height={40}
          width={40}
          src={source}
          onError={() => setFailedSources((sources) => [...sources, source])}
        />
      ) : null}
      <strong>{name}</strong>
    </a>
  );
}
