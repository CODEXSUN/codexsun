# Framework Planning

## Identity

Owner: `packages/framework`

Task prefix: `F`

## Goal

Keep Framework runtime-neutral while it provides stable contracts for provider lifecycle, module composition, results, events, persistence boundaries, and verification.

Framework does not own Fastify routes, React views, desktop or mobile APIs, database drivers, product domains, product tables, deployment profiles, or agent workflow rules.

## Architecture

```text
Framework public contracts
  -> Platform Core adapters
  -> application providers and modules
  -> host composition
```

Framework changes are shared-package changes. They require affected-app review before a worktree starts.

## Phases

### Phase F-1300: Contract Stability

- [ ] F-1301 Public export, compatibility, and consumer inventory.
- [ ] F-1302 Provider manifest, lifecycle, dependency graph, and error contract review.
- [ ] F-1303 Result, error, event, transaction, migration, and seeder contract review.

Exit: Framework public contracts have explicit owners, compatibility limits, and consumer evidence.

### Phase F-1310: Extension Safety

- [ ] F-1311 Provider and module extension rules.
- [ ] F-1312 Versioning, deprecation, migration, and compatibility policy.
- [ ] F-1313 Test harness, contract fixture, and consumer verification rules.

Exit: a Framework extension cannot silently break Platform or an application.

### Phase F-1320: Agent And Deployment Compatibility

- [ ] F-1321 Review Framework contracts needed by Zetro.
- [ ] F-1322 Define runtime-neutral capability and evidence contracts only when approved.
- [ ] F-1323 Verify desktop, mobile, and deployable profile compatibility.

Exit: Framework remains neutral while downstream applications retain module ownership.
