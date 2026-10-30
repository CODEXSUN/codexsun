import { createHash, randomBytes } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { sql } from "kysely";
import { getPlatformDatabase } from "../../database/platform-database.js";
import { TenantRepository } from "../tenant/tenant.repository.js";
import {
  appPrivateStorageRoot,
  appPublicStorageRoot,
  appStorageRoot,
  ensureAppStorage,
  ensureTenantStorage,
  normalizeStorageRelativePath,
  resolveInsideStorage,
  storageBase,
  tenantPrivateStorageRoot,
  tenantPublicStorageRoot,
  tenantStorageRoot
} from "./storage-manager.paths.js";
import type {
  CompanyBrandingVariant,
  CompanyLogoUploadPayload,
  StorageDownloadInput,
  StorageEntry,
  StorageFolderPayload,
  StorageListing,
  StorageListInput,
  StorageUploadPayload
} from "./storage-manager.types.js";

export class StorageManagerRepository {
  constructor(private readonly tenants = new TenantRepository()) {}

  async roots() {
    const app = await ensureAppStorage();
    const tenants = await this.tenants.list();
    const tenantRoots = [];
    for (const tenant of tenants) {
      const tenantKey = tenant.slug || tenant.tenantCode;
      const roots = await ensureTenantStorage(tenantKey);
      await this.updateTenantStorageRoots(tenant.id, roots);
      tenantRoots.push({
        privateRoot: tenant.storagePrivateRoot || roots.privateRoot,
        publicRoot: tenant.storagePublicRoot || roots.publicRoot,
        root: tenant.storageRoot || roots.root,
        tenantCode: tenant.tenantCode,
        tenantId: tenant.id,
        tenantName: tenant.tenantName
      });
    }
    return {
      app: {
        privateRoot: appPrivateStorageRoot(),
        publicRoot: appPublicStorageRoot(),
        root: appStorageRoot()
      },
      publicLink: app.symlink,
      tenants: tenantRoots
    };
  }

  async list(input: StorageListInput): Promise<StorageListing> {
    const context = await this.context(input);
    await mkdir(context.base, { recursive: true });
    const folderPath = resolveInsideStorage(context.base, input.path);
    const entries = await readdir(folderPath, { withFileTypes: true });
    const mapped: StorageEntry[] = [];
    for (const entry of entries) {
      const absolute = join(folderPath, entry.name);
      const info = await stat(absolute);
      const relativePath = normalizeStorageRelativePath(join(context.currentPath, entry.name));
      mapped.push({
        extension: entry.isDirectory() ? "" : extname(entry.name).replace(".", ""),
        modifiedAt: info.mtime.toISOString(),
        name: entry.name,
        path: relativePath,
        sizeBytes: entry.isDirectory() ? 0 : info.size,
        type: entry.isDirectory() ? "folder" : "file",
        visibility: context.visibility
      });
    }
    mapped.sort((left, right) =>
      left.type === right.type
        ? left.name.localeCompare(right.name)
        : left.type === "folder"
          ? -1
          : 1
    );
    return {
      currentPath: context.currentPath,
      entries: mapped,
      root: context.base,
      scope: context.scope,
      tenantId: context.tenantId,
      visibility: context.visibility
    };
  }

  async createFolder(input: StorageFolderPayload) {
    const context = await this.context(input);
    const folderPath = resolveInsideStorage(context.base, join(input.path ?? "", input.name));
    await mkdir(folderPath, { recursive: true });
    await this.recordObject({
      diskPath: folderPath,
      objectType: "folder",
      relativePath: normalizeStorageRelativePath(join(context.currentPath, input.name)),
      scope: context.scope,
      sizeBytes: 0,
      tenantId: context.tenantId,
      visibility: context.visibility
    });
    return this.list({ ...input, path: context.currentPath });
  }

  async upload(input: StorageUploadPayload) {
    const context = await this.context(input);
    const fileName = sanitizeFileName(input.fileName);
    const relativePath = normalizeStorageRelativePath(join(context.currentPath, fileName));
    const filePath = resolveInsideStorage(context.base, relativePath);
    await mkdir(resolveInsideStorage(context.base, context.currentPath), { recursive: true });
    const buffer = Buffer.from(input.contentBase64, "base64");
    await writeFile(filePath, buffer);
    const checksum = createHash("sha256").update(buffer).digest("hex");
    await this.recordObject({
      checksum,
      diskPath: filePath,
      mimeType: input.mimeType || null,
      objectType: "file",
      relativePath,
      scope: context.scope,
      sizeBytes: buffer.byteLength,
      tenantId: context.tenantId,
      visibility: context.visibility
    });
    return this.list({ ...input, path: context.currentPath });
  }

  async uploadCompanyLogo(tenantId: string, input: CompanyLogoUploadPayload) {
    const tenant = await this.tenants.findByIdOrCode(tenantId);
    if (!tenant) throw new Error("Tenant was not found for storage.");

    const tenantKey = tenant.slug || tenant.tenantCode;
    const fileName = companyBrandingFileName(input.variant);
    const companyId = positiveCompanyId(input.companyId);
    const logoFolder = `companies/${companyId}/logo`;
    const relativePath = `${logoFolder}/${fileName}`;
    const base = tenantPublicStorageRoot(tenantKey);
    const filePath = resolveInsideStorage(base, relativePath);
    const buffer = Buffer.from(input.contentBase64, "base64");

    const image = companyBrandingImage(buffer);
    if (!image) throw new Error(companyBrandingImageError());
    if (image.format === "svg" && !isSafeSvg(buffer)) {
      throw new Error("SVG branding files cannot include scripts or external content.");
    }
    if (buffer.byteLength > companyBrandingMaxBytes(image.format)) {
      throw new Error(companyBrandingSizeError(image.format));
    }

    await mkdir(resolveInsideStorage(base, logoFolder), { recursive: true });
    await writeFile(filePath, buffer);
    await this.recordObject({
      checksum: createHash("sha256").update(buffer).digest("hex"),
      diskPath: filePath,
      mimeType: image.mimeType,
      objectType: "file",
      relativePath,
      scope: "tenant",
      sizeBytes: buffer.byteLength,
      tenantId: tenant.id,
      visibility: "public"
    });

    return { path: `storage/${tenantKey}/public/${relativePath}`, variant: input.variant };
  }

  async readCompanyLogo(tenantId: string, companyId: number, variant: CompanyBrandingVariant) {
    const tenant = await this.tenants.findByIdOrCode(tenantId);
    if (!tenant) throw new Error("Tenant was not found for storage.");

    const tenantKey = tenant.slug || tenant.tenantCode;
    const fileName = companyBrandingFileName(variant);
    const base = tenantPublicStorageRoot(tenantKey);
    const filePath = await firstExistingFile(base, [
      ...companyBrandingPaths(positiveCompanyId(companyId), variant),
      ...legacyCompanyBrandingPaths(positiveCompanyId(companyId), variant)
    ]);
    if (!filePath) return null;
    let info;
    try {
      info = await stat(filePath);
    } catch (error) {
      if (isFileNotFound(error)) return null;
      throw error;
    }
    if (!info.isFile()) throw new Error("Company branding asset was not found.");
    const buffer = await readFile(filePath);
    const image = companyBrandingImage(buffer);
    if (!image) throw new Error("Stored company branding has an unsupported image format.");
    if (image.format === "svg" && !isSafeSvg(buffer)) {
      throw new Error("Stored SVG branding cannot include scripts or external content.");
    }
    return {
      buffer,
      fileName,
      mimeType: image.mimeType,
      sizeBytes: info.size
    };
  }

  async download(input: StorageDownloadInput) {
    const context = await this.context(input);
    const relativePath = normalizeStorageRelativePath(join(input.path ?? "", input.file));
    const filePath = resolveInsideStorage(context.base, relativePath);
    const info = await stat(filePath);
    if (!info.isFile()) {
      throw new Error("Storage download target is not a file.");
    }
    return {
      buffer: await readFile(filePath),
      fileName: filePath.split(/[\\/]/).pop() || "download",
      mimeType: mimeTypeFor(filePath),
      sizeBytes: info.size
    };
  }

  async updateTenantStorageRoots(
    tenantId: number,
    roots: { privateRoot: string; publicRoot: string; root: string }
  ) {
    await getPlatformDatabase()
      .updateTable("tenants")
      .set({
        storage_private_root: sql`CASE WHEN storage_private_root = '' THEN ${roots.privateRoot} ELSE storage_private_root END`,
        storage_public_root: sql`CASE WHEN storage_public_root = '' THEN ${roots.publicRoot} ELSE storage_public_root END`,
        storage_root: sql`CASE WHEN storage_root = '' THEN ${roots.root} ELSE storage_root END`
      })
      .where("id", "=", tenantId)
      .execute();
  }

  private async context(input: StorageListInput) {
    const scope: "app" | "tenant" = input.scope === "tenant" ? "tenant" : "app";
    const visibility: "private" | "public" = input.visibility === "private" ? "private" : "public";
    let tenantId: number | null = null;
    let tenantKey = input.tenantKey;

    if (scope === "tenant") {
      const tenant = await this.tenants.findByIdOrCode(
        String(input.tenantId || input.tenantKey || "")
      );
      if (!tenant) {
        throw new Error("Tenant was not found for storage.");
      }
      tenantId = tenant.id;
      tenantKey = tenant.slug || tenant.tenantCode;
      await ensureTenantStorage(tenantKey);
      await this.updateTenantStorageRoots(tenant.id, {
        privateRoot: tenantPrivateStorageRoot(tenantKey),
        publicRoot: tenantPublicStorageRoot(tenantKey),
        root: tenantStorageRoot(tenantKey)
      });
    } else {
      await ensureAppStorage();
    }

    return {
      base: storageBase({ scope, visibility, ...(tenantKey ? { tenantKey } : {}) }),
      currentPath: normalizeStorageRelativePath(input.path),
      scope,
      tenantId,
      visibility
    };
  }

  private async recordObject(input: {
    checksum?: string | null;
    diskPath: string;
    mimeType?: string | null;
    objectType: "file" | "folder";
    relativePath: string;
    scope: "app" | "tenant";
    sizeBytes: number;
    tenantId: number | null;
    visibility: "private" | "public";
  }) {
    await getPlatformDatabase()
      .insertInto("storage_objects")
      .values({
        checksum: input.checksum ?? null,
        disk_path: input.diskPath,
        mime_type: input.mimeType ?? null,
        object_type: input.objectType,
        relative_path: input.relativePath,
        scope: input.scope,
        size_bytes: input.sizeBytes,
        tenant_id: input.tenantId ?? 0,
        uuid: randomBytes(4).toString("hex"),
        visibility: input.visibility
      })
      .onDuplicateKeyUpdate({
        checksum: input.checksum ?? null,
        disk_path: input.diskPath,
        mime_type: input.mimeType ?? null,
        object_type: input.objectType,
        size_bytes: input.sizeBytes,
        updated_at: sql`CURRENT_TIMESTAMP`
      })
      .execute();
  }
}

async function firstExistingFile(base: string, paths: string[]) {
  for (const path of paths) {
    const filePath = resolveInsideStorage(base, path);
    try {
      const info = await stat(filePath);
      if (info.isFile()) return filePath;
    } catch (error) {
      if (!isFileNotFound(error)) throw error;
    }
  }
  return null;
}

function positiveCompanyId(value: number) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error("Company logo storage requires a valid company ID.");
  }
  return value;
}

function companyBrandingFileName(variant: CompanyBrandingVariant) {
  if (variant === "logo-dark") return "logo-dark";
  if (variant === "favicon") return "favicon";
  return "logo";
}

function companyBrandingPaths(companyId: number, variant: CompanyBrandingVariant) {
  return [`companies/${companyId}/logo/${companyBrandingFileName(variant)}`];
}

function legacyCompanyBrandingPaths(companyId: number, variant: CompanyBrandingVariant) {
  const fileName = companyBrandingFileName(variant);
  return [`companies/${companyId}/logo/${fileName}.svg`, `logo/${fileName}.svg`];
}

function isFileNotFound(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
}

function sanitizeFileName(value: string) {
  const fileName = value
    .trim()
    .replace(/[\\/]/g, "-")
    .replace(/[^a-zA-Z0-9._ -]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!fileName || fileName === "." || fileName === "..") {
    throw new Error("A readable file name is required.");
  }
  return fileName.slice(0, 160);
}

function isSafeSvg(buffer: Buffer) {
  const source = buffer.toString("utf8").trim();
  const hasSvg = isSvgSource(source);
  return (
    hasSvg &&
    !/<script[\s>]/i.test(source) &&
    !/<foreignObject[\s>]/i.test(source) &&
    !/\son[a-z]+\s*=/i.test(source) &&
    !/javascript\s*:/i.test(source) &&
    !/(?:href|src)\s*=\s*["'](?:https?:|\/\/)/i.test(source)
  );
}

function isSvgSource(source: string) {
  return source.startsWith("<?xml") ? /<svg[\s>]/i.test(source) : /^<svg[\s>]/i.test(source);
}

type CompanyBrandingImageFormat = "avif" | "bmp" | "gif" | "ico" | "jpeg" | "png" | "svg" | "webp";

type CompanyBrandingImage = {
  format: CompanyBrandingImageFormat;
  mimeType: string;
};

function companyBrandingImage(buffer: Buffer): CompanyBrandingImage | null {
  if (isSvgSource(buffer.toString("utf8").trim())) {
    return { format: "svg", mimeType: "image/svg+xml" };
  }
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { format: "png", mimeType: "image/png" };
  }
  if (buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) {
    return { format: "jpeg", mimeType: "image/jpeg" };
  }
  if (
    buffer.subarray(0, 6).toString("ascii") === "GIF87a" ||
    buffer.subarray(0, 6).toString("ascii") === "GIF89a"
  ) {
    return { format: "gif", mimeType: "image/gif" };
  }
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { format: "webp", mimeType: "image/webp" };
  }
  if (
    buffer.subarray(4, 8).toString("ascii") === "ftyp" &&
    ["avif", "avis"].includes(buffer.subarray(8, 12).toString("ascii"))
  ) {
    return { format: "avif", mimeType: "image/avif" };
  }
  if (buffer.subarray(0, 4).equals(Buffer.from([0, 0, 1, 0]))) {
    return { format: "ico", mimeType: "image/x-icon" };
  }
  if (buffer.subarray(0, 2).toString("ascii") === "BM") {
    return { format: "bmp", mimeType: "image/bmp" };
  }
  return null;
}

function companyBrandingMaxBytes(format: CompanyBrandingImageFormat) {
  return format === "svg" ? 640 * 1024 : 5 * 1024 * 1024;
}

function companyBrandingSizeError(format: CompanyBrandingImageFormat) {
  return format === "svg"
    ? "SVG branding files must be 640 KB or smaller."
    : "Raster branding images must be 5 MB or smaller.";
}

function companyBrandingImageError() {
  return "Company branding must be SVG, PNG, JPEG, WebP, AVIF, GIF, ICO, or BMP.";
}

function mimeTypeFor(filePath: string) {
  const extension = extname(filePath).toLowerCase();
  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".sql" || extension === ".txt" || extension === ".log")
    return "text/plain; charset=utf-8";
  if (extension === ".json") return "application/json";
  return "application/octet-stream";
}
