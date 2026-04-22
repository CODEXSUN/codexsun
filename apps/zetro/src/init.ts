#!/usr/bin/env node

/**
 * Zetro Initialization CLI
 *
 * Initializes Zetro for a project:
 * - Creates .ai/ folder structure
 * - Analyzes and indexes codebase
 * - Generates quick reference
 * - Validates Orexso connection
 * - Creates startup report
 */

import { promises as fs } from "fs";
import { join, resolve, dirname } from "path";
import { cpuUsage, memoryUsage } from "process";
import { fileURLToPath } from "url";

import { createProjectMemory } from "./project-memory.js";
import { CodebaseAnalyzer } from "./codebase-analyzer.js";
import { ContextCache } from "./context-cache.js";
import { generateQuickReference } from "./quick-reference.js";
import { ensureAIFolders } from "./memory-boundary.js";
import { createOrexsoClient } from "./orexso-client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ZETRO_ROOT = resolve(__dirname, "..");

interface InitReport {
  status: "success" | "warning" | "error";
  timestamp: string;
  version: string;
  projectPath: string;
  projectId: string;
  memory: {
    initialized: boolean;
    path: string;
  };
  codebase: {
    analyzed: boolean;
    totalApps: number;
    totalFiles: number;
    languages: Record<string, number>;
    frameworks: string[];
  };
  cache: {
    initialized: boolean;
    size: number;
  };
  orexso: {
    available: boolean;
    model: string | null;
    warmupReady: boolean | null;
  };
  performance: {
    duration: number;
    cpuUsed: number;
    memoryUsed: number;
  };
  errors: string[];
  warnings: string[];
}

async function initializeZetro(
  projectPath: string = ZETRO_ROOT,
  codebaseRoot: string = resolve(ZETRO_ROOT, "..", ".."),
  projectId: string = "default",
  verbose: boolean = false
): Promise<InitReport> {
  const startTime = Date.now();
  const startCpu = cpuUsage();
  const startMem = memoryUsage();

  const report: InitReport = {
    status: "success",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    projectPath: resolve(projectPath),
    projectId,
    memory: {
      initialized: false,
      path: "",
    },
    codebase: {
      analyzed: false,
      totalApps: 0,
      totalFiles: 0,
      languages: {},
      frameworks: [],
    },
    cache: {
      initialized: false,
      size: 0,
    },
    orexso: {
      available: false,
      model: null,
      warmupReady: null,
    },
    performance: {
      duration: 0,
      cpuUsed: 0,
      memoryUsed: 0,
    },
    errors: [],
    warnings: [],
  };

  try {
    if (verbose) {
      console.log("Initializing Zetro...\n");
    }

    if (verbose) {
      console.log("Setting up memory boundary (.ai/)...");
    }
    try {
      await ensureAIFolders(projectPath);
      report.memory.path = join(projectPath, ".ai");
      if (verbose) {
        console.log("  Memory folders created\n");
      }
    } catch (error) {
      report.errors.push(`Failed to create .ai folders: ${error}`);
      report.status = "error";
    }

    if (verbose) {
      console.log("Initializing project memory...");
    }
    try {
      const memory = await createProjectMemory(projectPath, projectId);
      await memory.updateMetadata({
        projectPath,
        learningStatus: "learning",
        confidence: 0,
      });
      report.memory.initialized = true;
      if (verbose) {
        console.log("  Project memory initialized\n");
      }
    } catch (error) {
      report.errors.push(`Failed to initialize memory: ${error}`);
      report.status = "error";
    }

    try {
      const configPath = join(report.projectPath, ".ai", "config.json");
      await fs.access(configPath).catch(async () => {
        const defaultConfig = {
          quiet: !verbose,
          memoryPath: ".ai",
          projectId,
          web: {
            port: 4211,
          },
        };
        await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), "utf-8");
      });
    } catch (error) {
      if (verbose) {
        console.warn("Warning: failed to write local .ai config", error);
      }
    }

    if (verbose) {
      console.log("Analyzing codebase...");
    }
    try {
      const analyzer = new CodebaseAnalyzer(codebaseRoot);
      const index = await analyzer.analyze();

      report.codebase.analyzed = true;
      report.codebase.totalApps = index.totalApps;
      report.codebase.totalFiles = index.totalFiles;

      for (const [language, count] of index.languages) {
        report.codebase.languages[language] = count;
      }
      report.codebase.frameworks = Array.from(index.frameworks);

      if (verbose) {
        console.log(`  Found ${index.totalApps} apps`);
        console.log(`  Indexed ${index.totalFiles} files`);
        console.log(`  Languages: ${Array.from(index.languages.keys()).join(", ")}`);
        console.log(`  Frameworks: ${Array.from(index.frameworks).join(", ")}\n`);
      }
    } catch (error) {
      report.warnings.push(`Failed to analyze codebase: ${error}`);
    }

    if (verbose) {
      console.log("Generating quick reference...");
    }
    try {
      await generateQuickReference(codebaseRoot);
      if (verbose) {
        console.log("  Quick reference generated\n");
      }
    } catch (error) {
      report.warnings.push(`Failed to generate quick reference: ${error}`);
    }

    if (verbose) {
      console.log("Initializing context cache...");
    }
    try {
      const cache = new ContextCache(codebaseRoot);
      await cache.flushToDisk();
      report.cache.initialized = true;
      if (verbose) {
        console.log("  Cache initialized\n");
      }
    } catch (error) {
      report.warnings.push(`Failed to initialize cache: ${error}`);
    }

    if (verbose) {
      console.log("Checking Orexso API...");
    }
    try {
      const client = createOrexsoClient({
        baseUrl: process.env.OREXSO_API_URL || "http://localhost:6005",
        timeout: 5000,
      });

      const health = await client.getHealth();
      report.orexso.available = health.status === "ok";
      report.orexso.model = health.chat_model;
      report.orexso.warmupReady = health.warmup_ready;

      if (report.orexso.available) {
        if (verbose) {
          console.log("  Orexso is running");
          console.log(`  Model: ${health.chat_model}`);
          console.log(
            `  Warmup: ${health.warmup_ready ? "ready" : "warming up"}\n`
          );
        }
      } else {
        report.warnings.push("Orexso API not responding at expected URL");
      }
    } catch (error) {
      report.warnings.push(`Orexso connection check failed: ${error}`);
    }

    const endTime = Date.now();
    const endCpu = cpuUsage(startCpu);
    const endMem = memoryUsage();

    report.performance.duration = endTime - startTime;
    report.performance.cpuUsed = endCpu.user + endCpu.system;
    report.performance.memoryUsed = endMem.heapUsed - startMem.heapUsed;

    if (report.errors.length > 0) {
      report.status = "error";
    } else if (report.warnings.length > 0) {
      report.status = "warning";
    }

    if (verbose) {
      console.log("Performance:");
      console.log(`  Duration: ${report.performance.duration}ms`);
      console.log(
        `  Memory: ${(report.performance.memoryUsed / 1024 / 1024).toFixed(2)}MB\n`
      );

      if (report.errors.length > 0) {
        console.log("Errors:");
        report.errors.forEach((entry) => console.log(`  - ${entry}`));
        console.log("");
      }

      if (report.warnings.length > 0) {
        console.log("Warnings:");
        report.warnings.forEach((entry) => console.log(`  - ${entry}`));
        console.log("");
      }

      console.log(`Zetro initialized: ${report.status.toUpperCase()}`);
    }

    const reportPath = join(projectPath, ".ai", "init-report.json");
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf-8");

    return report;
  } catch (error) {
    report.status = "error";
    report.errors.push(`Initialization failed: ${error}`);
    return report;
  }
}

async function runCLI() {
  const args = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  const flags = process.argv.slice(2).filter((arg) => arg.startsWith("--"));

  const projectPath = args[0] || ZETRO_ROOT;
  const codebaseRoot = args[1] || resolve(ZETRO_ROOT, "..", "..");
  const projectId = args[2] || "default";
  const verbose = !flags.includes("--quiet");

  try {
    const report = await initializeZetro(projectPath, codebaseRoot, projectId, verbose);
    process.exit(report.status === "error" ? 1 : 0);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

runCLI().catch((error) => {
  console.error("CLI Error:", error);
  process.exit(1);
});

export { initializeZetro };
