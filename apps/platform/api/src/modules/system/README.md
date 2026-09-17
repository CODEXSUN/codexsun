# Platform System Module

Owner: Platform API.

The provider registers the Platform System capability. The health route exposes loaded provider identifiers at `/api/v1/platform/health`.

`test/health-route.test.ts` uses Fastify inject to test the public route without
starting a listener.

Start it with `npm.cmd run dev:api`. Verify it with `Invoke-RestMethod "http://${env:PLATFORM_HOST}:${env:PLATFORM_API_PORT}/api/v1/platform/health"`.
