# Line Endings

## Rule

All repository text files use LF endings. The root `.gitattributes` file is the repository authority.

Do not depend on a developer's `core.autocrlf` setting. Binary assets are excluded from text conversion.

## Commands

Run this before review or staging:

```text
npm.cmd run fix:line-endings
node tools/line-endings.mjs check
```

`fix:line-endings` converts tracked and unignored text files from CRLF or CR to LF. It does not stage files.

The direct check stops when a repository text file has CRLF, mixed, or CR endings.

## Commit Workflow

`npm.cmd run github:now` normalizes text endings before it shows the changed-file review. It checks endings again before `git add -A`.

Review the normalized files before you confirm the Git operation. Do not stage files before the check passes.
