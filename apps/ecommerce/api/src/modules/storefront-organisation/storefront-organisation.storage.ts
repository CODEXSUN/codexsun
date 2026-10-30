import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { AppError } from "@codexsun/framework/errors";
import { getEcommercePublicStorageRoot } from "../../database/ecommerce-database.js";

export class StorefrontOrganisationLogoStorage {
  async upload(contentBase64: string) {
    const buffer = Buffer.from(contentBase64, "base64");
    if (!buffer.length || buffer.length > 2 * 1024 * 1024)
      throw AppError.validation("Use a logo no larger than 2 MB.");
    let normalized: Buffer;
    try {
      const image = sharp(buffer, { limitInputPixels: 16_000_000 });
      const metadata = await image.metadata();
      if (!["png", "jpeg", "webp"].includes(metadata.format ?? ""))
        throw new Error("Unsupported image");
      normalized = await image
        .rotate()
        .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer();
    } catch {
      throw AppError.validation("Upload a valid PNG, JPG, or WebP logo.");
    }
    const fileName = `${randomBytes(16).toString("hex")}.png`;
    const directory = resolve(getEcommercePublicStorageRoot(), "ecommerce", "logo");
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, fileName), normalized, { flag: "wx" });
    return { logoFileName: fileName };
  }

  async content(fileName: string) {
    if (!/^[a-f0-9]{32}\.png$/u.test(fileName))
      throw AppError.validation("Invalid storefront logo.");
    try {
      return await readFile(
        resolve(getEcommercePublicStorageRoot(), "ecommerce", "logo", fileName)
      );
    } catch {
      throw AppError.notFound("Storefront logo was not found.");
    }
  }
}
