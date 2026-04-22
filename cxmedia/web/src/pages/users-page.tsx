import { createAdminUser, updateAdminUser } from "../api"
import type { AdminUser } from "../types"
import { formatDate } from "../utils"

export function UsersPage({
  adminUsers,
  isAdmin,
  newUser,
  onRefreshUsers,
  selectedAdminEmail,
  selectedAdminUser,
  setError,
  setNewUser,
  setSelectedAdminEmail,
  setStatus,
  setUserEditor,
  userEditor,
}: {
  adminUsers: AdminUser[]
  isAdmin: boolean
  newUser: {
    email: string
    name: string
    password: string
    role: "admin" | "editor" | "viewer"
  }
  onRefreshUsers: () => Promise<void>
  selectedAdminEmail: string | null
  selectedAdminUser: AdminUser | null
  setError: (value: string) => void
  setNewUser: (
    updater: (current: {
      email: string
      name: string
      password: string
      role: "admin" | "editor" | "viewer"
    }) => {
      email: string
      name: string
      password: string
      role: "admin" | "editor" | "viewer"
    }
  ) => void
  setSelectedAdminEmail: (value: string | null) => void
  setStatus: (value: string) => void
  setUserEditor: (
    updater: (current: {
      active: boolean
      name: string
      password: string
      role: "admin" | "editor" | "viewer"
    }) => {
      active: boolean
      name: string
      password: string
      role: "admin" | "editor" | "viewer"
    }
  ) => void
  userEditor: {
    active: boolean
    name: string
    password: string
    role: "admin" | "editor" | "viewer"
  }
}) {
  async function handleCreateUser() {
    setError("")

    try {
      await createAdminUser(newUser)
      setNewUser(() => ({
        email: "",
        name: "",
        password: "",
        role: "viewer",
      }))
      setStatus("User created.")
      await onRefreshUsers()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create user.")
    }
  }

  async function handleSaveUser() {
    if (!selectedAdminUser) {
      return
    }

    setError("")

    try {
      await updateAdminUser({
        active: userEditor.active,
        email: selectedAdminUser.email,
        name: userEditor.name,
        password: userEditor.password || undefined,
        role: userEditor.role,
      })
      setUserEditor((current) => ({
        ...current,
        password: "",
      }))
      setStatus(`Updated ${selectedAdminUser.email}.`)
      await onRefreshUsers()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update user.")
    }
  }

  if (!isAdmin) {
    return (
      <div className="page-shell">
        <header className="page-header">
          <div>
            <p className="eyebrow">Administration</p>
            <h1>Users</h1>
          </div>
        </header>
        <div className="placeholder-panel large-placeholder">
          Only admin accounts can manage standalone cxmedia operators.
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Users</h1>
          <p className="page-copy">Manage standalone cxmedia operators from a dedicated page instead of the file browser inspector.</p>
        </div>
      </header>

      <div className="users-grid">
        <section className="settings-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Operators</p>
              <h2>Existing Users</h2>
            </div>
          </div>
          <div className="user-list-grid">
            {adminUsers.map((user) => (
              <button
                key={user.email}
                className="user-row"
                data-selected={selectedAdminEmail === user.email}
                onClick={() => setSelectedAdminEmail(user.email)}
                type="button"
              >
                <strong>{user.name}</strong>
                <span>{user.email}</span>
                <span>{user.role} · {user.active ? "active" : "disabled"}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Editor</p>
              <h2>{selectedAdminUser ? selectedAdminUser.name : "Select a user"}</h2>
            </div>
          </div>
          {selectedAdminUser ? (
            <div className="stack-form">
              <label className="field-block">
                <span>Name</span>
                <input
                  value={userEditor.name}
                  onChange={(event) =>
                    setUserEditor((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="field-block">
                <span>Role</span>
                <select
                  value={userEditor.role}
                  onChange={(event) =>
                    setUserEditor((current) => ({
                      ...current,
                      role: event.target.value as "admin" | "editor" | "viewer",
                    }))
                  }
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </label>
              <label className="field-block">
                <span>Status</span>
                <select
                  value={userEditor.active ? "active" : "disabled"}
                  onChange={(event) =>
                    setUserEditor((current) => ({
                      ...current,
                      active: event.target.value === "active",
                    }))
                  }
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </label>
              <label className="field-block">
                <span>Replace password</span>
                <input
                  placeholder="Leave blank to keep current password"
                  type="password"
                  value={userEditor.password}
                  onChange={(event) =>
                    setUserEditor((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                />
              </label>
              <dl className="property-grid">
                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(selectedAdminUser.createdAt)}</dd>
                </div>
                <div>
                  <dt>Last Login</dt>
                  <dd>{formatDate(selectedAdminUser.lastLoginAt)}</dd>
                </div>
              </dl>
              <button className="primary-button" onClick={() => void handleSaveUser()} type="button">
                Save User
              </button>
            </div>
          ) : (
            <div className="placeholder-panel">Pick a user from the left to edit role, status, or password.</div>
          )}
        </section>

        <section className="settings-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Provision</p>
              <h2>New User</h2>
            </div>
          </div>
          <div className="stack-form">
            <label className="field-block">
              <span>Email</span>
              <input
                type="email"
                value={newUser.email}
                onChange={(event) =>
                  setNewUser((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </label>
            <label className="field-block">
              <span>Name</span>
              <input
                value={newUser.name}
                onChange={(event) =>
                  setNewUser((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>
            <label className="field-block">
              <span>Role</span>
              <select
                value={newUser.role}
                onChange={(event) =>
                  setNewUser((current) => ({
                    ...current,
                    role: event.target.value as "admin" | "editor" | "viewer",
                  }))
                }
              >
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </label>
            <label className="field-block">
              <span>Password</span>
              <input
                type="password"
                value={newUser.password}
                onChange={(event) =>
                  setNewUser((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
              />
            </label>
            <button className="primary-button" onClick={() => void handleCreateUser()} type="button">
              Create User
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
