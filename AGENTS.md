# Workspace Boundary

The primary repository is `E:\codexsun\codexsun`. Approved CODEXSUN sibling
repositories may be used for the multi-repository migration under
`E:\codexsun\<repository>`. The approved integration workspace is
`D:\workspace`.

- Use only `E:\codexsun\codexsun` or an explicitly approved direct child repository.
- Use `D:\workspace` only as the approved multi-repository integration workspace.
- Treat every repository inside `D:\workspace` as an independent Git repository.
- Commit and push changes from the repository that owns the changed files.
- Before each repository command, verify the working directory and its Git root.
- Read and edit only the selected repository and its approved sibling scope.
- Do not access unrelated paths under `E:\codexsun` or outside `D:\workspace`.
- Ask the user before creating, deleting, resetting, switching, or force-pushing any repository.
- Do not use destructive Git commands unless the user approves the exact target and operation.
- Keep each repository change separate. Commit and push from the repository that owns the change.

## Documentation

- Start each repository-owned Markdown document with one clear `# Title` heading as its first nonblank line. Use a descriptive application or topic name, not a generic sample title.
- Follow the title with a concise purpose statement; organize the remaining content under `##` and `###` headings.
- Keep documentation current with completed work, configuration, storage, and verification. Distinguish implemented behavior from plans and never include credentials.
- Follow `assist/documentation/standards.md`. DOCX automatically indexes repository-owned Markdown; do not maintain sample document lists or duplicate source documents for the viewer.
