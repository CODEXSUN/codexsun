# Zetro2 Architecture and Source Ownership

## Product flow

```text
Actor on laptop or mobile
  → Zetro2 web: plan and submit a task or prompt
  → approved task and scoped Agent Run
  → agent understands the repository and edits code
  → tests and Zbrowser development preview
  → user verifies changes and supplies feedback
  → next task or another run on the same task
```

The web app is the main planning and control surface.
The customized editor provides direct file work, terminal access, diffs, and connected AI chat.
Zbrowser starts the selected registered development target from the same checkout the agent edits.
User feedback stays linked to the task, run, preview revision, and acceptance criteria.
Human acceptance and automated evidence determine completion; a running preview alone does not.

## Private application source

Use `devkits/zetro2/` as the single owner of Zetro2-authored product source.
Keep API modules, web modules, editor changes, integration adapters, and runtime scripts inside this app.
Do not import private ZCode or Zetro implementation files.
Copy any needed app-owned implementation through an explicit inventory, adaptation, and verification task.
Shared repository packages remain dependencies through public contracts; do not duplicate their source into the app.
Third-party dependencies and copied upstream sources retain their licenses and notices.
Zetro2-authored custom code is intended to be proprietary and privately distributed.
Confirm repository visibility, distribution access, and license scope before publishing any artifact.
Folder placement alone does not make source private or change the upstream license.

```text
devkits/zetro2/
  agent/                 plan, architecture, tasks, automation, Memory Bank design
  api/src/modules/        access, tasks, coding, knowledge, integrations, runtime, automation
  web/src/modules/        planning, task board, chat, approvals, preview, administration
  zvcode/             copied editor source and direct custom refactoring
  editor/                extension bridge, branding, source-change map
  zbrowser/              app-owned development-target and preview management source
  .container/            build definitions, private network, services, lifecycle scripts
```

## OpenVSCode source import and wiring

Copy `apps/temp/openvscode-server` into `devkits/zetro2/zvcode`.
Prefer copying so the original reference remains available; moving or deleting it is not required.
Inspect destination conflicts and upstream local changes before import.
Exclude Git metadata, dependencies, caches, generated outputs, and runtime secrets.
Preserve source notices and record the import origin and content identity.

Maintain the copied source as the Zetro2 editor implementation and refactor it directly.
Do not restrict Zetro2 to a pinned upstream editor release or prebuilt upstream editor image.
Build the editor from the current reviewed Zetro2 source for each deployment.
Record source revision and image digest so a built result can be tested and rolled back.
Recording a build identity does not freeze future editor development.

Wire authentication, workspace attachment, native chat, model/backend selection,
tool approvals, file context, changes, run history, and preview navigation to the Zetro2 API.
Keep core task, policy, and agent logic in the API-owned modules.
Use explicit compatibility tests before adopting later upstream source changes.

## One private Docker environment

Use one managed Compose environment per authorized development workspace.
An environment contains multiple internal services, not necessarily one container.
The API product modules form one modular API service; editor, backend, and preview services remain isolated where needed.

```text
Authenticated HTTPS ingress
  ├── Zetro2 web and API
  ├── customized editor
  └── authorized Zbrowser preview routes
           │
Private Docker network
  ├── agent backend services
  ├── development workspace and application services
  ├── browser execution service
  └── private state and evidence storage
```

The CODEXSUN working checkout, dependencies, commands, editor, tests, and development processes live inside Docker.
Use a persistent Docker volume for the checkout; do not require a writable host repository mount.
Editor, agent, and Zbrowser resolve the same workspace ID and checkout revision.
The development checkout is separate from installed Zetro2 control-service code and its credentials.
Editing application code must not silently change or restart the running control plane.
Use an explicit rebuild/update operation to deploy Zetro2 changes after verification.

Private access applies even between components: authenticate service calls and scope workspace credentials.
Expose only the authenticated ingress; keep backend, database, editor, and preview ports private.
Protect preview HTTP, WebSocket, HMR, downloads, and reconnect paths with the same access policy.
Previewed applications can contain untrusted code; isolate their browser origin from the control UI and its session cookies.
Allow configured outbound model/package access without opening public inbound runtime ports.
Keep human and agent access scoped; sharing one environment does not grant every user every capability.
Do not mount the host Docker socket in editor, backend, or preview services.

## Build, data, and acceptance

Keep authored source inside Zetro2 while following repository-wide output and storage contracts.
Host build artifacts stay under root `dist/zetro2/` and scoped application data uses the storage provider.
Inside Docker, mount persistent data at configured private storage paths.
Document the upstream editor's isolated build requirements without creating host-side nested dependency trees.

Verify login → plan → approve → agent edit → test → authenticated preview → user feedback → revised run.
Prove editor and preview use the same changed checkout and display the intended task/run revision.
Test HMR, session revocation, readonly roles, preview isolation, restarts, backup, and restore.
Keep production release, source visibility changes, and public distribution outside automatic task execution.
