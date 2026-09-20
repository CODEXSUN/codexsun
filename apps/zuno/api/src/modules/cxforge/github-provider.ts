export interface PullRequestDraft {
  readonly baseBranch: string;
  readonly description: string;
  readonly repository: string;
  readonly sourceBranch: string;
  readonly title: string;
}

export interface PullRequestRecord {
  readonly externalId: string;
  readonly provider: "github";
  readonly url: string;
}

export interface GitProvider {
  readonly configured: boolean;
  createPullRequest(draft: PullRequestDraft): Promise<PullRequestRecord>;
  mergePullRequest(repository: string, externalId: string): Promise<void>;
}

interface GitHubProviderOptions {
  readonly apiUrl: string;
  readonly request?: typeof fetch;
  readonly token?: string;
}

export class GitHubProvider implements GitProvider {
  readonly configured: boolean;
  private readonly request: typeof fetch;

  constructor(private readonly options: GitHubProviderOptions) {
    this.configured = Boolean(options.token);
    this.request = options.request ?? fetch;
  }

  async createPullRequest(draft: PullRequestDraft): Promise<PullRequestRecord> {
    const repository = githubRepository(draft.repository);
    const result = await this.requestJson<{ html_url: string; number: number }>(`/repos/${repository}/pulls`, {
      body: JSON.stringify({ base: draft.baseBranch, body: draft.description, head: draft.sourceBranch, title: draft.title }),
      method: "POST",
    });
    return { externalId: String(result.number), provider: "github", url: result.html_url };
  }

  async mergePullRequest(repositoryValue: string, externalId: string): Promise<void> {
    const repository = githubRepository(repositoryValue);
    const pullNumber = Number(externalId);
    if (!Number.isSafeInteger(pullNumber) || pullNumber < 1) throw new Error("GitHub pull request number is invalid.");
    const result = await this.requestJson<{ merged: boolean; message: string }>(`/repos/${repository}/pulls/${pullNumber}/merge`, {
      body: JSON.stringify({ merge_method: "squash" }),
      method: "PUT",
    });
    if (!result.merged) throw new Error(result.message || "GitHub did not merge the pull request.");
  }

  private async requestJson<T>(path: string, init: RequestInit): Promise<T> {
    if (!this.options.token) throw new Error("GitHub pull requests are not configured.");
    const response = await this.request(`${this.options.apiUrl.replace(/\/$/u, "")}${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.options.token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}.`);
    return response.json() as Promise<T>;
  }
}

export function githubRepository(value: string): string {
  const trimmed = value.trim().replace(/\.git$/u, "");
  const ssh = /^git@[^:]+:([^/]+\/[^/]+)$/u.exec(trimmed);
  if (ssh) return ssh[1];
  if (/^[^/:]+\/[^/]+$/u.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    const repository = url.pathname.replace(/^\//u, "");
    if (/^[^/]+\/[^/]+$/u.test(repository)) return repository;
  } catch {
    // The validation error below is clearer than the URL parser error.
  }
  throw new Error("Repository must be a GitHub owner/repository value or GitHub clone URL.");
}
