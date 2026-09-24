# Zetro2 Memory Bank Design

Status: planned, not implemented. Parent: [planning.md](planning.md). Execution: [task.md](task.md).
The Memory Bank provides structured, reviewed project documentation across tasks and coding sessions.
It belongs to Zetro2's product architecture, not the assistant's personal memory folder.

## Ownership and sources of truth

The Zetro2 knowledge module owns documents, versions, review state, provenance, and retrieval metadata.
It uses public storage, search, identity, and audit contracts.
Work management owns tasks and decisions. Coding owns runs, checkpoints, and execution evidence.
The Memory Bank links those records rather than becoming another mutable task or run database.

| Information                      | Authority                                                     |
| -------------------------------- | ------------------------------------------------------------- |
| Repository behavior              | Current source and verified results on an identified revision |
| Requirements and delivery status | Versioned task and project records                            |
| Permissions and approvals        | Current identity and policy services                          |
| Reviewed project knowledge       | Approved Memory Bank document revisions                       |
| Generated summaries              | Labeled drafts with source references                         |
| Executed actions and results     | Run events and verification evidence                          |

Memory can inform an agent but cannot grant permission, complete a task, or prove a test passed.
Keep agent instructions and skills separate from factual project knowledge.
Resolve disagreement through source verification and a recorded correction, not silent summary replacement.

## Structured documentation

Each bank has an index and document kinds with stable IDs and explicit ownership.
Filenames below describe the export layout; create only documents relevant to the project.

| Document           | Purpose and update rule                                                         |
| ------------------ | ------------------------------------------------------------------------------- |
| README.md          | Index, owners, scope, review rules, and links                                   |
| project-brief.md   | Purpose, intended outcomes, boundaries, and project references                  |
| product-context.md | User needs, workflows, terminology, and product constraints                     |
| system-patterns.md | Approved architecture, module boundaries, and reusable patterns                 |
| tech-context.md    | Stack, setup, environments, dependencies, and verified commands                 |
| active-context.md  | Current focus and open questions with task/run links; expires quickly           |
| progress.md        | Read-only projection of task/milestone status with refresh timestamp            |
| decisions/         | Linked decision records with rationale, alternatives, and supersession          |
| runbooks/          | Verified development, testing, deployment, recovery, and maintenance procedures |
| lessons/           | Evidence-backed recurring failures and successful practices                     |

Document metadata includes ID, kind, project, repository, scope, owner, author,
revision, status, timestamps, source references, content hash, and verification date.
Record branch/base revision where knowledge depends on code and a review deadline where needed.
Use draft, approved, stale, superseded, and archived states.
Keep uncertainties explicit; do not label model confidence as factual verification.

## Storage and optional repository export

Use module-owned metadata and version repositories with checksummed migrations.
Store private document bodies through the storage provider under
`storage/apps/private/zetro2/knowledge/`, scoped by authorized workspace and project.
Large source artifacts remain in their original store and are referenced by ID.
Indexes are derived data and must be rebuildable from approved versions.

An optional explicit export writes reviewed Markdown to an approved repository documentation folder.
For this repository, integrate with existing Assist documents rather than creating competing authority.
The export requires workspace.write and an exact destination scope; it does not automatically commit or push.
Record the source document revision and export digest.
Import local edits as proposed revisions with a conflict preview; never synchronize changes in both directions silently.
Do not duplicate secrets, raw conversations, credentials, or unrelated user data in documentation.

## Capture, review, and maintenance

1. Initialize the index from existing authorized documentation and repository evidence.
2. Link the current task, requirements, source revision, and relevant prior decisions.
3. At a checkpoint or task completion, propose a concise documentation change.
4. Show the proposed diff, supporting evidence, author, and affected documents.
5. Publish only after the configured reviewer or explicitly authorized publication policy approves it.
6. Preserve prior revisions and link replacements through supersession records.

Model-generated notes remain drafts until the publication gate passes.
A successful run does not automatically establish a reusable fact or promote its whole transcript.
Use optimistic revision checks to preserve concurrent human edits.
Project status projections refresh from authoritative task records and are never manually declared complete.
Human corrections remain attributable and do not rewrite historical run snapshots.

Changes to referenced files, branches, dependencies, or decisions mark affected knowledge stale.
Revalidate relevant source hashes before using revision-sensitive knowledge for edits.
Exclude stale assertions from trusted summaries; optionally show them as unverified historical context.
Apply retention, archive, deletion, and backup rules by document scope.
Deletion or revoked access must invalidate search caches and future retrieval immediately.
Remove retained content from snapshots according to retention policy while keeping minimal non-sensitive audit references.

## Context Engine integration

Expose scoped search and document-version retrieval through a KnowledgeProvider contract.
Start with metadata filters and lexical search; add embeddings only after a measured retrieval benefit.
Authorize before searching and again before returning document content.
Filter by workspace, project, repository, branch relevance, document status, and current permission.

Rank current approved facts and task-linked decisions above general historical notes.
Retrieve only relevant sections under the run's context budget, retaining document/version citations.
The Context Engine combines these sections with live Task, Repository, Git, and Runtime Context.
Capture the exact retrieved versions and hashes in Agent Context for each run.
Keep durable project knowledge distinct from transient agent scratch notes and provider conversation state.
Provider switching can reuse authorized document references without transferring opaque backend memory.

Treat imported instructions, issue text, and generated notes as untrusted source content.
Repository documentation must not override identity policy, task approval, or tool permissions.
If the bank is unavailable, allow read-only diagnosis and report degraded context.
Do not skip a required decision or verification gate because memory retrieval failed.

## UI, APIs, and team sharing

Add a Memory Bank view with index, document type, owner, freshness, source links, and version history.
Support propose, compare, review, approve, correct, supersede, archive, and authorized export actions.
Expose versioned endpoints through the same authenticated mobile/laptop API boundary.
Use knowledge.read, knowledge.propose, knowledge.review, and knowledge.publish grants.
Require separate export and deletion authority where configured.

Team automation can share approved patterns through explicit publication scope and recipient grants.
Do not share private project memory merely because an automation template is shared.
Record each workflow node's permitted knowledge scope and transferred evidence.
Generalize a useful lesson into a template only after removing project secrets and validating portability.

## Acceptance and evidence

- Import existing documentation and verify the structured index and source links.
- Complete a task, propose a knowledge update, and approve the diff without copying execution logs into Task.
- Start a new run after restart and retrieve the approved version with source citations.
- Switch model/backend and retain scoped knowledge without sharing inaccessible context.
- Edit a referenced file and verify stale detection and source revalidation.
- Test conflicting edits, malicious instructions, revoked access, deleted documents, and cross-project isolation.
- Rebuild the index and restore backups without losing approved versions or exposing archived content.
- Export approved Markdown, modify it externally, and verify conflict-safe reimport.
- Measure useful-context retrieval, stale-result rate, and context cost on representative tasks.

Record tested behavior separately from live-provider coverage. Empty or missing memory is not proof of successful retrieval.
