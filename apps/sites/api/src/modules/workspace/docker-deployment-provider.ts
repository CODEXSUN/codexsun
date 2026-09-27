import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import type { SiteDeployment } from "../../../../contracts/workspace.js";

type DockerDeploymentConfiguration = {
  repositoryRoot: string;
  runtimeRoot: string;
};

export class DockerDeploymentProvider {
  constructor(private readonly configuration: DockerDeploymentConfiguration) {}

  async deploy(deployment: SiteDeployment): Promise<void> {
    const composeFile = this.writeComposeFile(deployment);
    const commonArguments = this.composeArguments(deployment, composeFile);
    await runProcess("docker", [...commonArguments, "--profile", "tools", "run", "--rm", "migrate"]);
    await runProcess("docker", [...commonArguments, "up", "-d", "--build", "--remove-orphans"]);
  }

  private writeComposeFile(deployment: SiteDeployment): string {
    const directory = join(this.configuration.runtimeRoot, deployment.clientSlug, deployment.environment);
    mkdirSync(directory, { recursive: true });
    const composeFile = join(directory, "docker-compose.yml");
    writeFileSync(
      composeFile,
      renderClientCompose({ repositoryRoot: this.configuration.repositoryRoot, deployment }),
      "utf8",
    );
    return composeFile;
  }

  private composeArguments(deployment: SiteDeployment, composeFile: string): string[] {
    return [
      "compose",
      "--project-name",
      projectName(deployment),
      "--env-file",
      join(this.configuration.repositoryRoot, ".env"),
      "--env-file",
      join(this.configuration.repositoryRoot, "apps/sites/api/.app.env"),
      "--file",
      composeFile,
    ];
  }
}

export function renderClientCompose(input: { repositoryRoot: string; deployment: SiteDeployment }): string {
  const { deployment, repositoryRoot } = input;
  const project = projectName(deployment);
  const apiPort = runtimePort(deployment.clientSlug, deployment.environment, 1);
  const webPort = runtimePort(deployment.clientSlug, deployment.environment, 0);
  const databasePath = `/workspace/storage/apps/${deployment.clientSlug}/private/data/${deployment.environment}.sqlite`;
  const buildContext = yamlValue(repositoryRoot);
  const dockerfile = yamlValue(join(repositoryRoot, "apps/sites/.container/Dockerfile"));
  const rootEnv = yamlValue(join(repositoryRoot, ".env"));
  const apiEnv = yamlValue(join(repositoryRoot, "apps/sites/api/.app.env"));
  return `name: ${project}

services:
  migrate:
    image: sites/${deployment.clientSlug}-api:${deployment.releaseTag}
    build:
      context: ${buildContext}
      dockerfile: ${dockerfile}
      target: api
    env_file:
      - ${rootEnv}
      - ${apiEnv}
    environment:
      APP_MODE: production
      AUTO_LOGIN: "0"
      NODE_ENV: production
      PLATFORM_HOST: 0.0.0.0
      SITES_API_PORT: "6260"
      SITES_CLIENT_SLUG: ${deployment.clientSlug}
      SITES_DATABASE_PATH: ${databasePath}
      SITES_DEPLOYMENT_PROVIDER: record-only
    command: ["node", "../../../dist/apps/sites/api/deployment-prepare.js"]
    profiles: ["tools"]
    volumes:
      - ${project}-data:/workspace/storage

  api:
    image: sites/${deployment.clientSlug}-api:${deployment.releaseTag}
    build:
      context: ${buildContext}
      dockerfile: ${dockerfile}
      target: api
    env_file:
      - ${rootEnv}
      - ${apiEnv}
    environment:
      APP_MODE: production
      AUTO_LOGIN: "0"
      NODE_ENV: production
      PLATFORM_HOST: 0.0.0.0
      SITES_API_PORT: "6260"
      SITES_CLIENT_SLUG: ${deployment.clientSlug}
      SITES_DATABASE_PATH: ${databasePath}
      SITES_DEPLOYMENT_PROVIDER: record-only
      SITES_WEB_ORIGIN: http://127.0.0.1:${webPort}
    volumes:
      - ${project}-data:/workspace/storage
    ports:
      - 127.0.0.1:${apiPort}:6260
    healthcheck:
      test: ["CMD-SHELL", "node -e \\"fetch('http://127.0.0.1:6260/api/v1/sites/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\\""]
      interval: 10s
      timeout: 5s
      retries: 12
    restart: unless-stopped

  web:
    image: sites/${deployment.clientSlug}-web:${deployment.releaseTag}
    build:
      context: ${buildContext}
      dockerfile: ${dockerfile}
      target: web
      args:
        VITE_SITES_CLIENT_SLUG: ${deployment.clientSlug}
        VITE_SITES_PUBLIC_URL: http://127.0.0.1:${webPort}
    depends_on:
      api:
        condition: service_healthy
    ports:
      - 127.0.0.1:${webPort}:80
    restart: unless-stopped

volumes:
  ${project}-data:
    name: ${project}-data
`;
}

function projectName(deployment: SiteDeployment): string {
  return `sites-${deployment.clientSlug}-${deployment.environment}`;
}

function runtimePort(slug: string, environment: SiteDeployment["environment"], offset: number): number {
  const known = ["codexsun", "devxcrew", "logicx", "skilloopz"].indexOf(slug);
  const index = known >= 0 ? known : stableHash(slug) % 50;
  const environmentOffset = environment === "development" ? 0 : environment === "staging" ? 100 : 200;
  return 7300 + index * 4 + environmentOffset + offset;
}

function stableHash(value: string): number {
  return [...value].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) % 10_000, 7);
}

function yamlValue(value: string): string {
  return JSON.stringify(value.replaceAll("\\", "/"));
}

function runProcess(command: string, argumentsList: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argumentsList, {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr = `${stderr}${chunk.toString()}`.slice(-4_000);
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(stderr.trim() || `${command} exited with code ${code ?? "unknown"}.`)),
    );
  });
}
