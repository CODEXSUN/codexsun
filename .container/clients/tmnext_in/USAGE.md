# TMNext Deploy

Run every command from the repo root: `E:\\Workspace\\websites\\codexsun`

## 1. Create the Docker network once

```bash
docker network create codexion-network
```

## 2. Optional: prepare a runtime env template

```bash
cp .container/clients/tmnext_in/tmnext-in.env.example .container/clients/tmnext_in/tmnext-in.env
```

docker compose -f .container/clients/tmnext_in/docker-compose.yml down

docker logs --tail 100 tmnext-in-app

This file is a local reference template only. The active runtime `.env` is created inside the Docker volume at `/opt/codexsun/runtime/.env`.

## 3. Build the shared app image

```bash
docker build -t codexsun-app:v1 -f .container/Dockerfile .
```

## 4. Start TMNext app container

```bash
docker compose -f .container/clients/tmnext_in/docker-compose.yml up -d
```

On first start, the container creates `/opt/codexsun/runtime/.env` automatically from the app template if it does not already exist.

MariaDB is not started by this compose file. Point `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in `/opt/codexsun/runtime/.env` to your existing or separately installed database.

## 5. Open a shell in the app container

```bash
docker exec -it tmnext-in-app bash
```


docker logs --tail 100 tmnext-in-app



## 6. Inspect or edit the runtime env inside the container

```bash
docker exec -it tmnext-in-app bash
cat /opt/codexsun/runtime/.env
```

## Notes

- App URLs: `http://YOUR_SERVER_IP:4002` and `http://YOUR_SERVER_IP:5002`
- Runtime env file used by the container: `/opt/codexsun/runtime/.env`
- Database name: `tmnext_in_db`
- Database server: external or separately installed MariaDB
- Compose file path from root: `.container/clients/tmnext_in/docker-compose.yml`
- Shared app image: `codexsun-app:v1`


```
sudo nano tmnext.in
```

```
server {
    listen 80;
    server_name tmnext.in;

    location / {
        proxy_pass http://127.0.0.1:4007;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

sudo ln -s /etc/nginx/sites-available/tmnext.in /etc/nginx/sites-enabled/