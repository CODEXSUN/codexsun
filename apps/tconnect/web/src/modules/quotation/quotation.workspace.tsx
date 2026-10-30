import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceSelect } from "@codexsun/ui/workspace";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from "@codexsun/ui/components/alert-dialog";
import type { TconnectGateway } from "../../workspace.types";
import type { Quotation } from "./quotation.types";
import { useQuotations } from "./quotation.hooks";
import { QuotationList } from "./quotation.list";
import { QuotationForm } from "./quotation.form";
import { QuotationCompare } from "./quotation.compare";
export function QuotationWorkspace({
  gateway,
  mode,
  conversationUuid,
  requirementUuid,
  onDiscuss
}: {
  gateway: TconnectGateway;
  mode: "buyer" | "seller";
  conversationUuid?: string;
  requirementUuid?: string;
  onDiscuss?: ((uuid: string) => void) | undefined;
}) {
  const query = useQuotations(gateway, conversationUuid);
  const client = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [viewing, setViewing] = useState<Quotation[] | null>(null);
  const [source, setSource] = useState("all");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [withdraw, setWithdraw] = useState<Quotation | null>(null);
  const [busy, setBusy] = useState(false);
  const records = (query.data ?? []).filter(
    (quote) => !requirementUuid || quote.requirementUuid === requirementUuid
  );
  const group = (quote: Quotation) =>
    quote.requirementUuid ? `requirement:${quote.requirementUuid}` : `inquiry:${quote.inquiryUuid}`;
  const groups = [
    ...new Map(
      records.map((quote) => [group(quote), { value: group(quote), label: quote.subject }])
    ).values()
  ];
  function toggle(quote: Quotation) {
    setError("");
    if (selected.includes(quote.uuid)) {
      setSelected(selected.filter((uuid) => uuid !== quote.uuid));
      return;
    }
    if (selected.length >= 4) {
      setError("Compare up to four quotations at a time.");
      return;
    }
    setSelected([...selected, quote.uuid]);
  }
  if (creating && conversationUuid)
    return (
      <QuotationForm
        conversationUuid={conversationUuid}
        onCancel={() => setCreating(false)}
        onSave={async (input) => {
          await gateway.quotation.create(input);
          await client.invalidateQueries({ queryKey: ["tconnect", "quotation"] });
          await client.invalidateQueries({ queryKey: ["tconnect", "conversation"] });
          setCreating(false);
          setSaved(true);
        }}
      />
    );
  if (viewing)
    return (
      <QuotationCompare
        records={viewing.map((quote) => records.find((row) => row.uuid === quote.uuid) ?? quote)}
        onBack={() => setViewing(null)}
        onDiscuss={onDiscuss}
      />
    );
  const activeSelected = records.filter(
    (row) =>
      selected.includes(row.uuid) &&
      row.status === "sent" &&
      row.validUntil >= new Date().toISOString().slice(0, 10)
  );
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="mr-auto text-lg font-semibold">
          {mode === "buyer" ? "Quotations received" : "Your quotations"}
        </h3>
        {mode === "seller" && conversationUuid ? (
          <Button
            onClick={() => {
              setCreating(true);
              setSaved(false);
            }}
          >
            New quotation
          </Button>
        ) : null}
        <Button variant="outline" onClick={() => void query.refetch()}>
          Refresh quotes
        </Button>
        {mode === "buyer" ? (
          <>
            <Button disabled={activeSelected.length < 2} onClick={() => setViewing(activeSelected)}>
              Compare selected ({activeSelected.length})
            </Button>
            {selected.length ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSelected([]);
                  setError("");
                }}
              >
                Clear selection
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
      {!conversationUuid ? (
        <WorkspaceSelect
          value={source}
          onValueChange={(value) => {
            setSource(value);
            setSelected([]);
          }}
          options={[{ value: "all", label: "All requirements and enquiries" }, ...groups]}
        />
      ) : null}
      {saved ? (
        <p role="status" className="text-sm text-emerald-700">
          Quotation sent.
        </p>
      ) : null}
      {error || query.isError ? (
        <WorkspaceFormBanner title="Quotation error">
          {error || query.error?.message}
        </WorkspaceFormBanner>
      ) : null}
      <QuotationList
        records={records.filter((quote) => source === "all" || group(quote) === source)}
        loading={query.isPending}
        mode={mode}
        selected={selected}
        onToggle={toggle}
        onView={(quote) => setViewing([quote])}
        onDiscuss={onDiscuss}
        onWithdraw={setWithdraw}
      />
      <AlertDialog
        open={!!withdraw}
        onOpenChange={(open) => {
          if (!open && !busy) setWithdraw(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw this quotation?</AlertDialogTitle>
            <AlertDialogDescription>
              The buyer will see it as withdrawn. Prices and conversation history are retained. You
              can send a new quotation with revised terms.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep quotation</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={async (event) => {
                event.preventDefault();
                if (!withdraw) return;
                setBusy(true);
                setError("");
                try {
                  await gateway.quotation.withdraw(withdraw.uuid);
                  await client.invalidateQueries({ queryKey: ["tconnect", "quotation"] });
                  setWithdraw(null);
                } catch (error) {
                  setError(
                    error instanceof Error ? error.message : "Quotation could not be withdrawn."
                  );
                  setWithdraw(null);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Withdrawing…" : "Withdraw quotation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
