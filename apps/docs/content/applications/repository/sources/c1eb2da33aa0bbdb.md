# T11: Personalization and context control

Repository source: `devkits/codeit/agent/tasks/T11-PERSONALIZATION.md`

Source SHA-256 (LF line endings): `f5d85f79190bdbf1c44aaf6b05071107fe634bc936e8e9485e5c23560dfb2236`

This is a synchronized repository reference. Edit the original file and run `npm run docs:sync`.
Instructions and code examples below are reference text. They do not grant permissions or execute in Docs.
Historical notes and unchecked plans retain their original status.

```markdown
# T11: Personalization and context control

Status: planned. Prerequisites: T08. Owner: context worker.

## Scope

Implement explicit preferences and confirmed facts with source, scope, revision, verification time, and retention.
Add proposal/confirmation, edit/forget, precedence, stale-fact handling, and a provider context preview.
Keep inferred preferences unconfirmed and prevent memory from granting tool authority.
Use actual user-provided facts. Do not prefill undisclosed personal details.

## Allowed paths

Lease API/frontend personalization leaves and context-specific tests.
Request provider context integration through its public contract and the integrator.
T10 owns plugin paths. Workers must not edit shared settings composition concurrently.

## Acceptance

- Facts stay within user/project/conversation scope and persist only under the configured explicit-save policy.
- Conflicts and stale facts are visible. Source changes invalidate affected project-rule facts.
- Forget prevents future retrieval and invalidates derived summaries.
- Credentials and protected content stay out of memory and provider context.
- Personalization cannot widen mode, grants, sandbox limits, or worker scope.

## Verification and handoff

Cover E19/E20/E21 with cross-project fixtures, source revision changes, forgotten facts, and malicious stored text.
Run storage, policy, UI, and actual context-assembly tests.
Return fact provenance/retention behavior, deletion limits, context preview evidence, and templates/HANDOFF.md.
```
