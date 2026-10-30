import { useState } from "react";
import "./enquiry.workspace.css";

import { Button } from "@codexsun/ui/components/button";

import { Card } from "@codexsun/ui/components/card";

import { WorkspaceFilters } from "@codexsun/ui/workspace/filters";

import { WorkspacePagination } from "@codexsun/ui/workspace/pagination";

import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";

import { WorkspaceDetailTable, WorkspaceShowCard } from "@codexsun/ui/workspace/show";

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

import { EnquiryForm } from "./enquiry.form.js";
import { EnquiryList } from "./enquiry.list.js";
import { useEnquiries } from "./enquiry.hooks.js";

import {
  enquiryStatuses,
  type EnquiryGateway,
  type EnquiryDetail,
  type EnquiryRecord,
  type EnquiryQuery
} from "./enquiry.types.js";

export function EnquiryWorkspace({
  uuid,
  gateway
}: {
  uuid: string;
  gateway: EnquiryGateway | undefined;
}) {
  const [query, setQuery] = useState<EnquiryQuery>({ q: "", status: "all", trash: "no", page: 1 });
  const [selected, setSelected] = useState<EnquiryDetail | null>(null);
  const [remove, setRemove] = useState<EnquiryRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const inbox = useEnquiries(uuid, gateway, query);

  async function perform(work: () => Promise<EnquiryDetail>, success: string) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      setSelected(await work());
      inbox.refresh();
      setMessage(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enquiry request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="sites-enquiries grid gap-4 p-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h2 className="font-semibold">Contact enquiries</h2>
          <p className="text-sm text-muted-foreground">
            Private enquiries from this client’s website. Records expire 90 days after receipt.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={busy || inbox.loading}
          onClick={() => {
            if (selected && gateway)
              void perform(() => gateway.get(uuid, selected.reference), "Enquiry refreshed.");
            else inbox.refresh();
          }}
        >
          Refresh enquiries
        </Button>
      </div>

      {inbox.error || error ? (
        <WorkspaceFormBanner title="Enquiry request failed">
          {error || inbox.error}
        </WorkspaceFormBanner>
      ) : null}
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}

      {selected ? (
        <div className="grid gap-4">
          <div className="flex justify-between">
            <h3 className="font-semibold">Enquiry from {selected.name}</h3>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Back to enquiries
            </Button>
          </div>
          <WorkspaceShowCard title="Contact details">
            <WorkspaceDetailTable
              rows={[
                ["Reference", selected.reference],
                ["Name", selected.name],
                ["Email", selected.email],
                ["Company", selected.company || "Not supplied"],
                ["Phone", selected.phone || "Not supplied"],
                ["Received", new Date(selected.createdAt).toLocaleString()],
                ["Consent recorded", selected.consentedAt],
                ["Message", <p className="whitespace-pre-wrap break-words">{selected.message}</p>]
              ]}
            />
          </WorkspaceShowCard>

          <EnquiryForm
            key={`${selected.reference}:${selected.revision}`}
            record={selected}
            busy={busy}
            onSave={(status) => {
              if (gateway)
                void perform(() => gateway.status(uuid, selected, status), "Enquiry status saved.");
            }}
          />

          <Button
            className="justify-self-start"
            variant="outline"
            disabled={busy}
            onClick={() => {
              if (selected.deletedAt && gateway)
                void perform(() => gateway.trash(uuid, selected, true), "Enquiry restored.");
              else setRemove(selected);
            }}
          >
            {selected.deletedAt ? "Restore enquiry" : "Move to trash"}
          </Button>

          <WorkspaceShowCard title="Activity">
            <div className="grid gap-2 p-4 text-sm">
              {selected.activity.length ? (
                selected.activity.map((a, i) => (
                  <p key={i}>
                    {a.action} · {a.actor} · {new Date(a.at).toLocaleString()}
                  </p>
                ))
              ) : (
                <p>Received from the website. No status changes yet.</p>
              )}
            </div>
          </WorkspaceShowCard>
        </div>
      ) : (
        <>
          <WorkspaceFilters
            searchValue={query.q}
            searchPlaceholder="Search name, email, company or message"
            onSearchValueChange={(q) => setQuery({ ...query, q, page: 1 })}
            filterValue={query.status}
            onFilterValueChange={(status) =>
              setQuery({ ...query, status: status as EnquiryQuery["status"], page: 1 })
            }
            filterOptions={[
              { id: "all", label: "All statuses" },
              ...enquiryStatuses.map((s) => ({ id: s.value, label: s.label }))
            ]}
            toolbarAction={
              <Button
                variant="outline"
                onClick={() =>
                  setQuery({ ...query, trash: query.trash === "no" ? "yes" : "no", page: 1 })
                }
              >
                {query.trash === "no" ? "Show trash" : "Show inbox"}
              </Button>
            }
          />

          <EnquiryList
            records={inbox.records}
            loading={inbox.loading}
            onView={(r) => {
              if (gateway) void perform(() => gateway.get(uuid, r.reference), "");
            }}
            onDelete={setRemove}
            onRestore={(r) => {
              if (gateway) void perform(() => gateway.trash(uuid, r, true), "Enquiry restored.");
            }}
          />

          <WorkspacePagination
            page={query.page}
            rowsPerPage={20}
            rowsPerPageOptions={[20]}
            totalCount={inbox.total}
            totalPages={Math.max(1, Math.ceil(inbox.total / 20))}
            showingLabel="enquiries"
            singularLabel="enquiries"
            onPageChange={(page) => setQuery({ ...query, page })}
          />
        </>
      )}

      <AlertDialog
        open={Boolean(remove)}
        onOpenChange={(open) => {
          if (!open) setRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move this enquiry to trash?</AlertDialogTitle>
            <AlertDialogDescription>
              You can restore it from this client’s trash until its 90-day retention period ends.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (remove && gateway)
                  void perform(() => gateway.trash(uuid, remove, false), "Enquiry moved to trash.");
                setRemove(null);
              }}
            >
              Move to trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
