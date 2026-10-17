import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { WorkspacePagination } from "@codexsun/ui/workspace";
import type { TconnectGateway } from "../../workspace.types";
import type { Credential } from "./credential.types";
import { useCredentialRecords } from "./credential.hooks";
import { CredentialForm } from "./credential.form";
import { CredentialList } from "./credential.list";
export function CredentialWorkspace({ gateway }: { gateway: TconnectGateway }) {
  const query = useCredentialRecords(gateway);
  const companies = useQuery({ queryKey: ["tconnect", "company"], queryFn: gateway.company.list });
  const client = useQueryClient();
  const [record, setRecord] = useState<Credential | null | undefined>();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const filtered = (query.data ?? []).filter((row) =>
    `${row.companyName} ${row.standardName} ${row.status}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const [saved, setSaved] = useState(false);
  if (record !== undefined)
    return (
      <CredentialForm
        record={record}
        companies={companies.data ?? []}
        onCancel={() => setRecord(undefined)}
        onSave={async (input, uuid) => {
          await gateway.credential.save(input, uuid);
          await client.invalidateQueries({ queryKey: ["tconnect", "credential"] });
          setRecord(undefined);
          setSaved(true);
        }}
      />
    );
  return (
    <section className="space-y-4">
      <div className="flex gap-3">
        <Input
          aria-label="Search credential reviews"
          placeholder="Company, standard or status"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Button onClick={() => setRecord(null)}>New review</Button>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Refresh
        </Button>
      </div>
      {saved ? (
        <p role="status" className="text-sm text-emerald-700">
          Credential review saved.
        </p>
      ) : null}
      {query.isError ? (
        <WorkspaceFormBanner title="Credential reviews unavailable">
          {query.error.message}
        </WorkspaceFormBanner>
      ) : query.isPending ? (
        <p role="status">Loading reviews…</p>
      ) : (
        <CredentialList records={filtered.slice((page - 1) * 20, page * 20)} onEdit={setRecord} />
      )}
      <WorkspacePagination
        page={page}
        rowsPerPage={20}
        totalCount={filtered.length}
        totalPages={Math.max(1, Math.ceil(filtered.length / 20))}
        onPageChange={setPage}
        singularLabel="credential"
        showingLabel={`${filtered.length} records`}
      />
    </section>
  );
}
