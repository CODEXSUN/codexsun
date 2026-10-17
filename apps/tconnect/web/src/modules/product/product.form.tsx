import { useState, type FormEvent } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceFormPanel, WorkspaceLookup, WorkspaceSelect } from "@codexsun/ui/workspace";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { productInput } from "./product.schema";
import type { Product, ProductInput } from "./product.types";
export function ProductForm({
  record,
  companies,
  onSave,
  onCancel
}: {
  record: Product | null;
  companies: { uuid: string; name: string }[];
  onSave: (input: ProductInput, uuid?: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<ProductInput>(
    record ?? {
      companyUuid: companies.length === 1 ? companies[0]!.uuid : "",
      name: "",
      category: "",
      description: "",
      price: null,
      unit: "piece",
      minimumOrder: "",
      imageDataUrl: "",
      status: "active"
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const { uuid: _uuid, ...input } = { uuid: undefined, ...value };
    const parsed = productInput.safeParse(input);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])
        )
      );
      setMessage("Check the marked product fields.");
      return;
    }
    setErrors({});
    setMessage("");
    setBusy(true);
    try {
      await onSave(parsed.data, record?.uuid);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Product could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <WorkspaceFormPanel title={record ? "Edit product" : "New product"}>
      <form onSubmit={submit} className="space-y-4">
        {message ? (
          <WorkspaceFormBanner title="Check this product">{message}</WorkspaceFormBanner>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <label className={`space-y-1 text-sm ${errors.companyUuid ? "text-red-700" : ""}`}>
            Company *
            <WorkspaceLookup
              invalid={!!errors.companyUuid}
              allowTextValue={false}
              disabled={companies.length === 1}
              value={value.companyUuid}
              onValueChange={(next) => setValue({ ...value, companyUuid: next })}
              options={companies.map((company) => ({ value: company.uuid, label: company.name }))}
            />
            {errors.companyUuid}
          </label>
          <label className="space-y-1 text-sm">
            Name *
            <Input
              required
              aria-invalid={!!errors.name}
              value={value.name}
              onChange={(event) => setValue({ ...value, name: event.target.value })}
            />
            <span className="text-red-700">{errors.name}</span>
          </label>
          <label className="space-y-1 text-sm">
            Category *
            <Input
              required
              aria-invalid={!!errors.category}
              value={value.category}
              onChange={(event) => setValue({ ...value, category: event.target.value })}
            />
            <span className="text-red-700">{errors.category}</span>
          </label>
          <label className="space-y-1 text-sm">
            Price (INR, blank for quote)
            <Input
              type="number"
              min={0}
              step="0.01"
              value={value.price ?? ""}
              onChange={(event) =>
                setValue({
                  ...value,
                  price: event.target.value === "" ? null : Number(event.target.value)
                })
              }
            />
            <span className="text-red-700">{errors.price}</span>
          </label>
          <label className="space-y-1 text-sm">
            Unit *
            <Input
              required
              value={value.unit}
              onChange={(event) => setValue({ ...value, unit: event.target.value })}
            />
            <span className="text-red-700">{errors.unit}</span>
          </label>
          <label className="space-y-1 text-sm">
            Minimum order *
            <Input
              required
              value={value.minimumOrder}
              onChange={(event) => setValue({ ...value, minimumOrder: event.target.value })}
            />
            <span className="text-red-700">{errors.minimumOrder}</span>
          </label>
          <label className="space-y-1 text-sm md:col-span-2">
            Description *
            <Textarea
              required
              minLength={10}
              aria-invalid={!!errors.description}
              value={value.description}
              onChange={(event) => setValue({ ...value, description: event.target.value })}
            />
            <span className="text-red-700">{errors.description}</span>
          </label>
          <label className="space-y-1 text-sm">
            Status
            <WorkspaceSelect
              value={value.status}
              onValueChange={(next) =>
                setValue({ ...value, status: next as ProductInput["status"] })
              }
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" }
              ]}
            />
          </label>
          <label className="space-y-1 text-sm">
            Product image (PNG, JPEG or WebP, up to 150 KB)
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (file.size > 150000) {
                  setMessage("Choose an image smaller than 150 KB.");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === "string")
                    setValue({ ...value, imageDataUrl: reader.result });
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
        </div>
        {value.imageDataUrl ? (
          <div className="flex items-center gap-3">
            <img
              className="h-24 w-24 object-contain"
              src={value.imageDataUrl}
              alt="Product preview"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setValue({ ...value, imageDataUrl: "" })}
            >
              Remove image
            </Button>
          </div>
        ) : null}
        <div className="flex gap-3">
          <Button disabled={busy} type="submit">
            {busy ? "Saving…" : "Save product"}
          </Button>
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </WorkspaceFormPanel>
  );
}
