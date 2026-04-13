# Container Runtime

Container deployment assets now live entirely in this folder:

- `Dockerfile`
- `docker-compose.yml`
- `entrypoint.sh`
- `mariadb.yml`
- `50-server.cnf`
- `USAGE.md`

Read [`USAGE.md`](./USAGE.md) for the common deployment flow.

Production direction:

- build and tag the Docker image before it reaches the live server
- keep runtime `.env`, media storage, and database state outside the image
- update live systems by pulling the new image tag and restarting the container
- do not rely on `git pull`, `npm ci`, or `npm run build` inside the production container during normal updates
