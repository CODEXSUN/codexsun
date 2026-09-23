FROM node:22-bookworm-slim AS node

FROM gitpod/openvscode-server@sha256:5e7b8750749f282940a799ed59ccd02fac698ef6744f9113ac01c0ef8e76485e

USER root

COPY --from=node /usr/local /usr/local

COPY addons/codexsun-os /opt/zcode/codexsun-os

COPY zcode-configure.mjs /opt/zcode/zcode-configure.mjs
RUN node /opt/zcode/zcode-configure.mjs brand

COPY zcode-entrypoint.sh /usr/local/bin/zcode-entrypoint.sh
COPY zcode-bootstrap.mjs /opt/zcode/zcode-bootstrap.mjs

RUN chmod 755 /usr/local/bin/zcode-entrypoint.sh

USER openvscode-server

ENTRYPOINT ["/usr/local/bin/zcode-entrypoint.sh"]
