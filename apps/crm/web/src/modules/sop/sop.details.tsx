import { useEffect, useId, useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { Label } from "@codexsun/ui/components/label";
import { SopStatusBadge } from "./sop.status";
import {
  assignDuty,
  createSopItem,
  createSopRevision,
  deactivateDuty,
  listAssignments,
  listCrmUsers,
  listSopItems,
  listSopRevisions,
  publishSopItem,
  updateSopItem,
  updateSopRevision,
  type DutyAssignment,
  type Sop,
  type SopItem,
  type SopRevision
} from "./sop.services";

export function SopDetails({ sop }: { sop: Sop }) {
  const sops = [sop];
  const [items, setItems] = useState<SopItem[]>([]);
  const [assignments, setAssignments] = useState<DutyAssignment[]>([]);
  const [users, setUsers] = useState<Array<{ id: number; name: string; email: string }>>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [histories, setHistories] = useState<Record<number, SopRevision[]>>({});
  async function refresh() {
    try {
      const [allItems, allAssignments, allUsers] = await Promise.all([
        listSopItems(),
        listAssignments(),
        listCrmUsers()
      ]);
      const selected = allItems.filter((item) => item.sopId === sop.id);
      setItems(selected);
      setAssignments(
        allAssignments.filter((assignment) =>
          selected.some((item) => item.id === assignment.sopItemId)
        )
      );
      setUsers(allUsers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load SOP details.");
    }
  }
  useEffect(() => {
    void refresh();
  }, [sop.id]);
  async function submit(
    event: React.FormEvent<HTMLFormElement>,
    save: (data: FormData) => Promise<unknown>
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      await save(data);
      if (form.dataset.resetOnSave === "true") {
        form.reset();
        form.closest("details")?.removeAttribute("open");
      }
      await refresh();
      setHistories({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save changes.");
    } finally {
      setBusy(false);
    }
  }
  async function action(run: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await run();
      await refresh();
      setHistories({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save changes.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <details className="rounded-md border bg-background p-4">
        <summary className="cursor-pointer text-sm font-medium">New SOP item</summary>
        <div className="pt-4">
          <form
            data-reset-on-save="true"
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(e) =>
              void submit(e, async (f) =>
                createSopItem({
                  sopId: sop.id,
                  code: String(f.get("code")),
                  title: String(f.get("title")),
                  department: String(f.get("department")),
                  frequency: f.get("frequency") as "daily",
                  sortOrder: Number(f.get("sortOrder") || 0),
                  revision: {
                    instructions: String(f.get("instructions")),
                    evidenceGuidance: String(f.get("evidenceGuidance"))
                  }
                })
              )
            }
          >
            <Field name="code" label="Item code" />
            <Field name="title" label="Title" />
            <Field name="department" label="Department" />
            <label className="grid gap-1 text-sm">
              Frequency
              <select name="frequency" className="h-9 rounded-md border bg-background px-3">
                {["daily", "weekly", "monthly", "quarterly", "annually", "once"].map((v) => (
                  <option key={v} value={v}>
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <Field name="sortOrder" label="Order" type="number" />
            <Field name="instructions" label="Instructions" />
            <Field name="evidenceGuidance" label="Evidence guidance" />
            <Button
              className="self-end"
              disabled={busy || !sops.some((x) => x.status === "active")}
            >
              Create draft item
            </Button>
          </form>
        </div>
      </details>
      <section className="rounded-lg border bg-background p-4">
        <h2 className="mb-3 text-lg font-semibold">SOP items and revisions</h2>
        <div className="divide-y">
          {!items.length ? (
            <p className="py-3 text-sm text-muted-foreground">No SOP items yet.</p>
          ) : null}
          {items.map((item) => (
            <details key={item.id} className="py-3">
              <summary className="cursor-pointer font-medium">
                {item.code} · {item.title}{" "}
                <span className="ml-2 inline-flex items-center gap-2">
                  <SopStatusBadge status={item.currentRevision?.status ?? "draft"} />
                  {item.currentRevision ? (
                    <span className="text-xs text-muted-foreground">
                      Revision {item.currentRevision.revision}
                    </span>
                  ) : null}
                </span>
              </summary>
              <div className="space-y-4 pt-3">
                <form
                  className="grid gap-3 md:grid-cols-2"
                  onSubmit={(e) =>
                    void submit(e, async (f) =>
                      updateSopItem(item.id, {
                        sopId: item.sopId,
                        code: String(f.get("code")),
                        title: String(f.get("title")),
                        department: String(f.get("department")),
                        frequency: String(f.get("frequency")),
                        sortOrder: Number(f.get("sortOrder"))
                      })
                    )
                  }
                >
                  <Field name="code" label="Code" defaultValue={item.code} />
                  <Field name="title" label="Title" defaultValue={item.title} />
                  <Field name="department" label="Department" defaultValue={item.department} />
                  <Field
                    name="sortOrder"
                    label="Order"
                    type="number"
                    defaultValue={String(item.sortOrder)}
                  />
                  <label className="grid gap-1 text-sm">
                    Frequency
                    <select
                      name="frequency"
                      defaultValue={item.frequency}
                      className="h-9 rounded-md border bg-background px-3"
                    >
                      {["daily", "weekly", "monthly", "quarterly", "annually", "once"].map((v) => (
                        <option key={v} value={v}>
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button variant="outline" className="self-end" disabled={busy}>
                    Save item
                  </Button>
                </form>
                {item.currentRevision?.status === "draft" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void action(() => publishSopItem(item.id, item.currentRevision!.id))
                      }
                    >
                      Publish draft
                    </Button>
                  </div>
                ) : null}
                <details className="border-t pt-3">
                  <summary className="cursor-pointer text-sm font-medium">New revision</summary>
                  <div className="pt-3">
                    <form
                      className="grid gap-3 md:grid-cols-2"
                      onSubmit={(e) =>
                        void submit(e, async (f) =>
                          createSopRevision(item.id, {
                            instructions: String(f.get("instructions")),
                            evidenceGuidance: String(f.get("evidenceGuidance"))
                          })
                        )
                      }
                    >
                      <Field name="instructions" label="New revision instructions" />
                      <Field name="evidenceGuidance" label="Evidence guidance" />
                      <Button variant="outline" className="self-end" disabled={busy}>
                        Create draft revision
                      </Button>
                    </form>
                  </div>
                </details>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        setHistories({ ...histories, [item.id]: await listSopRevisions(item.id) });
                      } catch (e) {
                        setError(
                          e instanceof Error ? e.message : "Revision history could not load."
                        );
                      }
                    }}
                  >
                    Load revision history
                  </Button>
                </div>
                {histories[item.id]?.map((revision) => (
                  <div key={revision.id} className="rounded-md bg-muted/40 p-3 text-sm">
                    <strong>
                      Revision {revision.revision} · {revision.status}
                    </strong>
                    {revision.status === "draft" ? (
                      <form
                        className="mt-2 grid gap-3"
                        onSubmit={(e) =>
                          void submit(e, async (f) =>
                            updateSopRevision(item.id, revision.id, {
                              instructions: String(f.get("instructions")),
                              evidenceGuidance: String(f.get("evidenceGuidance"))
                            })
                          )
                        }
                      >
                        <label className="grid gap-1">
                          Instructions
                          <textarea
                            name="instructions"
                            required
                            defaultValue={revision.instructions}
                            className="min-h-24 rounded-md border bg-background p-2"
                          />
                        </label>
                        <label className="grid gap-1">
                          Evidence guidance
                          <textarea
                            name="evidenceGuidance"
                            defaultValue={revision.evidenceGuidance}
                            className="min-h-16 rounded-md border bg-background p-2"
                          />
                        </label>
                        <Button variant="outline" disabled={busy}>
                          Save draft
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void action(() => publishSopItem(item.id, revision.id))}
                        >
                          Publish revision
                        </Button>
                      </form>
                    ) : (
                      <>
                        <p className="mt-1 whitespace-pre-wrap">{revision.instructions}</p>
                        {revision.evidenceGuidance ? (
                          <p className="mt-1 text-muted-foreground">
                            Evidence: {revision.evidenceGuidance}
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>
      <details className="rounded-md border bg-background p-4">
        <summary className="cursor-pointer text-sm font-medium">Assign published duty</summary>
        <div className="pt-4">
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(e) =>
              void submit(e, async (f) => {
                const item = items.find((x) => x.id === Number(f.get("itemId")));
                if (!item?.currentRevision || item.currentRevision.status !== "published")
                  throw new Error("Select an item with a published revision.");
                return assignDuty({
                  sopItemId: item.id,
                  revisionId: item.currentRevision.id,
                  assigneeUserId: Number(f.get("userId")),
                  displayOrder: Number(f.get("displayOrder") || 0),
                  startDate: String(f.get("startDate")),
                  endDate: null
                });
              })
            }
          >
            <label className="grid gap-1 text-sm">
              Published item
              <select name="itemId" required className="h-9 rounded-md border bg-background px-3">
                {items
                  .filter((x) => x.currentRevision?.status === "published")
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.code} · {x.title}
                    </option>
                  ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Assign to
              <select name="userId" required className="h-9 rounded-md border bg-background px-3">
                {users.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name} · {x.email}
                  </option>
                ))}
              </select>
            </label>
            <Field name="startDate" label="Start date" type="date" />
            <Field name="displayOrder" label="Display order" />
            <Button
              className="self-end"
              disabled={
                busy ||
                !users.length ||
                !items.some((item) => item.currentRevision?.status === "published")
              }
            >
              Assign duty
            </Button>
          </form>
        </div>
      </details>
      <section className="rounded-lg border bg-background p-4">
        <h2 className="mb-3 text-lg font-semibold">Assignments</h2>
        {assignments.length ? (
          assignments.map((x) => (
            <div key={x.id} className="flex items-center justify-between gap-3 border-t py-3">
              <div>
                <strong>{x.itemTitle}</strong>
                <span className="text-sm text-muted-foreground">
                  {" "}
                  · {x.assigneeName} · {x.startDate} · {x.status}
                </span>
              </div>
              <SopStatusBadge status={x.status} />
              {x.status === "active" ? (
                <Button variant="outline" onClick={() => void action(() => deactivateDuty(x.id))}>
                  Deactivate
                </Button>
              ) : null}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No assignments yet.</p>
        )}
      </section>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
}) {
  const id = useId();
  const multiline = /instructions|evidence/i.test(name);
  return (
    <div className="grid gap-2 text-sm">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea
          id={id}
          name={name}
          defaultValue={defaultValue}
          required={name === "instructions"}
          className="min-h-28"
        />
      ) : (
        <Input
          id={id}
          name={name}
          type={type}
          defaultValue={defaultValue}
          required={!/department|sort|order/i.test(name)}
        />
      )}
    </div>
  );
}
