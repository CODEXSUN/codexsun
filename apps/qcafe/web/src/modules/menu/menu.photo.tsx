import { useRef, useState } from "react";
import { MenuImage } from "./menu.image";
import { cloudRequest } from "../../web/transport";

export function MenuPhoto({
  value,
  disabled,
  onChange,
  onBusy
}: {
  value: string;
  disabled: boolean;
  onChange: (url: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  async function upload(files: File[]) {
    if (disabled || uploading || !files.length) return;
    if (
      files.length !== 1 ||
      !["image/png", "image/jpeg", "image/webp"].includes(files[0]!.type) ||
      files[0]!.size > 5 * 1024 * 1024
    ) {
      setError("Choose one JPG, PNG, or WebP image up to 5 MB.");
      return;
    }
    setError("");
    setUploading(true);
    onBusy(true);
    try {
      const contentBase64 = await readImage(files[0]!);
      const result = await cloudRequest<{ imageUrl: string }>("/api/app/qcafe/menu/images", {
        method: "POST",
        body: JSON.stringify({ contentBase64 })
      });
      onChange(result.imageUrl);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to upload this photo.");
    } finally {
      setUploading(false);
      onBusy(false);
      if (picker.current) picker.current.value = "";
    }
  }
  return (
    <section>
      <button
        type="button"
        className={`qcafe-master-photo qcafe-master-drop ${dragging ? "is-dragging" : ""}`}
        disabled={disabled || uploading}
        onClick={() => picker.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void upload(Array.from(event.dataTransfer.files));
        }}
      >
        <span className="qcafe-master-photo-preview">
          <MenuImage src={value} alt="Item photo" />
        </span>
        <span>
          <strong>{uploading ? "Uploading photo…" : "Drop an image here or choose a file"}</strong>
          <small>JPG, PNG, or WebP up to 5 MB. Saved for this restaurant.</small>
          {value && !disabled && <small>Photo uploaded. Save item to apply it.</small>}
        </span>
      </button>
      <input
        ref={picker}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        aria-label="Upload item photo"
        disabled={disabled || uploading}
        onChange={(event) => void upload(Array.from(event.target.files ?? []))}
      />
      {value && !disabled && (
        <button
          type="button"
          className="qcafe-master-photo-remove"
          disabled={uploading}
          onClick={() => onChange("")}
        >
          Remove photo
        </button>
      )}
      {error && (
        <p role="alert" className="qcafe-master-error">
          {error}
        </p>
      )}
    </section>
  );
}

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Unable to read this image. Choose it again."));
    reader.readAsDataURL(file);
  });
}
