import { useEffect, useState } from "react";
import { Save, Sparkles } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { useSpecialSettings } from "./special.hooks";
import { saveSpecialSettings } from "./special.services";
import { specialSettingsSchema } from "./special.schema";
import { SpecialForm } from "./special.form";
import { SpecialList } from "./special.list";
import type { SpecialSettings, SpecialDefinition } from "./special.types";
import "./special.css";
export function SpecialWorkspace({ canManage }: { canManage: boolean }) {
  const source = useSpecialSettings();
  const [draft, setDraft] = useState<SpecialSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (source.settings) setDraft(source.settings);
  }, [source.settings]);
  async function save() {
    const parsed = specialSettingsSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      setDraft(await saveSpecialSettings(parsed.data));
      setNotice("Today Special settings saved.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save Today Special.");
    } finally {
      setBusy(false);
    }
  }
  function definitions(items: SpecialDefinition[]) {
    setDraft((current) =>
      current
        ? {
            ...current,
            definitions: items,
            selectedPrefix: items.some(
              (item) => item.prefix === current.selectedPrefix && item.isEnabled
            )
              ? current.selectedPrefix
              : "",
            enabled:
              current.enabled &&
              items.some((item) => item.prefix === current.selectedPrefix && item.isEnabled)
          }
        : current
    );
    setNotice("");
  }
  if (!draft)
    return (
      <p role={source.error ? "alert" : "status"}>{source.error || "Loading Today Special…"}</p>
    );
  const disabled = busy || !canManage;
  return (
    <section key={draft.revision} data-codexsun-draft-form className="qcafe-special-settings">
      <header>
        <div>
          <h1>
            <Sparkles size={20} /> Today Special
          </h1>
          <p>Define specials here, then set each item’s special prices in Master.</p>
        </div>
        <div>
          <Button variant="outline" disabled={busy} onClick={() => void source.refresh()}>
            Reload
          </Button>
          {canManage && (
            <Button disabled={busy} onClick={() => void save()}>
              <Save size={15} />
              {busy ? "Saving…" : "Save settings"}
            </Button>
          )}
        </div>
      </header>
      {(error || source.error) && (
        <p role="alert" className="qcafe-master-error">
          {error || source.error}
        </p>
      )}
      {notice && (
        <p role="status" className="qcafe-master-notice">
          {notice}
        </p>
      )}
      <div className="qcafe-special-selection">
        <label>
          <input
            type="checkbox"
            role="switch"
            aria-label="Enable Today Special"
            checked={draft.enabled}
            disabled={disabled}
            onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })}
          />{" "}
          Enable Today Special
        </label>
        <label>
          Active POS special
          <select
            aria-label="Active POS special"
            value={draft.selectedPrefix}
            disabled={disabled}
            onChange={(event) =>
              setDraft({
                ...draft,
                selectedPrefix: event.target.value,
                enabled: event.target.value ? draft.enabled : false
              })
            }
          >
            <option value="">No special selected</option>
            {draft.definitions
              .filter((item) => item.isEnabled)
              .map((item, index) => (
                <option key={index} value={item.prefix}>
                  {item.prefix} · {item.name}
                </option>
              ))}
          </select>
        </label>
        <p>
          New order lines use the selected price when “Use in POS” is enabled for that item. Other
          items use their normal price. Saved order lines and bills keep their original rate.
        </p>
      </div>
      <section>
        <h2>Special definitions</h2>
        <p>
          Use a unique prefix such as SS for Sunday Special. Save settings to apply your changes.
        </p>
        {canManage && (
          <SpecialForm
            disabled={disabled}
            onAdd={(item) => {
              if (draft.definitions.some((row) => row.prefix === item.prefix)) {
                setError("This prefix already exists.");
                return;
              }
              definitions([...draft.definitions, item]);
            }}
          />
        )}
        <SpecialList items={draft.definitions} disabled={disabled} onChange={definitions} />
      </section>
    </section>
  );
}
