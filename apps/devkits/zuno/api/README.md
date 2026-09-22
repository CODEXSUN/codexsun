# Zuno API

The API exposes typed Zod routes and a protected internal OpenAPI reference.
It accepts authenticated prepared-task packages from Zetro and stores them
before it returns a receipt. Signed-in Zuno users can review accepted packages
in the handoff inbox and use one to prefill a CXForge assignment. This intake
does not dispatch work to CXForge until the user confirms the repository and
owned paths.
