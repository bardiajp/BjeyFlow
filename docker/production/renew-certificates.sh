#!/bin/sh
set -eu
cd "$(dirname "$0")/../.."
set -a
. ./.env.production
set +a
certificate="deploy-data/letsencrypt/live/$APP_DOMAIN/fullchain.pem"
before=$(openssl x509 -in "$certificate" -noout -serial)
docker compose --env-file .env.production -f compose.production.yml run --rm --no-deps certbot renew --quiet --non-interactive
after=$(openssl x509 -in "$certificate" -noout -serial)
if [ "$before" != "$after" ]; then
    docker compose --env-file .env.production -f compose.production.yml exec -T web nginx -s reload
    docker compose --env-file .env.production -f compose.production.yml restart mailserver
fi
