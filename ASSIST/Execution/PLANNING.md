# Planning

## Active Batch

- `#181` Define the tenant, client, industry, and user workspace matrix plus visibility-resolution rules
  - Scope: define the future matrix that decides what each tenant, client, industry pack, and user role can see, and formalize the deterministic rules that resolve workspace visibility from those inputs.
  - Constraint: keep this batch at architecture and documentation level only. Do not change routed shell composition or runtime visibility logic yet.
  - Planned delivery:
    - define the workspace-resolution inputs: tenant, client overlay, industry pack, role or workspace profile, and feature flags
    - document the first visibility matrix for `techmedia`, `tirupurdirect`, `thetirupurtextiles`, `horse-club`, `neot`, and Codexsun control-plane users
    - define precedence and conflict rules so visibility resolution stays deterministic and supportable
    - update the modular ERP blueprint with a concrete workspace matrix section and next-step guidance for runtime implementation later
  - Validation:
    - documentation consistency review across the modular blueprint and new matrix docs
