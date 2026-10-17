import { logicxBrandAssets } from "./logicx-branding.mjs";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const escape = (value) =>
  String(value).replace(
    /[<>&"']/g,
    (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]
  );
export async function writeBranding(directory, brand, slug) {
  await mkdir(directory, { recursive: true });
  const custom = slug === "logicx" ? await logicxBrandAssets(brand) : null;
  const earth = slug === "ramutex";
  const ink = earth ? "#294e40" : slug === "logicx" ? "#004632" : "#173e78";
  const pale = earth ? "#f5f3eb" : slug === "logicx" ? "#F1F7EF" : "#edf3fc";
  const initials =
    slug === "ramutex"
      ? "rt"
      : slug === "logicx"
        ? "LX"
        : brand
            .split(/\s+/)
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
  const mark = (foreground, background) =>
    `<rect x="3" y="3" width="74" height="74" rx="${slug === "logicx" ? 10 : 20}" fill="${background}"/><path d="M16 21H64M16 60H64" stroke="${foreground}" opacity=".3"/><text x="40" y="51" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" font-weight="700" fill="${foreground}">${escape(initials)}</text>`;
  const width = Math.min(640, Math.max(230, 95 + brand.length * 18));
  const logo = (foreground, background) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="80" viewBox="0 0 ${width} 80"><title>${escape(brand)}</title>${mark(foreground, background)}<text x="95" y="48" fill="${foreground}" font-family="Arial,sans-serif" font-size="${brand.length > 20 ? 22 : 32}" font-weight="600" letter-spacing="-1">${escape(brand.slice(0, 36))}</text></svg>`;
  const icon =
    custom?.icon ??
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">${mark(pale, ink)}</svg>`;
  await writeFile(resolve(directory, "logo.svg"), custom?.logo ?? logo(ink, pale));
  await writeFile(resolve(directory, "logo-dark.svg"), custom?.darkLogo ?? logo("#f4f6f3", ink));
  await writeFile(resolve(directory, "favicon.svg"), icon);
  if (custom) {
    await writeFile(resolve(directory, "brand-mark.svg"), custom.mark);
    await writeFile(resolve(directory, "brand-mark-dark.svg"), custom.darkMark);
  }
  for (const [name, size] of [
    ["apple-touch-icon.png", 180],
    ["icon-192.png", 192],
    ["icon-512.png", 512]
  ])
    await sharp(Buffer.from(icon)).resize(size, size).png().toFile(resolve(directory, name));
  const png = await sharp(Buffer.from(icon)).resize(48, 48).png().toBuffer();
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header[6] = 48;
  header[7] = 48;
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18);
  await writeFile(resolve(directory, "favicon.ico"), Buffer.concat([header, png]));
  const social =
    custom?.social ??
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="${pale}"/><path d="M0 520L1200 180V630H0Z" fill="${ink}" opacity=".07"/><text x="90" y="310" fill="${ink}" font-family="Arial,sans-serif" font-size="${brand.length > 24 ? 48 : 72}" font-weight="600">${escape(brand.slice(0, 36))}</text><text x="94" y="390" fill="${ink}" font-family="Arial,sans-serif" font-size="26">Company · Services · Contact</text></svg>`;
  await sharp(Buffer.from(social)).png().toFile(resolve(directory, "social-card.png"));
  await writeFile(
    resolve(directory, "site.webmanifest"),
    JSON.stringify(
      {
        name: brand,
        short_name: brand.slice(0, 20),
        start_url: "/",
        display: "browser",
        background_color: pale,
        theme_color: ink,
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      },
      null,
      2
    )
  );
}

