# Module Naming And Boundary Rules

## Purpose

This file defines the first naming and boundary rules for:

1. `apps/framework`
2. `apps/ui`

These two roots come first because every other app will consume them. If these two collapse, every app built on top of them will collapse too.

## Priority Order

Use this order when deciding where code belongs:

1. framework
2. ui
3. core
4. app-specific code

Rule:

1. if code is runtime infrastructure, it belongs in framework
2. if code is reusable presentation, it belongs in ui
3. if code is business-shared, it belongs in core
4. if code is workflow-specific, it belongs in the app

## Framework Rules

### Framework Ownership

`apps/framework` owns reusable platform-level behavior only.

It may own:

1. auth runtime
2. database runtime
3. migration runtime
4. config runtime
5. storage runtime
6. payment adapters
7. notification adapters
8. shell contracts
9. support-runtime contracts

It must not own:

1. billing workflows
2. ecommerce workflows
3. CRM workflows
4. product pages
5. app-specific menus
6. app-specific page state

### Framework Folder Naming

Use short capability names.

Good names:

1. `auth`
2. `runtime`
3. `database`
4. `payments`
5. `shells`
6. `connectors`

Bad names:

1. `common`
2. `misc`
3. `helpers`
4. `temp`
5. `new`
6. `services2`

### Framework Module Shape

Use capability-first folders.

Recommended shape:

```text
apps/framework/src/
  auth/
  connectors/
  runtime/
    config/
    database/
    http/
    media/
    notifications/
    payments/
  web/
    auth/
    shells/
    support/
```

Rule:

1. top-level framework folders must describe platform capability
2. nested folders must describe transport or runtime concern
3. do not create app-specific feature folders inside framework

### Framework File Naming

Use descriptive kebab-case file names.

Good examples:

1. `theme-provider.tsx`
2. `application-registry.tsx`
3. `smtp-mailer.ts`
4. `migration.ts`
5. `table-names.ts`

Bad examples:

1. `index2.ts`
2. `helper.ts`
3. `temp-auth.ts`
4. `new-shell.tsx`

### Framework Import Boundaries

Allowed imports:

1. framework to framework
2. framework to shared low-level libraries
3. framework to stable type contracts

Blocked imports:

1. framework to `apps/ecommerce/*`
2. framework to `apps/billing/*`
3. framework to `apps/task/*`
4. framework to app-local routes or pages

Rule:

1. framework defines contracts
2. apps implement workflows on top of those contracts
3. framework must not import back into app code

### Framework Assembly Rule

Framework assemblies may wire generic contracts only.

Allowed:

1. shell definitions
2. platform app registries
3. auth providers
4. shell selection and composition

Blocked:

1. product form defaults
2. billing navigation trees
3. storefront page sections
4. task workflow assumptions

## UI Rules

### UI Ownership

`apps/ui` owns reusable presentation primitives and stable shared building blocks.

It may own:

1. primitive components
2. shared layout primitives
3. typography helpers
4. icon wrappers
5. generic code blocks
6. shared utility hooks
7. neutral presentation patterns

It must not own:

1. app business rules
2. billing desk flows
3. ecommerce checkout behavior
4. customer portal state
5. framework runtime configuration

### UI Folder Naming

Use layer-first names.

Current useful groups:

1. `components/ui`
2. `components/ux`
3. `hooks`
4. `lib`
5. `styles`
6. `theme`

Rule:

1. `components/ui` is for primitives
2. `components/ux` is for reusable shared experience building blocks
3. `hooks` is for reusable view hooks
4. `lib` is for UI helpers, not backend logic
5. `styles` owns shared CSS and tokens
6. `theme` owns shared theme providers and theme-level contracts

### UI Naming Rule For Component Levels

Use these levels:

1. primitive
2. composite
3. app-specific

Placement:

1. primitive components belong in `apps/ui/src/components/ui`
2. composite shared components belong in stable named folders such as `layout`, `templates`, or `blocks`
3. app-specific components do not belong in `apps/ui`

### UI File Naming

Use kebab-case and match the component role.

Good examples:

1. `button.tsx`
2. `navigation-menu.tsx`
3. `copy-to-clipboard-button.tsx`
4. `template-card.tsx`

Bad examples:

1. `ButtonNew.tsx`
2. `Comp1.tsx`
3. `helper-ui.tsx`
4. `test-card-final.tsx`

### UI Boundary Rules

Allowed imports:

1. ui to ui
2. ui to small utility libraries
3. ui to neutral shared types

Blocked imports:

1. ui to `apps/ecommerce/web/src/features/*`
2. ui to `apps/billing/web/src/features/*`
3. ui to `apps/framework/src/runtime/*`
4. ui to API repositories or DB code

Rule:

1. UI code may render data
2. UI code must not own business decisions
3. UI code must not fetch from DB layers directly

### UI Hook Rules

A hook belongs in `apps/ui` only if it is reusable across more than one app.

Allowed:

1. viewport hooks
2. clipboard hooks
3. debounce hooks
4. generic theme hooks

Blocked:

1. billing workspace store hooks
2. checkout hooks
3. cart mutation hooks
4. app route guard hooks

### UI Variant Rules

Do not create endless variants in the primitive layer.

Rule:

1. one primitive should serve a stable shared purpose
2. app-specific styling should stay in the app until reuse is proven
3. examples and experiments should not become the default production import path

## Framework And UI Interaction Rules

Framework and UI may work together, but their boundary must stay clear.

Framework may provide:

1. shell contracts
2. browser bootstrap
3. app composition

UI may provide:

1. buttons
2. cards
3. inputs
4. layout primitives
5. shared styles
6. theme providers
7. shared UX surfaces

Rule:

1. framework owns runtime assembly
2. ui owns shared presentation
3. neither layer should absorb app business workflows

## Naming Checklist

Before creating any new module in framework or ui, check:

1. does the folder name describe one clear capability
2. is the file name specific and stable
3. is the code reusable across apps
4. is the code free from app-specific workflow assumptions
5. can another app consume it without importing business logic

If any answer is no, the code probably does not belong in framework or ui.

## Safe Extension Order

When adding new shared code, use this order:

1. decide whether it is framework or ui
2. choose the smallest stable folder
3. name the folder by capability, not by convenience
4. name files by responsibility, not by time or experiment
5. verify no app-specific imports were introduced

## Final Rule

Framework is infrastructure.

UI is presentation.

Business workflows belong somewhere else.
