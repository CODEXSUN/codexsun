# CRM: Work Report

This source module adds work reporting and event integration to CRM workflows.

## Source contracts

The API owner is `apps/crm/api/src/modules/work-report`.
The matching web owner is `apps/crm/web/src/modules/work-report`.
Read their route schemas, service checks, repository, migration, and event definitions for the current contracts.
Platform supplies trusted tenant, actor, and authorization context. Chat integration uses the host's injected contract.

## Release verification limits

These files arrived during version 1.1.5 release preparation.
The latest Platform typecheck reported a work-report host query against an undeclared tenant table.
Do not treat source presence as successful deployment or completed permission and persistence verification.
Review tenant migration requirements, parent access checks, tenant isolation, and event delivery before rollout.
