import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Badge } from "@codexsun/ui/components/badge";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { formatDateTime } from "@codexsun/ui/workspace";
import { knowledgeKey, useKnowledgeCatalog, useKnowledgePage } from "./knowledge.hooks";
import { KnowledgeForm } from "./knowledge.form";
import { KnowledgeList } from "./knowledge.list";
import { KnowledgeRenderer } from "./knowledge.renderer";
import type { KnowledgeGateway, KnowledgeInput } from "./knowledge.types";
export function DocsKnowledgeWorkspace({
  gateway,
  selectedKey,
  onSelect
}: {
  gateway: KnowledgeGateway;
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  const catalog = useKnowledgeCatalog(gateway);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(false);
  const [source, setSource] = useState(false);
  const [history, setHistory] = useState(false);
  const selected = catalog.data?.pages.find((p) => p.pageKey === selectedKey);
  const query = useKnowledgePage(gateway, selected?.uuid);
  const client = useQueryClient();
  const save = useMutation({
    mutationFn: (input: KnowledgeInput) => gateway.save(selected!.uuid, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: knowledgeKey });
      setEditing(false);
    }
  });
  const error = catalog.error ?? query.error;
  const filtered = (catalog.data?.pages ?? []).filter((p) =>
    `${p.title} ${p.appLabel} ${p.groupLabel} ${p.moduleKey}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Developer documentation</h1>
          <p className="text-sm text-muted-foreground">
            Applications, business ownership, module contracts and workflows.
          </p>
        </div>
        {query.data && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setSource(!source)}>
              {source ? "Read page" : "View source"}
            </Button>
            <Button variant="outline" onClick={() => setHistory(!history)}>
              Activity
            </Button>
            {catalog.data?.canEdit && (
              <Button
                onClick={() => {
                  save.reset();
                  setEditing(true);
                }}
              >
                Edit tenant copy
              </Button>
            )}
          </div>
        )}
      </div>
      <Input
        aria-label="Search developer documentation"
        placeholder="Search apps, modules and workflows"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {error && (
        <WorkspaceFormBanner title="Documentation could not be loaded">
          {error.message}
        </WorkspaceFormBanner>
      )}
      {catalog.isPending && <p role="status">Loading developer catalog…</p>}
      {search ? (
        <>
          <p className="text-sm text-muted-foreground">{filtered.length} matching pages</p>
          <KnowledgeList
            pages={filtered}
            onSelect={(key) => {
              setSearch("");
              onSelect(key);
            }}
          />
        </>
      ) : !selected && catalog.data ? (
        <>
          <p className="text-sm text-muted-foreground">
            {catalog.data.pages.length} pages ·{" "}
            {new Set(catalog.data.pages.map((p) => p.appKey)).size} application groups. Select a
            page from the sidebar.
          </p>
          <KnowledgeList
            pages={catalog.data.pages.filter((p) => p.pageKey.endsWith("/overview"))}
            onSelect={onSelect}
          />
        </>
      ) : null}
      {!search && query.isPending && selected && <p role="status">Loading page…</p>}
      {!search && query.data && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{query.data.appLabel}</Badge>
            <Badge variant="outline">
              {query.data.origin === "database" ? "Tenant Markdown" : "Repository MDX"}
            </Badge>
            <span>
              Revision {query.data.revision} · {formatDateTime(query.data.updatedAt)}
            </span>
            <code>{query.data.sourcePath}</code>
          </div>
          {source ? (
            <pre className="docs-source">
              <code>{query.data.body}</code>
            </pre>
          ) : (
            <KnowledgeRenderer page={query.data} onSelect={onSelect} />
          )}{" "}
          {history && (
            <section className="rounded-md border p-4 space-y-2">
              <h2 className="font-semibold">Documentation activity</h2>
              {query.data.activity.map((entry, index) => (
                <p key={index} className="text-sm">
                  {formatDateTime(entry.createdAt)} · {entry.actor} · {entry.summary}
                </p>
              ))}
            </section>
          )}
          {editing && (
            <KnowledgeForm
              key={query.data.revision}
              page={query.data}
              busy={save.isPending}
              error={save.error?.message ?? ""}
              onSave={(input) => save.mutate(input)}
              onCancel={() => setEditing(false)}
            />
          )}
        </>
      )}
    </section>
  );
}
