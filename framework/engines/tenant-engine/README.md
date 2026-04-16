## Tenant Engine

This engine owns the reusable tenant model for the new architecture base.

Current scope:
- tenant manifest
- tenant contract
- company-link contract
- industry-profile contract
- persisted runtime storage for tenant records, company links, and industry profiles
- runtime services for upsert and tenant-context resolution

Rules:
- development posture may remain multi-tenant and multi-industry
- production posture defaults to one deployed software instance per tenant
- `apps/cxapp` remains the current live company owner
- industry packs configure tenant defaults; they do not replace tenant or company identity

Non-goal for this batch:
- moving live company ownership out of `apps/cxapp`
