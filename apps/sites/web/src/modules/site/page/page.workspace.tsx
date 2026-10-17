import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { useState } from "react";
import { usePageEditor } from "./page.hooks.js";
import { PageForm } from "./page.form.js";
import { PageProfileForm } from "./page.profile-form.js";
import { PageList, type PageSection } from "./page.list.js";
import type { PageGateway } from "./page.types.js";
import { PageValidationContext } from "./page.fields.js";
import { formatDateTime } from "@codexsun/ui/workspace";
import { PageCompanyPhone } from "./page.company-phone.js";
export function PageWorkspace({
  withApplications = false,
  textile = false,
  uuid,
  gateway,
  view,
  publicOrigin
}: {
  withApplications?: boolean;
  textile?: boolean;
  uuid: string;
  gateway: PageGateway | undefined;
  view: "profile" | "sections";
  publicOrigin: string;
}) {
  const editor = usePageEditor(uuid, gateway);
  const [section, setSection] = useState<PageSection>(textile ? "textile" : "hero");
  const [activity, setActivity] = useState<Awaited<ReturnType<PageGateway["activity"]>>>([]);
  return (
    <Card className="grid gap-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">
            {view === "profile" ? "Public client details" : "Website pages & sections"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Draft revision {editor.state?.revision ?? 0} · Published revision{" "}
            {editor.state?.publishedRevision ?? 0}
            {editor.dirty ? " · Unsaved changes" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button disabled={editor.busy || !editor.draft} onClick={() => void editor.save()}>
            Save draft
          </Button>
          <Button
            variant="outline"
            disabled={editor.busy || editor.dirty || !editor.state?.revision}
            onClick={() => void editor.publish()}
          >
            Publish page
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {textile
          ? "Tirupur Connect pages share this draft. Save, then Publish to update the connected live site. Check Live publishing for progress. Business data stays in TIRUPURCONNECT."
          : "Home, About, Services and Contact share this website draft. Save preserves the draft; Publish updates the public version. Use Start to connect local delivery."}
      </p>
      {view === "sections" ? (
        <nav aria-label="Public website pages" className="flex flex-wrap gap-2">
          {(textile
            ? [
                ["Home", "/"],
                ["Categories", "/categories"],
                ["Businesses", "/companies"],
                ["Associations", "/associations"],
                ["Community", "/community"],
                ["Contact", "/contact"],
                ["Standards", "/standards"]
              ]
            : [
                ["Home", "/"],
                ["About", "/about"],
                ["Services", "/services"],
                ["Contact", "/contact"],
                ["Blog", "/blogs"],
                ["Privacy", "/privacy"],
                ...(withApplications
                  ? [
                      ["Apps", "/apps"],
                      ["Support", "/support"]
                    ]
                  : [])
              ]
          ).map(([name, path]) => (
            <Button key={path} asChild size="sm" variant="outline">
              <a href={`${publicOrigin}${path}`} target="_blank" rel="noreferrer">
                Open {name} ↗
              </a>
            </Button>
          ))}
        </nav>
      ) : null}
      {editor.error ? (
        <WorkspaceFormBanner title="Page could not be updated">
          <pre className="whitespace-pre-wrap font-sans text-sm">{editor.error}</pre>
          <Button
            variant="outline"
            disabled={editor.busy}
            onClick={() => {
              if (!editor.dirty || window.confirm("Discard unsaved changes and reload?"))
                void editor.load();
            }}
          >
            Reload from server
          </Button>
        </WorkspaceFormBanner>
      ) : null}
      {editor.message ? (
        <p role="status" className="text-sm text-muted-foreground">
          {editor.message}
        </p>
      ) : null}
      <PageValidationContext.Provider value={Boolean(editor.error)}>
        <fieldset disabled={editor.busy} className="grid gap-4">
          {!editor.draft ? (
            <p>
              {editor.busy
                ? "Loading page…"
                : "No page loaded. Check the connection and permission grants."}
            </p>
          ) : view === "profile" ? (
            <>
              <PageCompanyPhone
                gateway={gateway}
                value={editor.draft.profile}
                onChange={(profile) => editor.setDraft({ ...editor.draft!, profile })}
              />
              <PageProfileForm
                value={editor.draft.profile}
                onChange={(profile) => editor.setDraft({ ...editor.draft!, profile })}
              />
            </>
          ) : (
            <>
              <PageList
                withApplications={withApplications}
                textile={textile}
                selected={section}
                onSelect={setSection}
              />
              <PageForm value={editor.draft} onChange={editor.setDraft} section={section} />
            </>
          )}
        </fieldset>
      </PageValidationContext.Provider>
      <details>
        <summary
          className="cursor-pointer text-sm font-medium"
          onClick={() => {
            if (gateway)
              void gateway
                .activity(uuid)
                .then(setActivity)
                .catch(() => setActivity([]));
          }}
        >
          Page activity
        </summary>
        <ul className="mt-3 grid gap-2 text-sm">
          {activity.map((item, index) => (
            <li key={index}>
              {item.action} · revision {item.revision} · {item.actor} ·{" "}
              {formatDateTime(item.created_at)}
            </li>
          ))}
        </ul>
      </details>
    </Card>
  );
}
