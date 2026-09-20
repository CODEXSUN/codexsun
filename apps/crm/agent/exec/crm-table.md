# CRM Table Plan

## 1. Planning Boundary

| Item | Decision |
| --- | --- |
| Purpose | Plan CRM tables before any migration, API, or UI code. |
| Product scope | Build a complete local CRM for sales, service, field work, collection, quality, AI help, and CRM-linked HR duty. |
| Main workflow | Campaign to lead to enquiry to estimate to quotation to assignment to field work to collection to verification. |
| App boundary | CRM owns product tables under `apps/crm`. |
| Identity boundary | Platform Identity owns users, roles, login, and global permissions. CRM stores actor IDs only. |
| Messaging boundary | CRM stores customer communication records. Shared chat infrastructure can deliver messages later. |
| Notification boundary | CRM raises CRM events. The platform can deliver push, email, or in-app alerts. |
| AI boundary | CRM stores assistant runs and approved outputs. The assistant does not own CRM records. |
| HR boundary | CRM stores duty, attendance links, and performance data needed for service delivery only. |
| Tenant boundary | Do not add tenant fields until a tenant decision record exists. |
| No external dependency | Do not require any live external system for the first CRM data model. |

## 2. Table Group Review

| Group | Keep | Add | Why |
| --- | --- | --- | --- |
| Campaign and lead | Campaign, lead, source, score, status history | Campaign cost, campaign member, duplicate review | This starts the funnel and supports attribution. |
| Customer 360 | Account, contact, address, contact method | Preference, consent, duplicate set | Sales and service need one customer view. |
| Enquiry | Enquiry, note, message, assignment, schedule, attachment, activity | Priority, SLA, commitment, timeline event | The enquiry is the main work record. |
| Communication | Call, email, SMS, WhatsApp, chat app records | Template, send attempt, delivery receipt, consent | Customer interaction must be auditable. |
| Supplier estimate | Supplier, estimate request, estimate line | Comparison, selection, supplier commitment | Quotation needs real cost and availability. |
| Quotation | Quotation, line, tax, discount, terms | Version, approval, send record, response | Sales teams need controlled quote history. |
| Assignment and schedule | Assignment, queue, team, duty roster | Follow-up queue, workload snapshot, escalation | Assigner and assignee work must scale. |
| Field service | Work order, task, appointment, check-in, check-out | Location record, proof, part use, issue, revisit | Service teams need site proof and completion control. |
| Collection | Collection plan, promise, attempt, payment record | Balance snapshot, escalation | Teams need payment commitments and recovery work. |
| Completion and quality | Verification, checklist, outcome, reopen | Recording metadata, review score, coaching action | Closed work needs proof and review. |
| AI assistant | Assistant session, request, suggestion, approval | Draft reply, quote helper, follow-up helper | AI should help users, not replace approval. |
| CRM-linked HR | Staff profile reference, skill, duty, attendance link | Performance metric, duty exception | Field service needs capacity and duty control. |
| Reports and admin | Saved view, report snapshot, metric snapshot | Automation rule, custom field, picklist, layout | Large CRM teams need configuration later. |

## 3. Shared Field Groups

| Field Group | Fields | Why | Where Used | Pros |
| --- | --- | --- | --- | --- |
| Core | `id`, `created_at`, `created_by_actor_id`, `updated_at`, `updated_by_actor_id` | Track record ownership and change history. | All CRM-owned tables. | Clear support trail. |
| Archive | `archived_at`, `archived_by_actor_id`, `archive_reason` | Hide records without hard delete. | Master and transaction tables. | Records stay recoverable. |
| Ownership | `owner_actor_id`, `team_id`, `queue_id`, `territory_id` | Route work to people and teams. | Leads, enquiries, quotes, work orders, cases. | Scales multi-user work. |
| Status | `status`, `status_reason`, `status_changed_at`, `status_changed_by_actor_id` | Make workflow state explicit. | Lead, enquiry, quote, work, collection, verification. | Better reporting and audit. |
| Money | `amount`, `currency`, `exchange_rate`, `tax_amount`, `discount_amount`, `total_amount` | Store commercial values safely. | Estimates, quotes, collections, contracts. | Multi-currency ready. |
| Contact | `phone`, `mobile`, `email`, `whatsapp`, `preferred_channel` | Reach customers through the right channel. | Accounts, contacts, enquiries, communications. | Faster follow-up. |
| Time | `due_at`, `scheduled_start_at`, `scheduled_end_at`, `completed_at` | Track promises and service work. | Assignments, visits, tasks, collection. | Good SLA control. |
| Location | `latitude`, `longitude`, `address_text`, `accuracy_meters`, `captured_at` | Prove field visits and collections. | Check-in, check-out, location history. | Better site accountability. |
| Evidence | `storage_ref`, `file_name`, `mime_type`, `size_bytes`, `captured_by_actor_id` | Attach proof to work. | Attachments, work proof, payment proof. | Stronger verification. |
| Safe JSON | `metadata_json`, `criteria_json`, `result_json` | Store controlled flexible data. | Reports, automation, AI, import. | Reduces early churn. |

## 4. Migration Order

| Order | Migration ID | Table Group | First Work | Why First |
| --- | --- | --- | --- | --- |
| 001 | `crm.foundation.001` | Number sequences, sources, tags, picklists, saved views | Create shared setup. | Other records need stable references. |
| 010 | `crm.organization.001` | Teams, members, queues, territories, shares | Create routing foundation. | Work assignment needs teams and queues. |
| 020 | `crm.party.001` | Accounts, contacts, addresses, contact methods, preferences | Create customer 360. | Enquiries and quotes need customers. |
| 030 | `crm.campaign.001` | Campaigns, members, costs, lead sources | Create marketing intake. | Leads need campaign attribution. |
| 040 | `crm.lead.001` | Leads, scores, qualification, duplicate reviews, conversion links | Create lead workflow. | Qualified leads create enquiries. |
| 050 | `crm.enquiry.001` | Enquiries, messages, notes, schedules, activities, attachments | Create the main work record. | Most CRM work starts here. |
| 060 | `crm.communication.001` | Calls, emails, SMS, WhatsApp, chat app messages, templates | Create customer timeline. | Every follow-up must be visible. |
| 070 | `crm.supplier.001` | Suppliers, estimate requests, supplier estimates, comparisons | Create cost capture. | Quotation needs supplier input. |
| 080 | `crm.quotation.001` | Quotations, lines, terms, versions, approvals, send records | Create customer offers. | Sales teams need quote control. |
| 090 | `crm.assignment.001` | Assignments, follow-ups, schedules, commitments, escalations | Create work control. | Managers need assigner and assignee queues. |
| 100 | `crm.field-service.001` | Work orders, tasks, appointments, check-in, check-out, proof, parts | Create site execution. | Engineers need field workflow. |
| 110 | `crm.collection.001` | Collection plans, promises, attempts, payments, balance snapshots | Create commercial follow-up. | Teams need payment visibility. |
| 120 | `crm.verification.001` | Completion rules, checklists, verification outcomes, reopen records | Create close control. | Work must be verified before close. |
| 130 | `crm.quality.001` | Recording metadata, review scores, issues, coaching actions | Create quality review. | Calls and visits need review. |
| 140 | `crm.ai.001` | Assistant sessions, requests, suggestions, approvals, draft outputs | Create AI support trail. | AI output needs review and audit. |
| 150 | `crm.hr-service.001` | Staff profile refs, skills, duty roster, attendance links, exceptions | Create CRM-linked HR support. | Scheduling needs staff availability. |
| 160 | `crm.reporting.001` | Metric snapshots, report snapshots, dashboards | Create reporting layer. | Managers need fast overview. |
| 170 | `crm.automation.001` | Assignment rules, reminder rules, approval rules, workflow actions | Create configurable workflows. | Automation should follow stable core tables. |
| 180 | `crm.admin-metadata.001` | Custom fields, layouts, validation rules, field access rules | Create enterprise configuration. | Customization should not block core launch. |

## 5. Required Tables

### 5.1 Foundation And Routing

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_number_sequences` | Core, `record_type`, `prefix`, `next_number`, `padding`, `is_active` | Generate readable numbers. | Enquiries, quotes, work orders. | `ENQ-000142`. | Easy human reference. |
| `crm_sources` | Core, Archive, `name`, `source_type`, `is_active`, `sort_order` | Track origin. | Campaign, lead, enquiry. | Website, phone, referral. | Better source reports. |
| `crm_tags` | Core, Archive, `name`, `color_token`, `description` | Label records. | Lists and reports. | VIP, urgent. | Flexible segmentation. |
| `crm_record_tags` | `id`, `tag_id`, `record_type`, `record_id`, `created_at`, `created_by_actor_id` | Link tags to records. | All record detail pages. | Add VIP to account. | One tag model. |
| `crm_picklists` | Core, `record_type`, `field_key`, `name`, `is_active` | Define option sets. | Forms and filters. | Enquiry priority. | Cleaner data entry. |
| `crm_picklist_values` | Core, `picklist_id`, `value_key`, `label`, `sort_order`, `is_default`, `is_active` | Store option values. | Forms and filters. | Priority urgent. | Stable labels. |
| `crm_teams` | Core, Archive, `name`, `team_type`, `parent_team_id`, `description` | Group users. | Assignment and reports. | Chennai service team. | Supports hierarchy. |
| `crm_team_members` | Core, `team_id`, `actor_id`, `role`, `started_at`, `ended_at` | Link actors to teams. | Queues and visibility. | Arun is service manager. | Uses platform actors safely. |
| `crm_queues` | Core, Archive, `name`, `queue_type`, `team_id`, `description` | Hold unassigned work. | Lead, enquiry, service queues. | Open enquiries queue. | Better workload control. |
| `crm_queue_members` | Core, `queue_id`, `actor_id`, `role`, `is_active` | Link actors to queues. | Claim and assign. | Seller can claim leads. | Simple routing. |
| `crm_territories` | Core, Archive, `name`, `parent_territory_id`, `region_code`, `description` | Segment markets and service areas. | Accounts, leads, work orders. | South zone. | Regional reporting. |
| `crm_record_shares` | Core, `record_type`, `record_id`, `share_type`, `share_target_id`, `access_level`, `expires_at` | Share records with actors or teams. | Collaboration. | Share enquiry with manager. | Controlled visibility. |

### 5.2 Customer 360

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_accounts` | Core, Archive, Ownership, `account_number`, `name`, `account_type`, `industry`, `website_url`, `phone`, `email`, `status`, `territory_id` | Store customer organizations. | Leads, enquiries, quotes, service. | Acme Pvt Ltd. | One customer record. |
| `crm_contacts` | Core, Archive, Ownership, `first_name`, `last_name`, `display_name`, `job_title`, `primary_email`, `primary_phone`, `mobile_phone`, `preferred_contact_method`, `do_not_call`, `do_not_email` | Store people. | Account, enquiry, quote, communication. | Meera Rao, CFO. | Reusable contact data. |
| `crm_account_contacts` | Core, `account_id`, `contact_id`, `role`, `is_primary`, `started_at`, `ended_at` | Link people to accounts. | Customer 360. | Main billing contact. | Supports many contacts. |
| `crm_addresses` | Core, Archive, `record_type`, `record_id`, `address_type`, `line1`, `line2`, `city`, `state`, `postal_code`, `country`, `latitude`, `longitude`, `is_primary` | Store billing and service addresses. | Visits, quotes, invoices. | Service site address. | Accurate site planning. |
| `crm_contact_methods` | Core, Archive, `record_type`, `record_id`, `method_type`, `label`, `value`, `is_primary`, `is_verified` | Store channel details. | Communication and lookup. | WhatsApp number. | Channel-ready contact data. |
| `crm_customer_preferences` | Core, `account_id`, `contact_id`, `preferred_channel`, `preferred_time`, `language`, `notes` | Respect customer contact choices. | Follow-up and automation. | Call after 3 PM. | Better customer experience. |
| `crm_consents` | Core, `record_type`, `record_id`, `consent_type`, `status`, `given_at`, `expires_at`, `note` | Track consent for contact and recording. | Calls, recordings, campaigns. | Consent for call recording. | Safer compliance. |
| `crm_duplicate_sets` | Core, `record_type`, `status`, `score`, `reviewed_by_actor_id`, `reviewed_at` | Store possible duplicates. | Lead, account, contact review. | Two Acme accounts. | Safer cleanup. |
| `crm_duplicate_items` | `id`, `duplicate_set_id`, `record_id`, `match_reason_json`, `created_at` | Link duplicate records. | Merge review. | Same mobile number. | Clear evidence. |
| `crm_merge_requests` | Core, `record_type`, `winner_record_id`, `loser_record_ids_json`, `status`, `requested_by_actor_id`, `approved_by_actor_id`, `merge_plan_json` | Control merges. | Data admin. | Merge two contacts. | Prevents data loss. |

### 5.3 Campaign And Lead

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_campaigns` | Core, Archive, Ownership, `campaign_number`, `name`, `campaign_type`, `status`, `start_date`, `end_date`, `budget_amount`, `actual_cost_amount`, `target_segment`, `goal` | Track marketing and outreach. | Lead generation and reports. | Diwali service campaign. | Clear campaign ROI. |
| `crm_campaign_members` | Core, `campaign_id`, `lead_id`, `contact_id`, `status`, `responded_at`, `response_note` | Track campaign audience. | Campaign detail. | Contact responded by WhatsApp. | Better conversion tracking. |
| `crm_campaign_costs` | Core, `campaign_id`, `cost_type`, `amount`, `currency`, `spent_at`, `note` | Track spend. | Campaign report. | Ad spend 5000 INR. | True cost reporting. |
| `crm_leads` | Core, Archive, Ownership, `lead_number`, `campaign_id`, `source_id`, `company_name`, `contact_name`, `mobile`, `email`, `lead_status`, `rating`, `score`, `need_summary`, `territory_id` | Store unqualified prospects. | Lead desk and conversion. | Website lead asks for service. | Keeps early leads separate. |
| `crm_lead_scores` | Core, `lead_id`, `score`, `score_reason`, `scored_at`, `scored_by_actor_id` | Track lead quality. | Qualification. | Score 80 due to budget. | Better prioritization. |
| `crm_lead_status_history` | `id`, `lead_id`, Status | Track lead movement. | Lead audit. | New to qualified. | Clear funnel history. |
| `crm_lead_qualification` | Core, `lead_id`, `need`, `budget`, `authority`, `timeline`, `fit_status`, `qualification_note` | Qualify leads. | Lead conversion. | Has budget and need. | Better conversion quality. |
| `crm_lead_conversions` | Core, `lead_id`, `account_id`, `contact_id`, `enquiry_id`, `converted_at`, `converted_by_actor_id` | Link lead to customer records. | Audit and reports. | Lead became enquiry. | No lost attribution. |

### 5.4 Enquiry And Timeline

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_enquiries` | Core, Archive, Ownership, `enquiry_number`, `title`, `description`, `account_id`, `contact_id`, `source_id`, `lead_id`, `priority`, `status`, `due_at`, `customer_location_id`, `last_activity_at` | Store the main customer request. | CRM desk and reports. | Repair request from Acme. | One main work item. |
| `crm_enquiry_status_history` | `id`, `enquiry_id`, Status | Track status changes. | Audit and reports. | Open to assigned. | Clear work history. |
| `crm_enquiry_messages` | Core, Archive, `enquiry_id`, `parent_message_id`, `message_type`, `body`, `author_actor_id`, `author_contact_id`, `is_internal` | Store comments and replies. | Enquiry timeline. | Customer asked for quote. | Full context. |
| `crm_enquiry_notes` | Core, Archive, `enquiry_id`, `note_type`, `body`, `is_private` | Store internal notes. | Team handoff. | Customer prefers morning visit. | Better team memory. |
| `crm_enquiry_schedules` | Core, `enquiry_id`, `scheduled_at`, `schedule_type`, `status`, `note` | Track follow-up dates. | Calendar and reminders. | Call tomorrow. | Fewer missed follow-ups. |
| `crm_enquiry_activities` | Core, `enquiry_id`, `activity_type`, `title`, `details`, `activity_at`, `actor_id` | Store timeline events. | Enquiry detail. | Quote sent. | Easy audit. |
| `crm_enquiry_attachments` | Core, Archive, `enquiry_id`, Evidence | Store files. | Detail and proof. | Site photo attached. | Evidence stays with work. |
| `crm_enquiry_commitments` | Core, `enquiry_id`, `commitment_type`, `promised_by_type`, `promised_by_id`, `due_at`, `status`, `note` | Track promises. | Follow-up and reports. | Customer promised payment Friday. | Promises are visible. |
| `crm_sla_policies` | Core, Archive, `name`, `record_type`, `priority`, `first_response_minutes`, `resolution_minutes`, `is_active` | Define service targets. | Enquiries and cases. | Urgent response in 30 minutes. | SLA-ready workflow. |
| `crm_sla_checkpoints` | Core, `record_type`, `record_id`, `checkpoint_type`, `due_at`, `met_at`, `status` | Track SLA deadlines. | Overview and escalations. | Response due by noon. | Better service control. |

### 5.5 Communication

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_communication_threads` | Core, `record_type`, `record_id`, `channel`, `subject`, `status`, `last_message_at` | Group customer conversations. | Enquiry and account detail. | WhatsApp thread for enquiry. | Cleaner timeline. |
| `crm_communications` | Core, `thread_id`, `record_type`, `record_id`, `channel`, `direction`, `from_value`, `to_value`, `subject`, `body`, `status`, `sent_at`, `received_at`, `actor_id` | Store customer interactions. | Timeline and reports. | SMS sent to customer. | One communication history. |
| `crm_call_logs` | Core, `record_type`, `record_id`, `direction`, `phone_number`, `started_at`, `ended_at`, `duration_seconds`, `outcome`, `actor_id`, `note` | Store voice calls. | Enquiry and collection. | Outbound collection call. | Call history is searchable. |
| `crm_message_templates` | Core, Archive, `name`, `channel`, `record_type`, `subject_template`, `body_template`, `is_active` | Store repeat messages. | Send and AI draft screens. | Quote follow-up template. | Faster replies. |
| `crm_send_attempts` | Core, `communication_id`, `channel`, `provider`, `status`, `attempted_at`, `error_code`, `error_message` | Track send attempts. | Delivery support. | WhatsApp send failed. | Easier troubleshooting. |
| `crm_delivery_receipts` | Core, `communication_id`, `status`, `received_at`, `provider_message_id`, `raw_status_json` | Track delivery status. | Message timeline. | Delivered and read. | Clear communication proof. |

### 5.6 Suppliers And Estimates

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_suppliers` | Core, Archive, Ownership, `supplier_number`, `name`, `status`, `phone`, `email`, `territory_id`, `rating` | Store supplier parties. | Estimates and service parts. | ABC Spares. | Supplier lookup is local. |
| `crm_supplier_contacts` | Core, `supplier_id`, `contact_id`, `role`, `is_primary` | Link supplier people. | Estimate requests. | Sales contact. | Faster supplier follow-up. |
| `crm_estimate_requests` | Core, `enquiry_id`, `request_number`, `status`, `needed_by`, `requested_by_actor_id`, `note` | Ask suppliers for pricing. | Estimate workflow. | Request laptop repair cost. | Controlled sourcing. |
| `crm_estimate_request_lines` | Core, `request_id`, `item_name`, `description`, `quantity`, `unit`, `target_price` | Store requested items. | Supplier estimate comparison. | Two replacement parts. | Clear supplier asks. |
| `crm_supplier_estimates` | Core, Archive, `request_id`, `supplier_id`, `estimate_number`, `status`, `valid_till`, `currency`, `subtotal_amount`, `tax_amount`, `total_amount`, `delivery_days`, `warranty_terms` | Store supplier offers. | Quotation preparation. | Supplier quotes 5000 INR. | Multiple supplier comparison. |
| `crm_supplier_estimate_lines` | Core, `supplier_estimate_id`, `item_name`, `quantity`, `unit_cost`, `tax_amount`, `total_amount`, `delivery_note` | Store supplier line details. | Estimate detail. | Sensor at 1200 INR. | Accurate cost rollup. |
| `crm_estimate_comparisons` | Core, `request_id`, `selected_supplier_estimate_id`, `comparison_json`, `decision_note`, `decided_by_actor_id`, `decided_at` | Compare supplier offers. | Manager approval. | Choose lower cost with warranty. | Better margin control. |
| `crm_supplier_commitments` | Core, `supplier_id`, `enquiry_id`, `commitment_type`, `promised_at`, `due_at`, `status`, `note` | Track supplier promises. | Follow-up and reports. | Part delivery Monday. | Less missed dependency work. |

### 5.7 Quotation And Commercial Offer

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_quotations` | Core, Archive, Ownership, `quotation_number`, `enquiry_id`, `account_id`, `contact_id`, `status`, `transaction_date`, `valid_till`, `currency`, `subtotal_amount`, `discount_amount`, `tax_amount`, `grand_total`, `margin_amount`, `remarks` | Store customer offers. | Quote builder and reports. | Quote for Acme service. | Controlled sales offer. |
| `crm_quotation_lines` | Core, `quotation_id`, `line_number`, `item_code`, `item_name`, `description`, `quantity`, `unit`, `rate`, `discount_amount`, `tax_amount`, `amount`, `source_estimate_line_id` | Store quote lines. | Quote math and preview. | Service charge line. | Repeatable totals. |
| `crm_quotation_terms` | Core, `quotation_id`, `term_type`, `term_text`, `sort_order` | Store terms. | Quote preview. | Payment within 7 days. | Clear customer terms. |
| `crm_quotation_versions` | Core, `quotation_id`, `version_number`, `status`, `snapshot_json`, `created_by_actor_id` | Keep revisions. | Quote history. | Version 2 adds discount. | Full history. |
| `crm_quotation_approvals` | Core, `quotation_id`, `approval_type`, `status`, `requested_by_actor_id`, `approved_by_actor_id`, `requested_at`, `decided_at`, `decision_note` | Control margin and discount risk. | Quote workflow. | Manager approves discount. | Safer pricing. |
| `crm_quotation_sends` | Core, `quotation_id`, `communication_id`, `channel`, `sent_to`, `sent_at`, `sent_by_actor_id`, `status` | Track sent quotes. | Timeline and reports. | Sent by email. | Proof of send. |
| `crm_quotation_responses` | Core, `quotation_id`, `response_status`, `responded_at`, `responded_by_contact_id`, `note` | Track customer response. | Sales follow-up. | Accepted by customer. | Clear next step. |

### 5.8 Assignment, Duty, And Field Service

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_assignments` | Core, Ownership, `record_type`, `record_id`, `assigner_actor_id`, `assignee_actor_id`, `queue_id`, `status`, `priority`, `assigned_at`, `accepted_at`, `due_at` | Assign work. | Enquiry, work order, collection. | Assign engineer to visit. | Clear accountability. |
| `crm_assignment_status_history` | `id`, `assignment_id`, Status | Track assignment movement. | Audit and reports. | Assigned to accepted. | Better follow-up. |
| `crm_follow_ups` | Core, `record_type`, `record_id`, `owner_actor_id`, `follow_up_type`, `due_at`, `status`, `result_note` | Track next actions. | My follow-up and manager queue. | Call customer tomorrow. | Fewer missed tasks. |
| `crm_duty_rosters` | Core, `actor_id`, `team_id`, `shift_date`, `shift_start_at`, `shift_end_at`, `status`, `backup_actor_id` | Store CRM duty plan. | Scheduling and dispatch. | Engineer on morning duty. | Assigns available staff. |
| `crm_staff_skills` | Core, `actor_id`, `skill_key`, `skill_level`, `certified_until`, `is_active` | Match work to skills. | Dispatch and workload. | AC repair skill. | Better assignment quality. |
| `crm_workload_snapshots` | Core, `actor_id`, `team_id`, `open_count`, `overdue_count`, `scheduled_minutes`, `snapshot_at` | Show current load. | Assignment screen. | Engineer has five open tasks. | Balanced work. |
| `crm_work_orders` | Core, Archive, Ownership, `work_order_number`, `enquiry_id`, `quotation_id`, `account_id`, `contact_id`, `subject`, `status`, `priority`, `scheduled_start_at`, `scheduled_end_at`, `completed_at` | Plan field or remote work. | Service console. | Repair device at site. | Connects enquiry to execution. |
| `crm_work_order_tasks` | Core, `work_order_id`, `title`, `description`, `status`, `estimated_minutes`, `completed_at`, `sort_order` | Store task checklist. | Engineer app. | Check wiring. | Better field quality. |
| `crm_service_appointments` | Core, `work_order_id`, `assignee_actor_id`, `customer_address_id`, `status`, `scheduled_start_at`, `scheduled_end_at`, `actual_start_at`, `actual_end_at` | Schedule visits. | Calendar and engineer queue. | Visit booked at 4 PM. | Better time planning. |
| `crm_check_ins` | Core, `appointment_id`, `actor_id`, `check_in_at`, Location, `device_id`, `note` | Record arrival. | Field proof and attendance. | Engineer reached site. | Site presence proof. |
| `crm_check_outs` | Core, `appointment_id`, `actor_id`, `check_out_at`, Location, `work_result`, `customer_note` | Record departure and result. | Completion and reports. | Work completed at 6 PM. | Clear finish proof. |
| `crm_location_records` | Core, `record_type`, `record_id`, Location, `source`, `purpose` | Store location events. | Field service and collection. | Visit check-in location. | Location audit. |
| `crm_work_proofs` | Core, `work_order_id`, `proof_type`, Evidence, `note` | Store photos, files, and signatures. | Verification. | Customer signature. | Strong completion proof. |
| `crm_service_parts` | Core, `work_order_id`, `item_code`, `item_name`, `quantity_planned`, `quantity_used`, `unit_cost`, `status` | Track parts. | Cost and stock handoff. | One sensor used. | Better service cost. |
| `crm_field_issues` | Core, `work_order_id`, `issue_type`, `severity`, `status`, `owner_actor_id`, `due_at`, `resolution_note` | Track field blockers. | Revisit and escalation. | Customer unavailable. | Clear next action. |

### 5.9 Collection, Completion, And Quality

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_collection_plans` | Core, Ownership, `record_type`, `record_id`, `expected_amount`, `currency`, `due_at`, `mode`, `status`, `owner_actor_id` | Plan collections. | Quote, enquiry, work order. | Collect 10000 INR Friday. | Payment follow-up is visible. |
| `crm_payment_commitments` | Core, `collection_plan_id`, `promised_amount`, `promised_at`, `promised_by_contact_id`, `promise_note`, `status` | Track promises. | Collection queue. | Customer promises Monday. | Better recovery work. |
| `crm_collection_attempts` | Core, `collection_plan_id`, `attempt_type`, `communication_id`, `visited_address_id`, `attempted_at`, `outcome`, `note` | Track follow-up attempts. | Collection history. | Call for overdue payment. | Complete effort log. |
| `crm_payments` | Core, `collection_plan_id`, `amount`, `currency`, `mode`, `reference_number`, `received_by_actor_id`, `received_at`, `proof_storage_ref`, `status` | Record received money. | Collection and reports. | UPI payment received. | Proof of collection. |
| `crm_balance_snapshots` | Core, `record_type`, `record_id`, `quoted_amount`, `collected_amount`, `pending_amount`, `overdue_amount`, `snapshot_at` | Store commercial state. | Overview and reports. | Pending 3000 INR. | Fast dashboard. |
| `crm_completion_rules` | Core, `record_type`, `name`, `criteria_json`, `is_active` | Define when work can complete. | Work order and enquiry close. | Proof required before complete. | Clear close control. |
| `crm_verification_checklists` | Core, `record_type`, `record_id`, `name`, `status`, `assigned_verifier_actor_id`, `due_at` | Define review steps. | Verification queue. | Verify site work. | Better quality gate. |
| `crm_verification_items` | Core, `checklist_id`, `title`, `status`, `evidence_required`, `result_note`, `sort_order` | Store checklist rows. | Verification UI. | Customer signature checked. | Detailed proof. |
| `crm_verification_outcomes` | Core, `checklist_id`, `outcome`, `decided_by_actor_id`, `decided_at`, `note` | Store final result. | Close workflow. | Verified. | Explicit close decision. |
| `crm_reopen_records` | Core, `record_type`, `record_id`, `reason`, `reopened_by_actor_id`, `reopened_at`, `new_assignment_id` | Reopen failed work. | Verification failure. | Missing proof. | Controlled rework. |
| `crm_recordings` | Core, `record_type`, `record_id`, `channel`, `storage_ref`, `duration_seconds`, `recorded_at`, `consent_id`, `retain_until`, `status` | Store call or visit recording metadata. | Quality review. | Recorded support call. | Recording is controlled. |
| `crm_quality_reviews` | Core, `record_type`, `record_id`, `recording_id`, `reviewer_actor_id`, `score`, `result`, `reviewed_at`, `review_note` | Review calls and visits. | Quality dashboard. | Call score 82. | Improves service. |
| `crm_quality_issues` | Core, `quality_review_id`, `issue_type`, `severity`, `owner_actor_id`, `due_at`, `status`, `resolution_note` | Track corrective action. | Coaching and reports. | Poor greeting issue. | Actionable quality review. |

### 5.10 AI Assistant, HR Link, Reports, And Admin

| Table | Required Fields | Why | Where Used | Short Example | Pros |
| --- | --- | --- | --- | --- | --- |
| `crm_assistant_sessions` | Core, `actor_id`, `record_type`, `record_id`, `purpose`, `status`, `started_at`, `ended_at` | Group AI help. | Enquiry, quote, quality. | Assistant helps draft quote. | Clear AI context. |
| `crm_assistant_requests` | Core, `session_id`, `request_type`, `input_summary`, `status`, `requested_at` | Store AI requests. | AI audit. | Summarize enquiry. | Traceable assistance. |
| `crm_assistant_suggestions` | Core, `request_id`, `suggestion_type`, `suggestion_text`, `suggestion_json`, `confidence`, `status` | Store AI output. | User review. | Suggested follow-up. | User can approve or reject. |
| `crm_assistant_approvals` | Core, `suggestion_id`, `approved_by_actor_id`, `decision`, `decided_at`, `decision_note` | Require human approval. | Quote and message drafts. | User approves WhatsApp draft. | AI stays advisory. |
| `crm_staff_profiles` | Core, `actor_id`, `employee_code`, `display_name`, `team_id`, `role_name`, `service_area`, `work_status` | Store CRM staff reference. | Duty, assignment, reports. | Field engineer profile. | CRM need not own users. |
| `crm_attendance_links` | Core, `actor_id`, `duty_roster_id`, `check_in_id`, `check_out_id`, `attendance_date`, `status` | Link duty to field work. | Attendance review. | Check-in counted for duty. | Better service HR view. |
| `crm_duty_exceptions` | Core, `actor_id`, `duty_roster_id`, `exception_type`, `status`, `reviewer_actor_id`, `note` | Track duty problems. | Manager review. | Late check-in. | Better accountability. |
| `crm_performance_metrics` | Core, `actor_id`, `team_id`, `metric_period`, `metric_key`, `metric_value`, `calculated_at` | Store performance rollups. | Manager dashboard. | First-time fix rate. | Fast reports. |
| `crm_saved_views` | Core, `actor_id`, `record_type`, `name`, `filter_json`, `sort_json`, `is_default` | Store user lists. | CRM desks. | My overdue work. | Faster daily work. |
| `crm_metric_snapshots` | Core, `metric_name`, `record_type`, `period_start`, `period_end`, `filter_json`, `result_json`, `created_at` | Store report data. | Overview and dashboards. | Open enquiries by team. | Fast dashboard load. |
| `crm_automation_rules` | Core, `record_type`, `rule_name`, `trigger_event`, `criteria_json`, `is_active` | Configure repeat workflows. | Assignment and reminders. | Auto-assign urgent enquiry. | Less manual work. |
| `crm_automation_actions` | Core, `rule_id`, `action_type`, `action_json`, `sort_order` | Store rule actions. | Automation engine. | Create follow-up task. | Multi-step automation. |
| `crm_custom_fields` | Core, `record_type`, `field_key`, `label`, `field_type`, `is_required`, `config_json`, `is_active` | Add controlled custom data later. | Admin and forms. | GST number field. | Sector fit without early churn. |
| `crm_page_layouts` | Core, `record_type`, `layout_name`, `layout_json`, `is_default`, `is_active` | Store future layouts. | Web UI. | Service enquiry layout. | Fits many CRM levels. |
| `crm_field_access_rules` | Core, `record_type`, `field_key`, `target_type`, `target_id`, `access_level` | Protect sensitive fields. | API and forms. | Hide margin from seller. | Safer enterprise use. |

## 6. Workflow Examples

| Workflow | Table Path | Why | Pros |
| --- | --- | --- | --- |
| Campaign to lead | `crm_campaigns` to `crm_campaign_members` to `crm_leads` | Track marketing source and response. | Campaign ROI is visible. |
| Lead to enquiry | `crm_leads` to `crm_lead_qualification` to `crm_lead_conversions` to `crm_enquiries` | Convert only qualified work. | Cleaner customer records. |
| Customer communication | `crm_communication_threads` to `crm_communications` to `crm_delivery_receipts` | Keep all contact history. | Complete customer timeline. |
| Call recording review | `crm_call_logs` to `crm_recordings` to `crm_quality_reviews` | Review service quality. | Coaching becomes traceable. |
| Estimate to quote | `crm_estimate_requests` to `crm_supplier_estimates` to `crm_quotations` | Build quotes from real cost. | Better margin control. |
| Quote send and response | `crm_quotations` to `crm_quotation_sends` to `crm_quotation_responses` | Track customer offer state. | Sales next step is clear. |
| Assignment to field work | `crm_assignments` to `crm_work_orders` to `crm_service_appointments` | Connect manager assignment to execution. | Assignee and assigner see the same state. |
| Engineer site visit | `crm_service_appointments` to `crm_check_ins` to `crm_check_outs` to `crm_work_proofs` | Record visit proof. | Site work is auditable. |
| Collection follow-up | `crm_collection_plans` to `crm_payment_commitments` to `crm_collection_attempts` to `crm_payments` | Track payment promises and results. | Better cash recovery. |
| Completion and verification | `crm_work_orders` to `crm_verification_checklists` to `crm_verification_outcomes` | Close only verified work. | Fewer false closures. |
| AI assisted follow-up | `crm_assistant_requests` to `crm_assistant_suggestions` to `crm_assistant_approvals` | Make AI output reviewable. | Users stay in control. |

## 7. Performance Plan

| Concern | Table Area | Plan | Why | Pros |
| --- | --- | --- | --- | --- |
| CRM desks | Leads, enquiries, assignments, work orders | Index `status`, `owner_actor_id`, `team_id`, `queue_id`, `priority`, `due_at`, `created_at`. | Lists filter by these fields. | Fast daily work views. |
| Customer lookup | Accounts, contacts, contact methods | Index normalized phone, mobile, email, and account name. | Users search by phone and customer. | Fast call capture. |
| Timeline load | Communications, notes, activities, attachments | Index `record_type`, `record_id`, and event dates. | Detail pages load timeline by record. | Fast record view. |
| Field work | Appointments, check-ins, check-outs | Index assignee, schedule time, status, and location date. | Dispatch screens need date and actor filters. | Faster schedule planning. |
| Collections | Collection plans, promises, payments | Index due date, owner, status, and record link. | Overdue work must surface quickly. | Better cash follow-up. |
| Reports | Metric snapshots | Store periodic rollups. | Heavy dashboards should not scan all tables. | Stable dashboards. |
| Attachments | Evidence tables | Store storage refs and metadata only. | File storage can stay outside CRM tables. | Smaller database. |
| AI | Assistant requests and suggestions | Store summaries and approved outputs. | Avoid storing raw private data when not needed. | Safer AI audit. |

## 8. Review Gates Before Code

| Gate | Question | Recommended Decision | Impact |
| --- | --- | --- | --- |
| Source of truth | Does CRM own its product data locally? | Yes. | Shapes every write path. |
| Identity | Should CRM own users? | No. Use platform actors. | Keeps boundaries clean. |
| Customer 360 | Should accounts and contacts ship early? | Yes. | Enquiry and quotation need stable customer data. |
| Communication | Should CRM store full message bodies? | Decide by channel and privacy policy. | Affects search, privacy, and retention. |
| Recording | Should recordings store files in the database? | No. Store metadata and storage refs. | Keeps database smaller. |
| Location | Should location be mandatory for every visit? | Yes for check-in and check-out. | Gives field proof. |
| AI | Can AI create CRM records directly? | No. It can draft and suggest only. | Keeps user approval clear. |
| HR | Should full HR live inside CRM? | No. Store only CRM duty and service delivery links. | Keeps CRM focused. |
| Custom fields | Should custom fields ship before core modules? | No. Add after core tables settle. | Reduces early complexity. |
| Automation | Should automation ship before manual workflow? | No. Add after stable manual flow. | Prevents hidden workflow bugs. |

## 9. First Work To Start After Approval

| Work ID | Phase | Task | Output | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| CRM-TABLE-001 | 0 | Approve CRM-only source-of-truth rule. | Approved planning note. | CRM data does not depend on a live external system. |
| CRM-TABLE-002 | 0 | Approve migration order. | Locked table group order. | Dependencies flow from setup to reports. |
| CRM-TABLE-003 | 0 | Approve Phase 1 table list. | Foundation, routing, customer, campaign, lead, enquiry tables are locked. | The first CRM workflow can start. |
| CRM-TABLE-004 | 0 | Approve communication storage policy. | Channel and retention decision. | Calls, messages, and recordings have privacy rules. |
| CRM-TABLE-005 | 0 | Approve field service proof policy. | Location, photo, file, and signature rule. | Site work can be verified. |
| CRM-TABLE-006 | 0 | Approve AI approval policy. | Assistant scope decision. | AI cannot change CRM records without user approval. |
| CRM-TABLE-007 | 0 | Approve CRM-linked HR boundary. | Duty and attendance scope decision. | CRM does not become a full HR system. |
| CRM-TABLE-008 | 1 | Start migrations only after approvals. | Migration implementation task. | Planning gates are complete. |
