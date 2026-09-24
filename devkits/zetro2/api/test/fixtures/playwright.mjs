// Playwright and browser test fixture configuration with strict root dist artifact path enforcement
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';

export function resolveRepoRoot(startDir = process.cwd()) {
  let current = resolve(startDir);
  while (true) {
    const parent = resolve(current, '..');
    if (parent === current) break;
    // repository root has package.json and assist/ or core/
    if (existsSync(resolve(current, 'core')) && existsSync(resolve(current, 'assist'))) {
      return current;
    }
    current = parent;
  }
  return process.cwd();
}

export function createPlaywrightArtifactManager(repoRoot = process.cwd()) {
  const artifactDir = resolve(repoRoot, 'dist', 'zetro2', 'artifacts');

  // Ensure root dist artifact directory exists
  mkdirSync(artifactDir, { recursive: true });

  return {
    artifactDir,

    /**
     * Resolves and verifies an artifact path strictly within root dist/zetro2/artifacts
     */
    getArtifactPath(testName, fileName) {
      const safeTestName = testName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const safeFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const targetPath = resolve(artifactDir, `${safeTestName}_${safeFileName}`);

      // Verify boundary: path must be inside root dist
      const rel = relative(resolve(repoRoot, 'dist'), targetPath);
      if (rel.startsWith('..') || isAbsolute(rel)) {
        throw new Error(`Security Violation: Artifact path "${targetPath}" escapes root dist/`);
      }

      return targetPath;
    },

    /**
     * Returns default browser launch options conforming to headless container environment
     */
    getBrowserOptions(customOptions = {}) {
      return {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
        ...customOptions,
      };
    },

    /**
     * Returns default viewport and context options
     */
    getContextOptions(customOptions = {}) {
      return {
        viewport: { width: 1280, height: 720 },
        recordVideo: {
          dir: artifactDir,
          size: { width: 1280, height: 720 },
        },
        ...customOptions,
      };
    },
  };
}
