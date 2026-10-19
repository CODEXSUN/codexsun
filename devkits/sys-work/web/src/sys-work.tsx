import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  FolderOpen,
  HardDrive,
  LayoutGrid,
  List,
  LoaderCircle,
  RefreshCw,
  ScanSearch,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  X
} from "lucide-react";

type Group = "Codex" | "Antigravity" | "WebStorm" | "Android" | "AppData" | "Windows";
type ScanRow = {
  id: string;
  group: Group;
  label: string;
  detail: string;
  canClean: boolean;
  bytes: number;
  files: number;
  paths: string[];
  largest: { path: string; bytes: number }[];
};
type Scan = {
  scanId: string;
  scannedAt: string;
  expiresAt: string;
  minAgeDays: number;
  rows: ScanRow[];
};
type CleanResult = {
  deletedFiles: number;
  reclaimedBytes: number;
  skippedFiles: number;
  errors: { path: string; message: string }[];
};

const groups: ("All" | Group)[] = [
  "All",
  "Codex",
  "Antigravity",
  "WebStorm",
  "Android",
  "AppData",
  "Windows"
];
const ages = [
  { days: 7, label: "Older than 7 days" },
  { days: 30, label: "Older than 30 days" },
  { days: 0, label: "All ages" }
];

function size(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let index = -1;
  do {
    value /= 1024;
    index++;
  } while (value >= 1024 && index < units.length - 1);
  return `${value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${units[index]}`;
}

async function post<T>(path: string, body: object): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Request failed.");
  return data as T;
}

export function SysWork() {
  const [scan, setScan] = useState<Scan | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [group, setGroup] = useState<(typeof groups)[number]>("All");
  const [age, setAge] = useState(7);
  const [working, setWorking] = useState<"scan" | "clean" | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CleanResult | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [compact, setCompact] = useState(false);
  const [showPaths, setShowPaths] = useState(false);
  const [tweakOpen, setTweakOpen] = useState(false);

  const visible = useMemo(
    () => scan?.rows.filter((row) => group === "All" || row.group === group) ?? [],
    [scan, group]
  );
  const totalBytes =
    scan?.rows.filter((row) => row.canClean).reduce((sum, row) => sum + row.bytes, 0) ?? 0;
  const totalFiles =
    scan?.rows.filter((row) => row.canClean).reduce((sum, row) => sum + row.files, 0) ?? 0;
  const cleanupAreas = scan?.rows.filter((row) => row.canClean && row.files > 0).length ?? 0;
  const inventoryBytes =
    scan?.rows.filter((row) => !row.canClean).reduce((sum, row) => sum + row.bytes, 0) ?? 0;
  const inventoryAreas = scan?.rows.filter((row) => !row.canClean && row.files > 0).length ?? 0;
  const selectedBytes =
    scan?.rows
      .filter((row) => row.canClean && selected.includes(row.id))
      .reduce((sum, row) => sum + row.bytes, 0) ?? 0;
  const selectedFiles =
    scan?.rows
      .filter((row) => row.canClean && selected.includes(row.id))
      .reduce((sum, row) => sum + row.files, 0) ?? 0;

  async function runScan() {
    setWorking("scan");
    setError("");
    setResult(null);
    setSelected([]);
    try {
      setScan(await post<Scan>("/api/scan", { minAgeDays: age }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Scan failed.");
    } finally {
      setWorking(null);
    }
  }

  async function runClean() {
    if (!scan || confirmation !== "DELETE") return;
    setWorking("clean");
    setError("");
    setShowConfirm(false);
    try {
      setResult(
        await post<CleanResult>("/api/clean", {
          scanId: scan.scanId,
          targetIds: selected,
          confirm: confirmation
        })
      );
      setScan(null);
      setSelected([]);
      setConfirmation("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Clean failed.");
    } finally {
      setWorking(null);
    }
  }

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }
  function selectVisible() {
    const ids = visible.filter((row) => row.canClean && row.files > 0).map((row) => row.id);
    setSelected((current) =>
      ids.every((id) => current.includes(id))
        ? current.filter((id) => !ids.includes(id))
        : [...new Set([...current, ...ids])]
    );
  }

  return (
    <div className={`sw-app ${compact ? "sw-compact" : ""}`}>
      <aside className="sw-sidebar">
        <div className="sw-brand">
          <span className="sw-brand-mark">
            <Sparkles size={19} />
          </span>
          <span>
            <strong>SYS WORK</strong>
            <small>CODEXSUN DEVKIT</small>
          </span>
        </div>
        <div className="sw-sidebar-label">WORKSPACE</div>
        <div className="sw-nav-active">
          <LayoutGrid size={17} /> Cleanup dashboard
        </div>
        <div className="sw-sidebar-label sw-sources-label">SOURCES</div>
        {groups.slice(1).map((item) => (
          <button
            className={`sw-side-link ${group === item ? "active" : ""}`}
            key={item}
            onClick={() => setGroup(item)}
          >
            <span className="sw-dot" />
            {item}
            <span className="sw-side-count">
              {scan?.rows.filter((row) => row.group === item && row.files > 0).length ?? "–"}
            </span>
          </button>
        ))}
        <div className="sw-sidebar-footer">
          <ShieldCheck size={17} />
          <span>
            Local device only
            <br />
            <small>Review before deletion</small>
          </span>
        </div>
      </aside>

      <main className="sw-main">
        <header className="sw-topbar">
          <span>
            Workspace <span className="sw-slash">/</span> Cleanup
          </span>
          <div className="sw-live">
            <span /> LOCAL SYSTEM
          </div>
        </header>
        <div className="sw-content">
          <div className="sw-heading">
            <div>
              <div className="sw-eyebrow">
                SYSTEM MAINTENANCE <span className="sw-eyebrow-line" />
              </div>
              <h1>Find what's using your space.</h1>
              <p>
                Review cleanup candidates and protected app data, then clear only the files you
                select.
              </p>
            </div>
            <div className="sw-heading-symbol">
              <HardDrive size={35} strokeWidth={1.35} />
            </div>
          </div>

          <section className="sw-scan-panel">
            <div className="sw-scan-left">
              <span className="sw-scan-icon">
                <ScanSearch size={22} />
              </span>
              <div>
                <strong>Scan storage areas</strong>
                <span>
                  Review known cleanup locations and inspect protected app and device data.
                </span>
              </div>
            </div>
            <div className="sw-scan-right">
              <div className="sw-age" role="group" aria-label="Minimum file age">
                {ages.map((option) => (
                  <button
                    key={option.days}
                    className={age === option.days ? "active" : ""}
                    onClick={() => setAge(option.days)}
                    disabled={working !== null}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <button className="sw-primary" onClick={runScan} disabled={working !== null}>
                {working === "scan" ? (
                  <LoaderCircle className="sw-spin" size={17} />
                ) : (
                  <RefreshCw size={17} />
                )}
                {working === "scan" ? "Scanning..." : scan ? "Scan again" : "Start scan"}
              </button>
            </div>
          </section>

          {error && (
            <div className="sw-message sw-error" role="alert">
              <CircleAlert size={18} />
              {error}
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={16} />
              </button>
            </div>
          )}
          {result && (
            <div className="sw-message sw-success" role="status">
              <Check size={18} />
              Removed {result.deletedFiles.toLocaleString()} files and reclaimed{" "}
              {size(result.reclaimedBytes)}.{" "}
              {result.skippedFiles > 0 &&
                `${result.skippedFiles.toLocaleString()} files were skipped.`}
            </div>
          )}

          <div className="sw-stats">
            <div>
              <span>ELIGIBLE TO CLEAN</span>
              <strong>{scan ? size(totalBytes) : "—"}</strong>
              <small>
                {scan
                  ? scan.minAgeDays === 0
                    ? `All ages · ${cleanupAreas} cleanup areas`
                    : `Older than ${scan.minAgeDays} days · ${cleanupAreas} areas`
                  : "Files in known cleanup areas"}
              </small>
            </div>
            <div>
              <span>CLEANABLE FILES</span>
              <strong>{scan ? totalFiles.toLocaleString() : "—"}</strong>
              <small>Matches the age filter</small>
            </div>
            <div>
              <span>PROTECTED DATA</span>
              <strong>{scan ? size(inventoryBytes) : "—"}</strong>
              <small>
                {scan
                  ? `Read-only · ${inventoryAreas} areas · excluded from cleanup`
                  : "Read-only app and device data"}
              </small>
            </div>
            <div>
              <span>SELECTED TO CLEAN</span>
              <strong>{scan ? size(selectedBytes) : "—"}</strong>
              <small>
                {selected.length} areas · {selectedFiles.toLocaleString()} files
              </small>
            </div>
          </div>

          <section className="sw-results">
            <div className="sw-results-head">
              <div>
                <div className="sw-eyebrow">SCAN RESULTS</div>
                <h2>
                  Storage areas <span>{scan?.rows.filter((row) => row.files > 0).length ?? 0}</span>
                </h2>
              </div>
              {scan && (
                <div className="sw-scanned">
                  <Clock3 size={15} /> Scanned {new Date(scan.scannedAt).toLocaleTimeString()}
                </div>
              )}
            </div>
            <div className="sw-toolbar">
              <div className="sw-tabs">
                {groups.map((item) => (
                  <button
                    key={item}
                    className={group === item ? "active" : ""}
                    onClick={() => setGroup(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {scan && (
                <button className="sw-select-all" onClick={selectVisible}>
                  <Check size={15} /> Select visible
                </button>
              )}
            </div>
            {!scan ? (
              <div className="sw-empty">
                <span>
                  <FolderOpen size={30} strokeWidth={1.4} />
                </span>
                <strong>Your cleanup map starts here</strong>
                <p>Run a scan to see cleanup candidates and protected storage.</p>
              </div>
            ) : (
              <div className="sw-list">
                {visible.map((row) => (
                  <div
                    className={`sw-row ${selected.includes(row.id) ? "selected" : ""}`}
                    key={row.id}
                  >
                    <button
                      className="sw-check"
                      role="checkbox"
                      aria-checked={selected.includes(row.id)}
                      aria-label={`Select ${row.label}`}
                      disabled={!row.canClean || row.files === 0 || working !== null}
                      onClick={() => toggle(row.id)}
                    >
                      {selected.includes(row.id) && <Check size={14} />}
                    </button>
                    <div className="sw-row-main">
                      <div className="sw-row-line">
                        <strong>{row.label}</strong>
                        <span className="sw-tag">{row.group}</span>
                        {!row.canClean && (
                          <span className="sw-tag sw-tag-protected">Inventory only</span>
                        )}
                      </div>
                      <p>{row.detail}</p>
                      {expanded === row.id && (
                        <div className="sw-details">
                          <div className="sw-detail-label">APPROVED LOCATIONS</div>
                          {row.paths.length ? (
                            row.paths.map((path) => <code key={path}>{path}</code>)
                          ) : (
                            <span>No matching installation found.</span>
                          )}
                          {row.largest.length > 0 && (
                            <>
                              <div className="sw-detail-label">
                                {row.canClean ? "LARGEST ELIGIBLE FILES" : "LARGEST FILES"}
                              </div>
                              {row.largest.map((file) => (
                                <div className="sw-file" key={file.path}>
                                  <code>{file.path}</code>
                                  <span>{size(file.bytes)}</span>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                      {showPaths && expanded !== row.id && row.paths[0] && (
                        <code className="sw-path-preview">{row.paths[0]}</code>
                      )}
                    </div>
                    <div className="sw-row-meta">
                      <strong>{size(row.bytes)}</strong>
                      <span>{row.files.toLocaleString()} files</span>
                    </div>
                    <button
                      className="sw-expand"
                      aria-label={`Details for ${row.label}`}
                      onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                    >
                      <ChevronDown size={18} className={expanded === row.id ? "open" : ""} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        {scan && selected.length > 0 && (
          <div className="sw-action-bar">
            <div>
              <span>{selected.length} AREAS SELECTED</span>
              <strong>
                {size(selectedBytes)} <small>eligible for cleanup</small>
              </strong>
            </div>
            <button
              className="sw-danger"
              onClick={() => setShowConfirm(true)}
              disabled={working !== null}
            >
              <Trash2 size={17} /> Review cleanup <ArrowRight size={16} />
            </button>
          </div>
        )}
      </main>

      <div className="sw-tweak">
        <button className="sw-tweak-toggle" onClick={() => setTweakOpen(!tweakOpen)}>
          <Settings2 size={18} /> Tweak view
        </button>
        {tweakOpen && (
          <div className="sw-tweak-panel">
            <strong>Display options</strong>
            <label>
              <span>
                <List size={16} /> Compact rows
              </span>
              <input
                type="checkbox"
                checked={compact}
                onChange={(event) => setCompact(event.target.checked)}
              />
            </label>
            <label>
              <span>
                <FolderOpen size={16} /> Show paths
              </span>
              <input
                type="checkbox"
                checked={showPaths}
                onChange={(event) => setShowPaths(event.target.checked)}
              />
            </label>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="sw-overlay" role="presentation">
          <div
            className="sw-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sw-confirm-title"
          >
            <button
              className="sw-dialog-close"
              onClick={() => setShowConfirm(false)}
              aria-label="Close"
            >
              <X size={19} />
            </button>
            <span className="sw-dialog-icon">
              <Trash2 size={23} />
            </span>
            <h2 id="sw-confirm-title">Review cleanup</h2>
            <p>
              This will permanently remove <strong>{selectedFiles.toLocaleString()} files</strong>{" "}
              from {selected.length} selected cache areas, up to{" "}
              <strong>{size(selectedBytes)}</strong>. Files changed since the scan will be skipped.
            </p>
            <div className="sw-confirm-list">
              {scan?.rows
                .filter((row) => selected.includes(row.id))
                .map((row) => (
                  <div key={row.id}>
                    <span>{row.label}</span>
                    <strong>{size(row.bytes)}</strong>
                  </div>
                ))}
            </div>
            <label className="sw-confirm-label" htmlFor="sw-confirm-input">
              Type DELETE to continue
            </label>
            <input
              id="sw-confirm-input"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
            />
            <div className="sw-dialog-actions">
              <button className="sw-secondary" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button className="sw-danger" disabled={confirmation !== "DELETE"} onClick={runClean}>
                <Trash2 size={16} /> Delete selected files
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
