# Production deployment

## Automatic deployment

`.github/workflows/production.yml` checks pull requests to `main` and deploys
every push to `main` after both production Docker images build successfully.
CI checks migration files and applies migrations to a temporary PostgreSQL database.
Manual runs deploy only when `main` is selected. No test suite is added.

Create these GitHub Actions secrets in the repository (or its `production`
environment):

- `DEPLOY_SSH_KEY`: the complete dedicated deployment private key.
- `DEPLOY_KNOWN_HOSTS`: the verified SSH host-key line for `194.117.64.181`.

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
Migrations run at backend startup; deployment also checks that none remain pending.
There can be a short interruption during
replacement; this is not a zero-downtime deployment. Failed migrations or
health checks fail the workflow; no automatic schema rollback is attempted.
Inspect Actions logs and server logs before retrying. A completed release SHA
is recorded in `/root/BjeyFlow/deploy-data/deployed-commit`.

Backups and old images are not automatically pruned. Monitor disk usage and
copy backups off-server. Do not run `docker system prune -a` indiscriminately.

## Manual operation

### Administration, backups and retention

The administration application requires its database migrations. Gunicorn's
entry point applies them on deployment. There are no production default admin
credentials; provision the first superuser interactively:

```sh
docker compose --env-file .env.production -f compose.production.yml exec backend python manage.py createsuperuser
```

The backend mounts only `deploy-data/status` read-only for backup metadata.
`backup-database.sh` atomically publishes a timestamp and dump size there; the
actual backup directory, dumps, secrets, mail data and Docker socket are not
mounted into the application. The Services page does not offer backup downloads
or privileged server commands. Existing dumps are not reported until the updated
backup script publishes a successful result.

To enable daily database backups followed by configured Trash cleanup, install
the supplied maintenance unit and timer:

```sh
install -m 644 docker/production/bjeyflow-maintenance.service docker/production/bjeyflow-maintenance.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now bjeyflow-maintenance.timer
```

The job shares the deployment lock, requires a successful database backup before
cleanup, and permanently deletes only tasks older than the retention period set
by a superuser. `0` disables cleanup. A nonzero retention policy does nothing
automatically until this timer (or an equivalent scheduler) is enabled. Inspect
`journalctl -u bjeyflow-maintenance.service` for failures. Backups are not pruned;
monitor disk usage and maintain a tested, access-controlled off-server copy.
Do not expose maintenance or backup execution as public HTTP endpoints.

The existing `push-worker` also runs `python manage.py advance_leagues` once per
minute. This closes past UTC league weeks, records their standings and creates
the current week. League API requests also catch up missed weeks after downtime.
The worker must stay running for automatic rollover when nobody opens the app.
It also sends league week and result notifications to registered devices when
browser notifications are enabled. League notifications respect quiet hours;
they are retried while their notification window remains open.

Health checks authenticate to SMTP without sending a message. Console or custom
email backends are labeled explicitly. Email events report backend acceptance
or failure only; they do not claim external inbox delivery. In development,
password-reset/verification emails remain in console logs, as before. Error
records in the panel contain source/category only, not exception text or traces.

Password recovery uses `APP_URL` as the trusted frontend origin; the production
Compose file sets it from `APP_DOMAIN`. Development defaults to
`http://localhost:5174`; set `APP_URL` when using another frontend origin.
Reset links expire after 30 minutes, are invalidated after use, and do not
reveal whether an email is registered. Delivery failures are logged on the
backend. Existing JWT cookies become invalid the first time password-based
session revocation is deployed; users must sign in again. Subsequent password
changes revoke their previous JWT sessions.

Migration `core.0003_task_deleted_at` adds the task recycle bin. Normal deletion
keeps the task and its checklist in Trash indefinitely; only the explicit
permanent-delete action removes them. Trashed tasks are excluded from regular
task lists, project counts, and editing/reordering endpoints. Projects with
tasks in Trash remain protected from deletion; restore or permanently remove
those tasks first.

The web application is installable as a PWA. After a successful online visit,
its service worker serves a static offline screen for navigation failures, even
when launched without a connection. API responses and account data are never
cached for offline use; task editing and synchronization require a connection.
The service worker is registered in production builds on HTTPS or localhost,
not by the development server. Updates activate as soon as the new worker is
installed; increment the offline cache version when changing the cached offline files.

### Web Push reminders

Web Push requires a stable P-256 VAPID key pair. Set `VAPID_PUBLIC_KEY` (base64url
uncompressed public point), `VAPID_PRIVATE_KEY` (base64url 32-byte private key),
and `VAPID_SUBJECT` (a `mailto:` contact) in the root-only `.env.production`.
Do not commit, print in CI logs, or rotate the private key casually; changing the
key invalidates existing subscriptions and devices must subscribe again. Keep a
restricted off-server backup of the key. When unconfigured, the app says so and
the worker does not send reminders.

After the updated backend image is running, generate a key pair in a new,
root-only file (this refuses to overwrite an existing file):

```sh
umask 077
set -C
docker compose --env-file .env.production -f compose.production.yml exec -T backend python -c 'import base64; from cryptography.hazmat.primitives.asymmetric import ec; from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat; k=ec.generate_private_key(ec.SECP256R1()); enc=lambda b: base64.urlsafe_b64encode(b).decode().rstrip("="); print("VAPID_PRIVATE_KEY="+enc(k.private_numbers().private_value.to_bytes(32,"big"))); print("VAPID_PUBLIC_KEY="+enc(k.public_key().public_bytes(Encoding.X962,PublicFormat.UncompressedPoint)))' > /root/bjeyflow-vapid.env
set +C
```

Privately copy those two values into `.env.production` along with
`VAPID_SUBJECT=mailto:your-contact@example.com`, replacing any blank entries.
Keep the generated file restricted and back it up securely; do not send its
contents to chat or paste them into CI logs. Recreate the backend and worker to
load the changed environment, then send a test from the device settings.

The `push-worker` Compose service scans every minute. After upgrading, install
the updated `deploy.sh` at `/usr/local/sbin/bjeyflow-deploy` as documented above;
the forced-command copy is outside the uploaded release and is not automatically
replaced. The updated deploy script starts the worker after backend migrations.
For the initial rollout also start it with
`docker compose --env-file .env.production -f compose.production.yml up -d push-worker`
after configuring VAPID. Do not start multiple workers without retaining the
database uniqueness and row-lock protections.

Subscriptions belong to a user and a login session. Logout, password changes,
revocation or session expiry stops delivery; users must enable a device again
after signing in. Reminder delivery is best effort, may be delayed by the push
service, expires quickly, and is not replayed after quiet hours. Date-only tasks
default to 09:00 in the chosen time zone. Notification text hides task titles.
Focus completion uses a local notification only while the app remains open. Test
notifications report push-service acceptance, not confirmed device delivery.
For iOS/iPadOS 16.4+, install the app to the Home Screen before enabling push.

The production stack is separate from the development Compose file. It runs
Nginx with the Vite production build, non-root Gunicorn (two workers/two threads),
PostgreSQL 18, a shared Redis cache, and Docker Mailserver 17. Database and Redis
ports are not published. TLS is shared by HTTPS and authenticated SMTP/IMAP.

Use `/root/BjeyFlow` on the server. Keep `.env.production` readable only by root;
generate independent random Django/JWT/database/mail secrets instead of using
the example values. Never upload a development `.env` or production data into a
Docker build context. `deploy-data/` contains private mail keys, mailboxes,
certificates and backups and is deliberately ignored by Git and Docker builds.

All commands below run from `/root/BjeyFlow`:

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
