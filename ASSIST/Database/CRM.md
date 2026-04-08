# CRM Module Database Architecture

The Customer Relationship Management (CRM) module is designed to orchestrate outbound and inbound lead generation workflows, specifically tracking the lifecycle of cold calls from initial contact through task assignment and final resolution. It leverages Codexsun's hybrid JSON-Store architecture for flexible payload storage and indexed relational tables for high-performance querying and cross-entity polymorphic linking.

## 1. CRM JSON Stores
The foundation of the CRM module relies on standard framework JSON stores for entity persistence.

### `crm_lead_stores`
Stores raw lead information, contact details, and custom metadata for prospective customers before they are converted into core framework contacts/companies.
- Payload includes: `company_name`, `contact_name`, `email`, `phone`, `source`, `status` (New, Contacted, Qualified, Lost), `metadata`.

### `crm_interaction_stores`
Records distinct communication events (e.g., cold calls, emails, meetings).
- Payload includes: `type` (Cold Call, Email, Meeting), `summary`, `sentiment`, `next_steps`, `timestamp`, `agent_metadata`.

## 2. CRM Relational Headers & Indexes

To facilitate high-performance queries and task orchestration, key data is extracted from the JSON payloads and stored in relational header tables.

### `crm_lead_headers`
Indexes primary lead parameters for rapid dashboard sorting and searching.
- `id` (VARCHAR 32, FK to `crm_lead_stores`)
- `company_name` (VARCHAR 255)
- `contact_name` (VARCHAR 255)
- `status` (VARCHAR 50) - e.g., 'Cold', 'Warm', 'Qualified'
- `source` (VARCHAR 100)
- `owner_id` (VARCHAR 32) - The internal user responsible for the lead.
- `created_at` (TIMESTAMP)

### `crm_interaction_headers`
Indexes interactions specifically to tie them back to leads and trigger subsequent operational workflows.
- `id` (VARCHAR 32, FK to `crm_interaction_stores`)
- `lead_id` (VARCHAR 32, FK to `crm_lead_headers`)
- `type` (VARCHAR 50) - e.g., 'Cold Call'
- `interaction_date` (TIMESTAMP)
- `requires_followup` (BOOLEAN) - Flag used to determine if a task should be generated.

## 3. Polymorphic Task Integration (The "Cold Call to Task" Pipeline)

The central requirement of the CRM is to convert cold calls into actionable duties. This is achieved using the existing `task_entity_links` polymorphic architecture.

When a Cold Call interaction is registered and requires action:
1. The interaction is saved in `crm_interaction_stores` and `crm_interaction_headers`.
2. A new Task is instantiated via the Task engine.
3. A record is inserted into `task_entity_links` bridging the domains:
   - `task_id`: [The newly created UUID]
   - `entity_type`: 'crm_lead' (or 'crm_interaction')
   - `entity_id`: [The Lead or Interaction ID]

**Workflow Data Progression:**
1. **Action:** Agent registers "Cold Call" -> **DB:** `INSERT crm_interaction_stores`
2. **Action:** System Assigns Task -> **DB:** `TaskTemplateEngine.instantiate()` -> `INSERT task_entity_links (type='crm_lead')`
3. **Action:** Agent Replies to Customer -> **DB:** `UPDATE task_stores (status='In Progress')`, `INSERT crm_interaction_stores (type='Email Reply')`
4. **Action:** Task Finalized -> **DB:** `UPDATE task_stores (status='Done', progress=100)`, Lead Status elevated to "Qualified".

## 4. Entity Relationship Diagram

\`\`\`mermaid
erDiagram
    crm_lead_stores ||--|| crm_lead_headers : "Indexes"
    crm_interaction_stores ||--|| crm_interaction_headers : "Indexes"

    crm_lead_headers ||--o{ crm_interaction_headers : "Has (1:N)"
    
    crm_lead_headers ||--o{ task_entity_links : "Polymorphic Link"
    task_entity_links }|--|| task_headers : "Binds To"
\`\`\`
