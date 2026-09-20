# CRM Local-First Table Plan

## 1. Planning Boundary

| Item | Decision |
| --- | --- |
| Purpose | Plan CRM tables before any migration, API, or UI code. |
| Source review | Use the moved plan in `apps/crm/agent/exec/crm-table.md` and the developed app under `apps/temp/crm`. |
| Current app behavior | The temp app reads and writes CRM records through live Frappe gateways. |
| Target behavior | CRM stores records locally first, then posts to Frappe when the live connection is available. |
| Scope | Sales CRM, service CRM, enquiry workflow, leads, campaigns, pipeline, forecasts, quotations, estimates, contracts, field service, reporting, import, automation, and Frappe sync. |
| Excluded work | No code, migration file, API route, UI, generated schema, or data movement in this document. |
| Owner rule | CRM owns CRM product data under `apps/crm`. |
| Identity rule | Platform Identity owns users. CRM stores actor IDs and Frappe actor links only. |
| Audit rule | Platform Operations can own global audit. CRM stores business status history and sync logs. |
| Tenant rule | Do not add `tenant_id` until a tenant decision record exists. |
| Organization rule | Support multiple users, teams, queues, branches, territories, and customer organizations now. |
| Frappe rule | Do not write directly to Frappe without a committed local CRM record and a sync outbox entry. |

## 2. Developed App Findings

| Area In `apps/temp/crm` | Current Tables Or Types | Current Source Of Truth | New CRM Decision | Why | Pros |
| --- | --- | --- | --- | --- | --- |
| Identity | `users`, `roles`, `permissions`, `user_roles`, `role_permissions` | Local platform database | Do not copy into CRM. Reference Platform actor IDs. | CRM must not own identity. | Keeps permissions reusable across apps. |
| User Frappe mapping | Frappe fields on `users` | Local platform database plus Frappe verification | Move to a CRM or integration actor-link table that references platform actors. | CRM needs Employee/User mapping for posting. | Keeps Frappe details out of product records. |
| Notifications | `notifications`, `notification_outbox`, `notification_device_tokens` | Local platform database | Treat as platform dependency. CRM emits events. | Notifications are cross-module. | Avoids duplicate notification tables. |
| Messaging | `conversations`, `conversation_members`, `messages`, `message_receipts`, `message_reactions` | Local platform database | Treat as platform or collaboration dependency. Link CRM records if needed. | Chat is not CRM-owned data. | Reuses real-time messaging. |
| Assistant | `ai_honey_threads`, `ai_honey_messages`, `ai_honey_skills`, `ai_honey_settings` | Local platform database | Do not include in CRM migration order. | Assistant is separate product support. | Keeps CRM schema focused. |
| Enquiry | `CrmEnquiry` types and Frappe gateway | Live Frappe | Create local `crm_enquiries` and child tables first. | Enquiries are the main CRM work item. | Offline and local workflow become possible. |
| Enquiry messages | Frappe child doctype `Enquiry Message` | Live Frappe | Create local `crm_enquiry_messages`. | Comments and replies must survive offline use. | Reliable team collaboration. |
| Job execution | Frappe doctype `Job Execution` | Live Frappe | Create local `crm_job_executions`. | Service work and cost must be local before posting. | Supports mobile job start and stop. |
| Customers and suppliers | Frappe doctypes `Customer` and `Supplier` | Live Frappe | Create local parties and keep Frappe references. | Enquiries, estimates, and quotations need party lookup. | Supports local customer 360. |
| Enquiry setup | Frappe doctypes `Enquiry Group` and `Enquiry Status` | Live Frappe | Create local setup tables with optional Frappe import. | Status and group drive workflow. | Admin can work without live Frappe. |
| Estimates | Frappe doctype `Estimate` | Live Frappe | Create local `crm_estimates`. | Purchase or vendor cost estimates belong to CRM workflow. | Local quote preparation becomes possible. |
| Quotations | Frappe doctype `Quotation` and child items | Live Frappe | Create local `crm_quotations` and `crm_quotation_items`. | Quotes must be local before live posting. | Controlled sales workflow. |
| HR staff requests | Frappe staff request gateway | Live Frappe | Keep outside CRM core or create optional support tables later. | This is staff operations, not core CRM. | Avoids bloating Phase 1. |
| SOP duties | Frappe SOP duty gateway | Live Frappe | Keep outside CRM core unless service delivery needs it. | This is operations workflow. | CRM launch stays focused. |

## 3. Local-First Frappe Flow

| Step | Local Action | Frappe Action | Required Table Support | Failure Behavior | Why |
| --- | --- | --- | --- | --- | --- |
| 1 | User creates or edits a CRM record locally. | None yet. | Product table and status history. | Local save succeeds if validation passes. | Local CRM must work without live Frappe. |
| 2 | CRM writes a sync item. | None yet. | `crm_sync_outbox`. | Item stays pending. | Sync is durable and retryable. |
| 3 | Sync worker reads pending item. | Posts to Frappe if enabled. | `crm_frappe_connections`, `crm_frappe_actor_links`. | Item retries with backoff. | Frappe is a live target, not the first write. |
| 4 | Frappe returns a name and modified time. | Record exists or updates in Frappe. | `crm_external_references`. | Save failure details for review. | Local and Frappe records stay mapped. |
| 5 | CRM stores sync result. | None. | `crm_sync_attempts`, sync fields on product tables. | Mark conflict or failed after policy limit. | Operations can fix bad data. |
| 6 | Optional live refresh imports changes. | Pulls Frappe deltas. | `crm_import_batches`, `crm_import_rows`. | Stage conflicts instead of overwriting local edits. | Existing Frappe data can seed CRM safely. |

## 4. Frappe Compatibility Contract

| Frappe Concept | Frappe Doctype Or Endpoint | Local Table | Required Mapping Fields | Direction | Notes |
| --- | --- | --- | --- | --- | --- |
| Enquiry | `Enquiry` | `crm_enquiries` | `frappe_name`, `frappe_modified_at`, `frappe_last_synced_at` | Local to Frappe, then refresh | Main work record. |
| Enquiry message | `Enquiry Message` child rows | `crm_enquiry_messages` | `frappe_name`, `parent_frappe_name`, `parent_message_frappe_name` | Local to Frappe | Supports comments and replies. |
| Job execution | `Job Execution` | `crm_job_executions` | `frappe_name`, `enquiry_frappe_name` | Local to Frappe | Supports start, stop, cost, and status. |
| Customer | `Customer` | `crm_parties` or `crm_accounts` | `frappe_name`, `party_type` | Import and reference, optional create later | Used by enquiry and quotation. |
| Supplier | `Supplier` | `crm_parties` | `frappe_name`, `party_type` | Import and reference, optional create later | Used by estimates. |
| Employee | `Employee` | `crm_frappe_actor_links` | `actor_id`, `frappe_employee_code`, `frappe_user` | Verify and refresh | Required for assignment and job execution. |
| Enquiry group | `Enquiry Group` | `crm_enquiry_groups` | `frappe_name` | Import and local edit | Drives enquiry classification. |
| Enquiry status | `Enquiry Status` | `crm_enquiry_statuses` | `frappe_name`, `status_group` | Import and local edit | Drives workflow. |
| Estimate | `Estimate` | `crm_estimates` | `frappe_name` | Local to Frappe | Supplier cost record. |
| Quotation | `Quotation` | `crm_quotations` | `frappe_name` | Local to Frappe | Customer offer record. |
| Quotation item | Quotation child item | `crm_quotation_items` | `frappe_name` | Local to Frappe | One or more quote lines. |
| Query reports | Frappe query reports | `crm_report_snapshots` | `report_name`, `source_system` | Import as snapshot | Local dashboards should not depend on live report calls. |

## 5. Shared Field Groups

| Group | Fields | Why | Where | Pros |
| --- | --- | --- | --- | --- |
| Core | `id`, `uuid`, `created_at`, `created_by_actor_id`, `updated_at`, `updated_by_actor_id` | Trace local changes. | All CRM-owned tables. | Good support trail. |
| Archive | `archived_at`, `archived_by_actor_id` | Soft delete CRM records. | Master and transaction tables. | Records stay recoverable. |
| Ownership | `owner_actor_id`, `team_id`, `queue_id`, `territory_id` | Route work to people and groups. | Enquiries, opportunities, cases, quotes. | Supports many users. |
| Local status | `local_status`, `lifecycle_status` | Control active, suspended, archived, and deleted states. | Work tables. | Avoids relying on Frappe status only. |
| Sync status | `sync_status`, `sync_error_code`, `sync_error_message`, `frappe_last_synced_at` | Track posting state. | Frappe-posted tables. | Clear offline and retry state. |
| Frappe identity | `frappe_name`, `frappe_doctype`, `frappe_modified_at` | Map local records to live Frappe. | Tables that post to Frappe. | Prevents duplicate remote records. |
| Status history | `from_status`, `to_status`, `reason`, `changed_at`, `changed_by_actor_id` | Explain workflow changes. | Status history tables. | Useful for sales and service audits. |
| Money | `amount`, `currency`, `exchange_rate` | Store financial values safely. | Estimate, quote, opportunity, contract tables. | Multi-currency ready. |
| Safe JSON | `payload_json`, `filter_json`, `result_json` | Store flexible import, report, and sync data. | Integration and reporting tables. | Reduces early churn. |

## 6. Phase Plan And Migration Order

| Phase | Order | Migration ID | Table Group | First Work | Why First |
| --- | --- | --- | --- | --- | --- |
| 1 | 001 | `crm.foundation.001` | Module registration, number sequences | Define CRM local table ownership. | Creates stable foundation. |
| 1 | 010 | `crm.integration.001` | Frappe connection refs, actor links, external refs, sync outbox | Build local-first sync contracts. | Every Frappe-posted table depends on this. |
| 1 | 020 | `crm.setup.001` | Sources, tags, enquiry groups, enquiry statuses | Import or seed Frappe-compatible setup. | Enquiry workflow depends on status and group. |
| 1 | 030 | `crm.organization.001` | Teams, team members, queues, territories, shares | Define ownership and routing. | Enquiries need assignment. |
| 1 | 040 | `crm.party.001` | Parties, accounts, contacts, contact methods | Store Customer and Supplier references locally. | Enquiries, estimates, and quotes need parties. |
| 1 | 050 | `crm.enquiry.001` | Enquiries, messages, schedules, calls, notes, files, activities | Build local enquiry source of truth. | This replaces live-only Frappe CRM flow. |
| 1 | 060 | `crm.job.001` | Job executions | Support mobile job work locally. | Temp app already depends on jobs. |
| 1 | 070 | `crm.estimate.001` | Estimates | Store supplier pricing locally. | Needed before quotation decisions. |
| 1 | 080 | `crm.quotation.001` | Quotations and quotation items | Store offers locally before posting. | Needed for sales workflow. |
| 1 | 090 | `crm.reporting.001` | Saved views, report snapshots, metrics | Replace live report dependency with snapshots. | Dashboards must be fast and stable. |
| 1 | 100 | `crm.import.001` | Import batches, rows, mappings, conflicts | Stage existing Frappe data into local CRM. | Migration needs reviewable batches. |
| 2 | 110 | `crm.activity.001` | General activities, reminders, participants, email metadata | Unify tasks, calls, meetings, and email. | Adds Salesforce-style productivity. |
| 2 | 120 | `crm.marketing.001` | Campaigns, campaign members, lead scoring | Add lead generation and attribution. | Connects marketing to sales. |
| 2 | 130 | `crm.lead.001` | Leads, qualification, conversion links | Add pre-account sales intake. | Keeps unqualified data out of accounts. |
| 2 | 140 | `crm.pipeline.001` | Products, price books, opportunities, stage history | Add sales pipeline beyond enquiry. | Supports larger sales teams. |
| 2 | 150 | `crm.forecast.001` | Forecast periods, quotas, forecast entries, targets | Add sales planning and manager commits. | Improves revenue visibility. |
| 2 | 160 | `crm.revenue.001` | Approvals, handoffs, orders, contracts, subscriptions, assets | Add controlled revenue workflow. | Connects CRM to billing and service. |
| 3 | 170 | `crm.service.001` | Cases, SLA checkpoints, entitlements, escalations | Add service-sector CRM. | Supports support teams. |
| 3 | 180 | `crm.field-service.001` | Work orders, service resources, appointments, parts | Add field service execution. | Supports service teams outside the office. |
| 3 | 190 | `crm.knowledge.001` | Knowledge articles and record links | Improve service and sales enablement. | Reduces repeated work. |
| 3 | 200 | `crm.feedback.001` | Surveys and responses | Add customer feedback. | Feeds account health. |
| 4 | 210 | `crm.automation.001` | Assignment rules, approval rules, workflow rules, actions | Add configurable CRM automation. | Reduces manual work. |
| 4 | 220 | `crm.admin-metadata.001` | Layouts, fields, picklists, validation rules | Add admin metadata for future customization. | Helps many CRM levels use one base. |
| 4 | 230 | `crm.quality.001` | Duplicate rules, duplicate sets, merge staging | Improve data quality. | Helps large migrations. |

## 7. Phase 1 Required Tables

### 7.1 Integration And Sync

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_frappe_connections` | Core, `connection_name`, `base_url`, `enabled`, `verification_status`, `last_checked_at`, `last_verified_at`, `credential_ref` | Store non-secret connection metadata. | Sync worker and admin settings. | `Live Frappe` is online. | Keeps secrets outside product tables. |
| `crm_frappe_actor_links` | Core, `actor_id`, `frappe_user`, `frappe_employee_code`, `verification_status`, `last_checked_at`, `last_verified_at`, `credential_ref` | Link platform actors to Frappe Employee. | Assignment, job execution, posting. | Actor maps to `EMP-0007`. | Supports per-user live posting. |
| `crm_external_references` | Core, `record_type`, `record_id`, `external_system`, `external_doctype`, `external_name`, `external_modified_at`, `last_synced_at`, `status` | Map local records to Frappe records. | All sync flows. | Local enquiry maps to `ENQ-00045`. | Prevents duplicate posting. |
| `crm_sync_outbox` | Core, `event_type`, `record_type`, `record_id`, `operation`, `payload_json`, `status`, `available_at`, `attempt_count`, `locked_at`, `locked_by` | Queue local changes for live posting. | Sync worker. | Post new quotation to Frappe. | Durable retries. |
| `crm_sync_attempts` | Core, `outbox_id`, `attempt_number`, `status`, `request_json`, `response_json`, `error_code`, `error_message`, `started_at`, `finished_at` | Debug failed sync. | Admin sync monitor. | Frappe rejected missing customer. | Faster support. |
| `crm_sync_conflicts` | Core, `record_type`, `record_id`, `external_reference_id`, `local_payload_json`, `remote_payload_json`, `status`, `resolution_note` | Review local and Frappe mismatch. | Import and refresh. | Remote status changed after local edit. | Avoids silent overwrite. |

### 7.2 Setup And Routing

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_sources` | Core, Archive, `name`, `description`, `is_active`, `sort_order` | Track source of enquiry or lead. | Enquiries, leads, reports. | `Website`, `Phone Call`. | Clear source reporting. |
| `crm_tags` | Core, Archive, `name`, `color_token`, `description` | Label records. | Lists and reports. | `VIP`, `At Risk`. | Flexible segmentation. |
| `crm_record_tags` | `id`, `tag_id`, `record_type`, `record_id`, `created_at`, `created_by_actor_id` | Link tags to any CRM record. | Lists and detail pages. | Enquiry gets `Urgent`. | One tag system. |
| `crm_number_sequences` | Core, `record_type`, `prefix`, `next_number`, `padding`, `is_active` | Generate readable local numbers. | Enquiries, jobs, estimates, quotes, cases. | `ENQ-000142`. | Human-friendly references. |
| `crm_enquiry_groups` | Core, Archive, Frappe identity, `name`, `description`, `is_active`, `sort_order` | Local copy of Frappe Enquiry Group. | Enquiry form and filters. | `Calls`. | Offline setup. |
| `crm_enquiry_statuses` | Core, Archive, Frappe identity, `name`, `status_key`, `status_group`, `is_closed`, `is_active`, `sort_order` | Local copy of Frappe Enquiry Status. | Enquiry workflow. | `Re Open` maps to `reopen`. | Stable status logic. |
| `crm_teams` | Core, Archive, `name`, `team_type`, `parent_team_id`, `description` | Group internal users. | Ownership and reports. | Enterprise Sales. | Scales user management. |
| `crm_team_members` | Core, `team_id`, `actor_id`, `role`, `started_at`, `ended_at` | Link actors to teams. | Assignment and visibility. | Arun is Sales Manager. | Uses Platform actors safely. |
| `crm_queues` | Core, Archive, `name`, `queue_type`, `team_id`, `description` | Hold unassigned work. | Enquiry and service queues. | Open Calls queue. | High-volume routing. |
| `crm_queue_members` | Core, `queue_id`, `actor_id`, `role`, `is_active` | Link actors to queues. | Claim workflow. | Agent can claim calls. | Simple assignment. |
| `crm_territories` | Core, Archive, `name`, `parent_territory_id`, `region_code`, `description` | Segment markets. | Accounts, enquiries, reports. | South India. | Regional reporting. |
| `crm_record_shares` | Core, `record_type`, `record_id`, `share_type`, `share_target_id`, `access_level`, `expires_at` | Share records with actors or teams. | Collaboration. | Share enquiry with manager. | Controlled visibility. |

### 7.3 Parties And Customer 360

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_parties` | Core, Archive, Frappe identity, `party_type`, `party_number`, `display_name`, `legal_name`, `mobile`, `email`, `status`, `source_id`, `parent_party_id` | Store customers and suppliers locally. | Enquiries, estimates, quotes. | Customer Acme and Supplier S1. | One local party reference. |
| `crm_accounts` | Core, Archive, Ownership, `account_number`, `party_id`, `name`, `industry`, `website_url`, `phone`, `email`, `annual_revenue_amount`, `annual_revenue_currency`, `employee_count` | Store richer customer organization data. | Sales and service. | Acme Pvt Ltd. | Customer 360 beyond Frappe lookup. |
| `crm_contacts` | Core, Archive, Ownership, `first_name`, `last_name`, `display_name`, `job_title`, `primary_email`, `primary_phone`, `mobile_phone`, `preferred_contact_method`, `do_not_email`, `do_not_call` | Store people. | Account, enquiry, quote, service pages. | Meera Rao, CFO. | Person data is reusable. |
| `crm_account_contacts` | Core, `account_id`, `contact_id`, `role`, `is_primary`, `started_at`, `ended_at` | Link contacts to accounts. | Customer 360. | CFO on Acme account. | Supports many contacts. |
| `crm_contact_methods` | Core, Archive, `record_type`, `record_id`, `method_type`, `label`, `value`, `is_primary`, `is_verified` | Store extra channels. | Communication and mobile lookup. | WhatsApp number. | Extensible contact data. |
| `crm_party_external_aliases` | Core, `party_id`, `external_system`, `external_doctype`, `external_name`, `display_name`, `mobile` | Keep Frappe party references and historical names. | Import and sync. | Frappe Customer `CUST-0004`. | Better matching and de-duplication. |

### 7.4 Enquiry Core

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_enquiries` | Core, Archive, Ownership, Frappe identity, `enquiry_number`, `title`, `workspace`, `party_id`, `customer_name_snapshot`, `mobile`, `enquiry_date`, `due_date`, `enquiry_group_id`, `status_id`, `status_key`, `status_group`, `status_details`, `priority`, `local_status`, `has_unread_assignment`, `last_activity_at` | Local source of truth for Frappe Enquiry. | CRM desk, mobile call capture, sync. | Incoming call creates local enquiry. | Works offline and posts later. |
| `crm_enquiry_messages` | Core, Archive, Frappe identity, `enquiry_id`, `parent_message_id`, `message_type`, `comment`, `plain_text`, `is_suspended`, `frappe_created_by`, `frappe_created_at` | Store comments and replies locally. | Timeline and Frappe child rows. | Agent replies to latest comment. | No message loss offline. |
| `crm_enquiry_schedules` | Core, Frappe identity, `enquiry_id`, `scheduled_on`, `status`, `note` | Store due dates and follow-up schedules. | Enquiry detail and reminders. | Follow up tomorrow. | Better scheduling than one due date. |
| `crm_enquiry_calls` | Core, `enquiry_id`, `direction`, `phone`, `called_at`, `duration_seconds`, `summary`, `mobile_capture_payload_json` | Store mobile call captures. | Call history and enquiry creation. | Outgoing call lasted 90 seconds. | Mobile-first workflow. |
| `crm_enquiry_emails` | Core, `enquiry_id`, `direction`, `subject`, `recipient`, `body`, `message_ref`, `sent_at` | Store enquiry email metadata or body by policy. | Timeline. | Proposal email sent. | Better communication trail. |
| `crm_enquiry_tasks` | Core, `enquiry_id`, `title`, `due_on`, `status`, `completed_at`, `completed_by_actor_id` | Store enquiry tasks. | Work queue. | Send brochure. | Follow-up control. |
| `crm_enquiry_notes` | Core, Archive, `enquiry_id`, `note`, `visibility` | Store internal notes. | Detail page. | Customer prefers WhatsApp. | Captures context. |
| `crm_enquiry_attachments` | Core, Archive, `enquiry_id`, `file_name`, `storage_ref`, `file_url`, `mime_type`, `size_bytes` | Store files and links. | Detail page and Frappe attachment posting. | Site photo attached. | Keeps evidence with enquiry. |
| `crm_enquiry_activities` | Core, `enquiry_id`, `action`, `details`, `source_system`, `source_name`, `activity_at`, `actor_display_name` | Store timeline events from local actions and Frappe docinfo. | Timeline and audit view. | Status changed to Pending. | Complete activity history. |
| `crm_enquiry_status_history` | `id`, `enquiry_id`, Status history | Track status changes. | Reports and audit. | New to Pending. | Pipeline and service metrics. |
| `crm_enquiry_assignments` | Core, `enquiry_id`, `from_actor_id`, `to_actor_id`, `from_employee_code`, `to_employee_code`, `reason`, `accepted_at` | Track assignment changes. | Assignment notifications and audit. | Assigned to `EMP-0007`. | Clear work ownership. |

### 7.5 Job Execution

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_job_executions` | Core, Archive, Frappe identity, `job_number`, `enquiry_id`, `employee_actor_id`, `employee_code`, `date`, `start_time`, `stop_time`, `status`, `employee_cost_per_hour`, `hours`, `total_cost` | Store service work done against an enquiry. | Mobile job control and Frappe posting. | Running job starts at 10:30. | Reliable field-service record. |
| `crm_job_execution_events` | Core, `job_execution_id`, `event_type`, `event_at`, `payload_json` | Track start, stop, cancel, and correction events. | Job audit and conflict review. | Stop event failed to post. | Strong debug trail. |

### 7.6 Estimates And Quotations

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_estimates` | Core, Archive, Frappe identity, `estimate_number`, `enquiry_id`, `supplier_party_id`, `supplier_name_snapshot`, `item_name`, `price`, `currency`, `estimate_date`, `status` | Store supplier estimates locally. | Enquiry cost and quote preparation. | Supplier quotes 5000 INR. | Local cost visibility. |
| `crm_quotations` | Core, Archive, Ownership, Frappe identity, `quotation_number`, `enquiry_id`, `account_id`, `party_id`, `customer_name_snapshot`, `company`, `owner_actor_id`, `transaction_date`, `valid_till`, `currency`, `subtotal_amount`, `discount_amount`, `tax_amount`, `grand_total`, `remarks`, `status` | Store customer offers locally. | Quote workflow and Frappe posting. | Quote for Acme valid 30 days. | Controlled sales offer. |
| `crm_quotation_items` | Core, Frappe identity, `quotation_id`, `line_number`, `item_code`, `item_name`, `quantity`, `rate`, `unit`, `discount_amount`, `tax_amount`, `amount` | Store quote line snapshots. | Quote totals and posting. | Item `SUPPORT` quantity 2. | Repeatable quote math. |
| `crm_quote_approvals` | Core, `quotation_id`, `approval_status`, `requested_by_actor_id`, `requested_at`, `approver_actor_id`, `decided_at`, `decision_note` | Control discount or high-value quote approval. | Quote workflow. | Manager approves discount. | Better margin control. |
| `crm_sales_handoffs` | Core, `quotation_id`, `target_system`, `target_contract_version`, `status`, `submitted_at`, `submitted_by_actor_id`, `accepted_at`, `target_reference`, `failure_code`, `failure_message` | Stage accepted quote for billing or ERP. | Post-sale handoff. | Quote maps to billing ID. | Keeps app boundary clean. |

### 7.7 Reporting And Import

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_saved_views` | Core, Archive, Ownership, `name`, `record_type`, `visibility`, `filter_json`, `sort_json`, `column_json`, `is_default` | Store list views. | All CRM lists. | My open calls. | User productivity. |
| `crm_report_snapshots` | `id`, `report_type`, `source_system`, `name`, `requested_by_actor_id`, `period_start`, `period_end`, `filter_json`, `result_json`, `created_at`, `archived_at` | Store stable report results. | Dashboards and Frappe report imports. | Owner status snapshot. | Fast dashboards. |
| `crm_metric_snapshots` | Core, `metric_name`, `period_start`, `period_end`, `scope_type`, `scope_id`, `value_number`, `value_json` | Store computed metrics. | Overview cards and dashboards. | Oldest active enquiry is 12 days. | Fast overview. |
| `crm_import_batches` | Core, `import_type`, `source_system`, `source_filename`, `status`, `total_rows`, `valid_rows`, `invalid_rows`, `imported_rows`, `started_at`, `finished_at`, `failure_message` | Stage imports from Frappe or CSV. | Migration and admin import. | Import 500 enquiries. | Safe onboarding. |
| `crm_import_rows` | Core, `batch_id`, `row_number`, `external_name`, `raw_json`, `normalized_json`, `status`, `error_code`, `error_message`, `target_record_type`, `target_record_id` | Review each imported row. | Import correction. | Row 42 has missing status. | Clear repair workflow. |
| `crm_import_mappings` | Core, Ownership, `name`, `import_type`, `mapping_json`, `is_default` | Reuse mappings. | CSV and Frappe import. | Legacy enquiry mapping. | Saves admin time. |

## 8. Phase 2 To 4 Expansion Tables

| Area | Tables | Why | Where | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| Marketing and leads | `crm_campaigns`, `crm_campaign_members`, `crm_campaign_costs`, `crm_leads`, `crm_lead_status_history`, `crm_lead_scores`, `crm_lead_conversion_links` | Capture demand before account and opportunity creation. | Lead inbox, campaign ROI, sales intake. | Expo campaign creates 150 leads. | Clean prospect workflow. |
| Generic activities | `crm_activities`, `crm_activity_links`, `crm_activity_participants`, `crm_activity_reminders`, `crm_email_messages` | Unify tasks, calls, meetings, notes, and emails. | Timelines and work queues. | Call linked to account and quote. | Salesforce-style productivity. |
| Sales pipeline | `crm_pipelines`, `crm_pipeline_stages`, `crm_opportunities`, `crm_opportunity_contacts`, `crm_opportunity_line_items`, `crm_opportunity_stage_history`, `crm_opportunity_competitors`, `crm_forecast_entries` | Manage deals beyond enquiries. | Sales board and forecast. | Deal moves to Negotiation. | Better forecast visibility. |
| Products and prices | `crm_products`, `crm_price_books`, `crm_price_book_entries`, `crm_discount_rules` | Standardize quote items and prices. | Opportunity and quote lines. | Support plan has INR price. | Consistent quoting. |
| Forecasts and quotas | `crm_forecast_periods`, `crm_quotas`, `crm_forecast_categories`, `crm_forecast_entries`, `crm_forecast_adjustments` | Track targets, commits, and forecast rollups. | Manager forecast dashboard. | Manager commits 50 lakh for Q1. | Better sales planning. |
| CPQ and pricing | `crm_product_bundles`, `crm_product_bundle_items`, `crm_quote_versions`, `crm_quote_terms`, `crm_quote_taxes`, `crm_quote_discounts` | Support complex quotes and approvals. | Quote builder. | Hardware bundle with service plan. | Safer quote control. |
| Orders and fulfillment | `crm_orders`, `crm_order_items`, `crm_fulfillment_requests`, `crm_delivery_milestones` | Track accepted quote execution before billing handoff. | Sales operations. | Accepted quote creates order. | Clear post-sale follow-through. |
| Contracts and revenue | `crm_contracts`, `crm_contract_terms`, `crm_subscriptions`, `crm_customer_assets`, `crm_renewal_opportunities` | Track won commitments. | Account and renewal views. | One-year support contract. | Retention workflow. |
| Service CRM | `crm_service_cases`, `crm_case_comments`, `crm_case_status_history`, `crm_case_sla_checkpoints`, `crm_entitlements`, `crm_case_escalations`, `crm_case_queues` | Support service-sector teams. | Service console. | Case due in 4 hours. | SLA-ready support. |
| Field service | `crm_work_orders`, `crm_work_order_tasks`, `crm_service_resources`, `crm_service_territories`, `crm_service_appointments`, `crm_service_parts` | Plan and complete on-site service work. | Field service console and mobile app. | Technician visits customer site. | Better service execution. |
| Knowledge | `crm_knowledge_articles`, `crm_knowledge_links` | Help agents and sellers answer faster. | Case and enquiry side panel. | Reset article linked to case. | Less repeated work. |
| Feedback | `crm_surveys`, `crm_survey_responses`, `crm_customer_health_scores` | Measure customer quality and risk. | Account health dashboard. | CSAT 5 after service case. | Better retention signal. |
| Automation | `crm_assignment_rules`, `crm_escalation_rules`, `crm_approval_rules`, `crm_workflow_rules`, `crm_workflow_actions`, `crm_automation_runs` | Configure routing, approvals, and actions without code. | Admin automation screens. | Urgent case goes to Tier 2. | Less manual work. |
| Admin metadata | `crm_custom_fields`, `crm_picklists`, `crm_picklist_values`, `crm_page_layouts`, `crm_validation_rules`, `crm_record_types` | Prepare for multi-level CRM customization. | Admin setup and future UI. | Enterprise deal layout differs from retail layout. | One CRM can serve many sectors. |
| Security and sharing | `crm_role_hierarchies`, `crm_sharing_rules`, `crm_record_shares`, `crm_field_access_rules` | Add CRM-level sharing without owning identity. | Authorization checks. | Manager sees team accounts. | Better enterprise access control. |
| Data quality | `crm_duplicate_rules`, `crm_duplicate_sets`, `crm_duplicate_items`, `crm_merge_requests` | Control duplicates. | Import and admin review. | Two Acme accounts look same. | Safer cleanup. |

## 8.1 Salesforce-Style Missing Table Catalog

### 8.1.1 Marketing And Leads

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_campaigns` | Core, Archive, Ownership, `campaign_number`, `name`, `campaign_type`, `status`, `start_date`, `end_date`, `budget_amount`, `budget_currency`, `expected_revenue_amount`, `description` | Track marketing campaigns. | Lead source and ROI reports. | 2027 Expo campaign. | Connects spend to pipeline. |
| `crm_campaign_members` | Core, `campaign_id`, `member_type`, `member_id`, `status`, `responded_at`, `source_detail` | Link leads and contacts to campaigns. | Campaign detail and lead detail. | Lead attended Expo. | Measures campaign response. |
| `crm_campaign_costs` | Core, `campaign_id`, `cost_type`, `amount`, `currency`, `spent_at`, `note` | Track campaign spend. | ROI reports. | Booth rental cost. | Better budget review. |
| `crm_leads` | Core, Archive, Ownership, `lead_number`, `company_name`, `first_name`, `last_name`, `display_name`, `job_title`, `email`, `phone`, `mobile`, `campaign_id`, `source_id`, `status`, `qualification_rating`, `score`, `estimated_value_amount`, `estimated_value_currency`, `expected_close_date`, `description`, `disqualification_reason`, `converted_account_id`, `converted_contact_id`, `converted_opportunity_id`, `converted_at`, `converted_by_actor_id` | Store prospects before conversion. | Lead inbox and qualification. | Website lead requests demo. | Keeps unqualified data separate. |
| `crm_lead_status_history` | `id`, `lead_id`, Status history | Track lead movement. | Lead audit and reports. | New to Qualified. | Shows qualification quality. |
| `crm_lead_scores` | Core, `lead_id`, `score`, `score_model`, `reason_json`, `calculated_at` | Rank leads. | Lead queue. | Lead score is 91. | Helps sellers focus. |
| `crm_lead_conversion_links` | Core, `lead_id`, `target_type`, `target_id`, `conversion_note` | Store conversion targets. | Conversion audit. | Lead creates account and deal. | Safe lead conversion. |

### 8.1.2 Sales Pipeline And Forecasts

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_pipelines` | Core, Archive, `name`, `description`, `is_default`, `is_active` | Store sales processes. | Opportunity boards. | Enterprise Sales pipeline. | Supports many sales motions. |
| `crm_pipeline_stages` | Core, `pipeline_id`, `name`, `description`, `sort_order`, `default_probability`, `is_won_stage`, `is_lost_stage`, `is_active` | Store ordered stages. | Opportunity workflow. | Proposal at 60 percent. | Consistent stage reports. |
| `crm_opportunities` | Core, Archive, Ownership, `opportunity_number`, `name`, `account_id`, `primary_contact_id`, `source_id`, `campaign_id`, `pipeline_id`, `stage_id`, `status`, `amount`, `currency`, `probability`, `forecast_category_id`, `expected_close_date`, `actual_close_date`, `lost_reason`, `description` | Store deals. | Pipeline, forecast, account detail. | Acme renewal deal. | Central sales value record. |
| `crm_opportunity_contacts` | Core, `opportunity_id`, `contact_id`, `role`, `is_primary`, `influence_level` | Link deal stakeholders. | Deal detail. | CFO is decision maker. | Maps buying committee. |
| `crm_opportunity_line_items` | Core, `opportunity_id`, `product_id`, `price_book_entry_id`, `line_number`, `item_code`, `item_name`, `quantity`, `unit_price`, `discount_amount`, `tax_amount`, `line_total`, `currency` | Store deal item snapshots. | Deal value and quote draft. | 10 support licenses. | Better forecast detail. |
| `crm_opportunity_stage_history` | `id`, `opportunity_id`, `from_stage_id`, `to_stage_id`, `from_status`, `to_status`, `reason`, `changed_at`, `changed_by_actor_id` | Track deal movement. | Sales audit. | Proposal to Negotiation. | Shows pipeline velocity. |
| `crm_opportunity_competitors` | Core, `opportunity_id`, `competitor_name`, `strength`, `weakness`, `is_primary` | Track competitors. | Deal strategy. | Competing with Vendor X. | Helps sales coaching. |
| `crm_forecast_periods` | Core, `name`, `period_type`, `start_date`, `end_date`, `status` | Define forecast windows. | Forecast dashboard. | FY 2027 Q1. | Consistent reporting periods. |
| `crm_forecast_categories` | Core, `name`, `sort_order`, `probability_min`, `probability_max`, `is_commit_category` | Classify forecast values. | Opportunity forecast. | Commit, Best Case, Pipeline. | Clear manager forecast. |
| `crm_quotas` | Core, `period_id`, `owner_actor_id`, `team_id`, `amount`, `currency`, `quota_type` | Store sales targets. | Quota attainment reports. | Seller quota is 25 lakh. | Goal tracking. |
| `crm_forecast_entries` | Core, `period_id`, `owner_actor_id`, `team_id`, `amount`, `currency`, `forecast_category_id`, `source_type`, `source_id`, `note` | Store forecast rows. | Forecast rollups. | Manager commits 50 lakh. | Manager control. |
| `crm_forecast_adjustments` | Core, `forecast_entry_id`, `adjusted_amount`, `currency`, `reason`, `adjusted_by_actor_id`, `adjusted_at` | Store manager adjustments. | Forecast review. | Manager reduces commit. | Transparent forecast changes. |

### 8.1.3 Products, CPQ, Orders, And Contracts

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_products` | Core, Archive, Frappe identity, `product_code`, `name`, `product_type`, `status`, `description`, `unit_of_measure` | Store sellable products. | Opportunity and quote lines. | Premium Support Plan. | Enables local quoting. |
| `crm_price_books` | Core, Archive, `name`, `currency`, `is_default`, `is_active`, `description` | Group prices. | Quotes and deals. | India INR price book. | Supports regional pricing. |
| `crm_price_book_entries` | Core, `price_book_id`, `product_id`, `unit_price`, `currency`, `valid_from`, `valid_until`, `is_active` | Store product prices. | Quote line pricing. | Yearly support price. | Avoids manual prices. |
| `crm_discount_rules` | Core, Archive, `name`, `criteria_json`, `max_discount_percent`, `approval_required`, `is_active` | Control discounts. | Quote approvals. | Above 10 percent needs approval. | Better margin control. |
| `crm_product_bundles` | Core, Archive, `bundle_code`, `name`, `description`, `status` | Sell grouped products. | CPQ and quote builder. | Starter service bundle. | Faster quote creation. |
| `crm_product_bundle_items` | Core, `bundle_id`, `product_id`, `quantity`, `is_required`, `sort_order` | Define bundle contents. | Quote builder. | Bundle includes setup service. | Consistent bundles. |
| `crm_quote_versions` | Core, `quotation_id`, `version_number`, `status`, `snapshot_json`, `created_by_actor_id` | Track quote revisions. | Quote audit. | Version 2 changes price. | Clear negotiation history. |
| `crm_quote_terms` | Core, `quotation_id`, `term_type`, `term_text`, `sort_order` | Store legal and commercial terms. | Quote PDF and approval. | Payment due in 30 days. | Better offer control. |
| `crm_quote_taxes` | Core, `quotation_id`, `tax_name`, `tax_rate`, `tax_amount`, `tax_scope` | Store tax details. | Quote totals. | GST line on quote. | Clear totals. |
| `crm_quote_discounts` | Core, `quotation_id`, `discount_type`, `discount_value`, `discount_amount`, `reason`, `approved_by_actor_id` | Store discounts. | Approval and margin reports. | 5 percent renewal discount. | Transparent pricing. |
| `crm_orders` | Core, Archive, Ownership, `order_number`, `quotation_id`, `account_id`, `party_id`, `status`, `order_date`, `currency`, `total_amount`, `fulfillment_status` | Track accepted quotes. | Sales operations. | Quote creates order. | Clear post-sale work. |
| `crm_order_items` | Core, `order_id`, `product_id`, `item_code`, `item_name`, `quantity`, `unit_price`, `amount`, `fulfillment_status` | Store order lines. | Fulfillment. | Two licenses pending delivery. | Item-level tracking. |
| `crm_fulfillment_requests` | Core, `order_id`, `target_system`, `status`, `submitted_at`, `target_reference`, `failure_code`, `failure_message` | Send orders to delivery or ERP. | Operations handoff. | Order sent to ERP. | Clear boundary. |
| `crm_delivery_milestones` | Core, `order_id`, `name`, `due_date`, `completed_at`, `status`, `owner_actor_id` | Track delivery promises. | Account and order detail. | Install due next week. | Better customer follow-up. |
| `crm_contracts` | Core, Archive, Ownership, `contract_number`, `account_id`, `contact_id`, `opportunity_id`, `quotation_id`, `order_id`, `status`, `start_date`, `end_date`, `total_amount`, `currency`, `terms` | Store won agreements. | Account and renewal views. | One-year support contract. | Connects sales to retention. |
| `crm_contract_terms` | Core, `contract_id`, `term_type`, `term_text`, `sort_order` | Store contract terms. | Contract detail. | Cancellation notice is 30 days. | Better agreement tracking. |
| `crm_subscriptions` | Core, Archive, `contract_id`, `product_id`, `status`, `billing_frequency`, `start_date`, `next_renewal_date`, `quantity`, `amount`, `currency` | Track recurring commitments. | Renewal workflow. | Annual service subscription. | Supports renewal pipeline. |
| `crm_customer_assets` | Core, Archive, `account_id`, `contact_id`, `product_id`, `serial_number`, `asset_name`, `status`, `installed_at`, `warranty_until` | Track sold or supported assets. | Service cases and account view. | Installed POS terminal. | Service knows customer assets. |
| `crm_renewal_opportunities` | Core, `subscription_id`, `opportunity_id`, `renewal_due_date`, `status` | Link subscriptions to renewal deals. | Renewal pipeline. | Renewal due in 60 days. | Better recurring revenue. |

### 8.1.4 Service, Field Service, And Customer Success

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_service_cases` | Core, Archive, Ownership, `case_number`, `account_id`, `contact_id`, `contract_id`, `asset_id`, `subject`, `description`, `case_type`, `priority`, `status`, `origin`, `opened_at`, `first_response_due_at`, `resolution_due_at`, `resolved_at`, `resolved_by_actor_id`, `resolution_summary` | Store support cases. | Service console. | Printer not working. | Strong service support. |
| `crm_case_comments` | Core, Archive, `case_id`, `comment_type`, `body`, `author_actor_id`, `author_contact_id` | Store case conversations. | Case timeline. | Agent asks for screenshot. | Complete support context. |
| `crm_case_status_history` | `id`, `case_id`, Status history | Track case movement. | Service audit. | Open to Pending Customer. | Better case reporting. |
| `crm_case_sla_checkpoints` | Core, `case_id`, `checkpoint_type`, `due_at`, `met_at`, `status` | Store SLA deadlines. | SLA dashboard. | First response due 2 PM. | SLA-ready service. |
| `crm_entitlements` | Core, Archive, `account_id`, `contract_id`, `name`, `support_level`, `start_date`, `end_date`, `case_limit`, `is_active` | Store support rights. | Case validation. | Gold support entitlement. | Prevents unsupported work. |
| `crm_case_escalations` | Core, `case_id`, `from_team_id`, `to_team_id`, `reason`, `escalated_at`, `resolved_at` | Track escalations. | Support management. | Tier 1 to Tier 2. | Better service performance. |
| `crm_work_orders` | Core, Archive, Ownership, `work_order_number`, `case_id`, `account_id`, `asset_id`, `subject`, `description`, `status`, `priority`, `scheduled_start_at`, `scheduled_end_at`, `completed_at` | Plan field work. | Field service console. | Replace device at site. | Connects cases to site work. |
| `crm_work_order_tasks` | Core, `work_order_id`, `title`, `status`, `estimated_minutes`, `completed_at`, `sort_order` | Store job checklist. | Technician app. | Check wiring. | Better field quality. |
| `crm_service_resources` | Core, `actor_id`, `resource_type`, `name`, `status`, `home_territory_id`, `skill_json` | Store field resources. | Scheduling. | Technician with printer skill. | Better dispatch. |
| `crm_service_territories` | Core, `name`, `parent_territory_id`, `region_code`, `operating_hours_json` | Store service coverage. | Dispatch and SLA. | Chennai North service area. | Better field routing. |
| `crm_service_appointments` | Core, `work_order_id`, `resource_id`, `territory_id`, `status`, `scheduled_start_at`, `scheduled_end_at`, `actual_start_at`, `actual_end_at` | Schedule field visits. | Dispatch calendar. | Visit booked at 4 PM. | Better technician planning. |
| `crm_service_parts` | Core, `work_order_id`, `product_id`, `quantity_planned`, `quantity_used`, `unit_cost`, `status` | Track parts used. | Field service and cost. | Replaced one sensor. | Better service costing. |
| `crm_success_plans` | Core, Archive, Ownership, `account_id`, `name`, `status`, `start_date`, `end_date`, `health_goal`, `note` | Track customer success plans. | Account health. | Onboarding plan for Acme. | Better retention work. |
| `crm_success_plan_tasks` | Core, `success_plan_id`, `title`, `owner_actor_id`, `due_at`, `status` | Track success work. | Customer success queue. | Complete onboarding call. | Clear account follow-up. |

### 8.1.5 Knowledge, Feedback, Quality, And Automation

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_knowledge_articles` | Core, Archive, Ownership, `article_number`, `title`, `summary`, `body`, `status`, `category`, `published_at` | Store sales and service knowledge. | Case help and seller enablement. | Reset device article. | Faster answers. |
| `crm_knowledge_links` | Core, `article_id`, `record_type`, `record_id`, `link_reason` | Link articles to records. | Case and enquiry pages. | Article linked to case. | Contextual help. |
| `crm_surveys` | Core, Archive, `name`, `survey_type`, `status`, `question_json` | Store survey definitions. | CSAT and feedback. | Case closure CSAT. | Measures experience. |
| `crm_survey_responses` | Core, `survey_id`, `record_type`, `record_id`, `contact_id`, `score`, `response_json`, `submitted_at` | Store survey answers. | Reports and account health. | Customer rates case 5. | Quality signal. |
| `crm_customer_health_scores` | Core, `account_id`, `score`, `score_label`, `reason_json`, `calculated_at` | Track customer risk. | Account health. | Acme health is 82. | Retention signal. |
| `crm_duplicate_rules` | Core, `record_type`, `name`, `match_json`, `action`, `is_active` | Define duplicate checks. | Leads, contacts, accounts. | Match contacts by email. | Better data quality. |
| `crm_duplicate_sets` | Core, `record_type`, `status`, `score`, `reviewed_by_actor_id`, `reviewed_at` | Store duplicate groups. | Merge review. | Two Acme accounts look same. | Controlled cleanup. |
| `crm_duplicate_items` | `id`, `duplicate_set_id`, `record_id`, `match_reason_json`, `created_at` | Link records to duplicate sets. | Merge review. | Acme A and Acme B. | Transparent evidence. |
| `crm_merge_requests` | Core, `record_type`, `winner_record_id`, `loser_record_ids_json`, `status`, `requested_by_actor_id`, `approved_by_actor_id`, `merge_plan_json` | Control record merge. | Data admin. | Merge duplicate contacts. | Safer cleanup. |
| `crm_assignment_rules` | Core, `record_type`, `rule_name`, `priority`, `criteria_json`, `target_type`, `target_id`, `is_active` | Route work by criteria. | Leads, enquiries, cases. | Web leads go to Inside Sales. | Less manual routing. |
| `crm_escalation_rules` | Core, `record_type`, `rule_name`, `criteria_json`, `target_team_id`, `deadline_minutes`, `is_active` | Escalate overdue work. | Cases and enquiries. | Urgent case escalates after 30 minutes. | Better SLA control. |
| `crm_approval_rules` | Core, `record_type`, `rule_name`, `criteria_json`, `approver_type`, `approver_id`, `is_active` | Configure approvals. | Quotes and discounts. | Discount above 10 percent needs approval. | Less hardcoded logic. |
| `crm_workflow_rules` | Core, `record_type`, `rule_name`, `trigger_event`, `criteria_json`, `is_active` | Trigger CRM actions. | Automation engine. | Status change sends notification. | Configurable operations. |
| `crm_workflow_actions` | Core, `workflow_rule_id`, `action_type`, `action_json`, `sort_order` | Store actions for workflow rules. | Automation engine. | Create task after won deal. | Multi-step automation. |
| `crm_automation_runs` | Core, `rule_id`, `record_type`, `record_id`, `status`, `started_at`, `finished_at`, `error_message` | Track automation runs. | Admin monitor. | Assignment rule failed. | Debuggable automation. |

### 8.1.6 Admin Metadata And Enterprise Controls

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_record_types` | Core, `record_type`, `name`, `description`, `is_default`, `is_active` | Support different business processes per object. | Layouts, picklists, workflow. | Enterprise Deal and Retail Deal. | One CRM fits many sectors. |
| `crm_custom_fields` | Core, `record_type`, `field_key`, `label`, `field_type`, `is_required`, `default_value`, `config_json`, `is_active` | Add controlled custom fields later. | Admin setup and dynamic views. | Account GST number. | Flexible without schema churn. |
| `crm_picklists` | Core, `record_type`, `field_key`, `name`, `is_active` | Define controlled option sets. | Forms and filters. | Case priority list. | Cleaner data entry. |
| `crm_picklist_values` | Core, `picklist_id`, `value_key`, `label`, `sort_order`, `is_default`, `is_active` | Store option values. | Forms and filters. | Priority `urgent`. | Stable labels. |
| `crm_page_layouts` | Core, `record_type`, `record_type_id`, `layout_name`, `layout_json`, `is_default`, `is_active` | Store future form layouts. | Web UI. | Service case layout. | Sector-specific screens. |
| `crm_validation_rules` | Core, `record_type`, `rule_name`, `criteria_json`, `error_message`, `is_active` | Validate records by configuration. | Save workflow. | Close date required for won deal. | Better data quality. |
| `crm_role_hierarchies` | Core, `parent_actor_id`, `child_actor_id`, `scope_type`, `scope_id`, `started_at`, `ended_at` | Model sales management visibility. | CRM authorization. | Manager sees seller pipeline. | Better enterprise sharing. |
| `crm_sharing_rules` | Core, `record_type`, `rule_name`, `criteria_json`, `share_target_type`, `share_target_id`, `access_level`, `is_active` | Configure record sharing. | CRM authorization. | South team sees South accounts. | Less manual sharing. |
| `crm_field_access_rules` | Core, `record_type`, `field_key`, `target_type`, `target_id`, `access_level` | Control sensitive fields. | Forms and API. | Hide margin from sellers. | Safer enterprise use. |
| `crm_audit_snapshots` | Core, `record_type`, `record_id`, `event_type`, `snapshot_json`, `actor_id` | Store important business snapshots. | Audit and compliance. | Quote accepted snapshot. | Stronger review trail. |

## 9. Existing Local Platform Tables To Reuse

| Existing Table | Fields Seen In Temp App | CRM Use | New Plan |
| --- | --- | --- | --- |
| `users` | Identity, status, role, Frappe credential fields | Actor identity and Frappe user mapping | Platform owns users. Move Frappe mapping to actor-link or platform identity extension. |
| `roles` | Key, label, description, status | Permission grouping | Platform owns roles. CRM defines permission keys only. |
| `permissions` | Key, label, description, status | CRM access rules | Platform owns permissions. CRM contributes seeds later. |
| `user_roles` | User and role link | Access control | Platform owns relation. |
| `role_permissions` | Role and permission link | Access control | Platform owns relation. |
| `notifications` | Recipient, actor, type, title, body, resource, status | CRM assignment, comment, reply, status alerts | Platform owns notifications. CRM publishes events. |
| `notification_outbox` | Notification, status, attempts | Push delivery | Platform owns notification delivery. |
| `notification_device_tokens` | User token | Push delivery | Platform owns device tokens. |
| `conversations` | Type, title, status, metadata | Optional CRM chat threads | Platform or collaboration owns chat. CRM links records later if needed. |
| `conversation_members` | Conversation, user, role, read state | Optional team chat | Platform or collaboration owns members. |
| `messages` | Conversation, sender, content, status, metadata | Optional chat messages | Platform or collaboration owns messages. |
| `message_receipts` | Message and user read data | Optional chat read state | Platform or collaboration owns receipts. |
| `message_reactions` | Message and emoji | Optional chat reactions | Platform or collaboration owns reactions. |
| `ai_honey_*` | Assistant threads, messages, skills, settings | Not required for CRM tables | Exclude from CRM migration plan. |

## 10. Workflow Examples

| Workflow | Local Table Path | Frappe Posting | Why | Pros |
| --- | --- | --- | --- | --- |
| Mobile call to enquiry | `crm_enquiries` to `crm_enquiry_calls` to `crm_sync_outbox` | Create `Enquiry` when live. | Field staff can capture calls locally. | No lost calls. |
| Enquiry comment | `crm_enquiry_messages` to `crm_sync_outbox` | Update `Enquiry Message` child rows. | Comments need ordered local history. | Offline collaboration. |
| Assignment | `crm_enquiry_assignments` to `crm_enquiries` to notifications | Update `assigned_to_employee`. | Assignment must notify local users first. | Faster work routing. |
| Job start and stop | `crm_job_executions` to `crm_job_execution_events` | Create or update `Job Execution`. | Work time and cost must persist locally. | Better mobile reliability. |
| Estimate to quote | `crm_estimates` to `crm_quotations` and `crm_quotation_items` | Post `Estimate` and `Quotation`. | Supplier cost informs customer offer. | Better margin control. |
| Frappe import | `crm_import_batches` to `crm_import_rows` to target tables | Read Frappe pages and map references. | Existing live data must come local safely. | Reviewable migration. |
| Sync conflict | `crm_sync_conflicts` plus target table | Pause remote overwrite. | Local and Frappe can change at same time. | Data loss prevention. |

## 11. Performance Plan

| Concern | Table Area | Plan | Why | Pros |
| --- | --- | --- | --- | --- |
| Enquiry lists | `crm_enquiries` | Index `status_group`, `status_id`, `owner_actor_id`, `queue_id`, `team_id`, `priority`, `enquiry_date`, `created_at`, `mobile`, `frappe_name`. | Lists filter by these fields. | Fast CRM desk. |
| Mobile lookup | `crm_enquiries`, `crm_parties`, `crm_contact_methods` | Index normalized mobile fields. | Mobile history searches by phone. | Fast call capture. |
| Timeline load | Messages, calls, notes, activities | Index `enquiry_id` and event dates. | Detail pages load by enquiry. | Fast record view. |
| Sync worker | Sync outbox | Index `status`, `available_at`, `locked_at`, `record_type`, `record_id`. | Worker must claim pending items fast. | Predictable posting. |
| External refs | `crm_external_references` | Unique index by system, doctype, external name. | Prevent duplicate Frappe maps. | Safer sync. |
| Reports | Snapshots and metrics | Use snapshot tables for heavy reports. | Live reports can be expensive. | Stable dashboards. |
| Imports | Import rows | Process and validate in pages. | Large Frappe imports need retries. | Safer migration. |
| Logs | Sync attempts | Retain full attempts for a defined period only. | Logs grow fast. | Controlled storage. |

## 12. Review Gates Before Code

| Gate | Question | Recommended Decision For Phase 1 | Impact |
| --- | --- | --- | --- |
| Source of truth | Is local CRM the source of truth? | Yes. Frappe is a live posting target. | Shapes every write path. |
| Tenant model | Should CRM support true tenant isolation now? | No until a decision record exists. | Avoids premature tenant fields. |
| User model | Should CRM own users? | No. Use Platform actors. | Keeps boundaries clean. |
| Frappe credentials | Where should secrets live? | Secret store or platform identity, referenced by `credential_ref`. | Avoids secret leakage. |
| Frappe import | Should existing Frappe data import before local launch? | Yes, through import batches. | Prevents missing history. |
| Conflict policy | Can Frappe overwrite local edits? | No. Stage conflicts for review. | Prevents data loss. |
| Generic links | Should `record_type` plus `record_id` be allowed? | Use only for tags, views, activities, external refs, and reports. | Balances flexibility and integrity. |
| Party model | Should Customer and Supplier share one local table? | Yes for Phase 1 via `crm_parties`. | Matches Frappe references with less duplication. |
| Email storage | Should CRM store email body or metadata only? | Decide before implementation. | Affects privacy and search. |
| HR and SOP | Should staff request and SOP duty be CRM tables? | No for Phase 1. Keep as Frappe-adjacent or separate operations module. | Keeps CRM focused. |
| Salesforce-style scope | Should all expanded modules ship together? | No. Ship Phase 1 first, then add Phase 2 to 4 in order. | Keeps local-first migration controlled. |
| Automation | Should assignment, escalation, approval, and workflow rules be configurable? | Yes for Phase 4. Keep Phase 1 logic explicit. | Avoids early rule-engine complexity. |
| Admin metadata | Should custom fields and page layouts exist in the first migration? | No. Add after core records are stable. | Avoids unstable schema and UI contracts. |
| Field access | Should CRM add field-level access rules? | Yes for enterprise phase. Reuse Platform Identity. | Helps protect pricing and margin fields. |

## 13. First Work To Start After Approval

| Work ID | Phase | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| CRM-TABLE-001 | 1 | Approve local-first source-of-truth rule. | Final decision record or approved note. | No direct Frappe write occurs without local record and sync item. |
| CRM-TABLE-002 | 1 | Approve Phase 1 table list. | Locked list for integration, setup, party, enquiry, job, estimate, quote, reporting, and import. | Each required temp app Frappe concept has a local table. |
| CRM-TABLE-003 | 1 | Approve Frappe mapping fields. | Standard external reference and sync field contract. | Every Frappe-posted table can map back to doctype and name. |
| CRM-TABLE-004 | 1 | Approve actor and credential boundary. | Platform actor plus CRM actor-link decision. | No CRM table stores raw API key or secret. |
| CRM-TABLE-005 | 1 | Approve conflict and retry policy. | Sync status state machine. | Failed and conflicting posts are reviewable and retryable. |
| CRM-TABLE-006 | 2 | Approve Salesforce-style Phase 2 table list. | Locked list for marketing, leads, activities, pipeline, forecasts, products, CPQ, orders, and contracts. | Sales Cloud style modules have clear owners and dependencies. |
| CRM-TABLE-007 | 3 | Approve service expansion table list. | Locked list for cases, entitlements, field service, knowledge, feedback, and customer success. | Service Cloud style modules have clear owners and dependencies. |
| CRM-TABLE-008 | 4 | Approve enterprise configuration table list. | Locked list for automation, custom fields, layouts, validation, sharing, and field access. | Admin metadata does not block Phase 1 local-first work. |
| CRM-TABLE-009 | 1 | Start migrations only after approvals. | Migration implementation task. | Phase 1 planning gates are complete. |
