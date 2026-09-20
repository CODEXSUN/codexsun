# syntax=docker/dockerfile:1

ARG MARIADB_VERSION=11.8
FROM mariadb:${MARIADB_VERSION}

COPY conf.d/orship.cnf /etc/mysql/conf.d/orship.cnf
RUN chmod 0644 /etc/mysql/conf.d/orship.cnf

# Keep the image usable by both the Orship manager and manual operators.
HEALTHCHECK --interval=10s --timeout=5s --retries=12 --start-period=30s \
  CMD healthcheck.sh --connect --innodb_initialized
