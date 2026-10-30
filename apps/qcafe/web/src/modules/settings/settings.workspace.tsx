import { WaiterWorkspace } from "../waiter";
import { useEffect, useState, type ReactNode } from "react";
import { Save } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { SpecialWorkspace } from "../special";
import { MenuDemo } from "../menu";
import { useCafeSettings } from "./settings.hooks";
import { SettingsList, type SettingsSection } from "./settings.list";
import { SettingsForm } from "./settings.form";
import { saveCafeSettings } from "./settings.services";
import { cafeSettingsSchema } from "./settings.schema";
import type { CafeSettings } from "./settings.types";
import "./settings.css";
export function SettingsWorkspace({
  canManage,
  canManageWaiters,
  tenantId,
  tenantName,
  email,
  appearanceSettings
}: {
  appearanceSettings?: ReactNode;
  canManage: boolean;
  canManageWaiters: boolean;
  tenantId: string;
  tenantName: string;
  email: string;
}) {
  const source = useCafeSettings();
  const [draft, setDraft] = useState<CafeSettings>(source.settings);
  const [section, setSection] = useState<SettingsSection>("general");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => setDraft(source.settings), [source.settings]);
  async function save() {
    const parsed = cafeSettingsSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    setError("");
    try {
      setDraft(await saveCafeSettings(parsed.data));
      setNotice("Settings saved for this restaurant.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save settings.");
    } finally {
      setBusy(false);
    }
  }
  if (source.loading) return <p role="status">Loading restaurant settings…</p>;
  const editable = ["general", "features", "pos", "printer", "media"].includes(section);
  return (
    <section className="qcafe-settings" key={draft.revision} data-codexsun-draft-form>
      <header>
        <div>
          <h1>QCafe Settings</h1>
          <p>Configure {tenantName} for your restaurant and counter.</p>
        </div>
        <div>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void source.refresh()}
          >
            Reload
          </Button>
          {canManage && editable && (
            <Button type="button" disabled={busy} onClick={() => void save()}>
              <Save size={15} />
              {busy ? "Saving…" : "Save settings"}
            </Button>
          )}
        </div>
      </header>
      <div className="qcafe-settings-body">
        <SettingsList selected={section} onSelect={setSection} />
        <section className="qcafe-settings-content">
          {(error || source.error) && (
            <p className="qcafe-master-error" role="alert">
              {error || source.error}
            </p>
          )}
          {notice && (
            <p role="status" className="qcafe-master-notice">
              {notice}
            </p>
          )}
          <SettingsForm
            section={section}
            value={draft}
            disabled={busy || !canManage}
            onChange={(value) => {
              setDraft(value);
              setNotice("");
            }}
          />
          {section === "waiters" && <WaiterWorkspace canManage={canManageWaiters} />}
          {section === "pos" && <MenuDemo canManage={canManage} />}
          {section === "specials" && <SpecialWorkspace canManage={canManage} />}
          {section === "license" && (
            <>
              <h2>License & Platform Access</h2>
              <p>
                QCafe web uses your signed-in Platform account and the tenant’s enabled app access.
              </p>
              <dl>
                <dt>Tenant</dt>
                <dd>
                  {tenantName} · {tenantId}
                </dd>
                <dt>Signed in as</dt>
                <dd>{email}</dd>
                <dt>QCafe access</dt>
                <dd>Enabled for this tenant session</dd>
              </dl>
              <p>
                Cashier PINs, machine activation, reconnect license and offline license files apply
                to desktop. Web access is managed in Platform.
              </p>
              <a href="/app/application/overview">Open Platform</a>
            </>
          )}
          {section === "appearance" && (
            <>
              <h2>Appearance</h2>
              <p>
                Use Platform’s shared appearance controls. This preference is saved on this browser.
              </p>
              {appearanceSettings ?? (
                <a href="/app/application/settings">Open Platform appearance settings</a>
              )}
            </>
          )}
          {section === "system" && (
            <>
              <h2>System, Database & Runtime</h2>
              <dl>
                <dt>Application host</dt>
                <dd>Platform web</dd>
                <dt>Database mode</dt>
                <dd>Tenant MariaDB</dd>
                <dt>Tenant identity</dt>
                <dd>{tenantId}</dd>
                <dt>Menu image folder</dt>
                <dd>storage/{tenantId}/apps/qcafe/master/</dd>
                <dt>Data synchronization</dt>
                <dd>Web requests save directly to this tenant’s database.</dd>
              </dl>
              <p>
                Browser printing uses the current device. Windows updater, local SQLite backup,
                application exit and offline sync controls belong to desktop. Reload this page to
                load the web version deployed by your administrator.
              </p>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
