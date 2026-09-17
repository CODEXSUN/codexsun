# Orship Infrastructure And Deployment Planning

## Identity

Application: Orship

Task prefix: `O`

## Goal

Build Orship as the governed infrastructure and deployment control plane. Deploy Platform as the first managed application.

## First Infrastructure Composition

```text
Orship API and web
Platform API and web
MariaDB
Redis scaffold
File Browser operator service
Prometheus and Grafana monitoring
```

All services join `codexsun-network`. Only approved operator services publish host ports. MariaDB and Redis stay internal. Persistent state uses named volumes. File Browser mounts only named application storage roots.

## Phases

### Phase O-1200: Infrastructure Governance

- [x] O-1201 Orship hosts and contracts.
- [x] O-1202 Deployment attempt and verification records.
- [ ] O-1203 Infrastructure manifest, service catalog, secrets boundary, and network policy.
- [ ] O-1204 Operator roles, approval policy, audit trail, and incident boundary.

### Phase O-1210: Docker Service Foundation

- [ ] O-1211 Compose profiles, named volumes, service labels, and restart policy.
- [ ] O-1212 MariaDB service, health gate, backup policy, and migration boundary.
- [ ] O-1213 Redis scaffold, internal access policy, and deferred queue selection.
- [ ] O-1214 File Browser restricted storage root, users, access audit, and recovery policy.

### Phase O-1220: Monitoring And Operations

- [ ] O-1221 Prometheus metrics contract and scrape policy.
- [ ] O-1222 Grafana dashboards, alert rules, retention, and operator roles.
- [ ] O-1223 Container, database, Redis, volume, and backup health evidence.
- [ ] O-1224 Incident, maintenance, restore, and rollback runbooks.

### Phase O-1230: Platform Deployment

- [ ] O-1231 Platform deployment profile and immutable release identity.
- [ ] O-1232 Environment validation, migration rehearsal, and backup checkpoint.
- [ ] O-1233 Platform API and web deployment with health-gated startup.
- [ ] O-1234 Browser, API, database, storage, and monitoring acceptance evidence.
- [ ] O-1235 Rollback rehearsal and manual production approval.

### Phase O-1240: Application Expansion

- [ ] O-1241 Preview environments and expiry cleanup.
- [ ] O-1242 Docs, Zetro, UIUX, and client application onboarding profiles.
- [ ] O-1243 Provider adapters after platform deployment evidence passes.
