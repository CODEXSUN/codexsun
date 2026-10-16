import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { Skeleton } from "@codexsun/ui/components/skeleton";
import {
  WorkspacePage,
  WorkspaceHeader,
  WorkspaceFilters,
  WorkspacePagination
} from "@codexsun/ui/workspace";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { RequirementsForm } from "./requirements.form";
import { RequirementsList } from "./requirements.list";
import { RequirementsShow } from "./requirements.show";
import {
  isCodexsunAccessError,
  useCodexsunContext,
  useRequirementActivity,
  useRequirements
} from "./requirements.hooks";
import {
  createRequirement,
  updateRequirement,
  submitRequirement,
  decideRequirement,
  type CodexsunGateway
} from "./requirements.services";
import type {
  CodexsunSurface,
  RequirementDraftInput,
  RequirementRecord
} from "./requirements.types";

export function CodexsunWorkspace({
  gateway,
  surface,
  devicePanel,
  saveDraft,
  offline = false,
  cachedRequirements = []
}: {
  gateway: CodexsunGateway;
  surface: CodexsunSurface;
  devicePanel?: ReactNode;
  saveDraft?: (input: RequirementDraftInput) => Promise<{ message: string }>;
  offline?: boolean;
  cachedRequirements?: RequirementRecord[];
}) {
  const context = useCodexsunContext(gateway);
  const permissions = context.data?.permissions ?? {};
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<RequirementRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  useEffect(() => {
    setSelected(null);
    setEditing(false);
    setNote("");
    setPage(1);
    setSearch("");
    setError("");
    setMessage("");
  }, [context.data?.tenantUuid, context.data?.actorEmail, surface]);
  const list = useRequirements(
    gateway,
    {
      page,
      pageSize: 20,
      search,
      ...(surface === "approvals" ? { status: "awaiting_approval" as const } : {})
    },
    Boolean(context.data && permissions["codexsun.requirements.view"]),
    context.data?.tenantUuid ?? ""
  );
  const activity = useRequirementActivity(gateway, selected?.uuid, context.data?.tenantUuid ?? "");
  const origin = surface === "frontdesk" ? "web" : surface === "workspace" ? "desktop" : "mobile";
  const readOnly = offline || list.isError;
  const records =
    readOnly && cachedRequirements.length ? cachedRequirements : (list.data?.records ?? []);
  const shownRecords =
    readOnly && surface === "approvals"
      ? records.filter((record) => record.status === "awaiting_approval")
      : records;

  async function run(
    operation: () => Promise<RequirementRecord | { message: string }>,
    success: string
  ) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await operation();
      if ("uuid" in result) setSelected(result);
      setMessage("message" in result ? result.message : success);
      setEditing(false);
      setFormVersion((version) => version + 1);
      await queryClient.invalidateQueries({ queryKey: ["codexsun", "requirements"] });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The operation failed. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <WorkspacePage title="">
      <WorkspaceHeader
        title={
          surface === "frontdesk"
            ? "Zuno · Front desk"
            : surface === "workspace"
              ? "Zuno · Workspace"
              : "Zuno · Approvals"
        }
        subtitle={
          context.data
            ? `${context.data.tenantName} · ${context.data.actorEmail}`
            : "CODEXSUN personal assistance"
        }
        actions={
          <Button variant="outline" disabled={list.isFetching} onClick={() => void list.refetch()}>
            Refresh
          </Button>
        }
      />
      {context.isPending && <Skeleton className="h-24" />}
      {(context.isError || list.isError || error) && (
        <WorkspaceFormBanner title="Unable to complete request">
          {error || context.error?.message || list.error?.message}
        </WorkspaceFormBanner>
      )}
      {message && (
        <WorkspaceFormBanner title="Request saved" tone="info">
          {message}
        </WorkspaceFormBanner>
      )}
      {devicePanel}
      {readOnly && context.data && (
        <WorkspaceFormBanner title="Offline working copy" tone="warning">
          Saved requirements are read-only and may be out of date. New drafts can be saved on this
          device; approval and changes require a cloud connection.
        </WorkspaceFormBanner>
      )}
      {surface !== "approvals" && permissions["codexsun.requirements.create"] && (
        <RequirementsForm
          key={formVersion}
          origin={origin}
          busy={busy}
          onSubmit={(input) =>
            void run(
              () => (saveDraft ? saveDraft(input) : createRequirement(gateway, input)),
              "Saved as a draft. Open Workspace to send it for approval."
            )
          }
        />
      )}
      {context.data && !permissions["codexsun.requirements.view"] && (
        <WorkspaceFormBanner title="Access required" tone="warning">
          Your role does not have access to requirements.
        </WorkspaceFormBanner>
      )}
      {permissions["codexsun.requirements.view"] && !isCodexsunAccessError(list.error) && (
        <>
          <WorkspaceFilters
            searchValue={search}
            searchPlaceholder="Search requirements"
            onSearchValueChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
          <RequirementsList
            records={shownRecords}
            loading={list.isPending}
            onSelect={(record) => {
              setSelected(record);
              setEditing(false);
              setNote("");
              setError("");
            }}
          />
          {!readOnly && (
            <WorkspacePagination
              page={page}
              rowsPerPage={20}
              rowsPerPageOptions={[20]}
              singularLabel="requirements"
              totalCount={readOnly ? shownRecords.length : (list.data?.total ?? 0)}
              totalPages={Math.max(1, Math.ceil((list.data?.total ?? 0) / 20))}
              showingLabel={`Page ${page}`}
              onPageChange={setPage}
              onPreviousPage={() => setPage(Math.max(1, page - 1))}
              onNextPage={() => setPage(page + 1)}
            />
          )}
          {readOnly && (
            <p className="text-xs text-muted-foreground">
              Showing {shownRecords.length} saved requirements from this device's last cloud sync.
            </p>
          )}
        </>
      )}
      {selected &&
        context.data &&
        permissions["codexsun.requirements.view"] &&
        !isCodexsunAccessError(list.error) && (
          <RequirementsShow
            record={selected}
            actorEmail={context.data.actorEmail}
            permissions={permissions}
            readOnly={readOnly}
            busy={busy}
            note={note}
            onNoteChange={setNote}
            activity={activity.data ?? []}
            activityLoading={activity.isPending}
            {...(activity.isError ? { activityError: activity.error.message } : {})}
            onClose={() => {
              setSelected(null);
              setEditing(false);
            }}
            onEdit={() => setEditing(!editing)}
            onSubmit={() =>
              void run(() => submitRequirement(gateway, selected), "Sent for approval.")
            }
            onDecision={(decision) =>
              void run(
                () => decideRequirement(gateway, selected, decision, note),
                decision === "approved" ? "Requirement approved." : "Requirement rejected."
              )
            }
            editForm={
              editing && !readOnly ? (
                <RequirementsForm
                  key={`${selected.uuid}:${selected.revision}`}
                  record={selected}
                  origin={selected.origin}
                  busy={busy}
                  onCancel={() => setEditing(false)}
                  onSubmit={(input) =>
                    void run(
                      () => updateRequirement(gateway, selected, input),
                      "Requirement updated."
                    )
                  }
                />
              ) : null
            }
          />
        )}
    </WorkspacePage>
  );
}
