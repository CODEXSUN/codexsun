export function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

export function hasStorefrontPrice(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function responsiveImageSrcSet(source: string, widths: number[]) {
  if (!source.startsWith("/api/platform/storefront/")) return undefined;
  return widths.map((width) => `${source}?width=${width}&format=webp ${width}w`).join(", ");
}

export function whatsappLink(message: string, phone?: string | null) {
  const recipient = whatsappNumber(phone);
  return `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
}

function whatsappNumber(phone?: string | null) {
  const digits = phone?.replace(/\D/g, "") ?? "";
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
}
