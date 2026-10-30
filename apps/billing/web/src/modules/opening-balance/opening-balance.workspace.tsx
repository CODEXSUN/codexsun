import { useOpeningBalanceControls } from "./opening-balance.controls";
import { WorkspaceHeaderActions } from "@codexsun/ui/workspace/navigation";
import { useWorkspaceRecordSelection } from "@codexsun/ui/workspace/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { useBillingAccess } from "../../shared/auth/billing-access";
import { useOpeningBalances } from "./opening-balance.hooks";
import { OpeningBalanceForm } from "./opening-balance.form";
import { OpeningBalanceList } from "./opening-balance.list";
import { saveOpeningBalance } from "./opening-balance.services";
import type { OpeningBalance } from "./opening-balance.types";

export function OpeningBalanceWorkspace() {
  const query = useOpeningBalances();
  const { tools, entries, toolbar } = useOpeningBalanceControls(query.data?.items ?? []);
  const access = useBillingAccess();
  const client = useQueryClient();
  const [editing, setEditing] = useWorkspaceRecordSelection(
    query.data?.items ?? [],
    (item) => item.id
  );
  const form = editing === undefined ? null : { initial: editing };
  const setForm = (value: { initial: OpeningBalance | null } | null) =>
    setEditing(value === null ? undefined : value.initial);
  const mutation = useMutation({
    mutationFn: saveOpeningBalance,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["billing"] });
      setForm(null);
      toast.success("Opening balance saved");
    }
  });
  if (query.isLoading) return <p>Loading opening balances…</p>;
  if (query.error) return <p role="alert">{query.error.message}</p>;
  if (!query.data) return null;
  return (
    <div className="space-y-4">
      {form ? (
        <OpeningBalanceForm
          data={query.data}
          initial={form.initial}
          saving={mutation.isPending}
          error={mutation.error?.message ?? ""}
          onSave={(value) => mutation.mutate(value)}
          onCancel={() => setForm(null)}
        />
      ) : (
        <>
          <WorkspaceHeaderActions>
            <Button
              disabled={!access.data?.canEditEntries}
              onClick={() => {
                mutation.reset();
                setForm({ initial: null });
              }}
            >
              New opening
            </Button>
          </WorkspaceHeaderActions>
          {toolbar}
          <OpeningBalanceList
            tools={tools}
            items={entries}
            canEdit={Boolean(access.data?.canEditEntries)}
            onEdit={(item) => {
              mutation.reset();
              setForm({ initial: item });
            }}
          />
        </>
      )}
    </div>
  );
}
