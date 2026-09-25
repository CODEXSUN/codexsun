# Zetro2 ZVcode editor build (task 2.5).
# Pinned inputs: base image digest, Node from .nvmrc (22.22.0),
# npm graph from package-lock.json (npm ci), header targets from checked-in .npmrc files.
# Artifact destination: root dist/zetro2/editor/ via the export stage (see README.md).

FROM node:22.22.0-bookworm@sha256:20a424ecd1d2064a44e12fe287bf3dae443aab31dc5e0c0cb6c74bef9c78911c AS toolchain

# Full node bookworm image already provides: python3, make, g++, gcc, patch,
# git, pkg-config, curl, tar, xz, unzip, ca-certificates. Verify before use.
RUN python3 --version \
	&& make --version \
	&& g++ --version \
	&& patch --version \
	&& git --version \
	&& pkg-config --version \
	&& node --version \
	&& npm --version

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /src/zvcode

# Native module headers used by npm ci (native-keymap, kerberos, node-pty):
# same set as upstream build/azure-pipelines/product-npm-package-validate.yml.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		build-essential \
		pkg-config \
		libx11-dev \
		libx11-xcb-dev \
		libxkbfile-dev \
		libkrb5-dev \
		libsecret-1-dev \
	&& rm -rf /var/lib/apt/lists/*

FROM toolchain AS source

COPY . .

# The openvscode-server export has no .git (import rule) but postinstall runs
# git config, and it lists two selfhost extension dirs that the export omits
# (they are absent from the upstream reference tree too). Prepare both here so
# `npm ci` succeeds without changing the host source.
RUN git init -q \
	&& git config pull.rebase merges \
	&& git config blame.ignoreRevsFile .git-blame-ignore-revs \
	&& mkdir -p .vscode/extensions/vscode-selfhost-import-aid .vscode/extensions/vscode-selfhost-test-provider \
	&& printf '{"name":"vscode-selfhost-import-aid","version":"0.0.0"}\n' > .vscode/extensions/vscode-selfhost-import-aid/package.json \
	&& printf '{"name":"vscode-selfhost-test-provider","version":"0.0.0"}\n' > .vscode/extensions/vscode-selfhost-test-provider/package.json \
	&& printf '{"name":"vscode-selfhost-import-aid","version":"0.0.0","lockfileVersion":3,"requires":true,"packages":{"":{"name":"vscode-selfhost-import-aid","version":"0.0.0"}}}\n' > .vscode/extensions/vscode-selfhost-import-aid/package-lock.json \
	&& printf '{"name":"vscode-selfhost-test-provider","version":"0.0.0","lockfileVersion":3,"requires":true,"packages":{"":{"name":"vscode-selfhost-test-provider","version":"0.0.0"}}}\n' > .vscode/extensions/vscode-selfhost-test-provider/package-lock.json

FROM source AS deps

# npm ci enforces the checked-in package-lock.json graph for the root and,
# through postinstall, every listed sub-directory lockfile. preinstall also
# fetches the Electron/Node header targets pinned in .npmrc and remote/.npmrc.
RUN npm ci

FROM deps AS build

# Builtin marketplace extensions land under .build/extensions during packaging;
# fetching first keeps the gulp run deterministic and cache-friendly.
RUN npm run download-builtin-extensions

# Server web (browser) package for linux-x64. BUILD_ROOT is the parent of the
# source root, so the package is written to /src/vscode-reh-web-linux-x64.
# Override for other targets: --build-arg VSCODE_TARGET=vscode-reh-linux-x64
ARG VSCODE_TARGET=vscode-reh-web-linux-x64
RUN npm run gulp -- "${VSCODE_TARGET}"

# Default stage: export only the packaged server so
# `docker build --output dist/zetro2/editor` materializes root artifacts.
FROM scratch AS export
COPY --from=build /src/vscode-reh-web-linux-x64/ /
