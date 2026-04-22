const loginPanel = document.getElementById("login-panel");
const appPanel = document.getElementById("app-panel");
const loginForm = document.getElementById("login-form");
const uploadForm = document.getElementById("upload-form");
const filterForm = document.getElementById("filter-form");
const prefixFilter = document.getElementById("prefix-filter");
const fileTableBody = document.getElementById("file-table-body");
const statusNode = document.getElementById("status");
const logoutButton = document.getElementById("logout-button");

const storageKey = "cxmedia.session";

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "null");
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(storageKey, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(storageKey);
}

function setStatus(message, tone = "info") {
  statusNode.textContent = message || "";
  statusNode.className = tone === "error" ? "status error" : "status";
}

async function request(path, init = {}) {
  const session = readSession();
  const headers = new Headers(init.headers || {});

  if (session?.accessToken) {
    headers.set("authorization", `Bearer ${session.accessToken}`);
  }

  const response = await fetch(path, {
    ...init,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || payload?.message || `Request failed with status ${response.status}.`);
  }

  return payload;
}

function renderFiles(items) {
  fileTableBody.innerHTML = "";

  if (!items.length) {
    fileTableBody.innerHTML = `<tr><td colspan="5">No files found for this prefix.</td></tr>`;
    return;
  }

  for (const item of items) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div><strong>${item.path}</strong></div>
        <div>${item.byteSize ? `${Math.round(item.byteSize / 1024)} KB` : "Unknown size"}</div>
      </td>
      <td>${item.contentType}</td>
      <td><span class="badge">${item.visibility}</span></td>
      <td>
        <div class="link-list">
          <a href="${item.publicUrl}" target="_blank" rel="noreferrer">Public URL</a>
          <a href="${item.privateUrl}" target="_blank" rel="noreferrer">Signed URL</a>
          <a href="${item.transformUrls.resize}" target="_blank" rel="noreferrer">Resize 300x300</a>
        </div>
      </td>
      <td>
        <div class="link-list">
          <button class="mini-button" data-copy="${item.publicUrl}">Copy public URL</button>
          <button class="mini-button" data-sign="${item.path}">New signed URL</button>
          <button class="mini-button" data-delete="${item.path}">Delete</button>
        </div>
      </td>
    `;
    fileTableBody.appendChild(row);
  }
}

async function loadFiles() {
  const prefix = prefixFilter.value.trim();
  setStatus("Loading files...");

  try {
    const response = await request(`/api/files${prefix ? `?prefix=${encodeURIComponent(prefix)}` : ""}`);
    renderFiles(response.items || []);
    setStatus(`Loaded ${response.items.length} file(s).`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Failed to load files.", "error");
  }
}

async function boot() {
  const session = readSession();

  if (!session?.accessToken) {
    loginPanel.classList.remove("hidden");
    appPanel.classList.add("hidden");
    return;
  }

  try {
    await request("/api/auth/me");
    loginPanel.classList.add("hidden");
    appPanel.classList.remove("hidden");
    await loadFiles();
  } catch {
    clearSession();
    loginPanel.classList.remove("hidden");
    appPanel.classList.add("hidden");
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  setStatus("Signing in...");

  try {
    const response = await request("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || ""),
      }),
    });

    saveSession(response);
    loginForm.reset();
    await boot();
    setStatus("Signed in.");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Login failed.", "error");
  }
});

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(uploadForm);
  setStatus("Uploading image...");

  try {
    const response = await request("/api/upload", {
      method: "POST",
      body: formData,
    });

    setStatus(`Uploaded ${response.item.path}.`);
    await loadFiles();
    uploadForm.reset();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Upload failed.", "error");
  }
});

filterForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await loadFiles();
});

logoutButton.addEventListener("click", () => {
  clearSession();
  setStatus("");
  boot();
});

fileTableBody.addEventListener("click", async (event) => {
  const target = event.target;

  if (!(target instanceof HTMLButtonElement)) {
    return;
  }

  if (target.dataset.copy) {
    await navigator.clipboard.writeText(target.dataset.copy);
    setStatus("Copied URL.");
    return;
  }

  if (target.dataset.sign) {
    try {
      const response = await request("/api/signed-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "download",
          path: target.dataset.sign,
        }),
      });
      await navigator.clipboard.writeText(response.url);
      setStatus("Copied fresh signed URL.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to create signed URL.", "error");
    }
    return;
  }

  if (target.dataset.delete) {
    try {
      await request(`/api/file?path=${encodeURIComponent(target.dataset.delete)}`, {
        method: "DELETE",
      });
      setStatus(`Deleted ${target.dataset.delete}.`);
      await loadFiles();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Delete failed.", "error");
    }
  }
});

boot();
