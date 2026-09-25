export type WorkspaceStage = "registered" | "configured" | "running";

export type WorkspaceHost = {
  configured: boolean;
  envFile: string;
  kind: "api" | "web" | "desktop" | "mobile";
  port: number;
  running: boolean;
  stage: WorkspaceStage;
  target: string;
  url: string;
  workspace: string;
};

export type WorkspaceDocumentation = {
  path: string;
  scope: "assist" | "application";
  title: string;
};

export type WorkspaceProject = {
  category: "business" | "devkit" | "platform";
  documentation: WorkspaceDocumentation[];
  hosts: WorkspaceHost[];
  id: string;
  label: string;
  owner: string;
  providers: string[];
  stage: WorkspaceStage;
};

export type WorkspaceSnapshot = {
  documentation: WorkspaceDocumentation[];
  generatedAt: string;
  projects: WorkspaceProject[];
  summary: {
    configuredHosts: number;
    documentationCount: number;
    projectCount: number;
    runningHosts: number;
  };
};

export type AddonCatalogItem = {
  areas: string[];
  contracts: string[];
  dataLifecycle: { compatibility: string; migrations: string[]; seeders: string[] };
  dataRetention: string;
  dependencies: string[];
  events: string[];
  enabled: boolean;
  id: string;
  label: string;
  owner: string;
  package: string;
  providerId: string;
  purpose: string;
};

export type AddonCatalogSnapshot = {
  addons: AddonCatalogItem[];
  generatedAt: string;
  summary: { addonCount: number; enabledCount: number; dependencyCount: number };
};
