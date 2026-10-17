import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { WorkspacePagination } from "@codexsun/ui/workspace";
import type { TconnectGateway } from "../../workspace.types";
import type { Company } from "./company.types";
import { CompanyForm } from "./company.form";
import { CompanyList } from "./company.list";
import { useCompanyRecords } from "./company.hooks";
export function CompanyWorkspace({
  gateway,
  associations
}: {
  gateway: TconnectGateway;
  associations: { uuid: string; name: string }[];
}) {
  const query = useCompanyRecords(gateway);
  const client = useQueryClient();
  const [record, setRecord] = useState<Company | null | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState(false);
  const filtered = (query.data ?? []).filter((item) =>
    JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
  );
  if (record !== undefined)
    return (
      <CompanyForm
        record={record}
        associations={associations}
        onCancel={() => setRecord(undefined)}
        onSave={async (input, uuid) => {
          await gateway.company.save(input, uuid);
          await client.invalidateQueries({ queryKey: ["tconnect"] });
          setRecord(undefined);
          setSaved(true);
        }}
      />
    );
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Input
          aria-label="Search company"
          placeholder="Search company"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Button onClick={() => setRecord(null)}>New company</Button>
        <Button variant="outline" onClick={() => void query.refetch()}>
          Refresh
        </Button>
      </div>
      {saved ? (
        <p role="status" className="text-sm text-emerald-700">
          Company saved.
        </p>
      ) : null}
      {query.isPending ? (
        <p role="status">Loading company…</p>
      ) : query.isError ? (
        <WorkspaceFormBanner title="Could not load company">
          {query.error.message}
        </WorkspaceFormBanner>
      ) : (
        <CompanyList records={filtered.slice((page - 1) * 20, page * 20)} onEdit={setRecord} />
      )}
      <WorkspacePagination
        page={page}
        rowsPerPage={20}
        totalCount={filtered.length}
        totalPages={Math.max(1, Math.ceil(filtered.length / 20))}
        onPageChange={setPage}
        singularLabel="company"
        showingLabel={`${filtered.length} records`}
      />
    </section>
  );
}
