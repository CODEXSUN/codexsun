/**
 * Codebase Analyzer and Indexer
 *
 * Analyzes project structure, learns patterns, and builds fast-lookup index
 * for enhanced context awareness and faster AI responses.
 */

import { promises as fs } from "fs";
import { join, relative, extname } from "path";

export interface FileInfo {
  path: string;
  relativePath: string;
  extension: string;
  size: number;
  language: string;
  isTestFile: boolean;
  isBuildOutput: boolean;
}

export interface AppInfo {
  name: string;
  path: string;
  type: "app" | "standalone" | "module";
  hasWeb: boolean;
  hasDatabase: boolean;
  hasHelper: boolean;
  hasShared: boolean;
  files: FileInfo[];
  languages: string[];
  frameworks: string[];
}

export interface RepositoryIndex {
  projectPath: string;
  indexedAt: string;
  totalFiles: number;
  totalApps: number;
  languages: Map<string, number>;
  frameworks: Set<string>;
  apps: AppInfo[];
  appsByName: Map<string, AppInfo>;
  patterns: {
    apiRoutes: string[];
    components: string[];
    services: string[];
    utils: string[];
    hooks: string[];
  };
  ownership: Map<string, string>; // file -> app owner mapping
}

/**
 * CodebaseAnalyzer learns from project structure
 */
export class CodebaseAnalyzer {
  private projectPath: string;
  private index: RepositoryIndex | null = null;
  private readonly ignorePatterns = [
    "node_modules",
    ".git",
    "dist",
    "build",
    ".next",
    ".venv",
    "__pycache__",
    ".ai",
    "coverage",
    ".cache",
  ];

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Analyze the entire codebase
   */
  async analyze(): Promise<RepositoryIndex> {
    console.log("Analyzing codebase...");

    const index: RepositoryIndex = {
      projectPath: this.projectPath,
      indexedAt: new Date().toISOString(),
      totalFiles: 0,
      totalApps: 0,
      languages: new Map(),
      frameworks: new Set(),
      apps: [],
      appsByName: new Map(),
      patterns: {
        apiRoutes: [],
        components: [],
        services: [],
        utils: [],
        hooks: [],
      },
      ownership: new Map(),
    };

    // Analyze apps directory
    const appsPath = join(this.projectPath, "apps");
    try {
      const appNames = await fs.readdir(appsPath);

      for (const appName of appNames) {
        const appPath = join(appsPath, appName);
        const stats = await fs.stat(appPath);

        if (stats.isDirectory()) {
          const appInfo = await this.analyzeApp(appName, appPath);
          index.apps.push(appInfo);
          index.appsByName.set(appName, appInfo);
          index.totalApps++;

          // Record ownership
          for (const file of appInfo.files) {
            index.ownership.set(file.relativePath, appName);
          }

          // Aggregate
          appInfo.languages.forEach((lang) => {
            index.languages.set(lang, (index.languages.get(lang) || 0) + 1);
          });
          appInfo.frameworks.forEach((fw) => index.frameworks.add(fw));
        }
      }
    } catch (error) {
      console.error("Error analyzing apps:", error);
    }

    // Detect frameworks
    await this.detectFrameworks(index);

    index.totalFiles = index.apps.reduce(
      (sum, app) => sum + app.files.length,
      0
    );

    this.index = index;
    return index;
  }

  /**
   * Analyze a single app
   */
  private async analyzeApp(name: string, path: string): Promise<AppInfo> {
    const appInfo: AppInfo = {
      name,
      path,
      type: "app",
      hasWeb: await this.pathExists(join(path, "web")),
      hasDatabase: await this.pathExists(join(path, "database")),
      hasHelper: await this.pathExists(join(path, "helper")),
      hasShared: await this.pathExists(join(path, "shared")),
      files: [],
      languages: [],
      frameworks: [],
    };
    const languages = new Set<string>();
    const frameworks = new Set<string>();

    // Scan files
    appInfo.files = await this.scanDirectoryRecursive(path, name);

    // Detect languages and frameworks
    for (const file of appInfo.files) {
      languages.add(file.language);

      // Detect frameworks from file content
      if (file.language === "typescript" || file.language === "javascript") {
        if (file.path.includes("react") || file.path.includes(".tsx")) {
          frameworks.add("react");
        }
        if (file.path.includes("service") || file.path.includes("api")) {
          frameworks.add("node");
        }
        if (file.path.includes("route") || file.path.includes("handler")) {
          frameworks.add("express");
        }
      }

      // Categorize patterns
      if (file.path.includes("/api/") || file.path.includes("routes")) {
        if (!frameworks.has("express")) {
          frameworks.add("api");
        }
      } else if (file.path.includes("component") || file.path.includes(".tsx")) {
        frameworks.add("react");
      }
    }

    appInfo.languages = Array.from(languages).sort();
    appInfo.frameworks = Array.from(frameworks).sort();

    return appInfo;
  }

  /**
   * Scan directory recursively
   */
  private async scanDirectoryRecursive(
    dirPath: string,
    appName: string,
    baseRelativePath: string = ""
  ): Promise<FileInfo[]> {
    const files: FileInfo[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        // Check ignore patterns
        if (this.ignorePatterns.some((p) => entry.name.includes(p))) {
          continue;
        }

        const fullPath = join(dirPath, entry.name);
        const relativePath = baseRelativePath
          ? `${baseRelativePath}/${entry.name}`
          : entry.name;

        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subFiles = await this.scanDirectoryRecursive(
            fullPath,
            appName,
            relativePath
          );
          files.push(...subFiles);
        } else if (entry.isFile()) {
          const fileInfo = this.createFileInfo(fullPath, appName, relativePath);
          files.push(fileInfo);
        }
      }
    } catch (error) {
      console.error(`Error scanning ${dirPath}:`, error);
    }

    return files;
  }

  /**
   * Create FileInfo object
   */
  private createFileInfo(
    path: string,
    _appName: string,
    _relativePath: string
  ): FileInfo {
    const ext = extname(path).toLowerCase();
    const isTestFile =
      path.includes(".test.") ||
      path.includes(".spec.") ||
      path.includes("__tests__");
    const isBuildOutput =
      path.includes("dist/") ||
      path.includes("build/") ||
      path.includes(".next/");

    const language = this.detectLanguage(ext);

    return {
      path,
      relativePath: relative(this.projectPath, path),
      extension: ext,
      size: 0, // Will populate if needed
      language,
      isTestFile,
      isBuildOutput,
    };
  }

  /**
   * Detect file language from extension
   */
  private detectLanguage(ext: string): string {
    const languageMap: Record<string, string> = {
      ".ts": "typescript",
      ".tsx": "typescript/react",
      ".js": "javascript",
      ".jsx": "javascript/react",
      ".py": "python",
      ".json": "json",
      ".yaml": "yaml",
      ".yml": "yaml",
      ".md": "markdown",
      ".sql": "sql",
      ".css": "css",
      ".scss": "scss",
      ".html": "html",
    };

    return languageMap[ext] || ext.slice(1) || "unknown";
  }

  /**
   * Detect frameworks used in project
   */
  private async detectFrameworks(index: RepositoryIndex): Promise<void> {
    const packageJsonPath = join(this.projectPath, "package.json");

    try {
      const content = await fs.readFile(packageJsonPath, "utf-8");
      const packageJson = JSON.parse(content);

      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      const frameworks: Record<string, string> = {
        react: "React",
        vue: "Vue",
        angular: "Angular",
        next: "Next.js",
        express: "Express",
        fastify: "Fastify",
        koa: "Koa",
        nestjs: "@nestjs/core",
        "react-native": "React Native",
        expo: "Expo",
        typescript: "TypeScript",
        webpack: "Webpack",
        vite: "Vite",
        esbuild: "ESBuild",
      };

      for (const [key, display] of Object.entries(frameworks)) {
        if (key in deps || display in deps) {
          index.frameworks.add(key);
        }
      }
    } catch (error) {
      console.error("Error detecting frameworks:", error);
    }
  }

  /**
   * Get app info by name
   */
  getApp(name: string): AppInfo | undefined {
    return this.index?.appsByName.get(name);
  }

  /**
   * Get app files by pattern
   */
  getFilesByPattern(pattern: RegExp): FileInfo[] {
    if (!this.index) return [];

    const files: FileInfo[] = [];
    for (const app of this.index.apps) {
      for (const file of app.files) {
        if (pattern.test(file.path) && !file.isBuildOutput) {
          files.push(file);
        }
      }
    }

    return files;
  }

  /**
   * Get files by language
   */
  getFilesByLanguage(language: string): FileInfo[] {
    if (!this.index) return [];

    const files: FileInfo[] = [];
    for (const app of this.index.apps) {
      for (const file of app.files) {
        if (file.language.includes(language) && !file.isBuildOutput) {
          files.push(file);
        }
      }
    }

    return files;
  }

  /**
   * Get app ownership for a file
   */
  getOwningApp(filePath: string): string | undefined {
    return this.index?.ownership.get(filePath);
  }

  /**
   * Get related files for context
   */
  getContextFiles(filePath: string, maxFiles: number = 5): FileInfo[] {
    const owningApp = this.getOwningApp(filePath);
    if (!owningApp) return [];

    const app = this.getApp(owningApp);
    if (!app) return [];

    // Find related files (same directory, same pattern)
    const dir = filePath.substring(0, filePath.lastIndexOf("/"));
    const related = app.files.filter(
      (f) => f.path.startsWith(dir) && !f.isBuildOutput && !f.isTestFile
    );

    return related.slice(0, maxFiles);
  }

  /**
   * Get architecture summary
   */
  getArchitectureSummary(): string {
    if (!this.index) return "";

    const lines: string[] = ["# Repository Architecture Summary"];
    lines.push("");
    lines.push(`**Total Apps:** ${this.index.totalApps}`);
    lines.push(`**Total Files:** ${this.index.totalFiles}`);
    lines.push(`**Frameworks:** ${Array.from(this.index.frameworks).join(", ")}`);
    lines.push("**Languages:**");
    for (const [lang, count] of this.index.languages) {
      lines.push(`  - ${lang}: ${count} files`);
    }

    lines.push("");
    lines.push("## Apps");
    for (const app of this.index.apps) {
      lines.push(`- **${app.name}**: ${app.files.length} files`);
      if (app.hasWeb) lines.push(`  - has web/`);
      if (app.hasDatabase) lines.push(`  - has database/`);
      if (app.hasHelper) lines.push(`  - has helper/`);
      if (app.hasShared) lines.push(`  - has shared/`);
      if (app.frameworks.length > 0) {
        lines.push(`  - frameworks: ${app.frameworks.join(", ")}`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Get the index
   */
  getIndex(): RepositoryIndex | null {
    return this.index;
  }

  /**
   * Check if path exists
   */
  private async pathExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Create and analyze codebase
 */
export async function analyzeCodebase(
  projectPath: string
): Promise<RepositoryIndex> {
  const analyzer = new CodebaseAnalyzer(projectPath);
  return analyzer.analyze();
}
