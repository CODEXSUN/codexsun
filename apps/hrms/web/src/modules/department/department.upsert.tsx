import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { GlobalLoader } from "@codexsun/ui/components/global-loader";
import { WorkspaceFormBanner, WorkspaceUpsertPage } from "@codexsun/ui/workspace/upsert";
import { DepartmentForm, departmentFormId } from "./department.form";
import { departmentQueryKey, useDepartment } from "./department.hooks";
import type { DepartmentRoute } from "./department.types";
import type { DepartmentGateway } from "./department.services";

export function DepartmentUpsertPage({
  gateway,
  route
}: {
  gateway: DepartmentGateway;
  route: Exclude<DepartmentRoute, { mode: "list" }>;
}) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const id = route.mode === "edit" ? route.id : null;
  const query = useDepartment(gateway, id);
  const openList = () => void navigate({ to: "/app/$", params: { _splat: "hrms/departments" } });
  const save = useMutation({
    mutationFn: (input: Parameters<DepartmentGateway["create"]>[0]) =>
      id ? gateway.update(id, input) : gateway.create(input),
    onSuccess: async (department) => {
      await client.invalidateQueries({ queryKey: departmentQueryKey });
      toast.success(id ? "Department updated" : "Department created", {
        description: department.name
      });
      openList();
    },
    onError: (error) => toast.error("Unable to save department", { description: error.message })
  });
  useEffect(() => {
    const submitShortcut = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      const form = document.getElementById(departmentFormId);
      if (!save.isPending && form instanceof HTMLFormElement) form.requestSubmit();
    };
    window.addEventListener("keydown", submitShortcut);
    return () => window.removeEventListener("keydown", submitShortcut);
  }, [save.isPending]);
  if (id && query.isPending) return <GlobalLoader fullScreen={false} className="min-h-[24rem]" />;
  if (id && (query.isError || query.data?.deletedAt)) {
    return (
      <WorkspaceUpsertPage title="" className="pt-0 lg:pt-0">
        <WorkspaceFormBanner title="Department cannot be edited">
          {query.error?.message ?? "Restore the deleted department before editing it."}
        </WorkspaceFormBanner>
        <Button variant="outline" onClick={openList}>
          Back to departments
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
      <DepartmentForm
        key={id ?? "new"}
        department={query.data ?? null}
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
