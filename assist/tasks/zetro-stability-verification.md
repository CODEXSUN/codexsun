# Zetro stability verification

Use a new Zetro chat after the candidate source is committed and its matching desktop installer is installed.
Select application zetro, module agent-chat, folder apps/zetro. Choose Review.

## Verification prerequisites

The supervisor commits the reviewed candidate before a new chat creates its worktree.
Find the repository root with `git rev-parse --show-toplevel` before reading root guidance.
The selected working directory is an application folder, not the repository root.
Check the installed executable version separately from package manifests.
Do not install dependencies in each conversation worktree or link its packages to another checkout.
Run deterministic checks through trusted repository tools in the dependency-ready primary checkout.
Confirm that checkout and the review worktree have the same commit and no source differences.
If trusted tools are unavailable, consume recorded evidence and report that live execution is blocked.
Do not retry missing commands inside an unprepared worktree.

## Copyable prompt

Verify Zetro 0.1.27 for supervised development. Do not implement business features or silently fix failures.
Resolve the repository root with git rev-parse --show-toplevel first.
Read root AGENTS.md, README.md, Assist guidance, and assist/records/zetro/2026-09-10-stability-0.1.27.md from that root.
Confirm repository commit, source version, installed desktop version, connected project, scope, and isolated worktree.
If these do not match, report BLOCKED before proceeding. Preserve unrelated work and existing conversations.
Check valid and invalid workspace scopes, approved documentation paths, and rejection of traversal or application/module mismatch.
Verify successful and failed chat responses, saved history, bounded activity details, and distinct Automation timeline, response, and report.
Use trusted repository tools to run the documented Zetro tests, typecheck, lint, build, and boundary checks.
Run these only in the dependency-ready primary checkout at the same clean commit, not the dependency-free review worktree.
Do not infer the installed desktop version from source manifests. Verify executable metadata or report NOT VERIFIED.
Do not bypass scope restrictions if a command requires root build output or cache access. Report the missing tool approval.
Use only explicitly approved disposable fixtures for write tests. Never probe or change another real application.
Separate requested permissions from proven sandbox enforcement. Treat the known sibling-write isolation issue as unresolved unless new evidence proves denial.
Do not restart the installed application, install software, alter credentials, migrate existing databases, commit, push, or deploy.
List restart, native UI, cancellation, and any other checks you cannot perform as NOT VERIFIED. Do not infer a pass from source tests.
Return a concise table: check, PASS/FAIL/BLOCKED/NOT VERIFIED, evidence, and next action.
Finish with separate verdicts for supervised development and unattended production. Do not say stable while required gates remain open.
