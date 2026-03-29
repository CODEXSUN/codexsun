# Review Checklist

## Reviewer Priorities

1. Data correctness and auditability
2. Security and authorization
3. Architecture boundary integrity
4. Ownership integrity between framework, `Core`, and apps
5. Functional behavior

## Checklist

1. Does the change match `ASSIST/Documentation/ARCHITECTURE.md`?
2. Is framework code kept separate from app business logic?
3. Are shared masters kept under `Core` instead of duplicated?
4. Is business logic outside UI components?
5. Are API boundaries validating inputs explicitly?
6. Are accounting or stock writes modeled as traceable operations?
7. Are docs and changelog updated?
8. Are validation steps or gaps documented?
