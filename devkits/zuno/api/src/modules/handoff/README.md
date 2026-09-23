# Zuno Handoff Module

This module accepts versioned prepared-task packages from Zetro. It stores each
package before it returns a receipt. The Zetro task ID is the idempotency key.

This module does not validate a repository or send work to CXForge. Zuno does
that work after a user reviews the accepted handoff.
