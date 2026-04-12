# Zetro Walkthrough

This is the human walkthrough.

## Open The Dashboard

Run the dev server if it is not already running:

```powershell
npm.cmd run dev
```

Open:

```text
http://localhost:5173/dashboard/apps/zetro
```

Available pages:

1. Overview
2. Claude Analysis
3. Playbooks
4. Rollout Plan
5. Runs
6. Findings
7. Review Lanes
8. Memory (Phase 2.1)
9. Guardrails
10. Settings

## Use The Terminal

From the repo root:

```powershell
npm.cmd run zetro -- help
```

Useful commands:

```powershell
npm.cmd run zetro -- summary
npm.cmd run zetro -- playbooks
npm.cmd run zetro -- playbook feature-dev
npm.cmd run zetro -- playbook-validate smart-security-review
npm.cmd run zetro -- playbook-evaluate smart-security-review --run <runId>
npm.cmd run zetro -- modes
npm.cmd run zetro -- guardrails
npm.cmd run zetro -- runs
npm.cmd run zetro -- findings
npm.cmd run zetro -- review-lanes
npm.cmd run zetro -- review-summary --run <id>
npm.cmd run zetro -- loop <runId>
npm.cmd run zetro -- loop-start --run <id> [--max <n>] [--timeout <ms>]
npm.cmd run zetro -- loop-stop --run <id>
npm.cmd run zetro -- loop-cancel --run <id>
npm.cmd run zetro -- loop-events --run <id>
npm.cmd run zetro -- memory-search "SQL injection"
npm.cmd run zetro -- memory-similar --title "XSS" --summary "Cross-site scripting vulnerability"
npm.cmd run zetro -- memory-store --finding <id> --content "Security finding text"
npm.cmd run zetro -- memory-list
npm.cmd run zetro -- memory-stats
npm.cmd run zetro -- router-info
npm.cmd run zetro -- router-test "write a React component"
npm.cmd run zetro -- plan "build persisted playbooks"
npm.cmd run zetro -- chat
```

## What The Terminal Can Do Today

It can:

1. Print the current Zetro catalog.
2. Show playbooks and phases.
3. Show output modes.
4. Show guardrail templates.
5. Show sample runs.
6. Show sample findings.
7. Create a maximum-output plan scaffold.
8. Run a local interactive `zetro>` prompt.
9. Control loop iterations (start, stop, cancel).
10. Show loop state and iteration events.
11. Search semantic memory for similar findings.
12. Store content in vector memory.
13. Show memory statistics.

It cannot yet:

1. Execute commands.
2. Write files from a prompt.
3. Use the network.
4. Run an autonomous loop without operator control.

That is intentional.

## First Human Test

Run:

```powershell
npm.cmd run zetro -- chat
```

Then type:

```text
summary
playbooks
playbook feature-dev
plan create persisted run console
exit
```

Expected result:

Zetro prints structured static output and exits without side effects.
