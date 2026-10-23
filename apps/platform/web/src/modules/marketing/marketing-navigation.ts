const pages = {
  consents: "marketing.consents",
  brands: "marketing.brands",
  campaigns: "marketing.campaigns",
  captures: "marketing.captures",
  submissions: "marketing.submissions",
  connections: "marketing.connections"
} as const;

export function marketingPageFromPath(pathname: string) {
  if (pathname === "/app/marketing" || pathname === "/app/marketing/") return pages.brands;
  const match =
    /^\/app\/marketing\/(brands|campaigns|captures|submissions|connections|consents)\/?$/.exec(
      pathname
    );
  return match ? pages[match[1] as keyof typeof pages] : null;
}
