# Versioning and GitHub Workflow

## Ownership

The root tools own repository-wide version alignment, changelog entries, and
interactive GitHub commits. They update every npm workspace and the root
lockfile together. They do not publish a package or create a release tag.

## Commands

```powershell
npm.cmd run version:show
npm.cmd run version:bump -- --title "Docs navigation" --no-database-update
npm.cmd run check:versions
npm.cmd run github:now -- --dry-run
npm.cmd run github:now
```

`version:bump` increases the patch version, updates CODEXSUN workspace package
versions and internal `@codexsun/*` dependency ranges, then records a changelog
entry. It also updates the Zetro Tauri and Rust package versions. Provide one
database flag when the impact is known.

`github:now` first shows the current version, proposed commit subject, and
changed-file count. It optionally asks for a version bump and title, then asks
for a final commit-message review and confirmation before it fetches, rebases,
stages, commits, or pushes. `--dry-run` does not mutate Git or versions.

## Safety

Review the changed-file list before confirmation. The command stages all
repository changes, so unrelated work must be removed or committed separately
before using it. It skips pull only when the branch has no upstream.
