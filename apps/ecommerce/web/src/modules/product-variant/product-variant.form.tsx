import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
import { productVariantSchema } from "./product-variant.schema";
import type {
  CatalogProductOption,
  ProductVariantPayload,
  ProductVariantRecord,
  VariantStatus
} from "./product-variant.types";
const empty: ProductVariantPayload = {
  productInformationId: 0,
  sku: "",
  title: "",
  barcode: "",
  option1Name: "",
  option1Value: "",
  option2Name: "",
  option2Value: "",
  option3Name: "",
  option3Value: "",
  priceAdjustment: 0,
  compareAtAdjustment: 0,
  costAdjustment: 0,
  weight: 0,
  sortOrder: 0,
  status: "active"
};
export function ProductVariantForm({
  loading,
  onCancel,
  onSubmit,
  products,
  record
}: {
  loading: boolean;
  onCancel: () => void;
  onSubmit: (value: ProductVariantPayload) => void;
  products: CatalogProductOption[];
  record: ProductVariantRecord | null;
}) {
  const [value, setValue] = useState(record ? payload(record) : empty);
  const [error, setError] = useState("");
  useEffect(() => setValue(record ? payload(record) : empty), [record]);
  const update = <K extends keyof ProductVariantPayload>(key: K, next: ProductVariantPayload[K]) =>
    setValue((current) => ({ ...current, [key]: next }));
  const submit = () => {
    const parsed = productVariantSchema.safeParse(value);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Check the variant.");
    setError("");
    onSubmit(parsed.data);
  };
  return (
    <Card
      title={record ? "Edit variant" : "New variant"}
      description="Define a purchasable SKU and its option combination."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Product">
          <select
            className="h-10 w-full rounded-md border bg-background px-3"
            value={value.productInformationId}
            onChange={(event) => update("productInformationId", Number(event.target.value))}
          >
            <option value={0}>Select a product</option>
            {products.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </Field>
        {["sku", "title", "barcode"].map((key) => (
          <Text
            key={key}
            label={key}
            value={String(value[key as "sku"])}
            onChange={(raw) => update(key as "sku", raw)}
          />
        ))}
        {[1, 2, 3].flatMap((index) =>
          ["Name", "Value"].map((part) => {
            const key = `option${index}${part}` as keyof ProductVariantPayload;
            return (
              <Text
                key={key}
                label={`Option ${index} ${part.toLowerCase()}`}
                value={String(value[key])}
                onChange={(raw) => update(key, raw as never)}
              />
            );
          })
        )}
        {(["priceAdjustment", "compareAtAdjustment", "costAdjustment", "sortOrder"] as const).map(
          (key) => (
            <NumberField
              key={key}
              label={key}
              value={value[key]}
              onChange={(next) => update(key, next)}
            />
          )
        )}
        <NumberField
          label="weight"
          value={value.weight ?? ""}
          onChange={(next) => update("weight", next)}
        />
        <Field label="Status">
          <select
            className="h-10 w-full rounded-md border bg-background px-3"
            value={value.status}
            onChange={(event) => update("status", event.target.value as VariantStatus)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
      </div>
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
      <Label className="capitalize">{label}</Label>
      {children}
    </div>
  );
}
function Text({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <Field label={label}>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}
function NumberField({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: number) => void;
  value: number | string;
}) {
  return (
    <Field label={label}>
      <Input
        min="0"
        step="0.01"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </Field>
  );
}
function payload(record: ProductVariantRecord): ProductVariantPayload {
  const {
    id: _id,
    uuid: _uuid,
    productTitle: _name,
    createdAt: _created,
    updatedAt: _updated,
    ...rest
  } = record;
  return rest;
}
