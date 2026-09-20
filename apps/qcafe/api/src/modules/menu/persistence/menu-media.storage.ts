import type { ModuleStorage } from "@codexsun/platform-core";

const extensions: Readonly<Record<string, string>> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class MenuMediaStorage {
  constructor(private readonly storage: ModuleStorage) {}

  async write(businessId: string, checksum: string, mediaType: string, bytes: Uint8Array): Promise<string> {
    const extension = extensions[mediaType];
    if (!extension) throw new Error("Menu media type is not supported.");
    const objectReference = `items/${businessId}/${checksum}.${extension}`;
    await this.storage.write("private", objectReference, bytes);
    return objectReference;
  }

  read(objectReference: string): Promise<Buffer> {
    return this.storage.read("private", objectReference);
  }
}
