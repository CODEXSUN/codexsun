# Codexsun Deploy

Run every command from the repo root: `E:\\Workspace\\websites\\codexsun`

## Quick start

To install only the Codexsun client with the shared deploy flow:

```bash
./.container/clients/codexsun/setup.sh
```

## 1. Create the Docker network once

```bash
docker network create codexion-network
```

## 2. Install MariaDB separately if needed

```bash
docker compose -f .container/mariadb.yml up -d
```

## 3. Optional: prepare a runtime env template

```bash
cp .container/clients/codexsun/.env.example .container/clients/codexsun/.env
```

This file is now only a local reference template. The container keeps its active runtime `.env` inside the Docker volume at `/opt/codexsun/runtime/.env`.

If you leave `DB_ENABLED=false`, Codexsun starts in setup mode and you can finish database configuration from the UI.

## 4. Build the shared app image

```bash
docker build -t codexsun-app:v1 -f .container/Dockerfile .
```

## 5. Start Codexsun

```bash
docker compose -f .container/clients/codexsun/docker-compose.yml up -d
```

On first start, the container automatically creates `/opt/codexsun/runtime/.env` from the app template if it does not already exist.

## 6. Open a shell in the app container

```bash
docker exec -it codexsun-app bash
```

## 7. Inspect or edit the runtime env inside the container

```bash
docker exec -it codexsun-app bash
cat /opt/codexsun/runtime/.env
```

```
docker logs --tail 100 codexsun-app
docker logs --tail 100 tirupur-direct-app

```

## Notes

- App URLs: `http://YOUR_SERVER_IP:4000` and `http://YOUR_SERVER_IP:5000`
- Runtime env file used by the container: `/opt/codexsun/runtime/.env`
- Compose file path from root: `.container/clients/codexsun/docker-compose.yml`
- Shared app image: `codexsun-app:v1`


```
sudo nano codexsun.com
```

```
server {
    listen 80;
    server_name codexsun.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

sudo ln -s /etc/nginx/sites-available/codexsun.com /etc/nginx/sites-enabled/
```

```
sudo certbot --nginx
```

```
sudo nginx -t
```

```
sudo systemctl reload nginx
```
