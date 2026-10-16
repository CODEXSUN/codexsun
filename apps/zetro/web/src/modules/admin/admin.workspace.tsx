import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import { ZetroPatternDraftForm } from "./admin.form";
import { ZetroGrantSection } from "./admin.grants";
import {
  ZetroApprovalSection,
  ZetroConversationSection,
  ZetroGrantEventsSection
} from "./admin.review";
import {
  useZetroAdminInteractions,
  useZetroAdminPatterns,
  useZetroAdminTenants,
  zetroAdminPatternsKey
} from "./admin.hooks";
import { ZetroInteractionList, ZetroPatternList } from "./admin.list";
import { zetroPatternDraftSchema } from "./admin.schema";
import { createZetroPatternDraft } from "./admin.services";
import type { ZetroPatternDraft } from "./admin.types";

export type ZetroAdminPage = "patterns" | "access" | "conversations" | "review";

const pageDetails: Record<ZetroAdminPage, { title: string; description: string }> = {
  patterns: {
    title: "Zetro query patterns",
    description: "Review live and draft business questions. Drafts do not enable tools."
  },
  access: {
    title: "Zetro permissions",
    description: "Manage tenant role grants for fixed business read capabilities."
  },
  conversations: {
    title: "Zetro conversations",
    description: "Inspect tenant conversations, tool events, and review notes."
  },
  review: {
    title: "Zetro review activity",
    description: "Review approval requests, recent interactions, and grant changes."
  }
};

export function ZetroAdminWorkspace({
  page,
  tenantId,
  onTenantChange
}: {
  page: ZetroAdminPage;
  tenantId: string;
  onTenantChange: (tenantId: string) => void;
}) {
  const tenants = useZetroAdminTenants();
  const availableTenants = tenants.data?.filter((tenant) =>
    tenant.enabledModuleKeys.includes("zetro")
  );
  const selectedTenantId = availableTenants?.some((tenant) => tenant.uuid === tenantId)
    ? tenantId
    : (availableTenants?.[0]?.uuid ?? "");
  const details = pageDetails[page];

  return (
    <WorkspacePage
      title={details.title}
      description={details.description}
      technicalName={`page.sa.zetro.${page}`}
    >
      <div className="space-y-5 p-5">
        <section className="rounded-lg border bg-card p-4">
          <p className="mb-2 text-sm font-medium">Tenant</p>
          <WorkspaceSelect
            ariaLabel="Tenant"
            value={selectedTenantId}
            onValueChange={onTenantChange}
            options={
              availableTenants?.map((tenant) => ({
                value: tenant.uuid,
                label: `${tenant.tenantName} (${tenant.tenantCode})`
              })) ?? []
            }
            placeholder="Select a tenant"
          />
          {tenants.error ? <p role="alert">{tenants.error.message}</p> : null}
          {availableTenants?.length === 0 ? <p>No tenant has Zetro enabled.</p> : null}
        </section>

        {selectedTenantId ? (
          page === "patterns" ? (
            <ZetroPatternsPage key={selectedTenantId} tenantId={selectedTenantId} />
          ) : page === "access" ? (
            <ZetroGrantSection key={selectedTenantId} tenantId={selectedTenantId} />
          ) : page === "conversations" ? (
            <ZetroConversationSection key={selectedTenantId} tenantId={selectedTenantId} />
          ) : (
            <ZetroReviewPage key={selectedTenantId} tenantId={selectedTenantId} />
          )
        ) : null}
      </div>
    </WorkspacePage>
  );
}

function ZetroPatternsPage({ tenantId }: { tenantId: string }) {
  const client = useQueryClient();
  const patterns = useZetroAdminPatterns(tenantId);
  const [draft, setDraft] = useState<ZetroPatternDraft>({
    serialNo: 36,
    questionPattern: "",
    queryPattern: "",
    limitation: "",
    extra: ""
  });
  const createDraft = useMutation({
    mutationFn: (value: ZetroPatternDraft) => createZetroPatternDraft(tenantId, value),
    onSuccess: () => {
      setDraft((value) => ({
        serialNo: value.serialNo + 1,
        questionPattern: "",
        queryPattern: "",
        limitation: "",
        extra: ""
      }));
      void client.invalidateQueries({ queryKey: zetroAdminPatternsKey(tenantId) });
      toast.success("Draft pattern added for review");
    },
    onError: (error) => toast.error("Could not add pattern", { description: error.message })
  });

  const submitDraft = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = zetroPatternDraftSchema.safeParse(draft);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Invalid draft pattern");
      return;
    }
    createDraft.mutate(result.data);
  };

  return (
    <div className="space-y-5">
      <ZetroPatternList
        patterns={patterns.data}
        error={patterns.error}
        onRefresh={() => void patterns.refetch()}
      />
      <ZetroPatternDraftForm
        draft={draft}
        setDraft={setDraft}
        pending={createDraft.isPending}
        onSubmit={submitDraft}
      />
    </div>
  );
}

function ZetroReviewPage({ tenantId }: { tenantId: string }) {
  const interactions = useZetroAdminInteractions(tenantId);
  const patterns = useZetroAdminPatterns(tenantId);
  return (
    <div className="space-y-5">
      <ZetroApprovalSection tenantId={tenantId} />
      <ZetroInteractionList
        interactions={interactions.data}
        patterns={patterns.data}
        error={interactions.error}
        onRefresh={() => void interactions.refetch()}
      />
      <ZetroGrantEventsSection tenantId={tenantId} />
    </div>
  );
}
