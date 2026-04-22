import { updateRuntimeSettings } from "../api"
import type { SettingsPayload } from "../types"

export function SettingsPage({
  isAdmin,
  onRefresh,
  setError,
  setSettingsEditor,
  setStatus,
  settings,
  settingsEditor,
}: {
  isAdmin: boolean
  onRefresh: () => Promise<void>
  setError: (value: string) => void
  setSettingsEditor: (
    updater: (current: {
      allowedMimeTypesText: string
      defaultUploadVisibility: "public" | "private"
      signedUrlExpiresInSeconds: string
    }) => {
      allowedMimeTypesText: string
      defaultUploadVisibility: "public" | "private"
      signedUrlExpiresInSeconds: string
    }
  ) => void
  setStatus: (value: string) => void
  settings: SettingsPayload | null
  settingsEditor: {
    allowedMimeTypesText: string
    defaultUploadVisibility: "public" | "private"
    signedUrlExpiresInSeconds: string
  }
}) {
  async function handleSave() {
    setError("")

    try {
      await updateRuntimeSettings({
        allowedMimeTypes: settingsEditor.allowedMimeTypesText
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        defaultUploadVisibility: settingsEditor.defaultUploadVisibility,
        signedUrlExpiresInSeconds: Number(settingsEditor.signedUrlExpiresInSeconds),
      })
      setStatus("Runtime settings updated.")
      await onRefresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update settings.")
    }
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Settings</h1>
          <p className="page-copy">Move operational configuration out of the file explorer and keep this page for runtime behavior only.</p>
        </div>
      </header>

      {settings ? (
        <div className="settings-grid">
          <section className="settings-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Environment</p>
                <h2>{settings.appName}</h2>
              </div>
            </div>
            <dl className="property-grid">
              <div>
                <dt>Bucket</dt>
                <dd>{settings.storage.bucket}</dd>
              </div>
              <div>
                <dt>Region</dt>
                <dd>{settings.storage.region}</dd>
              </div>
              <div>
                <dt>Endpoint</dt>
                <dd>{settings.storage.endpoint}</dd>
              </div>
              <div>
                <dt>Thumbor</dt>
                <dd>{settings.thumborEnabled ? "Enabled" : "Disabled"}</dd>
              </div>
            </dl>
          </section>

          <section className="settings-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Runtime</p>
                <h2>Upload and Delivery</h2>
              </div>
            </div>
            {isAdmin ? (
              <div className="stack-form">
                <label className="field-block">
                  <span>Allowed mime types</span>
                  <input
                    value={settingsEditor.allowedMimeTypesText}
                    onChange={(event) =>
                      setSettingsEditor((current) => ({
                        ...current,
                        allowedMimeTypesText: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field-block">
                  <span>Default upload visibility</span>
                  <select
                    value={settingsEditor.defaultUploadVisibility}
                    onChange={(event) =>
                      setSettingsEditor((current) => ({
                        ...current,
                        defaultUploadVisibility: event.target.value as "public" | "private",
                      }))
                    }
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </label>
                <label className="field-block">
                  <span>Signed URL expiry seconds</span>
                  <input
                    inputMode="numeric"
                    value={settingsEditor.signedUrlExpiresInSeconds}
                    onChange={(event) =>
                      setSettingsEditor((current) => ({
                        ...current,
                        signedUrlExpiresInSeconds: event.target.value,
                      }))
                    }
                  />
                </label>
                <button className="primary-button" onClick={() => void handleSave()} type="button">
                  Save Settings
                </button>
              </div>
            ) : (
              <div className="placeholder-panel">
                Viewer and editor accounts can inspect environment details here, but only admins can change runtime settings.
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="placeholder-panel large-placeholder">Settings are not loaded yet.</div>
      )}
    </div>
  )
}
