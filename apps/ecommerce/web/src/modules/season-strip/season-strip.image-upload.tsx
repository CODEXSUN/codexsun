import { useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { uploadSeasonImage } from "./season-strip.services";

const maxBytes = 8 * 1024 * 1024;

export function SeasonStripImageUpload({
  code,
  onChange,
  onError,
  value
}: {
  code: string;
  onChange: (value: string) => void;
  onError: (value: string) => void;
  value: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const upload = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return onError("Choose a JPG, PNG, or WebP image.");
    }
    if (file.size > maxBytes) return onError("Season image must be smaller than 8 MB.");
    setUploading(true);
    onError("");
    try {
      const extension = file.name.split(".").at(-1)?.toLowerCase() || "webp";
      const uploaded = await uploadSeasonImage(
        `${slugify(code || "season")}-${Date.now()}.${extension}`,
        await fileBase64(file)
      );
      onChange(uploaded.imageUrl);
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Could not upload the season image.");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Image URL or uploaded file"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          ref={input}
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          className="sr-only"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <Button
          className="w-full sm:w-auto"
          disabled={uploading}
          type="button"
          variant="outline"
          onClick={() => input.current?.click()}
        >
          <ImageUp className="size-4" /> {uploading ? "Uploading…" : "Browse"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">JPG, PNG, or WebP · up to 8 MB</p>
    </div>
  );
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
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/gu, "-")
      .replace(/(^-|-$)/gu, "") || "season"
  );
}
