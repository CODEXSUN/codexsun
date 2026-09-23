FROM node:22-bookworm-slim AS node

FROM gitpod/openvscode-server@sha256:5e7b8750749f282940a799ed59ccd02fac698ef6744f9113ac01c0ef8e76485e

USER root

COPY --from=node /usr/local /usr/local

RUN npm install --global @openai/codex@0.156.1 npm@12.0.2 \
    && mkdir -p /opt/zcode/extensions \
    && chown -R openvscode-server:openvscode-server /opt/zcode

USER openvscode-server

RUN /home/.openvscode-server/bin/openvscode-server \
    --extensions-dir /opt/zcode/extensions \
    --install-extension openai.chatgpt@26.908.40401

USER root

COPY zcode-configure.mjs /opt/zcode/zcode-configure.mjs
RUN node /opt/zcode/zcode-configure.mjs brand

COPY zcode-entrypoint.sh /usr/local/bin/zcode-entrypoint.sh

RUN chmod 755 /usr/local/bin/zcode-entrypoint.sh

USER openvscode-server

ENTRYPOINT ["/usr/local/bin/zcode-entrypoint.sh"]
