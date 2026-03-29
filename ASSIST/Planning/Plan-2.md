# Module Naming And Boundary Rules

## Purpose

This file defines the naming and boundary rules for the shared layers that every other app consumes first:

1. `apps/framework`
2. `apps/ui`

## Priority Order

Use this order when deciding where code belongs:

1. framework
2. ui
3. core
4. app-specific code

Rule:

1. runtime infrastructure belongs in framework
2. reusable presentation belongs in ui
3. business-shared contracts belong in core
4. workflow-specific behavior belongs in the app

## Framework Rules

### Framework Ownership

`apps/framework` owns reusable platform-level behavior only.

It may own:

1. config runtime
2. database runtime
3. HTTP route assembly
4. suite registration
5. host startup
6. reusable platform contracts

It must not own:

1. billing workflows
2. ecommerce workflows
3. task workflows
4. app-specific menus
5. app-specific page state

### Framework Folder Naming

Use short capability names.

Good names:

1. `application`
2. `di`
3. `runtime`
4. `server`
5. `config`
6. `http`

Bad names:

1. `common`
2. `misc`
3. `temp`
4. `new`
5. `services2`

## UI Rules

### UI Ownership

`apps/ui` owns reusable presentation primitives and stable shared building blocks.

It may own:

1. primitive components
2. shared layout primitives
3. shared desk-shell presentation
4. shared auth-layout presentation
5. design-system docs presentation
6. shared utility helpers
7. neutral presentation patterns

It must not own:

1. app business rules
2. billing desk flows
3. ecommerce checkout behavior
4. customer portal state
5. framework runtime configuration

### UI Folder Naming

Use the current active groups:

1. `assets/css`
2. `blocks`
3. `components/ui`
4. `components/ux`
5. `features/dashboard`
6. `features/docs`
7. `layouts`
8. `lib`

Rule:

1. `components/ui` is for primitives
2. `components/ux` is for shared experience building blocks
3. `features/dashboard` is for shared desk presentation only
4. `features/docs` is for shared design-system docs presentation
5. `layouts` is for reusable app, auth, admin, and web layout shells
6. `lib` is for UI helpers, not backend logic

## Framework And UI Interaction Rules

Framework and UI may work together, but their boundary must stay clear.

Framework may provide:

1. shell contracts
2. browser bootstrap
3. app composition
4. route metadata

UI may provide:

1. buttons
2. cards
3. inputs
4. layout primitives
5. shared styles
6. shared desk presentation
7. shared auth presentation
8. design-system docs presentation

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
