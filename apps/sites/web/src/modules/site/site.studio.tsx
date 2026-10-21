import { DeploymentWorkspace } from "./deployment/index.js";
import { EnquiryWorkspace } from "./enquiry/index.js";
import { useState } from "react";
import { PageWorkspace } from "./page/index.js";
import { BlogWorkspace } from "./blog/index.js";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { SiteRuntimeControls } from "./site.runtime-controls.js";
import type { SitesController } from "./site.hooks.js";
import type { CmsSite, SiteGateway } from "./site.types.js";
import type { SitePayload } from "./site.types.js";
import { SiteForm } from "./site.form.js";
import { sitePayloadSchema } from "./site.schema.js";
import { WorkspaceAnimatedTabs } from "@codexsun/ui/workspace";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";

export function SiteStudio({
  site,
  sites,
  gateway,
  onBack
}: {
  site: CmsSite;
  sites: SitesController;
  gateway: SiteGateway | undefined;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<"details" | "pages" | "blogs" | "enquiries">("details");
  const [settings, setSettings] = useState<SitePayload | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  async function exportPublication() {
    if (!gateway?.exportPublication) return;
    setExporting(true);
    setError("");
    try {
      const snapshot = await gateway.exportPublication(site.uuid);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = `${site.slug}-publication-${snapshot.sequence}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Could not export the published website."
      );
    } finally {
      setExporting(false);
    }
  }
  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    setError("");
    try {
      await sites.update(site.uuid, sitePayloadSchema.parse(settings));
      setSettings(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not save site settings.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="grid gap-4">
      {settings ? (
        <SiteForm
          draft={settings}
          error={error}
          isEdit
          onChange={setSettings}
          onCancel={() => setSettings(null)}
          onSave={() => void saveSettings()}
          saving={saving}
        />
      ) : null}
      {error ? (
        <WorkspaceFormBanner title="Site settings could not be saved">{error}</WorkspaceFormBanner>
      ) : null}
      <Button size="sm" variant="ghost" onClick={onBack}>
        ← Client Portfolios
      </Button>
      <Card className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div>
          <h1 className="text-xl font-bold">{site.name} · Site Studio</h1>
          <p className="text-sm text-muted-foreground">
            {site.primaryDomain} · {site.status}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <Button
            size="sm"
            variant="outline"
            title="Downloads the last published website and blog posts"
            disabled={exporting || !gateway?.exportPublication}
            onClick={() => void exportPublication()}
          >
            {exporting ? "Exporting…" : "Export deployment content"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setError("");
              setSettings({
                name: site.name,
                slug: site.slug,
                primaryDomain: site.primaryDomain,
                themeKey: site.themeKey,
                port: site.port,
                description: site.description
              });
            }}
          >
            Site settings
          </Button>
          <SiteRuntimeControls key={`${site.uuid}:${site.port}`} site={site} gateway={gateway} />
        </div>
      </Card>
      {site.slug === "tirupurconnect" ? (
        <DeploymentWorkspace uuid={site.uuid} gateway={gateway?.deployment} />
      ) : null}
      <WorkspaceAnimatedTabs
        contentPadding
        value={tab}
        onValueChange={(value) => {
          if (
            value === "details" ||
            value === "pages" ||
            value === "blogs" ||
            value === "enquiries"
          )
            setTab(value);
        }}
        contentClassName="hidden"
        tabs={[
          { value: "details", label: "Client details", content: null },
          { value: "pages", label: "Pages", content: null },
          { value: "blogs", label: "Blogs", content: null },
          { value: "enquiries", label: "Enquiries", content: null }
        ]}
      />
      <div hidden={tab === "blogs" || tab === "enquiries"}>
        <PageWorkspace
          withApplications={site.slug === "logicx"}
          textile={site.slug === "tirupurconnect"}
          uuid={site.uuid}
          gateway={gateway?.page}
          view={tab === "details" ? "profile" : "sections"}
          publicOrigin={
            site.slug === "tirupurconnect"
              ? "https://tirupurconnect.com"
              : `http://127.0.0.1:${site.port}`
          }
        />
      </div>
      {tab === "enquiries" ? (
        <EnquiryWorkspace key={site.uuid} uuid={site.uuid} gateway={gateway?.enquiries} />
      ) : null}
      <div hidden={tab !== "blogs"}>
        <BlogWorkspace uuid={site.uuid} gateway={gateway?.blog} />
      </div>
    </section>
  );
}
