# CODEXSUN

The complete CODEXSUN application and orchestration repository.

This project plays the same role as a Laravel application: it installs the framework and selected application packages, provides deployment configuration, builds the composed stack, and starts the runtime. Business implementation stays in its owning package.

## Installed stack

- `@codexsun/framework`
- `@codexsun/ui`
- `@codexsun/core`
- `@codexsun/billing`
- `@codexsun/ecommerce`
- `@codexsun/sites`
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

Platform is the only runtime application. Core, Billing, Mail, UI, and Framework are linked packages compiled before Platform; Ecommerce and Sites currently provide installable package boundaries ready for their independently owned implementations.

Use `npm run dev:api` or `npm run dev:web` to start one side only. Ports are deployment configuration and can be changed through environment variables without changing application packages.

## Verification

```sh
npm run build
npm run check
npm run test:product-stacks
npm run test:e2e:composed-runtime
```
