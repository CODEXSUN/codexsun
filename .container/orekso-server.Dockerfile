FROM node:22-bookworm-slim

WORKDIR /app

COPY apps/orekso/server/package.json ./
RUN npm install

COPY apps/orekso/server/index.js ./

EXPOSE 3011

CMD ["npm", "start"]
