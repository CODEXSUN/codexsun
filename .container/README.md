# Container Runtime

This folder owns Docker build, local container runtime, and container verification files.

Store Dockerfiles, Compose definitions, container scripts, runtime catalogs, and local verification scripts here. Keep business code in its owner application or package.

Use container configuration to mount the root `storage/` namespace where an application requires file storage. Do not store secrets in committed container files.

Read [the runtime layout guide](../assist/operations/runtime-layout.md) before adding container files.
