#!/bin/bash
set -euo pipefail
umask 077

if [[ ! ${SSH_ORIGINAL_COMMAND:-} =~ ^deploy\ ([0-9a-f]{40})$ ]]; then
    echo 'Expected: deploy <40-character commit SHA>' >&2
    exit 1
fi
release=${BASH_REMATCH[1]}

exec 9>/run/lock/bjeyflow-deploy.lock
flock -w 1200 9

app_dir=/root/BjeyFlow
incoming=$(mktemp -d /root/.bjeyflow-incoming.XXXXXXXX)
trap 'rm -rf -- "$incoming"' EXIT
tar --extract --gzip --no-same-owner --file=- --directory="$incoming"
test -f "$incoming/compose.production.yml"
test -f "$incoming/docker/production/Dockerfile-backend"
test -f "$incoming/docker/production/Dockerfile-frontend"

cd "$app_dir"
sh docker/production/backup-database.sh
rsync -r --delete \
    --exclude='.env' --exclude='.env.*' --exclude='deploy-data/' \
    --exclude='.git/' --exclude='node_modules/' --exclude='.venv/' \
    "$incoming/" "$app_dir/"

export RELEASE_TAG=$release
compose=(docker compose --env-file .env.production -f compose.production.yml)
"${compose[@]}" config --quiet
"${compose[@]}" build backend web
sed -i "s/^RELEASE_TAG=.*/RELEASE_TAG=$release/" .env.production
"${compose[@]}" up -d --no-deps --wait --wait-timeout 180 backend
"${compose[@]}" up -d --no-deps --force-recreate --wait --wait-timeout 120 web
"${compose[@]}" exec -T backend python manage.py migrate --check
"${compose[@]}" exec -T backend python manage.py check --deploy
curl --fail --silent --show-error --retry 5 --retry-delay 3 --retry-all-errors https://bjeyflow.space/healthz/
printf '%s\n' "$release" > deploy-data/deployed-commit
printf '\nDeployed %s\n' "$release"
