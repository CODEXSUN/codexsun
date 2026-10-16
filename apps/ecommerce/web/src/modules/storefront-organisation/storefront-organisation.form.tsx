import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { Input } from "@codexsun/ui/components/input";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFormField, WorkspaceFormGrid } from "@codexsun/ui/workspace/upsert";
import type {
  StorefrontOrganisation,
  StorefrontOrganisationOptions
} from "./storefront-organisation.types";

export function StorefrontOrganisationForm({
  value,
  options,
  errors,
  onChange,
  onUpload,
  uploading
}: {
  value: StorefrontOrganisation;
  options: StorefrontOrganisationOptions;
  errors: Partial<Record<keyof StorefrontOrganisation, string>>;
  onChange: (value: StorefrontOrganisation) => void;
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  return (
    <WorkspaceFormGrid>
      <WorkspaceFormField label="Display name">
        <Input
          aria-label="Display name"
          value={value.displayName}
          maxLength={191}
          placeholder="Use the company name"
          onChange={(event) => onChange({ ...value, displayName: event.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Shown in the storefront top menu and footer. Leave blank to use the company name.
        </p>
      </WorkspaceFormField>
      <WorkspaceFormField label="Storefront logo">
        <Input
          aria-label="Upload storefront logo"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
            event.target.value = "";
          }}
        />
        <p role="status" className="text-xs text-muted-foreground">
          {uploading
            ? "Uploading logo…"
            : "PNG, JPG, or WebP. Maximum 2 MB. Save to apply the logo."}
        </p>
        {value.logoFileName ? (
          <div className="flex items-center gap-3">
            <img
              alt="Storefront logo preview"
              className="h-14 max-w-40 object-contain"
              src={`/api/platform/storefront/organisation-logo/${value.logoFileName}`}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => onChange({ ...value, logoFileName: null })}
            >
              Remove logo
            </Button>
          </div>
        ) : null}
      </WorkspaceFormField>
      <WorkspaceFormField label="Default company" required>
        <WorkspaceLookup
          ariaLabel="Default company"
          allowTextValue={false}
          value={value.companyId == null ? "" : String(value.companyId)}
          options={options.companies.map((company) => ({
            value: String(company.id),
            label: company.label
          }))}
          invalid={Boolean(errors.companyId)}
          onValueChange={(id) => onChange({ ...value, companyId: id ? Number(id) : null })}
        />
        {errors.companyId ? <p className="text-xs text-destructive">{errors.companyId}</p> : null}
      </WorkspaceFormField>
      <WorkspaceFormField label="Accounting year" required>
        <WorkspaceLookup
          ariaLabel="Accounting year"
          allowTextValue={false}
          value={value.financialYearId == null ? "" : String(value.financialYearId)}
          options={options.financialYears.map((year) => ({
            value: String(year.id),
            label: year.label
          }))}
          invalid={Boolean(errors.financialYearId)}
          onValueChange={(id) => onChange({ ...value, financialYearId: id ? Number(id) : null })}
        />
        {errors.financialYearId ? (
          <p className="text-xs text-destructive">{errors.financialYearId}</p>
        ) : null}
      </WorkspaceFormField>
    </WorkspaceFormGrid>
  );
}
