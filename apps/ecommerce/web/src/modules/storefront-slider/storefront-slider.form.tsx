import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { useStorefrontSliderFrappeItems } from "./storefront-slider.hooks";
import {
  sliderImageSource,
  StorefrontSliderImageField
} from "./storefront-slider.image-field";
import { storefrontSliderSchema } from "./storefront-slider.schema";
import { getFrappeSliderItem } from "./storefront-slider.services";
import type { StorefrontSliderPayload, StorefrontSliderRecord } from "./storefront-slider.types";

const empty: StorefrontSliderPayload = {
  actionLabel: "Explore now",
  actionUrl: "#catalog",
  description: "",
  displayOrder: 0,
  endsAt: null,
  eyebrow: "",
  imageUrl: "",
  ishopItem: null,
  published: false,
  sliderCode: "",
  startsAt: null,
  status: "active",
  title: ""
};

export function StorefrontSliderForm({
  loading,
  onCancel,
  onSubmit,
  record
}: {
  loading: boolean;
  onCancel: () => void;
  onSubmit: (value: StorefrontSliderPayload) => void;
  record: StorefrontSliderRecord | null;
}) {
  const [value, setValue] = useState(record ? payload(record) : empty);
  const [error, setError] = useState("");
  const [frappeSearch, setFrappeSearch] = useState("");
  const [frappeMessage, setFrappeMessage] = useState("");
  const frappeItems = useStorefrontSliderFrappeItems(frappeSearch);
  const frappeOptions = useMemo(
    () =>
      (frappeItems.data ?? []).map((item) => ({
        value: item.itemCode,
        label: item.itemName,
        description: item.itemCode,
        meta: [item.itemGroup, item.brand].filter(Boolean).join(" · ")
      })),
    [frappeItems.data]
  );
  useEffect(() => setValue(record ? payload(record) : empty), [record]);
  const update = <K extends keyof StorefrontSliderPayload>(
    key: K,
    next: StorefrontSliderPayload[K]
  ) => setValue((current) => ({ ...current, [key]: next }));
  const submit = () => {
    const parsed = storefrontSliderSchema.safeParse(value);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Check the slider.");
    setError("");
    onSubmit(parsed.data);
  };
  const selectFrappeItem = async (itemCode: string) => {
    if (!itemCode) {
      update("ishopItem", null);
      setFrappeMessage("");
      return;
    }
    setFrappeMessage("Loading the latest item from Frappe…");
    try {
      const item = await getFrappeSliderItem(itemCode);
      setValue((current) => ({
        ...current,
        actionLabel: current.actionLabel || "Shop now",
        actionUrl: current.actionUrl || "#catalog",
        description: plainText(item.description).slice(0, 500),
        eyebrow: [item.itemGroup, item.brand].filter(Boolean).join(" · ").slice(0, 191),
        imageUrl: item.image,
        ishopItem: item.itemCode,
        sliderCode: slugify(item.itemCode),
        title: item.itemName
      }));
      setFrappeMessage(
        `Filled from Frappe item ${item.itemCode}. Review the slider fields before saving.`
      );
    } catch (caught) {
      setFrappeMessage(
        caught instanceof Error ? caught.message : "Could not load the Frappe item."
      );
    }
  };
  return (
    <Card
      title={record ? "Edit home slider" : "New home slider"}
      description="Manage the local storefront copy of a home slider. Pull from Frappe first when linking an iShop item."
    >
      {frappeMessage ? (
        <WorkspaceFormBanner title="Frappe item loaded" tone="info">
          {frappeMessage}
        </WorkspaceFormBanner>
      ) : null}
      <div className="mb-5 rounded-md border border-primary/20 bg-primary/5 p-4">
        <Field label="Frappe Item lookup">
          <WorkspaceLookup
            allowTextValue={false}
            loading={frappeItems.isLoading}
            options={frappeOptions}
            placeholder="Search item code or item name"
            showAllOptionsOnFocus
            value={value.ishopItem ?? ""}
            onTextChange={setFrappeSearch}
            onValueChange={(itemCode) => void selectFrappeItem(itemCode)}
          />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Slider code *">
          <Input
            value={value.sliderCode}
            onChange={(event) => update("sliderCode", event.target.value)}
          />
        </Field>
        <Field label="Title *">
          <Input value={value.title} onChange={(event) => update("title", event.target.value)} />
        </Field>
        <Field label="Eyebrow">
          <Input
            value={value.eyebrow}
            onChange={(event) => update("eyebrow", event.target.value)}
          />
        </Field>
        <Field label="Frappe iShop item code (auto-filled)">
          <Input
            readOnly
            value={value.ishopItem ?? ""}
          />
        </Field>
        <Field label="Slider image">
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm leading-6 text-muted-foreground">
            <p>1. Ratio: 4:3</p>
            <p>2. Preferred size: 1600 × 1200 px WebP</p>
          </div>
          <StorefrontSliderImageField
            imageUrl={value.imageUrl}
            itemCode={value.ishopItem}
            sliderCode={value.sliderCode}
            onChange={(imageUrl) => update("imageUrl", imageUrl)}
            onError={setError}
          />
        </Field>
        <Field label="Display order">
          <Input
            min="0"
            type="number"
            value={value.displayOrder}
            onChange={(event) => update("displayOrder", Number(event.target.value))}
          />
        </Field>
        <Field label="Action label">
          <Input
            value={value.actionLabel}
            onChange={(event) => update("actionLabel", event.target.value)}
          />
        </Field>
        <Field label="Action URL">
          <Input
            value={value.actionUrl}
            onChange={(event) => update("actionUrl", event.target.value)}
          />
        </Field>
        <Field label="Starts at">
          <Input
            type="datetime-local"
            value={localDate(value.startsAt)}
            onChange={(event) => update("startsAt", isoDate(event.target.value))}
          />
        </Field>
        <Field label="Ends at">
          <Input
            type="datetime-local"
            value={localDate(value.endsAt)}
            onChange={(event) => update("endsAt", isoDate(event.target.value))}
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Description">
            <Textarea
              value={value.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </Field>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input
            checked={value.published}
            type="checkbox"
            onChange={(event) => update("published", event.target.checked)}
          />
          Published
        </label>
        <label className="flex items-center gap-2">
          <input
            checked={value.status === "active"}
            type="checkbox"
            onChange={(event) => update("status", event.target.checked ? "active" : "inactive")}
          />
          Active
        </label>
      </div>
      {value.imageUrl ? (
        <img
          alt={value.title || "Slider preview"}
          className="mt-4 h-64 w-full rounded-md border bg-muted/20 object-contain p-4"
          src={sliderImageSource(value.imageUrl)}
        />
      ) : null}
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
function payload(record: StorefrontSliderRecord): StorefrontSliderPayload {
  const {
    createdAt: _created,
    frappeDocumentName: _source,
    frappeModifiedAt: _modified,
    id: _id,
    updatedAt: _updated,
    uuid: _uuid,
    ...value
  } = record;
  return value;
}
function isoDate(value: string) {
  return value ? new Date(value).toISOString() : null;
}
function localDate(value: string | null) {
  return value ? value.slice(0, 16) : "";
}

function plainText(value: string) {
  return value
    .replace(/<[^>]+>/gu, " ")
    .replace(/&nbsp;|&#160;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/\s+/gu, " ")
    .trim();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/(^-|-$)/gu, "");
}
