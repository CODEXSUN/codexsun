# Zetro Markdown Chat Rendering

## Outcome

Zetro composes assistant Markdown as clean semantic HTML in chat history. The
same renderer runs in the browser and the Tauri desktop app.

## Authoritative references

- Owner README: `apps/zetro/web/src/modules/agent-chat/README.md`
- Application catalog: `assist/modules/zetro.md`
- Architecture contract: `assist/architecture/module-standard.md`
- Local skill: `assist/skills/web-ui.md`

## Ownership and boundaries

The Agent Chat web module owns message formatting and safe HTML composition.
The API continues to store the original Markdown text. The renderer does not
accept raw provider HTML or load remote assets.

## Binding properties

| Producer       | Consumer       | Binding                  | Version or key                |
| -------------- | -------------- | ------------------------ | ----------------------------- |
| Chat API       | Agent Chat web | Assistant Markdown text  | `zetro.chat.api@^0.10.0`      |
| Agent Chat web | React DOM      | Safe semantic elements   | `zetro.agent-chat.web@0.10.0` |
| Tauri host     | Agent Chat web | Shared production bundle | `frontendDist`                |

## Parallel work

The worktree contained unrelated changes. This work changed only the Agent Chat
renderer, its focused test, package bindings, and Zetro documentation.

## Decisions

- Decision: Use `react-markdown` with GitHub Flavored Markdown support.
- Reason: It composes React elements and ignores unsafe raw HTML.
- Rejected alternative: Inject parsed HTML with `dangerouslySetInnerHTML`.
- Decision: Load the Markdown renderer as a separate local chunk.
- Reason: The eager bundle exceeded the repository 400 KB limit.
- Rejected alternative: Raise or silence the chunk warning limit.

## Interface review

- Spacing: Lists and paragraphs use a consistent vertical rhythm.
- Typography: Headings, body text, and code have distinct readable weights.
- Contrast: Links and code use restrained theme colors.
- Alignment: Bullets and table cells keep stable content lanes.
- Fit: Long code and tables scroll inside the message width.
- Repetition: The renderer uses plain content surfaces except for code and tables.

## Verification

- Command: `npm.cmd run test --workspace @codexsun/zetro-web`
- Result: The semantic HTML and unsafe raw HTML test passed.
- Command: Zetro web type check, lint, and production build.
- Result: All commands passed without warnings.
- Browser result: Lists, paragraphs, and inline code rendered as semantic HTML.
- Browser result: The browser console had no errors or warnings.
- Bundle result: The main chunk was 282.25 KB. The lazy renderer was 156.10 KB.
- Live result: Conversation creation took 18.2 ms against the installed desktop API.
- Live result: A connected Codex turn returned `Ready.` in 7.23 seconds.
- Version result: The aligned workspace and Windows installer version is 0.1.6.
- Installer result: WiX produced the 0.1.6 x64 MSI with SHA-256 `D4B7E6B91594B276A605FB5403B59BF81398FA57B4C22093687DBEAB680658FD`.
- Not run: The updated MSI was not installed over the current desktop app.

## Follow-up work

One unregistered disposable test directory remains in the desktop worktree root.
Git removed its worktree registration, but the current tool policy blocked the
final directory deletion.
