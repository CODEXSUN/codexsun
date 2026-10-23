import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { crmRequest } from "../../crm-request";

type SourceRevision = {
  revision: string;
  baseUrl: string;
  remoteName: string;
  documentJson: string;
  capturedAt: string;
};

export function EnquiryFrappeSource({ enquiryId }: { enquiryId: number }) {
  const [page, setPage] = useState(1);
  const source = useQuery({
    queryKey: ["crm", "enquiry", enquiryId, "frappe-source", page],
    queryFn: () =>
      crmRequest<SourceRevision[]>(`/frappe/enquiries/${enquiryId}/source?page=${page}`)
  });
  if (source.isLoading) return <p className="text-sm">Loading Frappe source fields…</p>;
  if (source.error)
    return (
      <p role="alert" className="text-sm text-destructive">
        {source.error.message}
      </p>
    );
  const revisions = source.data ?? [];
  if (!revisions.length && page === 1) return null;
  return (
    <section className="space-y-3" aria-label="Retained Frappe source fields">
      <h3 className="text-sm font-semibold">Frappe source fields and history</h3>
      <p className="text-xs text-muted-foreground">
        Original enquiry fields and comment records are retained here, including fields without a
        CRM editor. CRM edits do not remove this source history.
      </p>
      {revisions.map((row) => {
        const document = JSON.parse(row.documentJson) as Record<string, unknown>;
        const fields =
          document.enquiry && typeof document.enquiry === "object"
            ? Object.entries(document.enquiry)
            : null;
        return (
          <details key={row.revision} className="rounded-md border p-3">
            <summary className="cursor-pointer text-sm">
              {row.remoteName} · {fields ? "Enquiry fields" : "Comments"} ·{" "}
              {new Date(row.capturedAt).toLocaleString()}
            </summary>
            <p className="my-2 break-all text-xs text-muted-foreground">Source: {row.baseUrl}</p>
            {fields ? (
              <dl className="grid gap-2 text-sm sm:grid-cols-[12rem_1fr]">
                {fields.map(([name, value]) => (
                  <div key={name} className="contents">
                    <dt className="break-all font-medium">{name}</dt>
                    <dd className="whitespace-pre-wrap break-words">
                      {typeof value === "string" ? value : JSON.stringify(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all text-xs">
                {JSON.stringify(document, null, 2)}
              </pre>
            )}
          </details>
        );
      })}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
          Newer
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={revisions.length < 50}
          onClick={() => setPage(page + 1)}
        >
          Older
        </Button>
      </div>
    </section>
  );
}
