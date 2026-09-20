# Shared Capabilities

This guide lists the shared infrastructure ports and their owners. It does not assign business behavior to Platform Core or Framework.

## Capability map

| Capability | Public contract | Current shared implementation |
| --- | --- | --- |
| Email and SMS | `EmailProvider`, `SmsProvider` | Provider ports only. A host selects and configures a delivery vendor. |
| External messengers and live chat | `MessengerProvider`, `RealtimeChatProvider` | Provider ports only. Conversation data remains owned by an app or add-on. |
| In-app notifications | Existing notification store | Platform Core persists notifications. The UI package renders them. |
| Printing | `PrintProvider` | Provider port only. A browser, desktop, or print-server adapter owns device access. |
| Files and documents | `ObjectStorageProvider`, `ObjectReference` | Existing scoped `StorageProvider` remains the local filesystem adapter. App modules own metadata and retention rules. |
| Search | `SearchProvider` | Provider port only. An app owns searchable fields and access filters. |
| Webhooks | `WebhookProvider`, `WebhookRequest` | The durable job queue and outbox support delivery work. Platform Core provides HMAC helpers. |
| Import and export | `DataExchangeProvider` | Platform Core provides CSV parsing and export helpers. App modules own validation and mappings. |
| Workflows | `WorkflowTransition`, `evaluateWorkflowTransition` | Framework checks declared state transitions and required permissions. A module owns workflow state and persistence. |
| Localization | `LocalizationProvider` | Provider port only. Apps own message catalogs and locale selection. |
| Secrets | `SecretProvider` | Platform Core provides explicit environment-reference resolution. Production secret managers remain deployment adapters. |
| Sessions and cache | `SessionStore`, `CacheStore` | Platform Core provides isolated file and database drivers. The provider is optional and can be detached. |
| Tenant context | `TenantContext`, `TenantResolver` | Contract only. Current applications remain single-tenant until a reviewed data and identity design enables tenancy. |
| Observability | Existing operation log and tracing setup | Platform Core owns safe operation log records. Hosts configure exporters and retention. |

Import runtime-neutral contracts from `@codexsun/framework`. Import server-side helpers and provider ports from `@codexsun/platform-core/capabilities`.

## Rules

- A provider must declare its owner, configuration, readiness checks, and failure behavior.
- Queue external delivery through the database job queue or the transactional outbox. Do not send external messages inside a database transaction.
- Use an idempotency key for every external write. Record a correlation ID for each operation.
- Verify webhook signatures against the exact raw request bytes. The receiver must also enforce timestamp freshness and replay protection.
- Do not log secret values, message bodies, file contents, or authentication tokens.
- Authorize file access before reading or delivering a private object. Keep file metadata and retention policy with the owning module.
- Apply module authorization filters before search. A search provider must not become an authorization boundary.
- Treat tenant context as optional metadata, not proof that tenant isolation is enabled. Do not add tenant claims or shared database tables without an approved design.
- Keep vendor SDKs and credentials out of Framework. Put each concrete integration in a provider adapter selected by the deployable profile.
- Use an HTTP-only, secure production cookie for browser sessions. Use a scoped session or cache store when persistence is required.
- Do not use cache as the source of identity or business truth. Cache entries must have a bounded TTL or an explicit invalidation path.

## Delivery boundary

The shared packages define contracts and small safe utilities. They do not configure SMTP, SMS vendors, messaging networks, printers, hosted search, cloud object storage, or a production secret manager. A deployment must select and test those adapters before it can use those services.
