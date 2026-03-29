# Git Helper Usage

## Purpose

Codexsun includes a dedicated GitHub helper under `apps/cli` for staging, committing, rebasing, and pushing from one command flow.

The helper reads the latest reference number and title from [CHANGELOG](/E:/Workspace/codexsun/ASSIST/Documentation/CHANGELOG.md) and formats commit subjects like:

```text
#11 - CLI GitHub helper baseline
```

## Available Commands

Interactive source-mode helper:

```bash
npm run github
```

Immediate source-mode helper:

```bash
npm run github:now
```

Interactive built helper:

```bash
npm run github:server
```

Immediate built helper:

```bash
npm run github:server:now
```

## Interactive Flow

Run:

```bash
npm run github
```

Typical output:

```text
Codexsun GitHub Helper
Repository: E:/Workspace/codexsun
Branch: main
Upstream: origin/main
Sync: up to date
Changes: staged 0, unstaged 9, untracked 2
The repository has uncommitted changes. Stage all changes and create a commit? [Y/n]
Commit message body for #11 - [CLI GitHub helper baseline]:
```

Behavior:

1. inspects repository root, branch, upstream, and dirty state
2. blocks execution if merge, rebase, cherry-pick, or similar git operations are already in progress
3. stages all changes if you confirm
4. uses the latest changelog title as the default commit body when you press Enter
5. formats the final commit subject as `#<ref> - <message>`
6. checks whether the branch is behind upstream
7. offers `pull --rebase --autostash` if needed
8. pushes the branch, including first-push upstream setup when required

## Immediate Flow

Use the non-interactive command when you want commit and push immediately:

```bash
npm run github:now
```

This command:

1. auto-confirms commit, rebase, and push prompts
2. uses the latest changelog title as the commit body by default
3. commits as `#<ref> - <title>`
4. pushes immediately after the commit and any required rebase

## Passing A Custom Message

You can pass your own commit body after `--`:

```bash
npm run github:now -- feat(cli): add immediate push mode
```

This becomes:

```text
#11 - feat(cli): add immediate push mode
```

You can also use the explicit message flag:

```bash
npm run github -- --message "fix(cli): normalize commit format"
```

Or:

```bash
npm run github:now -- --message "docs(cli): add helper usage guide"
```

## Commit Reference Rules

The helper does not ask you to type the reference number.

It always reads the latest heading from `ASSIST/Documentation/CHANGELOG.md`, for example:

```md
### [#11] 2026-03-29 - CLI GitHub helper baseline
```

From that entry it derives:

1. reference number: `11`
2. default message body: `CLI GitHub helper baseline`

If you type a message that already starts with a reference, the helper rewrites it to the current one.

Example input:

```text
#4 - fix(cli): normalize helper
```

Final commit:

```text
#11 - fix(cli): normalize helper
```

## Safety Rules

The helper intentionally stops in these cases:

1. detached `HEAD`
2. rebase in progress
3. merge in progress
4. cherry-pick in progress
5. revert in progress
6. bisect in progress
7. failed rebase or push

Conflict resolution remains manual. If `pull --rebase` fails, finish the conflict resolution yourself and rerun the helper.

## Notes

1. the helper stages all changes with `git add -A`
2. it is designed for whole-change commits, not selective partial staging
3. it stays native to Node and standard git commands
4. it is an operational helper, not a replacement for release tagging or review discipline
