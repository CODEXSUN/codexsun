import { useEffect, useState } from "react"

import { consumeHandoffToken, loadAdminUsers, loadFiles, loadSettings, loginWithPassword } from "./api"
import { clearSession, readSession, saveSession } from "./session"
import type { AdminUser, AppSection, ExplorerView, MediaItem, Session, SettingsPayload } from "./types"
import { ExplorerPage } from "./pages/explorer-page"
import { SettingsPage } from "./pages/settings-page"
import { UsersPage } from "./pages/users-page"

function handoffTokenFromLocation() {
  if (typeof window === "undefined") {
    return null
  }

  return new URLSearchParams(window.location.search).get("handoff")
}

function clearHandoffTokenFromLocation() {
  if (typeof window === "undefined") {
    return
  }

  const nextUrl = new URL(window.location.href)
  nextUrl.searchParams.delete("handoff")
  window.history.replaceState({}, "", nextUrl.toString())
}

const sections: Array<{
  description: string
  id: AppSection
  label: string
}> = [
  {
    description: "Windows-style explorer layout for folders and files.",
    id: "explorer",
    label: "Explorer",
  },
  {
    description: "Runtime storage and delivery settings.",
    id: "settings",
    label: "Settings",
  },
  {
    description: "Standalone cxmedia operator accounts.",
    id: "users",
    label: "Users",
  },
]

export function App() {
  const [session, setSession] = useState<Session | null>(() => readSession())
  const [items, setItems] = useState<MediaItem[]>([])
  const [settings, setSettings] = useState<SettingsPayload | null>(null)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [selectedAdminEmail, setSelectedAdminEmail] = useState<string | null>(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [currentPrefix, setCurrentPrefix] = useState("")
  const [uploadPrefix, setUploadPrefix] = useState("")
  const [uploadVisibility, setUploadVisibility] = useState<"public" | "private">("public")
  const [search, setSearch] = useState("")
  const [view, setView] = useState<ExplorerView>("tiles")
  const [section, setSection] = useState<AppSection>("explorer")
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isConsumingHandoff, setIsConsumingHandoff] = useState(false)
  const [settingsEditor, setSettingsEditor] = useState({
    allowedMimeTypesText: "",
    defaultUploadVisibility: "public" as "public" | "private",
    signedUrlExpiresInSeconds: "900",
  })
  const [userEditor, setUserEditor] = useState({
    active: true,
    name: "",
    password: "",
    role: "viewer" as "admin" | "editor" | "viewer",
  })
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    password: "",
    role: "viewer" as "admin" | "editor" | "viewer",
  })

  const selectedItem = items.find((item) => item.path === selectedPath) ?? null
  const selectedAdminUser = adminUsers.find((user) => user.email === selectedAdminEmail) ?? null
  const isAdmin = session?.user.role === "admin"
  const canUpload = session?.user.role === "admin" || session?.user.role === "editor"

  useEffect(() => {
    if (!settings) {
      return
    }

    setUploadVisibility(settings.defaultUploadVisibility)
    setSettingsEditor({
      allowedMimeTypesText: settings.allowedMimeTypes.join(", "),
      defaultUploadVisibility: settings.defaultUploadVisibility,
      signedUrlExpiresInSeconds: String(settings.signedUrlExpiresInSeconds),
    })
  }, [settings])

  useEffect(() => {
    if (!selectedAdminUser) {
      return
    }

    setUserEditor({
      active: selectedAdminUser.active,
      name: selectedAdminUser.name,
      password: "",
      role: selectedAdminUser.role,
    })
  }, [selectedAdminUser])

  useEffect(() => {
    if (!isAdmin && section === "users") {
      setSection("explorer")
    }
  }, [isAdmin, section])

  async function refreshUsers() {
    if (!isAdmin) {
      setAdminUsers([])
      setSelectedAdminEmail(null)
      return
    }

    const response = await loadAdminUsers()
    setAdminUsers(response.users)
    setSelectedAdminEmail((current) =>
      current && response.users.some((user) => user.email === current)
        ? current
        : response.users[0]?.email ?? null
    )
  }

  async function refreshWorkspace() {
    if (!session) {
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const [fileResponse, settingsResponse] = await Promise.all([loadFiles(), loadSettings()])
      setItems(fileResponse.items)
      setSettings(settingsResponse)
      const nextSession = {
        ...session,
        user: settingsResponse.user,
      }
      saveSession(nextSession)
      setSession(nextSession)
      setSelectedPath((current) =>
        current && fileResponse.items.some((item) => item.path === current)
          ? current
          : fileResponse.items[0]?.path ?? null
      )
      await refreshUsers()
      setStatus(`Loaded ${fileResponse.items.length} media object(s).`)
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load workspace."
      setError(message)

      if (message.includes("Authorization")) {
        clearSession()
        setSession(null)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refreshWorkspace()
  }, [session?.accessToken])

  useEffect(() => {
    const handoffToken = handoffTokenFromLocation()

    if (!handoffToken || session || isConsumingHandoff) {
      return
    }

    setIsConsumingHandoff(true)
    setError("")
    setStatus("Signing in from cxapp...")

    void consumeHandoffToken(handoffToken)
      .then((nextSession) => {
        saveSession(nextSession)
        setSession(nextSession)
        setStatus("Signed in.")
        clearHandoffTokenFromLocation()
      })
      .catch((handoffError) => {
        setError(handoffError instanceof Error ? handoffError.message : "Trusted sign-in failed.")
        setStatus("")
      })
      .finally(() => {
        setIsConsumingHandoff(false)
      })
  }, [isConsumingHandoff, session])

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setError("")
    setStatus("Signing in...")

    try {
      const nextSession = await loginWithPassword(
        String(formData.get("email") || ""),
        String(formData.get("password") || "")
      )
      saveSession(nextSession)
      setSession(nextSession)
      setStatus("Signed in.")
      event.currentTarget.reset()
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed.")
      setStatus("")
    }
  }

  function renderSection() {
    if (section === "settings") {
      return (
        <SettingsPage
          isAdmin={Boolean(isAdmin)}
          onRefresh={refreshWorkspace}
          setError={setError}
          setSettingsEditor={(updater) => setSettingsEditor((current) => updater(current))}
          setStatus={setStatus}
          settings={settings}
          settingsEditor={settingsEditor}
        />
      )
    }

    if (section === "users") {
      return (
        <UsersPage
          adminUsers={adminUsers}
          isAdmin={Boolean(isAdmin)}
          newUser={newUser}
          onRefreshUsers={refreshUsers}
          selectedAdminEmail={selectedAdminEmail}
          selectedAdminUser={selectedAdminUser}
          setError={setError}
          setNewUser={(updater) => setNewUser((current) => updater(current))}
          setSelectedAdminEmail={setSelectedAdminEmail}
          setStatus={setStatus}
          setUserEditor={(updater) => setUserEditor((current) => updater(current))}
          userEditor={userEditor}
        />
      )
    }

    return (
      <ExplorerPage
        canUpload={Boolean(canUpload)}
        currentPrefix={currentPrefix}
        isLoading={isLoading}
        isUploading={isUploading}
        items={items}
        search={search}
        selectedItem={selectedItem}
        setCurrentPrefix={setCurrentPrefix}
        setSearch={setSearch}
        setSelectedPath={setSelectedPath}
        setStatus={setStatus}
        setError={setError}
        setIsUploading={setIsUploading}
        uploadPrefix={uploadPrefix}
        setUploadPrefix={setUploadPrefix}
        uploadVisibility={uploadVisibility}
        setUploadVisibility={setUploadVisibility}
        view={view}
        setView={setView}
        onRefresh={async () => {
          setIsUploading(true)
          try {
            await refreshWorkspace()
          } finally {
            setIsUploading(false)
          }
        }}
      />
    )
  }

  if (!session) {
    return (
      <div className="login-shell">
        <div className="login-visual">
          <div className="login-visual-inner">
            <p className="eyebrow">cxmedia</p>
            <h1>Explorer-style media browser and delivery service.</h1>
            <p>
              Standalone media storage with folders, transforms, signed delivery, and operator controls.
            </p>
          </div>
        </div>
        <main className="login-panel">
          <div className="login-card">
            <p className="eyebrow">Sign In</p>
            <h2>Open cxmedia</h2>
            <form className="login-form" onSubmit={handleLogin}>
              <label className="field-block">
                <span>Email</span>
                <input defaultValue="admin@example.com" name="email" required type="email" />
              </label>
              <label className="field-block">
                <span>Password</span>
                <input defaultValue="change-me-now" name="password" required type="password" />
              </label>
              <button className="primary-button" type="submit">Sign In</button>
            </form>
            {isConsumingHandoff ? <p className="status-text">Completing trusted sign-in...</p> : null}
            {error ? <p className="error-text">{error}</p> : null}
            {status ? <p className="status-text">{status}</p> : null}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="desktop-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <p className="eyebrow">cxmedia</p>
          <h2>Workspace</h2>
          <p className="sidebar-copy">Simple browser on the left, focused workspace in the center, inspector on the right.</p>
        </div>

        <div className="operator-card">
          <strong>{session.user.name}</strong>
          <span>{session.user.email}</span>
          <span className="tag-pill">{session.user.role}</span>
        </div>

        <nav className="side-menu">
          {sections
            .filter((item) => item.id !== "users" || isAdmin)
            .map((item) => (
              <button
                key={item.id}
                className="menu-button"
                data-active={section === item.id}
                onClick={() => setSection(item.id)}
                type="button"
              >
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </button>
            ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="ghost-button"
            onClick={() => {
              clearSession()
              setSession(null)
            }}
            type="button"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="app-main">
        {(status || error) ? (
          <div className="message-strip" data-tone={error ? "error" : "info"}>
            {error || status}
          </div>
        ) : null}
        {renderSection()}
      </main>
    </div>
  )
}
