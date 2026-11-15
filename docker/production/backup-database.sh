#!/bin/sh
set -eu
cd "$(dirname "$0")/../.."
umask 077
mkdir -p deploy-data/backups
backup="deploy-data/backups/postgres-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose --env-file .env.production -f compose.production.yml exec -T db sh -c 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$backup"
mkdir -p deploy-data/status
chmod 755 deploy-data/status
status=$(mktemp deploy-data/status/backup.XXXXXXXX)
printf '{"created_at":"%s","size_bytes":%s}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$(stat -c %s "$backup")" > "$status"
chmod 644 "$status"
mv "$status" deploy-data/status/backup.json
printf '%s\n' "$backup"
