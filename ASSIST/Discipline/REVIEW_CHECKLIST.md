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
9. Does the change avoid direct imports into another app's private `src/services/*`?
10. If cross-app behavior was added, does it flow through an app-owned `src/public` surface or another explicit contract?
11. Does the change keep transport, application, domain, and infrastructure concerns reasonably separated for the level of complexity involved?
12. If ports, repositories, events, aggregates, or new folders were introduced, are they justified by real domain complexity rather than folder ceremony?
13. If event-driven behavior was added, is it published after a successful state change and kept in-process unless durable delivery is truly required?
14. For frontend work, is page composition kept thin with data access and mapping moved into feature-owned modules when the surface is non-trivial?
