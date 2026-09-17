# Platform Core

`@codexsun/platform-core` composes the generic Platform runtime. Use
`createPlatformRuntime()` from an application composition root. Pass selected
application providers to it, then start and stop the returned runtime.

The package owns the Platform Core provider and the runtime registry. It does
not own application routes, product modules, or deployment selection.
