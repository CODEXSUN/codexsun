#!/usr/bin/env node

import {
  approveWorktree,
  createWorktree,
  developWorktree,
  mergeWorktree,
  reviewWorktree,
  showWorktreeGuide,
  verifyWorktree,
} from "./app-worktree.mjs";

function main() {
  const [area, action, scope, task, ...options] = process.argv.slice(2);
  if (area !== "app") throw new Error("Use: codexsun app <create|verify|develop|review|guide|approve|merge> <scope> <task>.");

  const handlers = {
    approve: () => approveWorktree(scope, task, optionValue(options, "--approved-by")),
    create: () => createWorktree(scope, task),
    develop: () => developWorktree(scope, task),
    guide: () => showWorktreeGuide(scope, task),
    merge: () => mergeWorktree(scope, task),
    review: () => reviewWorktree(scope, task),
    verify: () => verifyWorktree(scope, task),
  };
  if (!handlers[action]) throw new Error("Unknown app command.");

  const result = handlers[action]();
  console.log(typeof result === "string" ? result : JSON.stringify(result, null, 2));
}

function optionValue(options, name) {
  const index = options.indexOf(name);
  return index === -1 ? "" : options[index + 1] ?? "";
}

try {
  main();
} catch (error) {
  console.error(`\n  Error: ${error.message}\n`);
  process.exit(1);
}
