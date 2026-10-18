# BjeyFlow

**Django + Django REST Framework** backend and **React 19 + Vite** frontend.

## Stack

- Python 3.11+, Django 5.2, DRF, simplejwt (JWT auth with httponly cookies)
- React 19, Vite, TypeScript, Tailwind CSS 4, shadcn UI
- PostgreSQL
- Docker Compose

## Repository layout

```
backend/
  config/    Django settings, URLs, WSGI/ASGI
  core/      Core app for tasks and other entities (ready for viewsets)
  users/     User model, auth, permissions, serializers, services, viewsets, tests
  requirements/  base.txt, dev.txt

frontend/
  src/
    app.tsx        React router entry
    app/users/     User feature: api/, types/, schema/, components/, page.tsx, login.tsx
    routes/        Authenticated routes and administrator-only user management
    components/    Reusable UI components
    components/ui/ Shared Card, Button, Input, Dialog, Table, Badge, Skeleton, Label
    lib/           axios instance, pagination, cn() helper
    layouts/       Shared application and page layouts
    store/         In-memory user state (Zustand; tokens stay in httponly cookies)
    index.css
  package.json
  vite.config.ts
  tsconfig.json
```

## Endpoints

| URL | Description |
|-----|-------------|
| `POST /users/auth/login/` | JWT login (sets httponly cookie) |
| `POST /users/auth/logout/` | JWT logout (clears cookie) |
| `GET /users/auth/me/` | Current user |
| `POST /users/auth/change-password/` | Change your own password |
| `GET, POST /users/` | List/create panel users (system administrator only) |
| `GET, PUT, PATCH, DELETE /users/<id>/` | Retrieve/update/delete a panel user |
| `POST /users/<id>/activate/` | Activate a panel user |
| `POST /users/<id>/disable/` | Disable a panel user |
| `POST /users/<id>/reset-password/` | Administrator password reset |

## Feature structure (DVocean pattern)

Each frontend entity or feature lives under `src/app/<feature>/`:

```text
app/users/
  api/          Typed API functions, separated by operation
  types/        Request and response contracts
  schema/       Zod validation
  components/   Feature forms/actions and list/columns
  page.tsx      Feature page, fetching, and async states
  login.tsx     Login entry
```

Keep HTTP calls in `api/`, not in visual components. Reusable Card (including
`overview` and `ghost` variants), Button, Input with password toggle,
Dialog, Table, Badge, Skeleton, labeled fields, async/error states, and layouts
live outside feature folders. React Query handles server state; Zustand stores
the authenticated user. `/settings/users` is restricted to the `superuser` role.

Backend user management follows DVocean's model → serializer → service → viewset
separation, with shared role permissions and password helpers. Roles are `user`,
`staff`, and `superuser`. Staff cannot manage panel users. The same self-delete,
self-disable, last-active-administrator deletion/disable, and own-password-reset
guards are retained. Existing user data is preserved through an additive profile
migration. BjeyFlow keeps its own `bf_access` cookie name to avoid session
collisions with DVocean; no DVocean storage-domain code or assets are included.

Known inherited limitation: direct user updates (`PUT`/`PATCH`) can change roles
or `is_active` without the guards in the dedicated disable/delete actions.
Hardening this requires an intentional behavior change from DVocean and is
tracked as a follow-up before production use.

## Getting started

Prerequisites: Python 3.11+, Node.js 24, npm, and Docker Compose for PostgreSQL.

```bash
cp .env.example .env
make install                     # Creates .venv and installs development dependencies
make db-up                       # Starts only PostgreSQL
make migrate
make check
make test
make superuser                   # Optional; prompts for your own credentials
```

Run `make dev-backend` and `make dev-frontend` in separate terminals. The backend
uses http://127.0.0.1:8100 and Vite uses http://localhost:5174.

All Python Make targets use `.venv/bin/python`; activation is optional. To run
Python commands directly, use `source .venv/bin/activate` first. In PyCharm,
select `.venv/bin/python` as the project interpreter, mark `backend` as a sources
root, and use `backend/config/settings.py` for Django settings.

The checked-in environment defaults are for local development only. Keep `.env`
untracked and use unique secrets and database credentials for deployments.
`DEBUG` and `ALLOWED_HOSTS` are the setting names (not `DJANGO_DEBUG` or
`DJANGO_ALLOWED_HOSTS`).

Verification: `make lint`, `make check`, `make test`, and `make build-frontend`.
Backend tests use a separate PostgreSQL test database; the configured database
role must have `CREATEDB` permission (the Compose development role does).
Frontend verification currently uses typechecking and a production build; a
frontend unit test runner has not been configured yet.

Docker:

```bash
make build # Build Docker images initially or after dependency/Dockerfile changes
make up    # Start PostgreSQL, migrate, and start built apps without rebuilding
make down  # Stop containers; keep database data
```

`make up` copies `.env.example` to `.env` only if `.env` does not exist.
The backend is available at http://localhost:8100 and frontend at
http://localhost:5174 with the default ports. PostgreSQL is exposed on
`127.0.0.1:5433`, leaving DVocean's ports available. Container-internal ports
remain `8000`, `5173`, and `5432`. Use `make logs` to follow logs.
PostgreSQL data is persisted in the `postgres_data` named volume.

Both apps use bind-mounted source code: `backend/` and `frontend/` map to `/app`
in their respective containers. Django automatically restarts on Python changes;
Vite provides frontend hot module replacement, with polling enabled in Docker.
Source edits do not require `make build`. Rebuild after changing dependencies or
Dockerfiles, then run `make up` again. Frontend `node_modules` stays in an isolated
container volume, refreshed by `make up` so rebuilt dependencies take effect.
Run `make migrate` (or `make up`) after adding database migrations.
These containers run development servers, not production servers.

## Git

Remote: `git@github.com:bardiajp/bjeyflow.git`
