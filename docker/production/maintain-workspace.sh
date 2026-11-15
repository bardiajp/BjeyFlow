#!/bin/sh
set -eu
cd /opt/bjeyflow
exec 9>/run/lock/bjeyflow-deploy.lock
flock -w 1200 9
sh docker/production/backup-database.sh
docker compose --env-file .env.production -f compose.production.yml exec -T backend python manage.py clean_trash --apply
