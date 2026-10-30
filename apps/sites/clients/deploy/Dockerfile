FROM node:24-bookworm-slim
WORKDIR /app
COPY --chown=node:node . /app
ENV NODE_ENV=production CODEXSUN_SITES_HOST=0.0.0.0 CODEXSUN_SITES_PORT=8080 CODEXSUN_SITES_DB=/data/content.sqlite
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 8080
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s CMD node -e "const r=require('./release.json');require('node:http').get('http://127.0.0.1:8080/health',{headers:{host:new URL(process.env.CODEXSUN_SITES_ORIGIN||r.origin).host}},r=>{r.resume();process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"
CMD ["node","runtime/server.mjs"]
