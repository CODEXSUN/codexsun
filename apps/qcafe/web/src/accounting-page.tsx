import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Field } from "@codexsun/ui/components/field";
import { Input } from "@codexsun/ui/components/input";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@codexsun/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { readFoundationSetup } from "./foundation-setup-api";
import { changeAccounting, exportJournals, readAccounting } from "./accounting-api";

type Sender = (path: string, input?: Record<string, unknown>) => void;

export function AccountingPage({ request }: { request: typeof fetch }) {
  const client = useQueryClient();
  const setup = useQuery({ queryKey: ["qcafe", "foundation", "setup"], queryFn: () => readFoundationSetup(request) });
  const business = setup.data?.businesses[0];
  const [locationId, setLocationId] = useState("");
  useEffect(() => {
    if (!locationId && business?.locations[0]) setLocationId(business.locations[0].id);
  }, [business, locationId]);
  const key = ["qcafe", "accounting", business?.id, locationId] as const;
  const accounting = useQuery({
    enabled: Boolean(business && locationId),
    queryKey: key,
    queryFn: () => readAccounting(request, business!.id, locationId),
  });
  const change = useMutation({
    mutationFn: ({ input, path }: { input?: Record<string, unknown>; path: string }) => changeAccounting(request, path, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: key });
    },
  });
  if (!business) return <p className="text-sm text-muted-foreground">Create the business and outlet first.</p>;
  const data = accounting.data;
  const send: Sender = (path, input) => change.mutate({ input, path });
  const accountById = new Map((data?.accounts ?? []).map((account) => [account.id, account]));
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <NativeSelect aria-label="Outlet" value={locationId} onChange={(event) => setLocationId(event.currentTarget.value)}>
          {business.locations.map((item) => (
            <NativeSelectOption key={item.id} value={item.id}>
              {item.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <div className="flex flex-wrap gap-2">
          <Badge>{data?.accounts.length ?? 0} accounts</Badge>
          <Badge variant="outline">{data?.journals.filter((journal) => journal.status === "draft").length ?? 0} drafts</Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const csv = await exportJournals(request, business.id, locationId);
              const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
              const link = document.createElement("a");
              link.href = url;
              link.download = "qcafe-journals.csv";
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export posted CSV
          </Button>
        </div>
      </div>
      <Table className="min-w-[480px]">
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.accounts ?? []).map((account) => (
            <TableRow key={account.id}>
              <TableCell className="font-medium">{account.code}</TableCell>
              <TableCell>{account.name}</TableCell>
              <TableCell>{account.type}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("journals/generate", { sourceId: form.get("sourceId"), sourceType: form.get("sourceType") });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">Generate journal</h2>
        <Field label="Source type" htmlFor="accounting-generate-type">
          <NativeSelect className="w-full" id="accounting-generate-type" name="sourceType" required>
            <NativeSelectOption value="bill">Bill</NativeSelectOption>
            <NativeSelectOption value="payment">Payment</NativeSelectOption>
            <NativeSelectOption value="refund">Refund</NativeSelectOption>
            <NativeSelectOption value="voucher-issue">Voucher issue</NativeSelectOption>
            <NativeSelectOption value="voucher-apply">Voucher application</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field label="Source identifier" htmlFor="accounting-generate-source"><Input id="accounting-generate-source" name="sourceId" required placeholder="Bill, payment, or application UUID" /></Field>
        <Button className="w-fit" type="submit" variant="outline">
          Generate draft
        </Button>
      </form>
      {(data?.journals ?? []).map((journal) => (        <section className="grid gap-3 border-t pt-4" key={journal.id}>
          <div className="flex flex-wrap items-center gap-3">
            <strong className="text-sm">{journal.number}</strong>
            <Badge variant={journal.status === "posted" ? "default" : "secondary"}>{journal.status}</Badge>
            <span className="text-xs text-muted-foreground">
              {journal.source_type} · {journal.source_id.slice(0, 8)}
            </span>
            {journal.status === "draft" ? (
              <Button size="sm" variant="outline" onClick={() => send(`journals/${journal.id}/post`)}>
                Post
              </Button>
            ) : null}
          </div>
          <Table className="min-w-[480px]">
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Debit</TableHead>
                <TableHead>Credit</TableHead>
                <TableHead>Memo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.journalLines ?? [])
                .filter((line) => line.journal_id === journal.id)
                .map((line) => (
                  <TableRow key={line.id}>
                    <TableCell>
                      {accountById.get(line.account_id)?.code} · {accountById.get(line.account_id)?.name}
                    </TableCell>
                    <TableCell>{(line.debit_minor / 100).toFixed(2)}</TableCell>
                    <TableCell>{(line.credit_minor / 100).toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{line.memo ?? "-"}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </section>
      ))}
      {change.isPending ? <p className="text-sm text-muted-foreground">Recording journal change...</p> : null}
      {change.error ? <p className="text-sm text-destructive">{change.error.message}</p> : null}
    </div>
  );
}
