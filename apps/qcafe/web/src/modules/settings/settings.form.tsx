import { Input } from "@codexsun/ui/components/input";
import type { CafeSettings } from "./settings.types";
import type { SettingsSection } from "./settings.list";
export function SettingsForm({
  section,
  value,
  disabled,
  onChange
}: {
  section: SettingsSection;
  value: CafeSettings;
  disabled: boolean;
  onChange: (value: CafeSettings) => void;
}) {
  const field = (
    key:
      | "restaurantName"
      | "branchName"
      | "contactNumber"
      | "address"
      | "gstin"
      | "fssai"
      | "receiptHeader"
      | "receiptFooter"
      | "receiptLegalNote",
    label: string
  ) => (
    <label>
      {label}
      <Input
        value={value[key]}
        disabled={disabled}
        onChange={(event) => onChange({ ...value, [key]: event.target.value })}
      />
    </label>
  );
  const toggle = (
    key:
      | "showOrderTabs"
      | "showItemImages"
      | "showItemCodes"
      | "showSpecialLabels"
      | "imageWriteProtection"
      | "autoPrintBill"
      | "showReceiptContact",
    label: string,
    description: string
  ) => (
    <label className="qcafe-settings-toggle">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input
        type="checkbox"
        role="switch"
        aria-label={label}
        checked={value[key]}
        disabled={disabled}
        onChange={(event) => onChange({ ...value, [key]: event.target.checked })}
      />
    </label>
  );
  if (section === "general")
    return (
      <>
        <h2>Restaurant Profile</h2>
        <p>Restaurant information and receipt branding for this tenant.</p>
        <div className="qcafe-settings-fields">
          {field("restaurantName", "Restaurant name")}
          {field("branchName", "Branch / Counter name")}
          {field("address", "Address / Location")}
          {field("contactNumber", "Contact number")}
          <label>
            Display currency
            <Input value="INR (₹) — Indian Rupee" disabled />
            <small>Web billing currently uses INR.</small>
          </label>
        </div>
      </>
    );
  if (section === "features")
    return (
      <>
        <h2>Features & Toggles</h2>
        <p>Control the web ordering screens. Permissions remain enforced by Platform.</p>
        {toggle(
          "showOrderTabs",
          "Multi-order tabs",
          "Show order tabs and New Order on sales pages."
        )}
        {toggle("showItemImages", "Item images", "Display menu illustrations and uploaded photos.")}
        {toggle("showItemCodes", "Item codes", "Display the code badge on menu cards.")}
        {toggle(
          "showSpecialLabels",
          "Special price labels",
          "Display the selected Today Special label."
        )}
        <p>
          Kitchen, Parcel, Booking and Master are available in the sidebar. Inventory and Dashboard
          workflows are not yet available on web. Kitchen, Tables and Refresh toolbar buttons remain
          removed.
        </p>
      </>
    );
  if (section === "pos")
    return (
      <>
        <h2>Point of Sale & Billing</h2>
        <p>Cashier defaults and receipt details. Menu prices include any configured GST.</p>
        <div className="qcafe-settings-fields">
          <label>
            Default service type
            <select
              aria-label="Default service type"
              value={value.defaultServiceType}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  ...value,
                  defaultServiceType: event.target.value === "POS" ? "POS" : "TAKE AWAY"
                })
              }
            >
              <option value="TAKE AWAY">Parcel - Take away</option>
              <option value="POS">Dine-in — choose table and seats</option>
            </select>
          </label>
          <label>
            Included GST rate (%)
            <select
              aria-label="Included GST rate"
              value={value.gstRate}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  ...value,
                  gstRate: Number(event.target.value) as CafeSettings["gstRate"]
                })
              }
            >
              {[0, 5, 12, 18].map((rate) => (
                <option value={rate} key={rate}>
                  {rate}%
                </option>
              ))}
            </select>
            <small>Stored on new bills. Existing totals and saved bills remain unchanged.</small>
          </label>
          {field("gstin", "GSTIN / Tax registration number")}
          {field("fssai", "FSSAI license number")}
          {field("receiptHeader", "Receipt header message")}
          {field("receiptFooter", "Receipt footer note")}
          {field("receiptLegalNote", "Receipt legal note")}
        </div>
        <p>
          F1: switch page · F2: search · F3: item code · F7: payment · F8: Save & print · F9: new
          order
        </p>
      </>
    );
  if (section === "printer")
    return (
      <>
        <h2>Printer & Receipt Output</h2>
        <p>Web uses the browser print dialog. Select billing and KOT printers in that dialog.</p>
        <div className="qcafe-settings-fields">
          <label>
            Receipt paper width
            <select
              value={value.receiptWidth}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  ...value,
                  receiptWidth: event.target.value === "58mm" ? "58mm" : "80mm"
                })
              }
            >
              <option>58mm</option>
              <option>80mm</option>
            </select>
          </label>
        </div>
        {toggle(
          "autoPrintBill",
          "Print after full payment",
          "Open the browser print dialog when a bill becomes fully paid."
        )}
        {toggle(
          "showReceiptContact",
          "Show address and contact",
          "Include restaurant address and contact on new receipts."
        )}
        <p>
          Save & print always opens the receipt print dialog. Direct billing/KOT printers, spooler
          repair and Windows Print Service installation belong to desktop and are unavailable in the
          browser.
        </p>
      </>
    );
  if (section === "media")
    return (
      <>
        <h2>Image Storage & Media</h2>
        <p>
          Images are saved per tenant in storage/&lt;tenant-uuid&gt;/apps/qcafe/master/. Use Master
          to upload or drag and drop JPG, PNG and WebP files up to 5 MB.
        </p>
        {toggle(
          "imageWriteProtection",
          "Image write protection",
          "Block new uploads, photo replacement and demo-image import until an administrator turns this off."
        )}
        <p>
          Existing images remain readable in POS. Uploaded files are decoded into WebP and served
          through the authenticated tenant session. Folder selection and Windows file permissions
          remain desktop features.
        </p>
      </>
    );
  return null;
}
