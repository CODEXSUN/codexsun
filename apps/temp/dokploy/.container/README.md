# Codexsun Dokploy container

Run from the repository root:

```bash
cd apps/temp/dokploy
bash .container/setup.sh
```

Updates rebuild only the Dokploy service:

```bash
bash .container/update.sh
```

Setup creates `.container/.env` with local secrets, persists Postgres and Dokploy state, and mounts the host Docker socket. Review socket, firewall, TLS, backup, and licensing controls before production use.
