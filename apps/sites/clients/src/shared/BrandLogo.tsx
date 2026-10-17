export function BrandLogo({ name }: { name: string }) {
  return (
    <span className="brand-assets">
      <img
        className="portfolio-brand-logo brand-light"
        src="/logo.svg"
        alt={name}
        width={190}
        height={52}
      />
      <img
        className="portfolio-brand-logo brand-dark"
        src="/logo-dark.svg"
        alt={name}
        width={190}
        height={52}
      />
    </span>
  );
}
