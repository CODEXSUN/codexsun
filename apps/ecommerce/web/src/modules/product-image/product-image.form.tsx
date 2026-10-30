import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
import { Textarea } from "@codexsun/ui/components/textarea";
import { productImageSchema } from "./product-image.schema";
import { ProductImageUpload } from "./product-image.upload";
import type {
  ImageProductOption,
  ImageStatus,
  ImageVariantOption,
  ProductImagePayload,
  ProductImageRecord
} from "./product-image.types";
const empty: ProductImagePayload = {
  productInformationId: 0,
  variantId: null,
  url: "",
  altText: "",
  caption: "",
  sortOrder: 0,
  isPrimary: false,
  status: "active"
};
export function ProductImageForm({
  loading,
  onCancel,
  onSubmit,
  products,
  record,
  variants
}: {
  loading: boolean;
  onCancel: () => void;
  onSubmit: (value: ProductImagePayload) => void;
  products: ImageProductOption[];
  record: ProductImageRecord | null;
  variants: ImageVariantOption[];
}) {
  const [value, setValue] = useState(record ? payload(record) : empty);
  const [error, setError] = useState("");
  useEffect(() => setValue(record ? payload(record) : empty), [record]);
  const update = <K extends keyof ProductImagePayload>(key: K, next: ProductImagePayload[K]) =>
    setValue((current) => ({ ...current, [key]: next }));
  const available = variants.filter(
    (item) => item.productInformationId === value.productInformationId
  );
  const submit = () => {
    const parsed = productImageSchema.safeParse(value);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Check the image.");
    setError("");
    onSubmit(parsed.data);
  };
  return (
    <Card
      title={record ? "Edit product image" : "New product image"}
      description="Add ordered storefront media for a product or one specific variant."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Product">
          <select
            className="h-10 w-full rounded-md border bg-background px-3"
            value={value.productInformationId}
            onChange={(event) => {
              update("productInformationId", Number(event.target.value));
              update("variantId", null);
            }}
          >
            <option value={0}>Select a product</option>
            {products.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Variant (optional)">
          <select
            className="h-10 w-full rounded-md border bg-background px-3"
            value={value.variantId ?? ""}
            onChange={(event) =>
              update("variantId", event.target.value ? Number(event.target.value) : null)
            }
          >
            <option value="">All variants</option>
            {available.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.sku})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Image">
          <ProductImageUpload
            value={value.url}
            productTitle={
              products.find((item) => item.id === value.productInformationId)?.title ?? "product"
            }
            onChange={(url) => update("url", url)}
            onError={setError}
          />
        </Field>
        <Field label="Alternative text">
          <Input
            value={value.altText}
            onChange={(event) => update("altText", event.target.value)}
          />
        </Field>
        <Field label="Caption">
          <Textarea
            value={value.caption}
            onChange={(event) => update("caption", event.target.value)}
          />
        </Field>
        <Field label="Sort order">
          <Input
            min="0"
            type="number"
            value={value.sortOrder}
            onChange={(event) => update("sortOrder", Number(event.target.value))}
          />
        </Field>
        <Field label="Status">
          <select
            className="h-10 w-full rounded-md border bg-background px-3"
            value={value.status}
            onChange={(event) => update("status", event.target.value as ImageStatus)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
        {value.url ? (
          <div className="rounded-md border bg-muted/20 p-3">
            <img
              alt={value.altText || "Product preview"}
              className="h-40 w-full rounded object-contain"
              src={value.url}
            />
          </div>
        ) : null}
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          checked={value.isPrimary}
          type="checkbox"
          onChange={(event) => update("isPrimary", event.target.checked)}
        />
        Primary product image
      </label>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={loading} onClick={submit}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </div>
    </Card>
  );
}
function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function payload(record: ProductImageRecord): ProductImagePayload {
  const {
    id: _id,
    uuid: _uuid,
    productTitle: _product,
    variantTitle: _variant,
    createdAt: _created,
    updatedAt: _updated,
    ...rest
  } = record;
  return rest;
}
