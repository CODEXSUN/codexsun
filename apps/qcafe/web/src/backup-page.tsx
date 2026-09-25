import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Field } from "@codexsun/ui/components/field";
import { Input } from "@codexsun/ui/components/input";
import { NativeSelect, NativeSelectOption } from "@codexsun/ui/components/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@codexsun/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { readFoundationSetup } from "./foundation-setup-api";
import { changeBackup, readBackup } from "./backup-api";

type Sender = (path: string, input?: Record<string, unknown>) => void;

export function BackupPage({ request }: { request: typeof fetch }) {
  const client = useQueryClient();
  const setup = useQuery({ queryKey: ["qcafe", "foundation", "setup"], queryFn: () => readFoundationSetup(request) });
  const business = setup.data?.businesses[0];
  const [locationId, setLocationId] = useState("");
  useEffect(() => {
    if (!locationId && business?.locations[0]) setLocationId(business.locations[0].id);
  }, [business, locationId]);
  const key = ["qcafe", "backup", business?.id, locationId] as const;
  const backup = useQuery({
    enabled: Boolean(business && locationId),
    queryKey: key,
    queryFn: () => readBackup(request, business!.id, locationId),
  });
  const change = useMutation({
    mutationFn: ({ input, path }: { input?: Record<string, unknown>; path: string }) => changeBackup(request, path, input),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: key });
    },
  });
  if (!business) return <p className="text-sm text-muted-foreground">Create the business and outlet first.</p>;
  const data = backup.data;
  const send: Sender = (path, input) => change.mutate({ input, path });
  const scope = { businessId: business.id, locationId };
  const folder = data?.dataFolders[0];
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
          <Badge>{folder ? folder.folder_path : "No data folder"}</Badge>
          <Badge variant="outline">{data?.backups.filter((item) => item.status === "verified").length ?? 0} verified</Badge>
        </div>
      </div>
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("data-folders", { ...scope, folderPath: form.get("folderPath") });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">Desktop data folder</h2>
        <Field label="Absolute folder path" htmlFor="backup-folder">
          <Input id="backup-folder" name="folderPath" required placeholder="C:\ProgramData\Codexsun\Qcafe" />
        </Field>
        <Button className="w-fit" type="submit" variant="outline">
          Select folder
        </Button>
      </form>
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("schedules", { ...scope, frequency: form.get("frequency"), name: form.get("name"), retainCount: Number(form.get("retainCount")) });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">Backup schedules</h2>
        <Field label="Name" htmlFor="backup-schedule-name"><Input id="backup-schedule-name" name="name" required placeholder="Nightly" /></Field>
        <Field label="Frequency" htmlFor="backup-schedule-frequency">
          <NativeSelect className="w-full" id="backup-schedule-frequency" name="frequency" required>
            <NativeSelectOption value="daily">Daily</NativeSelectOption>
            <NativeSelectOption value="weekly">Weekly</NativeSelectOption>
            <NativeSelectOption value="manual">Manual</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field label="Retain count" htmlFor="backup-schedule-retain"><Input id="backup-schedule-retain" name="retainCount" required type="number" min="1" defaultValue="7" /></Field>
        <Button className="w-fit" type="submit" variant="outline">
          Create schedule
        </Button>
      </form>
      {(data?.backupSchedules ?? []).map((schedule) => (
        <div className="flex flex-wrap items-center gap-3 border-t pt-3" key={schedule.id}>
          <strong className="text-sm">{schedule.name}</strong>
          <Badge variant={schedule.active ? "default" : "secondary"}>{schedule.frequency}</Badge>
          <Button size="sm" variant="ghost" onClick={() => send(`schedules/${schedule.id}/active`, { active: !schedule.active })}>
            {schedule.active ? "Disable" : "Enable"}
          </Button>
        </div>
      ))}
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          send("backups", {
            ...scope,
            checksum: form.get("checksum"),
            fileRef: form.get("fileRef"),
            scheduleId: String(form.get("scheduleId") ?? "").trim() || undefined,
            sizeBytes: Number(form.get("sizeBytes")),
            status: "completed",
          });
          event.currentTarget.reset();
        }}
      >
        <h2 className="text-sm font-semibold">Record backup</h2>
        <Field label="Schedule" htmlFor="backup-record-schedule">
          <NativeSelect className="w-full" id="backup-record-schedule" name="scheduleId">
            <NativeSelectOption value="">Manual</NativeSelectOption>
            {(data?.backupSchedules ?? []).map((schedule) => (
              <NativeSelectOption key={schedule.id} value={schedule.id}>
                {schedule.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field label="File reference" htmlFor="backup-record-file"><Input id="backup-record-file" name="fileRef" required placeholder="backups/nightly-1.zip" /></Field>
        <Field label="SHA-256 checksum" htmlFor="backup-record-checksum"><Input id="backup-record-checksum" name="checksum" required placeholder="sha256:…" /></Field>
        <Field label="Size in bytes" htmlFor="backup-record-size"><Input id="backup-record-size" name="sizeBytes" required type="number" min="1" /></Field>
        <Button className="w-fit" type="submit" variant="outline">
          Record backup
        </Button>
      </form>
      <Table className="min-w-[680px]">
        <TableHeader>
          <TableRow>
            <TableHead>Backup</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Restore drill</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.backups ?? []).map((backup) => (
            <TableRow key={backup.id}>
              <TableCell>
                <div className="font-medium">{backup.file_ref}</div>
                <div className="text-xs text-muted-foreground">{backup.created_at}</div>
              </TableCell>
              <TableCell>
                <Badge variant={backup.status === "verified" ? "default" : backup.status === "failed" ? "destructive" : "secondary"}>
                  {backup.status}
                </Badge>
              </TableCell>
              <TableCell>
                {backup.status !== "failed" ? (
                  <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = new FormData(event.currentTarget);
                      send(`backups/${backup.id}/restore-checks`, {
                        detail: String(form.get("detail") ?? "").trim() || undefined,
                        status: form.get("status"),
                      });
                      event.currentTarget.reset();
                    }}
                  >
                    <NativeSelect aria-label="Restore outcome" name="status" required>
                      <NativeSelectOption value="passed">Passed</NativeSelectOption>
                      <NativeSelectOption value="failed">Failed</NativeSelectOption>
                    </NativeSelect>
                    <Input aria-label="Restore detail" name="detail" placeholder="Required when failed" />
                    <Button size="sm" type="submit" variant="outline">
                      Check
                    </Button>
                  </form>
                ) : (
                  <span className="text-xs text-muted-foreground">Record a new backup.</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {change.isPending ? <p className="text-sm text-muted-foreground">Recording backup change...</p> : null}
      {change.error ? <p className="text-sm text-destructive">{change.error.message}</p> : null}
    </div>
  );
}
