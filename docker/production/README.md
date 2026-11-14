# Production deployment

## Automatic deployment

`.github/workflows/production.yml` checks pull requests to `main` and deploys
every push to `main` after both production Docker images build successfully.
Manual runs deploy only when `main` is selected. No test suite is added.

Create these GitHub Actions secrets in the repository (or its `production`
environment):

- `DEPLOY_SSH_KEY`: the complete dedicated deployment private key.
- `DEPLOY_KNOWN_HOSTS`: the verified SSH host-key line for `94.184.25.40`.

The matching public key on the server must use this authorized_keys entry:

```text
restrict,command="/usr/local/sbin/bjeyflow-deploy" ssh-ed25519 <public-key> bjeyflow-github-actions
```

Install `docker/production/deploy.sh` as root-owned mode `755` at
`/usr/local/sbin/bjeyflow-deploy`. This copy is deliberately outside the upload
directory; updating the repository does not replace the SSH entry point.
The key permits only the deployment protocol, not an interactive shell,
forwarding, or arbitrary SSH commands. Deployments still execute trusted
repository code as root through Docker: protect `main`, workflow changes, and
the production environment accordingly. Never expose the secrets to fork PRs.

The runner transfers the exact commit archive over verified SSH. The server
serializes deployments, backs up PostgreSQL, synchronizes source without
touching `.env.production` or `deploy-data`, and builds images before replacing
the backend and Nginx. Only application containers are updated; database, Redis,
and mail infrastructure changes require a deliberate manual operation.
Migrations run at backend startup. There can be a short interruption during
replacement; this is not a zero-downtime deployment. Failed migrations or
health checks fail the workflow; no automatic schema rollback is attempted.
Inspect Actions logs and server logs before retrying. A completed release SHA
is recorded in `/opt/bjeyflow/deploy-data/deployed-commit`.

Backups and old images are not automatically pruned. Monitor disk usage and
copy backups off-server. Do not run `docker system prune -a` indiscriminately.

## Manual operation

The production stack is separate from the development Compose file. It runs
Nginx with the Vite production build, non-root Gunicorn (two workers/two threads),
PostgreSQL 18, a shared Redis cache, and Docker Mailserver 17. Database and Redis
ports are not published. TLS is shared by HTTPS and authenticated SMTP/IMAP.

Use `/opt/bjeyflow` on the server. Keep `.env.production` readable only by root;
generate independent random Django/JWT/database/mail secrets instead of using
the example values. Never upload a development `.env` or production data into a
Docker build context. `deploy-data/` contains private mail keys, mailboxes,
certificates and backups and is deliberately ignored by Git and Docker builds.

All commands below run from `/opt/bjeyflow`:

```sh
docker compose --env-file .env.production -f compose.production.yml build
docker compose --env-file .env.production -f compose.production.yml up -d db cache backend web
```

Start with `NGINX_TEMPLATE=http.conf.template`. This serves ACME challenges and
a maintenance response, not an insecure login form. Set DNS A records for the
application and mail host to the server IP, disable CDN proxying for mail, and
remove incompatible AAAA records. Issue the certificate:
Ensure `deploy-data/acme` and its challenge subdirectories have mode `755` so
the Nginx worker can read public validation files. Keep private mail and
certificate directories restricted.

```sh
docker compose --env-file .env.production -f compose.production.yml run --rm --no-deps certbot certonly --webroot -w /var/www/certbot --cert-name bjeyflow.space -d bjeyflow.space -d mail.bjeyflow.space --email postmaster@bjeyflow.space --agree-tos --non-interactive
```

Change `NGINX_TEMPLATE=https.conf.template`, create the SMTP account via
`setup email add`, generate DKIM via `setup config dkim`, and start all services.
The mail account password must match `EMAIL_HOST_PASSWORD`. Create postmaster,
abuse and DMARC aliases to a monitored mailbox. Do not enable trusted Docker
subnets for anonymous relaying. The application authenticates over TLS on 465.
Use SMTP submission on 465/587 and IMAPS on 993; port 25 is for server delivery.
Antivirus/spam filtering is disabled to fit the small server; do not turn this
into a general-purpose public mailbox service without enabling appropriate
filtering, authentication-abuse protection, monitoring, and capacity.

Publish MX (`@` to `mail.bjeyflow.space`, priority 10), SPF (only authorized
sending sources), the generated `mail._domainkey` TXT, and DMARC. PTR must be set
by the VPS provider to `mail.bjeyflow.space`. Initial delivery tests should use
DMARC monitoring; tighten to quarantine/reject only once SPF/DKIM alignment is
verified. Never publish multiple SPF records for the same hostname.

Install the certificate service/timer into `/etc/systemd/system/` and enable it:

```sh
systemctl daemon-reload
systemctl enable --now bjeyflow-certificates.timer
```

The renewal script reloads Nginx and restarts mail only when the certificate
serial changes. The timer runs twice daily with jitter. Outgoing TCP 25, correct
DNS/PTR and IP reputation are all necessary for reliable external delivery.
Submission to the local SMTP server alone does not prove inbox delivery.

Health and logs:

```sh
docker compose --env-file .env.production -f compose.production.yml ps
docker compose --env-file .env.production -f compose.production.yml logs --tail=100 backend mailserver
curl --fail https://bjeyflow.space/healthz/
```

Before updates, run `sh docker/production/backup-database.sh`. Copy dumps off the
server, restrict access, and verify restoration regularly. The script does not
delete older dumps. Never use `docker compose down -v` on production data.
Mail/certificates also require off-server backups of `deploy-data/` and the
encrypted/restricted production environment file. Local backups alone do not
protect against server or disk loss.

Run Django deployment checks after environment changes:

```sh
docker compose --env-file .env.production -f compose.production.yml exec -T backend python manage.py check --deploy
```

Nginx overwrites client forwarding headers. Only its fixed `172.30.0.10` address
is trusted for client-IP extraction, so signup quotas and weather use the real
client IP without accepting spoofed forwarding headers. Keep these addresses in
sync if changing the network. Redis makes quotas/cache shared across workers.
If Docker Hub is inaccessible from the region, use a reachable registry mirror
or transfer verified images; record image digests and update them deliberately.
