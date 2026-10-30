import { useEffect, useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Skeleton } from "@codexsun/ui/components/skeleton";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import {
  WorkspaceFormSurface,
  WorkspaceFormBody,
  WorkspaceFormActions,
  WorkspaceFormBanner
} from "@codexsun/ui/workspace/upsert";
import { toast } from "sonner";
import { StorefrontOrganisationForm } from "./storefront-organisation.form";
import { useStorefrontOrganisation } from "./storefront-organisation.hooks";
import { storefrontOrganisationSchema } from "./storefront-organisation.schema";
import type { StorefrontOrganisation } from "./storefront-organisation.types";

export function StorefrontOrganisationWorkspace() {
  const { settings, options, save, upload } = useStorefrontOrganisation();
  const [value, setValue] = useState<StorefrontOrganisation>({
    companyId: null,
    financialYearId: null,
    displayName: "",
    logoFileName: null
  });
  const [errors, setErrors] = useState<Partial<Record<keyof StorefrontOrganisation, string>>>({});
  useEffect(() => {
    if (settings.data) setValue(settings.data);
  }, [settings.data]);
  const error = settings.error || options.error;
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = storefrontOrganisationSchema.safeParse(value);
    if (!result.success) {
      setErrors(
        Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]))
      );
      return;
    }
    setErrors({});
    save.mutate(result.data, { onSuccess: () => toast.success("Storefront organisation saved.") });
  }
  return (
    <WorkspacePage title="">
      {error ? (
        <WorkspaceFormBanner title="Organisation could not be loaded">
          <p>{error.message}</p>
          <Button
            variant="outline"
            onClick={() => {
              void settings.refetch();
              void options.refetch();
            }}
          >
            Retry
          </Button>
        </WorkspaceFormBanner>
      ) : null}
      {!error && (settings.isPending || options.isPending) ? <Skeleton className="h-40" /> : null}
      {!error && settings.isSuccess && options.isSuccess ? (
        <form noValidate onSubmit={submit}>
          <WorkspaceFormSurface className="shadow-none ring-0">
            <WorkspaceFormBody>
              {Object.keys(errors).length || save.isError || upload.isError ? (
                <WorkspaceFormBanner title="Check organisation settings">
                  <p>
                    {upload.error?.message ||
                      save.error?.message ||
                      "Select a company and accounting year."}
                  </p>
                </WorkspaceFormBanner>
              ) : null}
              {!options.data.companies.length || !options.data.financialYears.length ? (
                <p className="text-sm text-muted-foreground">
                  Create an active company and accounting year in Application → Organisation first.
                </p>
              ) : null}
              <StorefrontOrganisationForm
                value={value}
                options={options.data}
                errors={errors}
                onChange={setValue}
                uploading={upload.isPending}
                onUpload={(file) =>
                  upload.mutate(file, {
                    onSuccess: (result) =>
                      setValue((current) => ({ ...current, logoFileName: result.logoFileName }))
                  })
                }
              />
            </WorkspaceFormBody>
            <WorkspaceFormActions>
              <Button type="submit" disabled={save.isPending || upload.isPending}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </WorkspaceFormActions>
          </WorkspaceFormSurface>
        </form>
      ) : null}
    </WorkspacePage>
  );
}
