import { AddonService, createAddonProvider as createProvider, type AddonDefinition } from "@codexsun/addon-runtime";
export { routes } from "./api.js";

export const definition: AddonDefinition = {
  "id": "gitflow",
  "label": "Gitflow",
  "purpose": "Developer collaboration around repositories, branches, commits, issues, pull requests, and development workflows",
  "areas": [
    "repositories",
    "pull requests",
    "webhooks"
  ],
  "contracts": [
    "gitflow.v1"
  ],
  "publishedEvents": [
    "gitflow.commit.created",
    "gitflow.pull_request.created"
  ]
};

export function createAddonProvider() {
  return createProvider(definition);
}

export class GitflowService extends AddonService {
  constructor() {
    super(definition);
  }

  recordPullRequest(input: { authorId: string; repositoryId: string; title: string }) {
    return { ...this.create({ title: input.title, ownerId: input.authorId, metadata: { repositoryId: input.repositoryId } }), repositoryId: input.repositoryId };
  }
}

export function createGitflowService() {
  return new GitflowService();
}
