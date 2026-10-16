# Zetro agent

`skills.md` is Zetro's versioned business rule source. The Zetro API loads it from
the repository in development and from the collected build output in production.
The API fails closed if the file is missing or empty. A SHA-256 hash of the loaded
rules is stored with each interaction log.

## What the rules control

The rules define Zetro's business terms, answer pattern, supported questions,
and limits. They guide the model's words. They do not grant database access.
The backend classifies each request and runs only a named, authorized skill.
Live record skills cover four Billing questions and the signed user's assigned
Local CRM enquiry summary. Other Billing and CRM question families are drafts.

Text files (`.txt`, `.md`, `.csv`, `.json`) up to 1 MB may be attached to a chat.
Zetro shows a local text preview before sending. The API scans the file and
records its hash, file facts, and a bounded text extract with the prompt in the
tenant conversation and interaction log. For files larger than the direct text
limit, Zetro analyzes every part in bounded model calls and combines those
analyses with selected excerpts. The full source is not retained in chat tables;
the answer must avoid claiming exact details absent from its summaries. File
analysis uses only `business_chat`.
File content never selects a Billing query or grants access to a business record.

## Numbered catalog

`skills.md` lists the live catalog using six fields: UUID, Serial #, Question
pattern, Query pattern, Limitation, and Extra. The tenant database mirrors the
eight live entries and 28 review drafts in `zetro_query_patterns`. The UUID stays stable across
tenants. The serial number gives reviewers a short reference.

| UUID                                   | Serial # | Question pattern                       | Query pattern                       | Limitation                                | Extra                               |
| -------------------------------------- | -------: | -------------------------------------- | ----------------------------------- | ----------------------------------------- | ----------------------------------- |
| `010f0000-0000-4000-8000-000000000001` |        1 | Business help from user-provided facts | `business_chat`                     | No company record access                  | Drafts and suggestions only         |
| `010f0000-0000-4000-8000-000000000002` |        2 | Exact customer outstanding             | `billing.customer-outstanding.read` | Grant and Billing permission required     | Billing Customer Summary source     |
| `010f0000-0000-4000-8000-000000000003` |        3 | Off-topic request                      | `none`                              | No data query                             | Short scope reply                   |
| `010f0000-0000-4000-8000-000000000004` |        4 | Today's business report                | `billing.daily-summary.read`        | Grant and Billing permission required     | Four dated totals                   |
| `010f0000-0000-4000-8000-000000000005` |        5 | This month's transaction totals        | `billing.monthly-summary.read`      | Grant and Billing permission required     | One category or all four            |
| `010f0000-0000-4000-8000-000000000006` |        6 | Long outstanding sales                 | `billing.aged-sales.read`           | Grant and Billing permission required     | Ten oldest open invoices            |
| `010f0000-0000-4000-8000-000000000007` |        7 | My assigned Local CRM enquiries        | `crm.assigned-enquiries.read`       | Grant and CRM enquiry view required       | Assigned scope only                 |
| `010f0000-0000-4000-8000-000000000036` |       36 | Explicit `/docs` developer reference   | `docs.developer.read`               | Active Docs and knowledge view permission | Bounded cited file/tenant reference |

Super Admin reviews Zetro from the grouped side menu: query patterns at
`/sa/zetro/patterns`, role permissions at `/sa/zetro/access`, conversations
and notes at `/sa/zetro/conversations`, and approvals, interaction logs, and
grant changes at `/sa/zetro/review`. The selected tenant is carried between
these pages. The earlier `/sa/zetro` link opens query patterns.
The backend stores the matching pattern UUID with each interaction. A Super
Admin can add a numbered draft. A draft is only a proposal. To make it live,
add a fixed backend contract, update `skills.md` and the built-in catalog, and
review the permission and tests before release.
Drafts #8–35 cover Billing statements, documents, stock, tax, rankings, and
CRM enquiry and contact questions. `skills.md` records each six-field proposal.
They are seeded for Super Admin review and never run from chat. A user's varied
wording may select a live intent, but it cannot select a draft query key.

## Query and response pattern

1. Identify the business intent and required record identifier.
2. Check the signed user, tenant, role grant, application permission, and data scope.
3. Call a fixed read contract owned by the business module. Do not generate SQL.
4. Show the result with its source, company, financial year, and limits.
5. Record the prompt, result, skill decision, rule hash, and any tool event in the tenant database.

The chat API saves the answer, interaction log, tool event, and denied approval
request in one tenant database transaction. A failed audit write rolls back the
answer. The live chat stream sends a record answer only after that transaction
commits and the backend checks the current grant again. General chat can stream
text as the provider writes it. Codex CLI returns its complete answer at once.
For follow-up questions, Zetro sends up to six earlier user questions to the
provider. It does not send earlier record answers as context.

Tenant admins can configure the Codex CLI, OpenAI API, or a loopback compatible
API in Zetro Settings. This connection selects the model. It does not change
business permissions. Super Admin reviews tenant conversations, tool events,
approval requests, notes, and grant changes in the grouped Zetro pages above.
The floating drawer is available in the shared authenticated tenant workspace
across its application pages when the tenant has Zetro enabled. Public pages
and separate application shells need their own authenticated host integration.

For customer outstanding, the Billing Customer Summary contract supplies the
amount. Zetro asks for an exact customer name or code when it cannot identify one
record. It never invents an amount or treats a recorded balance as payment advice.

Related wording maps to the same fixed contract. For example, “daily activity”
maps to #4. “Collections this month” maps to the receipt category in #5.
“Oldest unpaid invoices” maps to #6. The classifier selects an intent and a
permitted category. It cannot provide SQL or choose the tenant scope.
“How many enquiries are assigned to me?” maps to #7. The answer uses CRM's
assigned scope and identifies Local CRM as the source. If the tenant selected
Frappe enquiries, Zetro explains that #7 cannot read that source.

## Refinement

`zetro_interaction_logs` records completed and failed requests, including the
matching catalog UUID when classification succeeds. The existing
review notes and approval records let Super Admin inspect conversations and
denied skills. Reviewers use this evidence to propose a change to `skills.md`,
the classifier, or a module-owned skill. Each change needs a code review and
verification before release. Zetro does not train itself, change its own rules,
or activate a skill from chat content or a review note.

The tenant database stores conversation data and capability grants. The file
stores product rules. Future tenant business profiles may add approved terms,
but they cannot override these rules or backend permissions.

## Developer documentation

Use `/docs billing workflow` (or an application/module name) in the authenticated chat. This fixed, read-only connection uses current Docs activation and `docs.knowledge.view`, returns bounded citations and records the lookup in the normal chat interaction/tool audit. It requires no AI provider call for exact lookup. Pattern #36 is live; draft patterns #8–35 remain non-executable. Historical doc answers are masked when Docs access is revoked. See `apps/docs/README.md` for hybrid source/override rules.
