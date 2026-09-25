# Q Cafe Documents Module

The documents module owns durable documents, printer profiles, print routing, print jobs, and print attempts.

It depends on `qcafe.foundation`.

QC-0701 exposes document creation and rendering, printer profiles, kind-based print routes with fallbacks, and job queueing. A durable document record is created before any print job is queued. A draft document cannot be queued. Every queue, acknowledgement, failure, and reprint is recorded as a new print attempt; the original attempt is never removed.

QC-0702 exposes preview printing. Queueing with `preview: true` holds the job in `preview` status with zero attempts and a pending preview record. The operator confirms the preview before the first print attempt starts; attempts and reprints on an unconfirmed preview job are rejected, and a preview can be confirmed only once.

QC-0703 exposes direct Windows service printing with idempotency acknowledgement. Queueing accepts an idempotency key that is unique per location; a repeated request returns the existing job instead of duplicating it. Request, acknowledgement, retry, and failure are recorded as ordered attempts on the direct receipt or KOT job.

QC-0704 exposes web gateway, Bluetooth, wireless, and network printer adapters behind the single `PrintAdapter` contract in `services/print-adapters.ts`. Dispatch checks adapter availability: browser and direct adapters serve active printers, while gateway, Bluetooth, and network adapters additionally require a configured endpoint. An unavailable printer keeps the job pending with an `unavailable` dispatch record, or follows the configured route fallback with a `rerouted` record. Every dispatch decision is stored in `qcafe_print_dispatches`.

QC-0705 exposes PDF email and approved WhatsApp delivery records. Each customer and channel needs a granted consent before a delivery can be queued, and revocation blocks new sends. Only rendered documents can be delivered. Email destinations must be valid addresses and WhatsApp destinations must use international format. A sent delivery requires a provider reference and a failed delivery requires an error; resolved deliveries are immutable.
