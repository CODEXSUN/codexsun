import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { GlobalLoader } from "@codexsun/ui/components/global-loader";
import { WorkspaceFormBanner, WorkspaceUpsertPage } from "@codexsun/ui/workspace/upsert";
import { DesignationForm, designationFormId } from "./designation.form";
import { designationQueryKey, useDesignation } from "./designation.hooks";
import type { DesignationRoute } from "./designation.types";
import type { DesignationGateway } from "./designation.services";

export function DesignationUpsertPage({
  gateway,
  route
}: {
  gateway: DesignationGateway;
  route: Exclude<DesignationRoute, { mode: "list" }>;
}) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const id = route.mode === "edit" ? route.id : null;
  const query = useDesignation(gateway, id);
  const openList = () => void navigate({ to: "/app/$", params: { _splat: "hrms/designations" } });
  const save = useMutation({
    mutationFn: (input: Parameters<DesignationGateway["create"]>[0]) =>
      id ? gateway.update(id, input) : gateway.create(input),
    onSuccess: async (designation) => {
      await client.invalidateQueries({ queryKey: designationQueryKey });
      toast.success(id ? "Designation updated" : "Designation created", {
        description: designation.name
      });
      openList();
    },
    onError: (error) => toast.error("Unable to save designation", { description: error.message })
  });
  useEffect(() => {
    const submitShortcut = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      const form = document.getElementById(designationFormId);
      if (!save.isPending && form instanceof HTMLFormElement) form.requestSubmit();
    };
    window.addEventListener("keydown", submitShortcut);
    return () => window.removeEventListener("keydown", submitShortcut);
  }, [save.isPending]);
  if (id && query.isPending) return <GlobalLoader fullScreen={false} className="min-h-[24rem]" />;
  if (id && (query.isError || query.data?.deletedAt)) {
    return (
      <WorkspaceUpsertPage title="" className="pt-0 lg:pt-0">
        <WorkspaceFormBanner title="Designation cannot be edited">
          {query.error?.message ?? "Restore the deleted designation before editing it."}
        </WorkspaceFormBanner>
        <Button variant="outline" onClick={openList}>
          Back to designations
        </Button>
        {query.isError && (
          <Button variant="outline" className="ml-2" onClick={() => void query.refetch()}>
            Retry
          </Button>
        )}
      </WorkspaceUpsertPage>
    );
  }
  return (
    <WorkspaceUpsertPage title="" className="pt-0 lg:pt-0">
      <DesignationForm
        key={id ?? "new"}
        designation={query.data ?? null}
        busy={save.isPending}
        error={save.error?.message ?? ""}
        onCancel={openList}
        onSave={(input) => {
          if (!save.isPending) save.mutate(input);
        }}
      />
    </WorkspaceUpsertPage>
  );
}
