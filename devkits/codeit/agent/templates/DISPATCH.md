# Worker dispatch template

Fill every required field before dispatch. This form is not an execution grant by itself.

| Field                                       | Value    |
| ------------------------------------------- | -------- |
| Human-authorized milestone and source       | Required |
| Task ID and packet path                     | Required |
| Worker and supervising IDE/session          | Required |
| Workspace root and base revision            | Required |
| Dirty baseline fingerprint                  | Required |
| Contract revision and accepted dependencies | Required |
| Exact allowed files/directories             | Required |
| Reserved/shared files                       | Required |
| Lease ID, generation, expiry                | Required |
| Allowed tools and resource scope            | Required |
| Time/token/tool/output/process budget       | Required |
| Acceptance criteria and E2E IDs             | Required |
| Mandatory commands and fixture              | Required |
| Stop/blocker conditions                     | Required |
| Handoff destination                         | Required |

State the concrete deliverable in one paragraph.
List shared composition requests separately from worker-owned changes.
Require the worker to acknowledge the assignment before mutation.
