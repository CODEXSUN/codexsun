# Tirupur Direct Deploy

## 4. Start Tirupur Direct app container

```bash
docker compose -f .container/clients/tirupur_direct/docker-compose.yml up -d
```

```bash
docker compose -f .container/clients/tirupur_direct/docker-compose.yml down
```

```bash
docker logs --tail 100 tirupur-direct-app
```

## 5. Open a shell in the app container

```bash
docker exec -it tirupur-direct-app bash
```


## Notes

- App URLs: `http://YOUR_SERVER_IP:4001` and `http://YOUR_SERVER_IP:5001`
- Runtime env file used by the container: `/opt/codexsun/runtime/.env`
- Database name: `tirupur_direct_db`
- Database server: external or separately installed MariaDB
- Compose file path from root: `.container/clients/tirupur_direct/docker-compose.yml`
- Shared app image: `codexsun-app:v1`


docker volume rm tirupur-direct_tirupur_direct_runtime
docker volume rm codexsun_codexsun_runtime
docker volume rm tmnext-in_tmnext_in_runtime