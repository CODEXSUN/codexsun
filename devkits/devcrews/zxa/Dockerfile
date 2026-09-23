FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install --yes --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && npm install --global @openai/codex@latest && npm cache clean --force \
  && groupadd --gid 10001 zxa \
  && useradd --uid 10001 --gid zxa --create-home --shell /usr/sbin/nologin zxa

WORKDIR /opt/zxa
COPY --chown=zxa:zxa src ./src
COPY entrypoint.sh ./entrypoint.sh
RUN chmod 755 ./entrypoint.sh

ENV CODEX_HOME=/home/zxa/.codex
ENV HOME=/home/zxa
EXPOSE 7210
ENTRYPOINT ["/opt/zxa/entrypoint.sh"]
CMD ["node", "src/server.mjs"]
