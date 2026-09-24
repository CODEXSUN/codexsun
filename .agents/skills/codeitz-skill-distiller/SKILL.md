---
name: codeitz-skill-distiller
description: Distill repeatable software engineering workflows and learned heuristics into standard Agent Skill documents for long-term capability expansion.
---

# Codeitz Skill Distiller

Extract, structure, and formalize verified software engineering patterns into standardized reusable Agent Skills.

## Purpose

Automate the transition from episodic task learning to formalized, permanent agent capability documentation conforming to repository skill standards.

## Scope

Used when a recurring engineering pattern, complex integration procedure, or multi-step troubleshooting protocol has been validated across multiple tasks.

## Inputs

- Problem summary and domain classification.
- Validated step-by-step resolution workflow.
- Mandatory verification checks and commands.
- Negative constraints, boundaries, and safety exclusions.

## Workflow

### 1. Identify Reusable Patterns
- Evaluate whether a solved engineering challenge occurs repeatedly across applications or packages.
- Confirm that the solution contains deterministic steps rather than one-time ad-hoc patches.

### 2. Format Canonical Skill Structure
- Compose YAML frontmatter with concise `name` (lowercase kebab-case) and `description`.
- Begin markdown body with `# Title` (capitalized topic name).
- Add `## Purpose` stating the concrete outcome.
- Add `## Scope` defining applicability boundaries.
- Add `## Inputs` listing prerequisites and contextual evidence.
- Add `## Workflow` with numbered, actionable instructions.
- Add `## Verification` listing commands and criteria to prove correctness.
- Add `## Exclusions` specifying boundaries, non-goals, and security prohibitions.

### 3. Validate Conformance
- Ensure no real credentials or sensitive environment data are referenced.
- Ensure all repository-relative paths and commands run with `E:\codexsun\codexsun` as working directory.
- Verify Markdown formatting aligns with `assist/documentation/standards.md`.

### 4. Index and Expose
- Register the distilled skill in the Codeitz Skills Registry (`/api/v1/codeitz/skills`).
- Save the markdown file under `.agents/skills/<skill-name>/SKILL.md`.

## Verification

Before publishing a distilled skill:
- Run `node tools/check-app-architecture.mjs` and ensure zero errors.
- Confirm the new skill file has valid YAML frontmatter and proper `# Title` heading.

## Exclusions

- Do not create skills that bypass platform security, authentication, or boundaries.
- Do not generate skills without automated verification criteria.
