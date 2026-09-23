# Tools

The gateway exposes registry, workspace, app lifecycle, test, migration, runtime, and constrained terminal tools. `terminal.exec` permits only `git status`, approved npm test/check/lint/build commands, and Cargo test/check. Shells, network commands, credential access, destructive commands, and generated dependency directories are blocked.
