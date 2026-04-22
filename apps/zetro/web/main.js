import { ZetroLspClient } from "./lsp-client.js";

const state = {
  currentBase: ".",
  activePath: "",
  editor: null,
  lsp: null,
  openFiles: new Map(),
  cursor: { lineNumber: 1, column: 1 },
  paletteMode: "files",
  paletteSelection: 0,
  paletteItems: [],
  paletteVisible: false,
  paletteRequestId: 0,
  explorerEntries: [],
  diagnosticsByUri: new Map(),
};

const COMMANDS = [
  { id: "save", label: "Save Active File", run: () => saveCurrent() },
  { id: "refresh", label: "Refresh Explorer", run: () => refresh() },
  { id: "goto", label: "Go To Line", run: () => promptGoToLine() },
  { id: "format", label: "Format Document", run: () => formatCurrent() },
  { id: "close", label: "Close Active Tab", run: () => closeActiveTab() },
  { id: "workspace", label: "Switch To Workspace Root", run: async () => setBaseAndRefresh("workspace") },
  { id: "zetro", label: "Switch To Zetro App Root", run: async () => setBaseAndRefresh(".") },
  { id: "chat", label: "Focus Chat Input", run: () => byId("msg").focus() },
];

function byId(id) {
  return document.getElementById(id);
}

function setStatus(message, tone = "neutral") {
  const status = byId("status");
  status.textContent = message;
  status.dataset.tone = tone;
}

function setLspStatus(status) {
  const badge = byId("lsp-status");
  badge.textContent = status.toUpperCase();
  badge.dataset.state = status;
}

function joinBase(base, name) {
  if (!base || base === ".") {
    return name;
  }
  return `${base.replace(/\/$/, "")}/${name}`;
}

function getParentBase(base) {
  if (base === "." || base === "workspace") {
    return null;
  }

  const normalized = base.replace(/\/$/, "");
  const parts = normalized.split("/");
  parts.pop();
  return parts.length ? parts.join("/") : ".";
}

function extToLang(path) {
  const ext = (path || "").split(".").pop()?.toLowerCase() || "";
  const map = {
    js: "javascript",
    ts: "typescript",
    jsx: "javascript",
    tsx: "typescript",
    json: "json",
    md: "markdown",
    html: "html",
    css: "css",
    py: "python",
    java: "java",
    rs: "rust",
    go: "go",
    sh: "shell",
    yml: "yaml",
    yaml: "yaml",
    xml: "xml",
  };
  return map[ext] || "plaintext";
}

function getFileName(path) {
  return (path || "").split("/").pop() || path;
}

async function listFiles(base = ".") {
  const response = await fetch(`/api/files?base=${encodeURIComponent(base)}`);
  if (!response.ok) {
    throw new Error(`Failed to list files for ${base}`);
  }
  return response.json();
}

async function searchFiles(query, base = "workspace") {
  const response = await fetch(
    `/api/search-files?base=${encodeURIComponent(base)}&limit=80&q=${encodeURIComponent(query)}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to search files for ${query}`);
  }
  return response.json();
}

async function loadFile(path) {
  const response = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
}

async function saveFile(path, content) {
  const response = await fetch("/api/file", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, content }),
  });
  return response.json();
}

async function sendChat(message) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  return response.json();
}

function setCurrentBase(base) {
  state.currentBase = base;
  byId("current-base").textContent = base;
}

function setCurrentFile(path) {
  byId("current-file").textContent = path || "No file";
}

function appendMsg(role, text) {
  const history = byId("history");
  const entry = document.createElement("div");
  entry.className = `msg ${role}`;
  entry.textContent = `${role}: ${text}`;
  history.appendChild(entry);
  history.scrollTop = history.scrollHeight;
}

function getActiveEntry() {
  return state.openFiles.get(state.activePath) || null;
}

function updateStatusBar() {
  const active = getActiveEntry();
  byId("file-language").textContent = active?.language || "plaintext";
  byId("cursor-position").textContent = `Ln ${state.cursor.lineNumber}, Col ${state.cursor.column}`;

  const diagnostics = active
    ? state.diagnosticsByUri.get(active.uri.toString()) || []
    : [];
  const errorCount = diagnostics.filter((item) => item.severity === monaco.MarkerSeverity.Error).length;
  const warningCount = diagnostics.filter((item) => item.severity === monaco.MarkerSeverity.Warning).length;
  byId("problem-count").textContent = `${errorCount} errors, ${warningCount} warnings`;
}

function renderProblems() {
  const root = byId("problems");
  root.innerHTML = "";
  const active = getActiveEntry();
  const diagnostics = active
    ? state.diagnosticsByUri.get(active.uri.toString()) || []
    : [];

  if (!diagnostics.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No active diagnostics.";
    root.appendChild(empty);
    return;
  }

  for (const diagnostic of diagnostics.slice(0, 20)) {
    const row = document.createElement("button");
    row.className = `problem problem-${diagnostic.severityLabel}`;
    row.innerHTML = `
      <strong>${diagnostic.message}</strong>
      <span>Ln ${diagnostic.startLineNumber}, Col ${diagnostic.startColumn}</span>
    `;
    row.onclick = () => {
      state.editor.revealPositionInCenter({
        lineNumber: diagnostic.startLineNumber,
        column: diagnostic.startColumn,
      });
      state.editor.setPosition({
        lineNumber: diagnostic.startLineNumber,
        column: diagnostic.startColumn,
      });
      state.editor.focus();
    };
    root.appendChild(row);
  }
}

function renderOpenEditors() {
  const root = byId("open-editors");
  root.innerHTML = "";

  if (!state.openFiles.size) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No open editors.";
    root.appendChild(empty);
    return;
  }

  for (const entry of state.openFiles.values()) {
    const item = document.createElement("button");
    item.className = `open-item${entry.path === state.activePath ? " active" : ""}`;
    item.innerHTML = `
      <span>${getFileName(entry.path)}${entry.dirty ? " *" : ""}</span>
      <small>${entry.path}</small>
    `;
    item.onclick = () => activateFile(entry.path);
    root.appendChild(item);
  }
}

function renderTabs() {
  const root = byId("tabs");
  root.innerHTML = "";

  if (!state.openFiles.size) {
    const empty = document.createElement("div");
    empty.className = "tab-empty";
    empty.textContent = "Open a file from the explorer or press Ctrl+P.";
    root.appendChild(empty);
    return;
  }

  for (const entry of state.openFiles.values()) {
    const tab = document.createElement("div");
    tab.className = `tab${entry.path === state.activePath ? " active" : ""}`;

    const switchButton = document.createElement("button");
    switchButton.className = "tab-switch";
    switchButton.textContent = `${getFileName(entry.path)}${entry.dirty ? " *" : ""}`;
    switchButton.onclick = () => activateFile(entry.path);

    const closeButton = document.createElement("button");
    closeButton.className = "tab-close";
    closeButton.textContent = "x";
    closeButton.onclick = async (event) => {
      event.stopPropagation();
      await closeFile(entry.path);
    };

    tab.append(switchButton, closeButton);
    root.appendChild(tab);
  }
}

function renderFiles(list) {
  const filesRoot = byId("files");
  filesRoot.innerHTML = "";
  state.explorerEntries = list.files.filter((entry) => !entry.isDirectory);

  const parentBase = getParentBase(state.currentBase);
  if (parentBase != null) {
    const up = document.createElement("button");
    up.className = "file file-nav";
    up.textContent = "..";
    up.onclick = async () => setBaseAndRefresh(parentBase);
    filesRoot.appendChild(up);
  }

  const directories = list.files.filter((entry) => entry.isDirectory);
  const plainFiles = list.files.filter((entry) => !entry.isDirectory);

  for (const entry of [...directories, ...plainFiles]) {
    const item = document.createElement("button");
    item.className = "file";
    item.textContent = entry.isDirectory ? `${entry.name}/` : entry.name;
    item.onclick = async () => {
      if (entry.isDirectory) {
        await setBaseAndRefresh(entry.path);
        return;
      }
      await openFilePath(entry.path);
    };
    filesRoot.appendChild(item);
  }
}

async function refresh() {
  try {
    setStatus(`Loading ${state.currentBase}...`);
    const data = await listFiles(state.currentBase);
    renderFiles(data);
    setStatus(`Ready in ${state.currentBase}`, "success");
  } catch (error) {
    console.error(error);
    setStatus(`Failed to load ${state.currentBase}`, "error");
  }
}

async function setBaseAndRefresh(base) {
  setCurrentBase(base);
  await refresh();
}

function ensureEditorReady() {
  if (!state.editor) {
    throw new Error("Editor is not initialized");
  }
}

function trackModel(entry) {
  entry.changeDisposable = entry.model.onDidChangeContent(() => {
    entry.version += 1;
    entry.dirty = entry.model.getValue() !== entry.lastSavedValue;
    renderTabs();
    renderOpenEditors();
    updateStatusBar();
    queueLspChange(entry);
  });
}

function queueLspChange(entry) {
  if (!state.lsp) {
    return;
  }

  clearTimeout(entry.changeTimer);
  entry.changeTimer = setTimeout(() => {
    state.lsp.changeDocument({
      uri: entry.uri.toString(),
      version: entry.version,
      text: entry.model.getValue(),
    });
  }, 120);
}

function diagnosticSeverityToMarker(severity) {
  switch (severity) {
    case 1:
      return monaco.MarkerSeverity.Error;
    case 2:
      return monaco.MarkerSeverity.Warning;
    case 3:
      return monaco.MarkerSeverity.Info;
    default:
      return monaco.MarkerSeverity.Hint;
  }
}

function applyDiagnostics(params) {
  const entry = [...state.openFiles.values()].find((item) => item.uri.toString() === params.uri);
  const markers = (params.diagnostics || []).map((diagnostic) => ({
    startLineNumber: diagnostic.range.start.line + 1,
    startColumn: diagnostic.range.start.character + 1,
    endLineNumber: diagnostic.range.end.line + 1,
    endColumn: diagnostic.range.end.character + 1,
    message: diagnostic.message,
    severity: diagnosticSeverityToMarker(diagnostic.severity),
  }));

  state.diagnosticsByUri.set(
    params.uri,
    markers.map((marker) => ({
      ...marker,
      severityLabel: marker.severity === monaco.MarkerSeverity.Error ? "error" : "warning",
    })),
  );

  if (entry) {
    monaco.editor.setModelMarkers(entry.model, "zetro-lsp", markers);
  }

  renderProblems();
  updateStatusBar();
}

function activateFile(path) {
  ensureEditorReady();
  const next = state.openFiles.get(path);
  if (!next) {
    return;
  }

  const current = getActiveEntry();
  if (current) {
    current.viewState = state.editor.saveViewState();
  }

  state.activePath = path;
  state.editor.setModel(next.model);
  if (next.viewState) {
    state.editor.restoreViewState(next.viewState);
  }
  state.editor.focus();
  setCurrentFile(next.path);
  renderTabs();
  renderOpenEditors();
  renderProblems();
  updateStatusBar();
}

async function openFilePath(path) {
  const existing = state.openFiles.get(path);
  if (existing) {
    activateFile(path);
    return existing;
  }

  setStatus(`Opening ${path}...`);
  const data = await loadFile(path);
  const language = extToLang(path);
  const uri = monaco.Uri.file(data.fullPath);
  const model = monaco.editor.getModel(uri) || monaco.editor.createModel(data.content || "", language, uri);
  if (model.getValue() !== (data.content || "")) {
    model.setValue(data.content || "");
  }
  monaco.editor.setModelLanguage(model, language);

  const entry = {
    path,
    fullPath: data.fullPath,
    uri,
    language,
    model,
    version: 1,
    dirty: false,
    lastSavedValue: data.content || "",
    viewState: null,
    changeTimer: null,
    changeDisposable: null,
  };

  trackModel(entry);
  state.openFiles.set(path, entry);
  state.lsp?.openDocument({
    uri: uri.toString(),
    languageId: language,
    version: entry.version,
    text: entry.model.getValue(),
  });

  activateFile(path);
  setStatus(`Opened ${path}`, "success");
  return entry;
}

async function saveCurrent() {
  const active = getActiveEntry();
  if (!active) {
    setStatus("No file selected", "warning");
    return null;
  }

  setStatus(`Saving ${active.path}...`);
  const result = await saveFile(active.path, active.model.getValue());
  if (!result.written) {
    setStatus(`Save failed for ${active.path}`, "error");
    return result;
  }

  active.lastSavedValue = active.model.getValue();
  active.dirty = false;
  renderTabs();
  renderOpenEditors();
  state.lsp?.saveDocument(active.uri.toString());
  setStatus(`Saved ${active.path}`, "success");
  updateStatusBar();
  return result;
}

async function closeFile(path) {
  const entry = state.openFiles.get(path);
  if (!entry) {
    return;
  }

  if (entry.dirty) {
    const shouldClose = confirm(`Close ${path} without saving?`);
    if (!shouldClose) {
      return;
    }
  }

  clearTimeout(entry.changeTimer);
  entry.changeDisposable?.dispose();
  state.lsp?.closeDocument(entry.uri.toString());
  monaco.editor.setModelMarkers(entry.model, "zetro-lsp", []);
  state.openFiles.delete(path);
  state.diagnosticsByUri.delete(entry.uri.toString());

  if (state.activePath === path) {
    const next = state.openFiles.keys().next();
    state.activePath = next.done ? "" : next.value;
    if (state.activePath) {
      activateFile(state.activePath);
    } else {
      state.editor.setModel(null);
      setCurrentFile("");
    }
  }

  renderTabs();
  renderOpenEditors();
  renderProblems();
  updateStatusBar();
}

async function closeActiveTab() {
  if (!state.activePath) {
    return;
  }
  await closeFile(state.activePath);
}

function configureMonaco() {
  try {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      jsx: monaco.languages.typescript.JsxEmit.React,
    });
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      checkJs: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
    });
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
  } catch (error) {
    console.warn("Monaco TS/JS defaults not available", error);
  }
}

function loadMonaco(callback) {
  if (window.monaco) {
    callback();
    return;
  }

  const script = document.createElement("script");
  script.src = "/vendor/monaco/vs/loader.js";
  script.onload = () => {
    require.config({ paths: { vs: "/vendor/monaco/vs" } });
    require(["vs/editor/editor.main"], callback);
  };
  script.onerror = () => setStatus("Failed to load Monaco editor assets", "error");
  document.head.appendChild(script);
}

function showPalette(mode) {
  state.paletteMode = mode;
  state.paletteVisible = true;
  state.paletteSelection = 0;
  state.paletteItems = [];
  const palette = byId("palette");
  palette.hidden = false;
  palette.setAttribute("aria-hidden", "false");
  byId("palette-title").textContent = mode === "commands" ? "Command Palette" : "Quick Open";
  byId("palette-input").value = "";
  byId("palette-input").placeholder =
    mode === "commands" ? "Type a command" : "Type a file name";
  renderPaletteItems(mode === "commands" ? "Loading commands..." : "Open files and current folder files appear instantly. Type to search the workspace.");
  byId("palette-input").focus();
}

function hidePalette() {
  state.paletteVisible = false;
  state.paletteItems = [];
  state.paletteRequestId += 1;
  const palette = byId("palette");
  palette.hidden = true;
  palette.setAttribute("aria-hidden", "true");
}

function renderPaletteItems(emptyMessage) {
  const root = byId("palette-results");
  root.innerHTML = "";

  if (!state.paletteItems.length) {
    const empty = document.createElement("div");
    empty.className = "palette-empty";
    empty.textContent =
      emptyMessage ||
      (state.paletteMode === "commands" ? "No matching commands." : "No matching files.");
    root.appendChild(empty);
    return;
  }

  state.paletteItems.forEach((item, index) => {
    const row = document.createElement("button");
    row.className = `palette-item${index === state.paletteSelection ? " active" : ""}`;
    row.innerHTML = `<strong>${item.label}</strong><span>${item.description || ""}</span>`;
    row.onclick = () => {
      state.paletteSelection = index;
      runPaletteSelection();
    };
    root.appendChild(row);
  });
}

function buildQuickOpenItems(query) {
  const normalized = query.toLowerCase();
  const seen = new Set();
  const items = [];

  for (const entry of state.openFiles.values()) {
    if (normalized && !entry.path.toLowerCase().includes(normalized)) {
      continue;
    }
    if (seen.has(entry.path)) {
      continue;
    }
    seen.add(entry.path);
    items.push({
      label: getFileName(entry.path),
      description: `${entry.path}${entry.dirty ? " • unsaved" : " • open"}`,
      run: async () => openFilePath(entry.path),
    });
  }

  for (const entry of state.explorerEntries) {
    if (normalized && !entry.path.toLowerCase().includes(normalized)) {
      continue;
    }
    if (seen.has(entry.path)) {
      continue;
    }
    seen.add(entry.path);
    items.push({
      label: entry.name,
      description: entry.path,
      run: async () => openFilePath(entry.path),
    });
  }

  return items.slice(0, 30);
}

async function updatePaletteItems() {
  const requestId = ++state.paletteRequestId;
  const query = byId("palette-input").value.trim();
  if (state.paletteMode === "commands") {
    const normalized = query.toLowerCase();
    state.paletteItems = COMMANDS.filter((item) => item.label.toLowerCase().includes(normalized)).map((item) => ({
      label: item.label,
      description: item.id,
      run: item.run,
    }));
    state.paletteSelection = 0;
    renderPaletteItems();
    return;
  }

  const localItems = buildQuickOpenItems(query);
  state.paletteItems = localItems;
  state.paletteSelection = 0;
  renderPaletteItems(query ? "No local matches yet." : "No open files or current folder files.");

  if (query.length < 2) {
    return;
  }

  renderPaletteItems("Searching workspace...");

  await new Promise((resolve) => setTimeout(resolve, 180));
  if (requestId !== state.paletteRequestId || !state.paletteVisible) {
    return;
  }

  try {
    const results = await searchFiles(query, "workspace");
    if (requestId !== state.paletteRequestId || !state.paletteVisible) {
      return;
    }

    const remoteItems = results.files.map((item) => ({
      label: item.name,
      description: item.path,
      run: async () => openFilePath(item.path),
    }));

    const merged = [...localItems];
    const seen = new Set(merged.map((item) => item.description));
    for (const item of remoteItems) {
      if (seen.has(item.description)) {
        continue;
      }
      seen.add(item.description);
      merged.push(item);
    }

    state.paletteItems = merged.slice(0, 80);
    state.paletteSelection = 0;
    renderPaletteItems();
  } catch (error) {
    console.error(error);
    if (requestId !== state.paletteRequestId || !state.paletteVisible) {
      return;
    }
    renderPaletteItems("Workspace search failed. Use the explorer or try a narrower query.");
  }
}

async function runPaletteSelection() {
  const selected = state.paletteItems[state.paletteSelection];
  if (!selected) {
    return;
  }
  hidePalette();
  await selected.run();
}

function promptGoToLine() {
  const lineInput = prompt("Go to line number:");
  const lineNumber = Number(lineInput);
  if (!Number.isFinite(lineNumber) || !state.editor) {
    return;
  }
  state.editor.revealLineInCenter(lineNumber);
  state.editor.setPosition({ lineNumber, column: 1 });
  state.editor.focus();
}

function formatCurrent() {
  state.editor?.getAction("editor.action.formatDocument").run().catch((error) => {
    console.warn(error);
  });
}

function bindUi() {
  byId("btn-zetro").onclick = () => setBaseAndRefresh(".");
  byId("btn-workspace").onclick = () => setBaseAndRefresh("workspace");
  byId("btn-up").onclick = async () => {
    const parentBase = getParentBase(state.currentBase);
    if (parentBase == null) {
      setStatus("Already at the top level", "warning");
      return;
    }
    await setBaseAndRefresh(parentBase);
  };
  byId("btn-refresh").onclick = () => refresh();
  byId("btn-save").onclick = () => saveCurrent();
  byId("btn-format").onclick = () => formatCurrent();
  byId("btn-find").onclick = () => state.editor?.getAction("actions.find").run();
  byId("btn-goto").onclick = () => promptGoToLine();
  byId("btn-quick-open").onclick = () => {
    showPalette("files");
    updatePaletteItems().catch(console.error);
  };
  byId("btn-command").onclick = () => {
    showPalette("commands");
    updatePaletteItems().catch(console.error);
  };

  byId("send").onclick = async () => {
    const input = byId("msg");
    const text = input.value.trim();
    if (!text) {
      return;
    }

    appendMsg("user", text);
    input.value = "";
    setStatus("Sending prompt to Zetro...");

    try {
      const response = await sendChat(text);
      appendMsg("assistant", response.text || JSON.stringify(response));
      setStatus("Assistant response received", "success");
    } catch (error) {
      console.error(error);
      setStatus("Chat request failed", "error");
    }
  };

  byId("msg").addEventListener("keydown", async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await byId("send").onclick();
    }
  });

  byId("palette-input").addEventListener("input", () => {
    updatePaletteItems().catch(console.error);
  });

  byId("palette-input").addEventListener("keydown", async (event) => {
    if (event.key === "Escape") {
      hidePalette();
      state.editor?.focus();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      state.paletteSelection = Math.min(state.paletteSelection + 1, state.paletteItems.length - 1);
      renderPaletteItems();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      state.paletteSelection = Math.max(state.paletteSelection - 1, 0);
      renderPaletteItems();
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      await runPaletteSelection();
    }
  });

  byId("palette-close").onclick = () => hidePalette();
  byId("palette").onclick = (event) => {
    if (event.target === byId("palette")) {
      hidePalette();
    }
  };

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.paletteVisible) {
      event.preventDefault();
      hidePalette();
      state.editor?.focus();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p" && !event.shiftKey) {
      event.preventDefault();
      showPalette("files");
      updatePaletteItems().catch(console.error);
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "p") {
      event.preventDefault();
      showPalette("commands");
      updatePaletteItems().catch(console.error);
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "w") {
      event.preventDefault();
      closeActiveTab().catch(console.error);
    }
  });

  window.addEventListener("beforeunload", (event) => {
    const hasDirtyFiles = [...state.openFiles.values()].some((entry) => entry.dirty);
    if (!hasDirtyFiles) {
      return;
    }
    event.preventDefault();
    event.returnValue = "";
  });
}

function startLsp() {
  state.lsp = new ZetroLspClient({
    root: "workspace",
    onDiagnostics: applyDiagnostics,
    onStatus: setLspStatus,
  });
  state.lsp.connect();
}

bindUi();

loadMonaco(() => {
  configureMonaco();
  state.editor = monaco.editor.create(byId("editor"), {
    value: "",
    language: "javascript",
    automaticLayout: true,
    theme: "vs-dark",
    minimap: { enabled: true },
    fontSize: 14,
    tabSize: 2,
    smoothScrolling: true,
    glyphMargin: true,
    scrollBeyondLastLine: false,
    roundedSelection: false,
    wordWrap: "off",
  });

  state.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => saveCurrent());
  state.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
    showPalette("files");
    updatePaletteItems().catch(console.error);
  });
  state.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => {
    showPalette("commands");
    updatePaletteItems().catch(console.error);
  });

  state.editor.onDidChangeCursorPosition((event) => {
    state.cursor = event.position;
    updateStatusBar();
  });

  setCurrentBase(".");
  setCurrentFile("");
  renderTabs();
  renderOpenEditors();
  renderProblems();
  updateStatusBar();
  refresh().catch((error) => {
    console.error(error);
    setStatus("Initial load failed", "error");
  });
  startLsp();
});
