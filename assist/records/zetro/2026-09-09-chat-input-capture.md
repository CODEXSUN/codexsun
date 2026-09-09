# Zetro Chat Input Capture

Date: 2026-09-09

## Outcome

Zetro now accepts chat images and files from the picker, drag and drop, and the
clipboard. The composer previews images and turns clipboard text of 4,000 or
more characters into a named text attachment. It accepts four files of 4 MB
each before submission.

The shared React module owns this behavior for the web and Tauri desktop builds.
There is no separate desktop implementation.

## Ownership and processing

`zetro.agent-chat.web` owns input capture, limits, previews, and long-paste
conversion. `zetro.chat.api` owns prompt assembly and provider routing. The
Codex connection sends images as multimodal App Server inputs. It writes other
files to the isolated conversation input directory.

The provider prompt tells Codex to identify file formats and inspect visible
text, screenshots, diagrams, and drawings. This uses Codex image understanding;
Zetro does not maintain a second OCR service or extracted-text store.

## Safety

The browser rejects source files larger than 4 MB and keeps the existing
four-attachment limit. The API validates Data URLs and applies its encoded-size
limit. Files stay associated with the selected conversation and scoped worktree.

## Verification

- Attachment conversion tests: Passed.
- Chat attachment guidance test: Passed.
- Zetro web and API type checks, tests, lint, and builds: Passed.
- Tauri desktop tests and type check: Passed.
- The largest Zetro web JavaScript chunk is 354.03 KB: Passed.
- Application docs, module docs, module boundaries, file lengths, versions, and
  `git diff --check`: Passed.
- Module dependencies remain blocked by the concurrent Project Tasks binding to
  `zetro.tasks.api` version `^0.4.0` while the module is version `0.5.0`.
- The repository format check remains blocked by nine unrelated Orship,
  Platform Identity, and Platform web files.
- Live image interpretation and a packaged desktop visual check: Not run.
