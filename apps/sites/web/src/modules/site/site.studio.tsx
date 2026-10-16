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
  const [tab, setTab] = useState<"details" | "pages" | "blogs">("details");
  const [settings, setSettings] = useState<SitePayload | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
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
      <WorkspaceAnimatedTabs
        value={tab}
        onValueChange={(value) => {
          if (value === "details" || value === "pages" || value === "blogs") setTab(value);
        }}
        contentClassName="hidden"
        tabs={[
          { value: "details", label: "Client details", content: null },
          { value: "pages", label: "Pages", content: null },
          { value: "blogs", label: "Blogs", content: null }
        ]}
      />
      <div hidden={tab === "blogs"}>
        <PageWorkspace
          uuid={site.uuid}
          gateway={gateway?.page}
          view={tab === "details" ? "profile" : "sections"}
          publicOrigin={`http://127.0.0.1:${site.port}`}
        />
      </div>
      <div hidden={tab !== "blogs"}>
        <BlogWorkspace uuid={site.uuid} gateway={gateway?.blog} />
      </div>
    </section>
  );
}
