import { useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { useStorefrontSliderStorageSettings } from "./storefront-slider.hooks";
import { uploadSliderImage } from "./storefront-slider.services";

export function StorefrontSliderImageField({
  imageUrl,
  itemCode,
  onChange,
  onError,
  sliderCode
}: {
  imageUrl: string;
  itemCode: string | null;
  onChange: (value: string) => void;
  onError: (value: string) => void;
  sliderCode: string;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const settings = useStorefrontSliderStorageSettings();
  const maxBytes = settings.data?.maxUploadBytes ?? 8 * 1024 * 1024;

  const upload = async (file: File) => {
    if (file.type !== "image/webp") return onError("Choose a WebP image.");
    if (file.size > maxBytes) {
      return onError(`Slider image must be smaller than ${formatBytes(maxBytes)}.`);
    }
    setUploading(true);
    onError("");
    try {
      const sourceName = itemCode || sliderCode || file.name.replace(/\.webp$/iu, "");
      const uploaded = await uploadSliderImage(
        `${slugify(sourceName)}.webp`,
        await fileBase64(file)
      );
      onChange(uploaded.imageUrl);
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Could not upload the slider image.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          aria-label="Public slider image path"
          readOnly
          placeholder="/p2673.webp"
          value={displayImagePath(imageUrl)}
        />
        <input
          ref={fileInput}
          accept="image/webp,.webp"
          className="sr-only"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <Button
          disabled={uploading}
          type="button"
          variant="outline"
          onClick={() => fileInput.current?.click()}
        >
          <ImageUp className="size-4" />
          {uploading ? "Uploading…" : "Browse"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Slider storage · WebP · up to {formatBytes(maxBytes)}
      </p>
    </div>
  );
}

export function sliderImageSource(value: string) {
  return /^\/[a-z0-9][a-z0-9-]*\.webp$/u.test(value)
    ? `/api/platform/storefront/slider-images/${encodeURIComponent(value.slice(1))}`
    : value;
}

function displayImagePath(value: string) {
  if (!value) return "";
  const fileName = value.split("/").filter(Boolean).at(-1);
  return fileName ? `/${fileName.toLowerCase()}` : "";
}

function fileBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(file);
  });
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/(^-|-$)/gu, "");
}

function formatBytes(value: number) {
  return `${Math.round(value / (1024 * 1024))} MB`;
}
