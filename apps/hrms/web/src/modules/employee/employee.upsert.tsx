import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { GlobalLoader } from "@codexsun/ui/components/global-loader";
import { WorkspaceFormBanner, WorkspaceUpsertPage } from "@codexsun/ui/workspace/upsert";
import { EmployeeForm, employeeFormId } from "./employee.form";
import { employeeQueryKey, useEmployee } from "./employee.hooks";
import type { EmployeeRoute } from "./employee.routing";
import type { EmployeeGateway } from "./employee.services";
import type { EmployeeInput } from "./employee.types";

export function EmployeeUpsertPage({
  gateway,
  route
}: {
  gateway: EmployeeGateway;
  route: Exclude<EmployeeRoute, { mode: "list" }>;
}) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const id = route.mode === "edit" ? route.id : null;
  const query = useEmployee(gateway, id);
  const openList = () => void navigate({ to: "/app/$", params: { _splat: "hrms/employees" } });
  const save = useMutation({
    mutationFn: (input: EmployeeInput) => (id ? gateway.update(id, input) : gateway.create(input)),
    onSuccess: async (employee) => {
      await client.invalidateQueries({ queryKey: employeeQueryKey });
      toast.success(id ? "Employee updated" : "Employee created", {
        description: employee.employeeCode
      });
      openList();
    },
    onError: (error) => toast.error("Unable to save employee", { description: error.message })
  });
  useEffect(() => {
    const submitShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || !event.ctrlKey || event.key.toLowerCase() !== "s") return;
      event.preventDefault();
      const form = document.getElementById(employeeFormId);
      if (!save.isPending && form instanceof HTMLFormElement) form.requestSubmit();
    };
    window.addEventListener("keydown", submitShortcut);
    return () => window.removeEventListener("keydown", submitShortcut);
  }, [save.isPending]);
  if (id && query.isPending) return <GlobalLoader fullScreen={false} className="min-h-[24rem]" />;
  if (id && (query.isError || query.data?.deletedAt)) {
    return (
      <WorkspaceUpsertPage title="" className="pt-0 lg:pt-0">
        <WorkspaceFormBanner title="Employee cannot be edited">
          {query.error?.message ?? "Restore the deleted employee before editing it."}
        </WorkspaceFormBanner>
        <Button variant="outline" onClick={openList}>
          Back to employees
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
      <EmployeeForm
        key={id ?? "new"}
        employee={query.data ?? null}
        gateway={gateway}
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
