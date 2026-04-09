# Techmedia Deploy

Run every command from the repo root.

## 1. Create the Docker network once

```bash
docker network create codexion-network
```

## 2. Optional: prepare a runtime env template

```bash
cp .container/clients/techmedia_in/techmedia-in.env.example .container/clients/techmedia_in/techmedia-in.env
```

This file is a local reference template only. The active runtime `.env` is created inside the Docker volume at `/opt/codexsun/runtime/.env`.

## 3. Build the shared app image

```bash
docker build -t codexsun-app:v1 -f .container/Dockerfile .
```

## 4. Start Techmedia app container

```bash
docker compose -f .container/clients/techmedia_in/docker-compose.yml up -d
```

## 5. Open a shell in the app container

```bash
docker exec -it techmedia-in-app bash
```

## Notes

- App URLs: `http://YOUR_SERVER_IP:4008` and `http://YOUR_SERVER_IP:5008`
- Runtime env file used by the container: `/opt/codexsun/runtime/.env`
- Database name: `techmedia_in_db`
- Compose file path from root: `.container/clients/techmedia_in/docker-compose.yml`
- Shared app image: `codexsun-app:v1`
