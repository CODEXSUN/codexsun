# transport: frontend skills

Read [the operating protocol](../../../agent/SKILLS.md) and [the handoff](../../../agent/HANDOFF.md).

Own typed HTTP envelopes, session-slot propagation, and readable JSON/proxy errors only. Keep fixed business endpoints inside owner services. Never accept arbitrary SQL or credentials from page state.

Use shared UI controls and explicit loading, empty, error, warning, and success states.
Verify single-click navigation, browser refresh, saved-session links, selected data, and persistence.
Keep business changes behind the authenticated API. A disabled control is not a permission check.
Do not copy a tenant's table or field list into this workspace as a future migration recipe.
