# Gitpod Classic local review

This is the upstream Gitpod Classic local preview image, not a build of the
source tree in this repository. The container runs k3s and Gitpod services.
It is for disposable local testing only. It uses privileged Docker access,
has an old self-signed certificate, and must not be exposed on a network.

Run from the Codexsun repository root:

```sh
sh apps/temp/gitpod/local-preview/setup.sh
sh apps/temp/gitpod/local-preview/verify.sh
```

The container publishes HTTPS on `127.0.0.1:443`. Its configured domain is
`gitpod.localhost`. Do not bypass a browser certificate warning. The preview
creates a CA certificate inside its private Docker volume at
`/var/gitpod/gitpod-ca.crt`. Install that CA in a test browser profile only
if you trust the preview image. Gitpod workspace URLs need wildcard domain
resolution, so the dashboard alone does not prove workspaces work.

Stop while keeping its volume:

```sh
sh apps/temp/gitpod/local-preview/drop.sh
```

Remove the review container and its volume:

```sh
sh apps/temp/gitpod/local-preview/drop.sh --purge
```

The stack has no connection to Zcode, Zuno, or other Codexsun containers.
Telemetry is disabled with `DO_NOT_TRACK=1`.
