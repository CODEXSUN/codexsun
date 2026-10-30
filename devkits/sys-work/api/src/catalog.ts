import { homedir } from "node:os";
import { join } from "node:path";
import { readdir } from "node:fs/promises";

export type CleanerTarget = {
  id: string;
  group: "Codex" | "Antigravity" | "WebStorm" | "Android" | "AppData" | "Windows";
  label: string;
  detail: string;
  mode?: "inventory";
  roots: (home: string) => Promise<string[]>;
};

function fixed(...parts: string[]) {
  return async (home: string) => [join(home, ...parts)];
}

function webStorm(...parts: string[]) {
  return async (home: string) => {
    const parent = join(home, "AppData", "Local", "JetBrains");
    try {
      const entries = await readdir(parent, { withFileTypes: true });
      return entries
        .filter((entry) => entry.isDirectory() && /^WebStorm\d{4}\.\d+$/u.test(entry.name))
        .map((entry) => join(parent, entry.name, ...parts));
    } catch {
      return [];
    }
  };
}

function webStormNodeCache() {
  return async (home: string) => {
    const installations = await webStorm("acp-agents", ".runtimes", "node")(home);
    const roots: string[] = [];
    for (const installation of installations) {
      try {
        const versions = await readdir(installation, { withFileTypes: true });
        roots.push(
          ...versions
            .filter((entry) => entry.isDirectory() && /^\d+\.\d+\.\d+$/u.test(entry.name))
            .map((entry) => join(installation, entry.name, "npm-cache", "_cacache"))
        );
      } catch {
        /* This version has no embedded Node runtime. */
      }
    }
    return roots;
  };
}

function webStormInstalledAgents() {
  return async (home: string) => {
    const parent = join(home, "AppData", "Local", "JetBrains");
    try {
      const installations = await readdir(parent, { withFileTypes: true });
      const versions = installations.filter(
        (entry) => entry.isDirectory() && /^WebStorm\d{4}\.\d+$/u.test(entry.name)
      );
      const roots: string[] = [];
      for (const version of versions) {
        const agents = join(parent, version.name, "acp-agents");
        try {
          const entries = await readdir(agents, { withFileTypes: true });
          roots.push(
            ...entries
              .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
              .map((entry) => join(agents, entry.name))
          );
        } catch {
          // This WebStorm version has no agent installations.
        }
      }
      return roots;
    } catch {
      return [];
    }
  };
}

export const cleanerTargets: CleanerTarget[] = [
  {
    id: "windows-temp",
    group: "Windows",
    label: "Windows temp files",
    detail: "Files under C:\\Windows\\Temp. In-use or protected files are skipped.",
    roots: async () => [join(process.env.WINDIR ?? "C:\\Windows", "Temp")]
  },
  {
    id: "codex-runtime-installs",
    group: "Codex",
    label: "Runtime install leftovers",
    detail: "Temporary Codex runtime downloads and older install folders.",
    roots: async (home) => {
      const parent = join(home, ".cache", "codex-runtimes");
      try {
        const entries = await readdir(parent, { withFileTypes: true });
        return entries
          .filter((entry) => entry.isDirectory() && entry.name.startsWith("codex-runtime-install-"))
          .map((entry) => join(parent, entry.name));
      } catch {
        return [];
      }
    }
  },
  {
    id: "codex-sessions-inventory",
    group: "Codex",
    label: "Codex sessions",
    detail: "Read-only size view. Session files may contain work in progress.",
    mode: "inventory",
    roots: fixed(".codex", "sessions")
  },
  {
    id: "codex-history-inventory",
    group: "Codex",
    label: "Codex history database",
    detail: "Read-only size view of saved conversation history.",
    mode: "inventory",
    roots: fixed(".codex", "thread_history_1.sqlite")
  },
  {
    id: "opencode-data-inventory",
    group: "Codex",
    label: "OpenCode local database",
    detail: "Read-only size view of OpenCode application data.",
    mode: "inventory",
    roots: fixed(".local", "share", "opencode", "opencode.db")
  },
  {
    id: "codex-temp",
    group: "Codex",
    label: "Codex temporary files",
    detail: "The .codex temporary folder. Sessions and history stay untouched.",
    roots: fixed(".codex", ".tmp")
  },
  {
    id: "codex-cache",
    group: "Codex",
    label: "Codex cache",
    detail: "Regenerable Codex cache files.",
    roots: fixed(".codex", "cache")
  },
  {
    id: "antigravity-cache",
    group: "Antigravity",
    label: "Desktop caches",
    detail: "Cache, code cache, and GPU cache. App storage stays untouched.",
    roots: async (home) =>
      ["Cache", "Code Cache", "GPUCache", "DawnGraphiteCache", "DawnWebGPUCache"].map((name) =>
        join(home, "AppData", "Roaming", "Antigravity", name)
      )
  },
  {
    id: "antigravity-logs",
    group: "Antigravity",
    label: "Desktop logs",
    detail: "Antigravity diagnostic logs.",
    roots: fixed("AppData", "Roaming", "Antigravity", "logs")
  },
  {
    id: "antigravity-updater",
    group: "Antigravity",
    label: "Updater installer",
    detail: "Downloaded installer. The installed app stays untouched.",
    roots: fixed("AppData", "Local", "antigravity-updater", "installer.exe")
  },
  {
    id: "webstorm-npm-cache",
    group: "WebStorm",
    label: "Agent npm cache",
    detail: "WebStorm agent runtime npm content cache, not its installed agents.",
    roots: webStormNodeCache()
  },
  {
    id: "webstorm-agent-installs-inventory",
    group: "WebStorm",
    label: "Installed agent packages",
    detail: "Read-only size view. These packages provide WebStorm agent features.",
    mode: "inventory",
    roots: webStormInstalledAgents()
  },
  {
    id: "webstorm-downloads",
    group: "WebStorm",
    label: "Agent downloads",
    detail: "Downloaded agent archives. Installed versions stay untouched.",
    roots: webStorm("acp-agents", ".downloads")
  },
  {
    id: "webstorm-index",
    group: "WebStorm",
    label: "Indexes",
    detail: "Regenerable project indexes. Reindexing can take time.",
    roots: webStorm("index")
  },
  {
    id: "webstorm-temp",
    group: "WebStorm",
    label: "Temporary files",
    detail: "IDE temporary output.",
    roots: webStorm("tmp")
  },
  {
    id: "webstorm-cache",
    group: "WebStorm",
    label: "IDE caches",
    detail: "Regenerable IDE caches. Clearing them can trigger rebuilds.",
    roots: webStorm("caches")
  },
  {
    id: "webstorm-logs",
    group: "WebStorm",
    label: "Logs",
    detail: "IDE diagnostic logs.",
    roots: webStorm("log")
  },
  {
    id: "android-gradle",
    group: "Android",
    label: "Gradle caches",
    detail: "Downloaded and transformed build artifacts. Builds will fetch or rebuild them.",
    roots: fixed(".gradle", "caches")
  },
  {
    id: "gradle-wrapper-cache",
    group: "Android",
    label: "Gradle wrapper downloads",
    detail: "Downloaded Gradle distributions. Builds may download them again.",
    roots: fixed(".gradle", "wrapper", "dists")
  },
  {
    id: "android-cache",
    group: "Android",
    label: "Android emulator cache",
    detail: "Emulator cache files. Virtual device data stays untouched.",
    roots: fixed(".android", "cache")
  },
  {
    id: "android-emulator-inventory",
    group: "Android",
    label: "Android virtual devices",
    detail: "Read-only size view of emulator disks and snapshots. These contain device data.",
    mode: "inventory",
    roots: fixed(".android", "avd")
  },
  {
    id: "android-sdk-inventory",
    group: "Android",
    label: "Android SDK installation",
    detail: "Read-only size view of installed SDK platforms, tools, and system images.",
    mode: "inventory",
    roots: fixed("AppData", "Local", "Android", "Sdk")
  },
  {
    id: "chrome-profile-inventory",
    group: "AppData",
    label: "Chrome profile data",
    detail: "Read-only size view of Chrome profiles, local models, and browser data.",
    mode: "inventory",
    roots: fixed("AppData", "Local", "Google", "Chrome", "User Data")
  },
  {
    id: "windows-package-data-inventory",
    group: "AppData",
    label: "Windows app package data",
    detail: "Read-only size view of installed app settings and local data.",
    mode: "inventory",
    roots: fixed("AppData", "Local", "Packages")
  },
  {
    id: "android-studio-index",
    group: "Android",
    label: "Android Studio indexes",
    detail: "Regenerable IDE indexes.",
    roots: fixed("AppData", "Local", "Google", "AndroidStudio2026.1.3", "index")
  },
  {
    id: "appdata-npm-cache",
    group: "AppData",
    label: "npm cache",
    detail: "Global npm package download cache.",
    roots: fixed("AppData", "Local", "npm-cache", "_cacache")
  },
  {
    id: "appdata-npx-cache",
    group: "AppData",
    label: "npx package cache",
    detail: "Cached one-off npm packages. Tools may download them again.",
    roots: fixed("AppData", "Local", "npm-cache", "_npx")
  },
  {
    id: "playwright-browsers",
    group: "AppData",
    label: "Playwright browsers",
    detail: "Downloaded test browsers. Browser tests may reinstall them after cleanup.",
    roots: fixed("AppData", "Local", "ms-playwright")
  },
  {
    id: "appdata-go-build",
    group: "AppData",
    label: "Go build cache",
    detail: "Compiled Go build cache.",
    roots: fixed("AppData", "Local", "go-build")
  },
  {
    id: "appdata-pnpm-cache",
    group: "AppData",
    label: "pnpm cache",
    detail: "Regenerable pnpm package cache.",
    roots: fixed("AppData", "Local", "pnpm-cache")
  },
  {
    id: "appdata-temp",
    group: "AppData",
    label: "User temp files",
    detail: "Files in AppData Local Temp. In-use files are skipped.",
    roots: fixed("AppData", "Local", "Temp")
  }
];

export const defaultHome = homedir();
