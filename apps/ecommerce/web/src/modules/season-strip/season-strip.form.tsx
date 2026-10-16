import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
import { Textarea } from "@codexsun/ui/components/textarea";
import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { useSeasonStripFrappeItems } from "./season-strip.hooks";
import { seasonStripSchema } from "./season-strip.schema";
import { SeasonStripImageUpload } from "./season-strip.image-upload";
import { getFrappeSeasonItem } from "./season-strip.services";
import type { SeasonStripPayload, SeasonStripRecord } from "./season-strip.types";

const empty: SeasonStripPayload = {
  actionLabel: "Explore now",
  actionUrl: "#catalog",
  badge: "Offer",
  badgePosition: "top-right",
  badgeTextColor: "#ffffff",
  badgeTint: "#b91c1c",
  description: "",
  displayOrder: 0,
  endsAt: null,
  eyebrow: "",
  imageUrl: "",
  ishopItem: null,
  offerPrice: 0,
  originalPrice: null,
  published: false,
  seasonCode: "",
  startsAt: null,
  status: "active",
  title: ""
};

export function SeasonStripForm({
  loading,
  onCancel,
  onSubmit,
  record
}: {
  loading: boolean;
  onCancel: () => void;
  onSubmit: (value: SeasonStripPayload) => void;
  record: SeasonStripRecord | null;
}) {
  const noun = "season strip";
  const [value, setValue] = useState(record ? payload(record) : empty);
  const [error, setError] = useState("");
  const [frappeSearch, setFrappeSearch] = useState("");
  const [frappeMessage, setFrappeMessage] = useState("");
  const frappeItems = useSeasonStripFrappeItems(frappeSearch);
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
  const update = <K extends keyof SeasonStripPayload>(key: K, next: SeasonStripPayload[K]) =>
    setValue((current) => ({ ...current, [key]: next }));
  const submit = () => {
    const parsed = seasonStripSchema.safeParse(value);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? `Check the ${noun}.`);
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
      const item = await getFrappeSeasonItem(itemCode);
      setValue((current) => ({
        ...current,
        actionLabel: current.actionLabel || "Shop now",
        actionUrl: current.actionUrl || "#catalog",
        description: plainText(item.description).slice(0, 500),
        eyebrow: [item.itemGroup, item.brand].filter(Boolean).join(" · ").slice(0, 191),
        imageUrl: item.image,
        ishopItem: item.itemCode,
        seasonCode: slugify(item.itemCode),
        title: item.itemName
      }));
      setFrappeMessage(
        `Filled from Frappe item ${item.itemCode}. Review the ${noun} fields before saving.`
      );
    } catch (caught) {
      setFrappeMessage(
        caught instanceof Error ? caught.message : "Could not load the Frappe item."
      );
    }
  };
  return (
    <Card
      title={record ? `Edit ${noun}` : `New ${noun}`}
      description={`Manage the local storefront copy of a ${noun}. Pull from Frappe first when linking an iShop item.`}
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
        <Field label="Season code *">
          <Input
            value={value.seasonCode}
            onChange={(event) => update("seasonCode", event.target.value)}
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
          <Input readOnly value={value.ishopItem ?? ""} />
        </Field>
        <Field label="Season image">
          <SeasonStripImageUpload
            code={value.seasonCode}
            value={value.imageUrl}
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
        <Field label="Offer price *">
          <Input
            min="0"
            step="0.01"
            type="number"
            value={value.offerPrice}
            onChange={(event) => update("offerPrice", Number(event.target.value))}
          />
        </Field>
        <Field label="Original price">
          <Input
            min="0"
            step="0.01"
            type="number"
            value={value.originalPrice ?? ""}
            onChange={(event) =>
              update("originalPrice", event.target.value ? Number(event.target.value) : null)
            }
          />
        </Field>
        <Field label="Badge">
          <Input value={value.badge} onChange={(event) => update("badge", event.target.value)} />
        </Field>
        <Field label="Badge position">
          <select
            className="h-10 w-full rounded-md border bg-background px-3"
            value={value.badgePosition}
            onChange={(event) =>
              update("badgePosition", event.target.value as SeasonStripPayload["badgePosition"])
            }
          >
            <option value="top-left">Top left</option>
            <option value="top-right">Top right</option>
            <option value="bottom-left">Bottom left</option>
            <option value="bottom-right">Bottom right</option>
          </select>
        </Field>
        <Field label="Badge tint">
          <ColorField
            value={value.badgeTint}
            fallback="#b91c1c"
            onChange={(color) => update("badgeTint", color)}
          />
        </Field>
        <Field label="Badge text colour">
          <ColorField
            value={value.badgeTextColor}
            fallback="#ffffff"
            onChange={(color) => update("badgeTextColor", color)}
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
          alt={value.title || "Season preview"}
          className="mt-4 h-64 w-full rounded-md border bg-muted/20 object-contain p-4"
          src={value.imageUrl}
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
function ColorField({
  fallback,
  onChange,
  value
}: {
  fallback: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const color = /^#[0-9a-f]{6}$/iu.test(value) ? value : fallback;
  return (
    <div className="flex items-center gap-2">
      <Input
        aria-label="Choose colour"
        className="w-16 p-1"
        type="color"
        value={color}
        onChange={(event) => onChange(event.target.value)}
      />
      <Input
        aria-label="Colour value"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
function payload(record: SeasonStripRecord): SeasonStripPayload {
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
