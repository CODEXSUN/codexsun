# Live execution visuals

## Outcome and ownership

Root version `0.1.22`. Automation web `0.4.0` adds observed execution signals.
`packages/ui` owns the new Execution Status block and the motion-safe Spinner and Progress behavior.
The public block uses `state`, `title`, `description`, `elapsed`, `metrics`, and `animated`.
Zetro owns state mapping, task polling, counters, navigation, and actions.
UIUX owns the interactive specimen at `/?block=execution-status`.

The active ring and indeterminate bar indicate execution, not estimated completion.
Stale task feeds stop active motion. Queued and terminal runs remain static.
View options and reduced-motion settings can disable activity animation.
The existing two-second snapshot feed remains unchanged. No SSE, synthetic graph, or private reasoning was added.
This change adds no database migration, provider permission, or automatic publication authority.

## References and bindings

- [Shared block contract](../../../packages/ui/src/blocks/execution-status/README.md)
- [Automation owner](../../../apps/zetro/web/src/modules/automation/README.md)
- [Previous desktop verification](2026-09-10-desktop-0.1.21.md)

## Parallel work and release scope

Existing Framework and Platform Identity repairs were reviewed and committed separately as `ac75fdf`.
Version metadata spans all workspaces through the canonical helper.
Commit staging must use an explicit reviewed file set because the Git helper stages all changes.
Business readiness still requires the documented Framework, Platform, and adoption release gates.

## Verification

`npm.cmd run check` passed across all workspace builds, types, lint, formatting, ownership,
documentation, runtime, Framework, Zetro, Identity, and server lifecycle tests.
Expected negative readiness tests emitted their asserted 503 warnings. Builds had no warnings.
Six Automation tests and three shared Execution Status rendering tests passed.
The final UIUX build and UI/UIUX lint passed after the Overview specimen was added.
`check:build-output` passed for 687 chunks. Zetro's largest chunk was 390.96 KB.
UIUX's largest chunk was 393.03 KB. Both remain below the 400 KB limit.

Browser checks covered the gallery active, complete, attention, and motion-pause states.
Paused ring and bar computed animation names were both `none`.
The indeterminate progress bar had no fabricated `aria-valuenow`.
The gallery reported no console errors or warnings. Zetro navigation and View options rendered.
Preflight restarted the development web/API after the new public export was added.

The MSI build passed. Upgrade from `0.1.21` returned exit code 0 and installed metadata reports `0.1.22`.
Backup: `storage/app/private/backups/zetro-0.1.21-before-0.1.22/zetro.sqlite`.
Installer: `dist/apps/zetro/desktop/target/release/bundle/msi/Zetro_0.1.22_x64_en-US.msi`.
SHA-256: `C1C01C1C80678966D6FAEAF2D7C8349072C9277A3648E8F858817360D3F8DF0E`.
The installed desktop passed readiness and authenticated supervisor capability checks on port `16050`.
Packaged runtime tests passed authorization, trust denial, named-script output, shutdown, and port release.

The installer remains unsigned. Native populated-run visual checks, Docker deployment,
cross-app identity adoption, and full business acceptance remain separate gates.
The source release uses explicit staging and a normal push, not a force push or public binary publication.
