# Sources

Zetro needs sources, but they must be controlled.

## Internal Sources

Use these first:

1. `AGENTS.md`
   Repo rules and app boundaries.

2. `apps/ui/src/design-system/data/project-defaults.ts`
   UI defaults.

3. `apps/framework/src/application/app-suite.ts`
   Suite registration.

4. `apps/cxapp/web/src/desk/desk-registry.ts`
   Dashboard navigation.

5. `apps/cxapp/web/src/pages/framework-app-workspace-page.tsx`
   Dashboard workspace renderer.

6. `apps/zetro/shared`
   Zetro contracts and catalog.

7. `apps/zetro/src`
   Zetro backend and terminal logic.

8. `apps/zetro/web`
   Zetro dashboard UI.

9. `apps/task`
   Later follow-up integration.

10. `apps/cli`
   Later approved command runner integration.

11. `apps/api`
   Later internal API route mounting.

## Reference Sources

Use as reference only:

1. `temp/Claude/claude-code-main/claude-code-main`

Allowed use:

1. capability analysis
2. workflow shape
3. plugin family labels
4. safety ideas
5. UI/product inspiration

Not allowed without license review:

1. source copying
2. vendoring plugin files
3. reusing exact implementation code

## External Sources

Use only when the phase needs them:

1. model provider docs
2. MCP docs
3. git provider API docs
4. security references
5. package docs for libraries already in the repo

External source use should be recorded in run history once persistence exists.

## Model Provider Sources

For model-provider work, use official provider docs first:

1. Ollama docs for local model serving.
2. OpenAI API docs for OpenAI-hosted models.
3. Anthropic API docs for Claude-hosted models.
4. The provider's own docs for custom OpenAI-compatible gateways.

Default stance:

1. Zetro works with provider `none`.
2. Ollama is the first free/local adapter.
3. Hosted providers are optional and environment-backed.
4. Model output cannot directly execute commands or write files.
