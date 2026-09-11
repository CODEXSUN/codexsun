# Zetro provider settings

This web module composes package-owned controls into Zetro's provider settings screen and top-right chat switcher. Header choices remain local drafts until the user presses the icon-only connect control. The header saves the complete provider, model, and reasoning tuple on the active conversation; it does not change other conversations or the settings default. A green verified state appears only after the API stores that tuple and the selected runtime returns the expected live smoke response. The API owns persistence and credentials remain with their provider runtime.

The same icon becomes a red cross when the selected CXZ runtime cannot load models, fails connection verification, or stops responding to its bounded health probe. The control checks CXZ every five seconds and removes the previous green state immediately after failure.

## Development records

- [Provider connections](../../../../../../../assist/records/zetro/2026-09-11-zetro-provider-connections.md)
- [CXZ provider runtime](../../../../../../../assist/records/zetro/2026-09-11-cxz-provider-runtime.md)
- [Conversation-owned providers](../../../../../../../assist/records/zetro/2026-09-11-conversation-owned-providers.md)
