import type { SVGProps } from "react";

export function StorefrontCollectionIcon({ name }: { name: string }) {
  const common: SVGProps<SVGSVGElement> = {
    "aria-hidden": true,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    viewBox: "0 0 64 64"
  };

  if (/laptop|notebook/iu.test(name)) {
    return (
      <svg {...common}>
        <path d="M15 18h34v25H15zM10 47h44M20 47l2-4h20l2 4" />
      </svg>
    );
  }
  if (/desktop|computer|aio|workstation/iu.test(name)) {
    return (
      <svg {...common}>
        <path d="M7 15h16v34H7zM11 20h8M12 42h2M17 42h2M28 15h29v25H28zM37 49h11M42.5 40v9" />
        <circle cx="15" cy="33" r="2" />
      </svg>
    );
  }
  if (/accessor|mouse|keyboard/iu.test(name)) {
    return (
      <svg {...common}>
        <path d="M33 13c10 0 17 8 17 18v4c0 10-8 18-18 18s-18-8-18-18v-4c0-10 8-18 19-18zM32 13v14M24 25h16" />
      </svg>
    );
  }
  if (/monitor|display/iu.test(name)) {
    return (
      <svg {...common}>
        <rect x="8" y="10" width="48" height="34" rx="2" />
        <path d="M24 54h16M32 44v10" />
      </svg>
    );
  }
  if (/cable|connector|adapter/iu.test(name)) {
    return (
      <svg {...common}>
        <path d="M17 10v14a15 15 0 0 0 30 0V10M12 10h10M42 10h10M32 39v15M25 54h14" />
      </svg>
    );
  }
  if (/deal|offer|sale|promotion/iu.test(name)) {
    return (
      <svg {...common}>
        <path d="M11 29 30 10h15l9 9v15L35 53 11 29zM19 29l16 16" />
        <circle cx="42" cy="22" r="3" />
        <path d="m24 35 12-12" />
      </svg>
    );
  }
  if (/mobile|phone|tablet|handheld/iu.test(name)) {
    return (
      <svg {...common}>
        <rect x="20" y="7" width="24" height="50" rx="4" />
        <path d="M27 13h10M30 50h4" />
      </svg>
    );
  }
  if (/printer|scanner/iu.test(name)) {
    return (
      <svg {...common}>
        <path d="M18 24V10h28v14M16 46H9V25h46v21h-7M18 37h28v17H18zM47 30h2" />
      </svg>
    );
  }
  if (/camera|security|cctv/iu.test(name)) {
    return (
      <svg {...common}>
        <path d="M10 21h12l4-6h12l4 6h12v31H10z" />
        <circle cx="32" cy="36" r="10" />
      </svg>
    );
  }
  if (/network|server|storage/iu.test(name)) {
    return (
      <svg {...common}>
        <rect x="8" y="9" width="48" height="13" rx="2" />
        <rect x="8" y="27" width="48" height="13" rx="2" />
        <rect x="8" y="45" width="48" height="10" rx="2" />
        <path d="M14 15h1M20 15h1M14 33h1M20 33h1M14 50h1M20 50h1" />
      </svg>
    );
  }
  if (/service|repair|upgrade/iu.test(name)) {
    return (
      <svg {...common}>
        <path d="M39 10a13 13 0 0 0-14 17L10 42l12 12 15-15a13 13 0 0 0 17-14l-9 9-8-8 9-9a13 13 0 0 0-7-7z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="9" y="9" width="18" height="18" />
      <rect x="37" y="9" width="18" height="18" />
      <rect x="9" y="37" width="18" height="18" />
      <rect x="37" y="37" width="18" height="18" />
    </svg>
  );
}
