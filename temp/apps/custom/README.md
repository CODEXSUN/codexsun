# Custom App

`apps/custom` is the clean standalone app scaffold for future work that should not start inside `apps/ecommerce/web`.

## Architecture

1. `domain` holds the app contract, folder map, module map, and package list
2. `api` holds the standalone server setup and module-oriented backend structure
3. `web` holds the standalone frontend shell and module-oriented page structure

## Root Rules

1. keep framework logic in `apps/framework`
2. keep shared business logic in `apps/core`
3. keep app-specific routes, pages, and workflows inside `apps/custom`
4. keep module folders boring and predictable

## Module Shape

Backend module shape:

1. `model`
2. `application`
3. `http`

Frontend module shape:

1. `model`
2. `components`
3. `hooks`
4. `pages`

Add `data` only when the module really owns persistence.
