import { useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
import { uploadStorefrontProfileImage } from "./storefront-profile.services";
import type { StorefrontProfile } from "./storefront-profile.types";

const maxBytes = 8 * 1024 * 1024;

export function StorefrontPaymentMethodsEditor({
  value,
  onChange
}: {
  value: StorefrontProfile;
  onChange: (value: StorefrontProfile) => void;
}) {
  const update = (index: number, key: "logoUrl" | "name", fieldValue: string) => {
    const paymentMethods = value.paymentMethods.map((method, methodIndex) =>
      methodIndex === index ? { ...method, [key]: fieldValue } : method
    );
    onChange({ ...value, paymentMethods });
  };
  return (
    <section className="grid gap-3" aria-labelledby="storefront-payment-methods-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <Label id="storefront-payment-methods-heading">Supported payment types</Label>
          <p className="text-sm text-muted-foreground">
            Upload a logo from this device and add the name shown in the storefront footer.
          </p>
        </div>
        <Button
          disabled={value.paymentMethods.length >= 12}
          onClick={() =>
            onChange({
              ...value,
              paymentMethods: [...value.paymentMethods, { logoUrl: "", name: "" }]
            })
          }
          size="sm"
          type="button"
          variant="outline"
        >
          Add payment type
        </Button>
      </div>
      <div className="grid gap-3">
        {value.paymentMethods.map((method, index) => (
          <PaymentMethodRow
            index={index}
            key={index}
            logoUrl={method.logoUrl}
            name={method.name}
            onRemove={() =>
              onChange({
                ...value,
                paymentMethods: value.paymentMethods.filter(
                  (_, methodIndex) => methodIndex !== index
                )
              })
            }
            onUpdate={(key, fieldValue) => update(index, key, fieldValue)}
          />
        ))}
      </div>
    </section>
  );
}

function PaymentMethodRow({
  index,
  logoUrl,
  name,
  onRemove,
  onUpdate
}: {
  index: number;
  logoUrl: string;
  name: string;
  onRemove: () => void;
  onUpdate: (key: "logoUrl" | "name", value: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const upload = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return setError("Choose a JPG, PNG, or WebP image.");
    }
    if (file.size > maxBytes) return setError("Logo must be smaller than 8 MB.");
    setError("");
    setUploading(true);
    try {
      const extension = file.name.split(".").at(-1)?.toLowerCase() || "webp";
      const uploaded = await uploadStorefrontProfileImage(
        `payment-${slugify(name || `method-${index + 1}`)}-${Date.now()}.${extension}`,
        await fileBase64(file)
      );
      onUpdate("logoUrl", uploaded.imageUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not upload the payment logo.");
    } finally {
      setUploading(false);
      if (input.current) input.current.value = "";
    }
  };
  return (
    <div className="grid items-end gap-3 rounded-md border p-3 md:grid-cols-[72px_minmax(160px,0.7fr)_minmax(240px,1.3fr)_auto]">
      <div className="flex h-11 w-[72px] items-center justify-center overflow-hidden rounded-md border bg-white p-2">
        {logoUrl ? (
          <img
            alt={`${name || "Payment method"} logo preview`}
            className="max-h-full max-w-full object-contain"
            src={logoUrl}
          />
        ) : (
          <span className="text-xs text-slate-500">Logo</span>
        )}
      </div>
      <Field label="Name">
        <Input
          maxLength={80}
          onChange={(event) => onUpdate("name", event.target.value)}
          placeholder="VISA"
          value={name}
        />
      </Field>
      <div className="grid gap-2">
        <Label>Logo</Label>
        <div className="flex gap-2">
          <Input aria-label={`${name || "Payment method"} logo path`} readOnly value={logoUrl} />
          <input
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
            ref={input}
            type="file"
          />
          <Button
            disabled={uploading}
            onClick={() => input.current?.click()}
            type="button"
            variant="outline"
          >
            <ImageUp className="size-4" /> {uploading ? "Uploading…" : "Browse"}
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
      <Button
        aria-label={`Remove ${name || "payment type"}`}
        onClick={onRemove}
        type="button"
        variant="outline"
      >
        Remove
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
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
      .replace(/(^-|-$)/gu, "") || "payment"
  );
}
