#!/bin/sh
set -eu
cd /opt/bjeyflow
umask 077
mkdir -p deploy-data/backups
backup="deploy-data/backups/postgres-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose --env-file .env.production -f compose.production.yml exec -T db sh -c 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$backup"
printf '%s\n' "$backup"
