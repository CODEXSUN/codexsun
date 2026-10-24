# Verification evidence template

| Field                                | Value                          |
| ------------------------------------ | ------------------------------ |
| Task/milestone and E2E IDs           | Required                       |
| Source/base/integrated revision      | Required                       |
| Contract and policy revision         | Required                       |
| Fixture and data/storage identity    | Required                       |
| OS/runtime/browser/IDE versions      | Required where relevant        |
| Provider/model/adapter version       | Required for model checks      |
| Actual command or reproducible steps | Required                       |
| Expected and observed behavior       | Required                       |
| Exit code and status                 | Required                       |
| Artifact path and content hash       | Required for retained evidence |
| Independent reviewer                 | Required before acceptance     |
| Skipped checks and limitations       | Required                       |

Screenshots prove visible state, not hidden persistence or authorization.
Mocks prove controlled contracts, not a live service.
Attach denied-action and recovery evidence when those boundaries are part of the task.
Do not store runtime evidence binaries or logs in the agent handbook.
