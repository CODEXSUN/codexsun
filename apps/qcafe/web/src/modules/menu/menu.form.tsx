import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { menuSchema } from "./menu.schema";
import type { MenuInput, MenuItem } from "./menu.types";
export function MenuForm({
  item,
  busy,
  onSave,
  onCancel,
  formId,
  embedded = false,
  readOnly = false,
  initialCategory = "",
  categories = []
}: {
  item: MenuItem | null;
  busy: boolean;
  onSave: (input: MenuInput) => Promise<void>;
  onCancel: () => void;
  formId?: string;
  embedded?: boolean;
  readOnly?: boolean;
  initialCategory?: string;
  categories?: string[];
}) {
  const [code, setCode] = useState(item?.code ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState(item?.category ?? initialCategory);
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [price, setPrice] = useState(item ? (item.price / 100).toFixed(2) : "");
  const [status, setStatus] = useState<MenuInput["status"]>(item?.status ?? "active");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failedImage, setFailedImage] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (readOnly) return;
    const parsed = menuSchema.safeParse({
      code,
      name,
      category,
      imageUrl,
      price: /^\d+(\.\d{1,2})?$/u.test(price) ? Math.round(Number(price) * 100) : 0,
      status
    });
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0]);
        if (!fields[field]) fields[field] = issue.message;
      }
      setErrors(fields);
      return;
    }
    setErrors({});
    await onSave(parsed.data);
  }
  const disabled = busy || readOnly;
  return (
    <form id={formId} onSubmit={(event) => void submit(event)} className="qcafe-master-item-form">
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="qcafe-master-error">
          Check the marked fields.
        </p>
      )}
      <div className="qcafe-master-fields">
        <label>
          Category <span>*</span>
          <Input
            list="qcafe-menu-categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Select or enter a category"
            aria-invalid={!!errors.category}
            disabled={disabled}
          />
          <datalist id="qcafe-menu-categories">
            {categories.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          {errors.category && <small className="qcafe-master-error">{errors.category}</small>}
        </label>
        <label>
          Item code <span>*</span>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-invalid={!!errors.code}
            disabled={disabled}
          />
          {errors.code && <small className="qcafe-master-error">{errors.code}</small>}
        </label>
        <label>
          Item name <span>*</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            disabled={disabled}
          />
          {errors.name && <small className="qcafe-master-error">{errors.name}</small>}
        </label>
        <label>
          Normal price (₹) <span>*</span>
          <Input
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            aria-invalid={!!errors.price}
            disabled={disabled}
          />
          {errors.price && <small className="qcafe-master-error">{errors.price}</small>}
        </label>
      </div>
      <section className="qcafe-master-photo">
        <div className="qcafe-master-photo-preview">
          {imageUrl && !failedImage ? (
            <img
              src={imageUrl}
              alt={name || "Item photo"}
              referrerPolicy="no-referrer"
              onError={() => setFailedImage(true)}
            />
          ) : (
            <ImagePlus size={25} />
          )}
        </div>
        <label>
          Item photo{" "}
          <Input
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              setFailedImage(false);
            }}
            placeholder="Paste an HTTPS image URL"
            disabled={disabled}
            aria-invalid={!!errors.imageUrl}
          />
          <small>Optional. Add a photo to help staff find this item in POS.</small>
          {errors.imageUrl && (
            <small className="qcafe-master-error">Use a valid HTTPS image URL.</small>
          )}
        </label>
      </section>
      <label className="qcafe-master-status">
        Status
        <select
          aria-label="Menu item status"
          value={status}
          onChange={(e) => setStatus(e.target.value === "inactive" ? "inactive" : "active")}
          disabled={disabled}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <small>Only active items appear in POS.</small>
      </label>
      {!embedded && (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button disabled={disabled}>{busy ? "Saving…" : "Save item"}</Button>
        </div>
      )}
    </form>
  );
}
