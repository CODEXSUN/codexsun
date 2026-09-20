import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { GitHubProvider, githubRepository } from "../github-provider.js";

test("validates the CXForge task contract used by Zuno", () => {
  const taskSchema = z.object({ title: z.string().trim().min(3), repository: z.string().trim().min(1), ownedPaths: z.array(z.string().trim().min(1)).min(1) });
  assert.equal(taskSchema.safeParse({ title: "Dispatch worker", repository: "repo", ownedPaths: ["apps/zuno"] }).success, true);
  assert.equal(taskSchema.safeParse({ title: "No", repository: "repo", ownedPaths: [] }).success, false);
});

test("GitHub provider creates and merges pull requests with versioned REST requests", async () => {
  const requests: { body: string; method: string; url: string }[] = [];
  const provider = new GitHubProvider({
    apiUrl: "https://api.github.test",
    token: "test-token",
    request: async (url, init) => {
      requests.push({ body: String(init?.body), method: init?.method ?? "", url: String(url) });
      return String(url).endsWith("/merge")
        ? new Response(JSON.stringify({ merged: true, message: "Pull Request successfully merged" }), { status: 200 })
        : new Response(JSON.stringify({ html_url: "https://github.com/codexsun/codexsun/pull/17", number: 17 }), { status: 201 });
    },
  });

  const created = await provider.createPullRequest({ baseBranch: "main", description: "Verified change", repository: "https://github.com/codexsun/codexsun.git", sourceBranch: "cxforge/task-1", title: "Review handoff" });
  await provider.mergePullRequest("codexsun/codexsun", created.externalId);

  assert.deepEqual(requests.map(({ method, url }) => `${method} ${url}`), [
    "POST https://api.github.test/repos/codexsun/codexsun/pulls",
    "PUT https://api.github.test/repos/codexsun/codexsun/pulls/17/merge",
  ]);
  assert.deepEqual(JSON.parse(requests[0].body), { base: "main", body: "Verified change", head: "cxforge/task-1", title: "Review handoff" });
  assert.equal(created.url, "https://github.com/codexsun/codexsun/pull/17");
});

test("GitHub repository parsing rejects local workspace paths", () => {
  assert.equal(githubRepository("git@github.com:codexsun/codexsun.git"), "codexsun/codexsun");
  assert.equal(githubRepository("https://github.example.com/codexsun/codexsun.git"), "codexsun/codexsun");
  assert.throws(() => githubRepository("apps/zuno/api"), /GitHub owner\/repository/u);
});
