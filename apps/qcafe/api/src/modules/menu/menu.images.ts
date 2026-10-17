import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { AppError } from "@codexsun/framework/errors";
import type { QCafeDependencies } from "../../cloud/runtime.js";

export const menuImagePrefix = "/api/app/qcafe/menu/images/";
export const menuImageName = /^[a-f0-9]{32}\.webp$/u;
const maximumBytes = 5 * 1024 * 1024;

export class MenuImages {
  constructor(private readonly dependencies: QCafeDependencies) {}

  async upload(tenantId: string, content: string) {
    if (!/^[A-Za-z0-9+/]+={0,2}$/u.test(content) || content.length % 4 !== 0)
      throw AppError.validation("Choose a JPG, PNG, or WebP image up to 5 MB.");
    const bytes = Buffer.from(content, "base64");
    if (!bytes.length || bytes.length > maximumBytes)
      throw AppError.validation("Choose an image up to 5 MB.");
    let image: Buffer;
    try {
      const decoder = sharp(bytes, { limitInputPixels: 25_000_000, animated: false });
      const metadata = await decoder.metadata();
      if (!["jpeg", "png", "webp"].includes(metadata.format ?? "") || (metadata.pages ?? 1) > 1)
        throw new Error("Unsupported image");
      image = await decoder
        .rotate()
        .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      throw AppError.validation("This file is not a supported JPG, PNG, or WebP image.");
    }
    const directory = this.directory(tenantId);
    await mkdir(directory, { recursive: true });
    const name = `${randomBytes(16).toString("hex")}.webp`;
    await writeFile(join(directory, name), image, { flag: "wx" });
    return { imageUrl: `${menuImagePrefix}${name}` };
  }

  async read(tenantId: string, name: string) {
    if (!menuImageName.test(name)) throw AppError.notFound("Item photo was not found.");
    try {
      return await readFile(join(this.directory(tenantId), name));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT")
        throw AppError.notFound("Item photo was not found.");
      throw error;
    }
  }

  async validateReference(tenantId: string, imageUrl?: string) {
    if (!imageUrl?.startsWith(menuImagePrefix)) return;
    const name = imageUrl.slice(menuImagePrefix.length);
    if (!menuImageName.test(name)) throw AppError.validation("Upload an item photo again.");
    try {
      await access(join(this.directory(tenantId), name));
    } catch {
      throw AppError.validation("The item photo is unavailable. Upload it again.");
    }
  }

  private directory(tenantId: string) {
    const directory = this.dependencies.masterImageDirectory?.(tenantId);
    if (!directory) throw AppError.validation("Item photo storage is not configured.");
    return directory;
  }
}
