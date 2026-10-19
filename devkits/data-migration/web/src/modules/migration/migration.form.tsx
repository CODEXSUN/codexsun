import { useEffect, useState, type FormEvent } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import {
  WorkspaceAutocomplete,
  type AutocompleteOption
} from "@codexsun/ui/workspace/autocomplete";
import { WorkspaceSelect } from "@codexsun/ui/workspace/select";
import {
  WorkspaceFormBanner,
  WorkspaceFormField,
  WorkspaceFormGrid,
  WorkspaceFormFooter
} from "@codexsun/ui/workspace/upsert";
import {
  addSource,
  listDatabases,
  updateSource,
  type SourceInput,
  type SourceOption
} from "./migration.services.js";
import { sourceSchema, sourceUpdateSchema } from "./migration.schema.js";

const initial: SourceInput = {
  label: "",
  host: "",
  port: 3306,
  database: "",
  user: "",
  password: "",
  tlsMode: "required"
};

export function SourceForm({
  source,
  sources,
  onSaved,
  onCancel
}: {
  source?: SourceOption | undefined;
  sources: SourceOption[];
  onSaved: (id: number) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<SourceInput>(
    source
      ? {
          label: source.label,
          host: source.host,
          port: source.port,
          database: source.database,
          user: source.user,
          tlsMode: source.tlsMode,
          password: ""
        }
      : initial
  );
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<keyof SourceInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [databases, setDatabases] = useState<string[]>([]);
  const [loadingDatabases, setLoadingDatabases] = useState(false);
  const [databaseError, setDatabaseError] = useState("");

  useEffect(() => {
    if (!source) return;
    let active = true;
    setLoadingDatabases(true);
    void listDatabases(source.id)
      .then((items) => {
        if (active) setDatabases(items);
      })
      .catch((reason: unknown) => {
        if (active)
          setDatabaseError(reason instanceof Error ? reason.message : "Could not load databases.");
      })
      .finally(() => {
        if (active) setLoadingDatabases(false);
      });
    return () => {
      active = false;
    };
  }, [source?.id]);

  async function refreshDatabases() {
    if (!source) return;
    setLoadingDatabases(true);
    setDatabaseError("");
    try {
      setDatabases(await listDatabases(source.id));
    } catch (reason) {
      setDatabaseError(reason instanceof Error ? reason.message : "Could not load databases.");
    } finally {
      setLoadingDatabases(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldError(null);
    const parsed = (source ? sourceUpdateSchema : sourceSchema).safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Complete the source connection.");
      const field = parsed.error.issues[0]?.path[0];
      if (typeof field === "string") setFieldError(field as keyof SourceInput);
      return;
    }
    setSaving(true);
    try {
      const result = source
        ? await updateSource(source.id, {
            ...values,
            ...(values.password ? { password: values.password } : {})
          })
        : await addSource(values);
      onSaved(result.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save the source connection.");
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof SourceInput>(field: K, value: SourceInput[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function updatePort(value: string) {
    const port = Number(value);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      setFieldError("port");
      setError("Port must be a number from 1 to 65535.");
      return;
    }
    setFieldError(null);
    setError("");
    update("port", port);
  }

  function selectSourcePreset(label: string) {
    const preset = sources.find((item) => item.label === label);
    if (!preset) {
      update("label", label);
      return;
    }
    setValues((current) => ({
      ...current,
      label,
      host: preset.host,
      port: preset.port,
      database: source ? preset.database : "",
      user: preset.user,
      tlsMode: preset.tlsMode,
      password: ""
    }));
  }

  const labelOptions = choices(
    sources.map((item) => item.label),
    values.label
  );
  const hostOptions = choices(
    sources.map((item) => item.host),
    values.host
  );
  const portOptions = choices(
    ["3306", "3307", ...sources.map((item) => String(item.port))],
    String(values.port)
  ).map((option) => ({
    ...option,
    label: option.value === "3306" ? "3306 (MariaDB default)" : option.label
  }));
  const databaseOptions = choices(
    [...sources.map((item) => item.database), ...databases],
    values.database
  );
  const userOptions = choices(
    sources.map((item) => item.user),
    values.user
  );

  return (
    <form
      noValidate
      onSubmit={(event) => void save(event)}
      className="space-y-4 rounded-md border bg-card p-5"
    >
      <h2 className="text-base font-semibold">
        {source ? `Edit ${source.label}` : "External MariaDB source"}
      </h2>
      <p className="text-sm text-muted-foreground">
        {source
          ? "Choose a database from this connection, or create a name. Leave the password blank to keep the saved secret."
          : "Save the connection first, then choose a database from the server. The password is encrypted."}
      </p>
      <WorkspaceFormGrid>
        <SuggestionField
          label="Connection name"
          value={values.label}
          options={labelOptions}
          invalid={fieldError === "label"}
          onChange={selectSourcePreset}
        />
        <SuggestionField
          label="Host"
          value={values.host}
          options={hostOptions}
          invalid={fieldError === "host"}
          onChange={(value) => update("host", value)}
        />
        <SuggestionField
          label="Port"
          value={String(values.port)}
          options={portOptions}
          invalid={fieldError === "port"}
          onChange={updatePort}
        />
        <SuggestionField
          label="User"
          value={values.user}
          options={userOptions}
          invalid={fieldError === "user"}
          onChange={(value) => update("user", value)}
        />
        <Field
          label="Password"
          value={values.password}
          type="password"
          required={!source}
          invalid={fieldError === "password"}
          onChange={(value) => update("password", value)}
        />
        <WorkspaceFormField label="TLS" required>
          <WorkspaceSelect
            value={values.tlsMode}
            onValueChange={(value) => update("tlsMode", value as SourceInput["tlsMode"])}
            options={[
              { label: "Required (recommended)", value: "required" },
              { label: "Disabled", value: "disabled" }
            ]}
          />
        </WorkspaceFormField>
        <div className="space-y-2">
          {source ? (
            <>
              <WorkspaceFormField label="Database">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <WorkspaceAutocomplete
                      value={values.database}
                      options={databaseOptions}
                      placeholder="Select or create database"
                      createLabel="Create"
                      onChange={(selected) => update("database", selected ?? "")}
                      onCreate={(value) => update("database", value)}
                      {...(fieldError === "database" ? { className: "border-destructive" } : {})}
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    disabled={loadingDatabases}
                    title="Fetch databases"
                    aria-label="Fetch databases"
                    onClick={() => void refreshDatabases()}
                  >
                    <RefreshCw className={loadingDatabases ? "animate-spin" : undefined} />
                  </Button>
                </div>
                {fieldError === "database" ? (
                  <span className="text-xs text-destructive">Database needs a valid value.</span>
                ) : null}
              </WorkspaceFormField>
            </>
          ) : (
            <WorkspaceFormField label="Database">
              <Input disabled placeholder="Save connection to fetch databases" />
            </WorkspaceFormField>
          )}
          {databaseError ? (
            <p role="alert" className="text-xs text-destructive">
              {databaseError}
            </p>
          ) : null}
        </div>
      </WorkspaceFormGrid>
      {error ? (
        <WorkspaceFormBanner title="Connection could not be saved">{error}</WorkspaceFormBanner>
      ) : null}
      <WorkspaceFormFooter
        primaryLabel={saving ? "Connecting…" : "Test and save"}
        primaryLoading={saving}
        onCancel={onCancel}
      />
    </form>
  );
}

function SuggestionField({
  label,
  value,
  options,
  required = true,
  invalid,
  onChange
}: {
  label: string;
  value: string;
  options: AutocompleteOption[];
  required?: boolean;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <WorkspaceFormField label={label} required={required}>
      <WorkspaceAutocomplete
        value={value}
        options={options}
        placeholder={`Select or create ${label.toLowerCase()}`}
        createLabel="Create"
        onChange={(selected) => onChange(selected ?? "")}
        onCreate={onChange}
        {...(invalid ? { className: "border-destructive" } : {})}
      />
      {invalid ? (
        <span className="text-xs text-destructive">{label} needs a valid value.</span>
      ) : null}
    </WorkspaceFormField>
  );
}

function choices(values: string[], current: string): AutocompleteOption[] {
  return [...new Set([...values, current].map((item) => item.trim()).filter(Boolean))].map(
    (value) => ({ value, label: value })
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = true,
  invalid = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  invalid?: boolean;
}) {
  return (
    <WorkspaceFormField label={label} required={required}>
      <Input
        type={type}
        value={value}
        aria-invalid={invalid}
        className={invalid ? "border-destructive" : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {invalid ? (
        <span className="text-xs text-destructive">{label} needs a valid value.</span>
      ) : null}
    </WorkspaceFormField>
  );
}
