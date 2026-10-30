import { WorkspaceLookup } from "@codexsun/ui/workspace/lookup";
import { useEffect, useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@codexsun/ui/components/select";
import { WorkspaceTableHeaderCell } from "@codexsun/ui/workspace/table";
import { transfers } from "./transfer-session.services.js";
import type { TransferSession, TransferColumn, TransferField } from "./transfer-session.types.js";
export function TransferChoice({
  value,
  onChange,
  options,
  disabled = false
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  if (options.length > 25)
    return (
      <WorkspaceLookup
        value={value}
        onValueChange={onChange}
        options={options}
        allowTextValue={false}
        disabled={disabled}
        placeholder="Search and select"
        showAllOptionsOnFocus
      />
    );
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function TransferFields({
  session,
  onSave,
  busy
}: {
  session: TransferSession;
  onSave: (fields: TransferField[]) => void;
  busy: boolean;
}) {
  const [schema, setSchema] = useState<{
    source: TransferColumn[];
    target: TransferColumn[];
  } | null>(null);
  const [fields, setFields] = useState<TransferField[]>([]);
  const [parents, setParents] = useState<Record<string, Array<{ id: number; label: string }>>>({});
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await transfers.inspect(session.id);
        if (!active || !result.schema) return;
        setSchema(result.schema);
        setFields(
          result.schema.target.map(
            (c) =>
              session.fields.find((f) => f.target === c.name) ?? {
                target: c.name,
                source: result.schema!.source.some((s) => s.name === c.name && !c.generated)
                  ? c.name
                  : null,
                mode:
                  c.name === "uuid" && c.required
                    ? "uuid"
                    : (["id", "uuid", "created_at", "updated_at"].includes(c.name) ||
                          /_by$/u.test(c.name)) &&
                        !c.required
                      ? "default"
                      : c.generated
                        ? "default"
                        : c.parent &&
                            !result.schema!.source.some(
                              (source) => source.name === c.name && source.parent
                            )
                          ? "value"
                          : result.schema!.source.some((s) => s.name === c.name)
                            ? "source"
                            : c.required && ["created_at", "updated_at"].includes(c.name)
                              ? "now"
                              : "default",
                value: null
              }
          )
        );
        for (const c of result.schema.target.filter((c) => c.parent)) {
          const options = await transfers.parents(session.id, c.name);
          if (active) setParents((old) => ({ ...old, [c.name]: options }));
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to inspect fields.");
      }
    })();
    return () => {
      active = false;
    };
  }, [session.id, session.revision]);
  function update(target: string, patch: Partial<TransferField>) {
    setFields((old) => old.map((f) => (f.target === target ? { ...f, ...patch } : f)));
  }
  return (
    <section className="space-y-4">
      <h2 className="font-semibold">Map source fields to destination fields</h2>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <div className="overflow-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {["Destination field", "Type", "Value rule", "Source field / value"].map((n) => (
                <WorkspaceTableHeaderCell key={n}>{n}</WorkspaceTableHeaderCell>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {schema?.target.map((c) => {
              const field = fields.find((f) => f.target === c.name);
              if (!field) return null;
              return (
                <tr key={c.name}>
                  <td className="p-3">
                    {c.name}
                    {c.required ? " *" : ""}
                    {c.parent ? ` / ${c.parent}` : ""}
                  </td>
                  <td className="p-3">{c.type}</td>
                  <td className="p-3">
                    <TransferChoice
                      disabled={busy || (c.generated && !(c.primary && c.name === "id"))}
                      value={field.mode}
                      onChange={(mode) =>
                        update(c.name, {
                          mode: mode as TransferField["mode"],
                          source: null,
                          value: null
                        })
                      }
                      options={[
                        { value: "default", label: "Destination default / omit" },
                        {
                          value: "source",
                          label: c.parent ? "Resolve source parent" : "Source field"
                        },
                        { value: "value", label: c.parent ? "Target parent" : "Custom value" },
                        ...(!c.parent && /^char\(8\)$/iu.test(c.type)
                          ? [{ value: "uuid", label: "Generate UUID" }]
                          : []),
                        ...(!c.parent && /^(date|datetime|timestamp)/iu.test(c.type)
                          ? [{ value: "now", label: "Current time" }]
                          : [])
                      ]}
                    />
                  </td>
                  <td className="p-3">
                    {field.mode === "source" ? (
                      <TransferChoice
                        value={field.source ?? ""}
                        onChange={(source) => update(c.name, { source })}
                        options={schema.source.map((s) => ({
                          value: s.name,
                          label: `${s.name} / ${s.type}`
                        }))}
                      />
                    ) : field.mode === "value" ? (
                      c.parent ? (
                        <TransferChoice
                          value={field.value === null ? "" : String(field.value)}
                          onChange={(value) => update(c.name, { value: Number(value) })}
                          options={(parents[c.name] ?? []).map((v) => ({
                            value: String(v.id),
                            label: `${v.label} (#${v.id})`
                          }))}
                        />
                      ) : (
                        <Input
                          aria-label={`${c.name} custom value`}
                          value={field.value ?? ""}
                          onChange={(e) => update(c.name, { value: e.target.value })}
                        />
                      )
                    ) : (
                      <span className="text-muted-foreground">
                        {field.mode === "default"
                          ? "Destination default"
                          : "Generated when preparing data"}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Button disabled={busy || !fields.length} onClick={() => onSave(fields)}>
        Verify fields and continue
      </Button>
    </section>
  );
}
