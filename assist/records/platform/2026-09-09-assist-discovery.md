# Assist Discovery and Skill Routing

Date: 2026-09-09

## Outcome

Assist now has one short entry point and one skill router. The router maps a
requested change to the required architecture standard, local skill, source
owner, and development record.

## Authoritative references

- [Agent Guide](../../../AGENTS.md)
- [Root README](../../../README.md)
- [Assist index](../../README.md)
- [Skill router](../../skills/README.md)
- [Golden rules](../../governance/golden-rules.md)

## Ownership and boundaries

`assist` owns repository guidance and discovery. Application READMEs own local
commands and runtime behavior. Module READMEs own module behavior. Development
records retain completed decision history. The index links to those documents
without duplicating their source-owned detail.

## Decisions

- Start every task from one ordered onboarding path.
- Select every matching skill for a cross-boundary change.
- Use catalogs to find a source owner before reading a module.
- Keep record history in application folders and link it from one index.
- Add a short `Use this when` section to every local skill.

## Verification

- Confirmed all current Assist documents, root guidance, application catalogs,
  development-record indexes, operations guides, and local skills.
- Confirmed the router covers modules, APIs, web UI, shared UI documentation,
  framework contracts, runtime lifecycle, deployment assembly, and versioning.
- Checked links and Markdown formatting with the focused documentation checks.
