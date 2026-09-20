import { createHash } from "node:crypto";
import type { ActivityRecorder, CommandContext } from "../../foundation/contracts/activity.contract.js";
import type { UploadMenuMedia } from "../contracts/menu.contract.js";
import { MenuMediaStorage } from "../persistence/menu-media.storage.js";
import { MenuRepository } from "../repository/menu.repository.js";
import { MenuConflictError, MenuService } from "./menu.service.js";

export class MenuMediaService {
  constructor(
    private readonly repository: MenuRepository,
    private readonly menu: MenuService,
    private readonly storage: MenuMediaStorage,
    private readonly activity: ActivityRecorder,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async upload(input: UploadMenuMedia, mediaType: string, bytes: Uint8Array, context: CommandContext) {
    if (!bytes.byteLength) throw new MenuConflictError("Choose a non-empty menu image.");
    if (bytes.byteLength > 5 * 1024 * 1024) throw new MenuConflictError("Menu images must be 5 MB or smaller.");
    if (!hasImageSignature(mediaType, bytes)) throw new MenuConflictError("The uploaded file does not match its image type.");
    if (!(await this.repository.mediaTargetExists(input.businessId, input.itemId, input.variantId))) {
      throw new MenuConflictError("The selected menu item or variant does not exist.");
    }
    const checksum = createHash("sha256").update(bytes).digest("hex");
    let objectReference: string;
    try {
      objectReference = await this.storage.write(input.businessId, checksum, mediaType, bytes);
    } catch (error) {
      if (error instanceof MenuConflictError) throw error;
      if (error instanceof Error && error.message.includes("not supported")) throw new MenuConflictError(error.message);
      throw error;
    }
    const subjectId = await this.repository.attachMedia({ ...input, checksum, mimeType: mediaType, objectReference }, this.now().toISOString());
    await this.activity.record(context, { eventType: "qcafe.menu.media.attached", subjectId, subjectType: "menu-item-media" });
    return this.menu.read(input.businessId);
  }

  async read(assetId: string, businessId: string): Promise<{ bytes: Buffer; mediaType: string } | null> {
    const asset = await this.repository.findMediaAsset(assetId, businessId);
    if (!asset) return null;
    return { bytes: await this.storage.read(asset.storage_object_ref), mediaType: asset.mime_type };
  }
}

function hasImageSignature(mediaType: string, bytes: Uint8Array): boolean {
  if (mediaType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mediaType === "image/png") return bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  const header = Buffer.from(bytes.subarray(0, 12)).toString("ascii");
  if (mediaType === "image/gif") return header.startsWith("GIF87a") || header.startsWith("GIF89a");
  return mediaType === "image/webp" && header.startsWith("RIFF") && header.slice(8, 12) === "WEBP";
}
