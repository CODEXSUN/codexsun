# CODEXSUN

The complete CODEXSUN application and orchestration repository.

The repository-owned Billing container stack is installed with `bash install.sh`. It serves the
four application domains documented in `.container/README.md`; CMS portfolio sites and Techmedia
are independently installed from their own repositories.

This project plays the same role as a Laravel application: it installs the framework and selected application packages, provides deployment configuration, builds the composed stack, and starts the runtime. Business implementation stays in its owning package.

## Repository guidance

Read `assist/AGENT-GUIDE.md` before changing this repository. The current composed-repository
workspace map, ownership boundaries, migration/seed order, environment contract, versioning,
and release workflow are documented under `assist/`.

## Installed stack

- `@codexsun/framework`
- `@codexsun/ui`
- `@codexsun/core`
- `@codexsun/billing`
- `@codexsun/mail`

## Development

```sh
npm install
npm run setup
npm run dev
```

The repositories must be sibling folders under the same parent directory. `npm run setup` installs each local package serially, and the lockfiles preserve the resolved development graph. No package is fetched from a registry during local composition.

The default development runtime is:

- API: `http://127.0.0.1:7010`
- Web: `http://127.0.0.1:7020`

Platform is the only runtime application. Core, Billing, Mail, UI, and Framework are linked packages compiled before Platform.

Use `npm run dev:api` or `npm run dev:web` to start one side only. Ports are deployment configuration and can be changed through environment variables without changing application packages.

## Verification

```sh
npm run build
npm run check
npm run test:product-stacks
npm run test:e2e:composed-runtime
```

Repository release helpers are `npm run version:show`, `npm run check:versions`, and
`npm run github:now -- --dry-run`.

## VPS container installation

Clone this repository and run `bash install.sh`. The installer clones the required Framework, UI,
Core, Billing, and Mail repositories beside it, builds every container from source, starts the
Billing stack through Traefik, and runs the smoke test. Use `bash install.sh update` for later
clean fast-forward source updates and container rebuilds. No container registry login is required.
