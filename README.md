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
  users/     User model, auth, permissions, serializers, services, viewsets
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
| `GET, POST /api/projects/` | List/create your projects |
| `GET, PUT, PATCH, DELETE /api/projects/<id>/` | Manage your project |
| `GET, POST /api/tasks/` | List/create your tasks |
| `GET, PUT, PATCH, DELETE /api/tasks/<id>/` | Manage your task |
| `POST /api/tasks/<id>/complete/` | Complete a task (idempotent) |
| `POST /api/tasks/<id>/reopen/` | Reopen a task as To do |
| `POST /api/tasks/reorder/` | Atomically save board order and status changes |
| `GET, POST /api/tasks/<task_id>/subtasks/` | List/create checklist items |
| `GET, PUT, PATCH, DELETE /api/tasks/<task_id>/subtasks/<id>/` | Manage a checklist item |
| `POST /api/tasks/<task_id>/subtasks/reorder/` | Atomically reorder a task's complete checklist |

## Projects, tasks, and subtasks

All three models use UUID primary keys and creation/update timestamps.
The relationship is `User → Project → Task → SubTask`: projects belong to a
user, tasks **must** belong to a project, and subtasks **must** belong to a task.
Ownership is inherited through these relationships, not duplicated on tasks or
subtasks. Every authenticated user, including system administrators, sees only
their own project/task data. Existing account-administration permissions remain
separate.

Create a task and its initial checklist in one atomic request:

```http
POST /api/tasks/
Content-Type: application/json
```

```json
{
  "project": "<your-project-uuid>",
  "title": "Review homepage explorations",
  "description": "Review the latest design proposals.",
  "priority": "high",
  "due_date": "2026-10-19",
  "due_time": "10:00:00",
  "subtasks": [
    { "title": "Review layout" },
    { "title": "Check mobile version" }
  ]
}
```

Statuses: `todo`, `in_progress`, `completed`. Priorities: `low`, `normal`,
`high`, `urgent`. New tasks default to `todo`/`normal`; initial checklist items
start unchecked. Due dates and times are optional, but a time requires a date.
Dates are calendar dates; times carry no timezone and should be interpreted in
the application's configured timezone. Completion timestamps are timezone-aware
and managed by the server on both status updates and completion/reopen actions.

The task response contains `project` (UUID), `project_name`, `subtasks`,
`subtasks_count`, and `completed_subtasks_count`. Update checklist items through
their nested endpoint, using `PATCH {"is_completed": true}` to check an item.
Nested checklist writes on task updates are rejected rather than silently
replacing or discarding items. Completing a subtask does not complete its task.

### Frontend query parameters

All lists are paginated (`count`, `next`, `previous`, `results`; `?page=2`).
Inbox is `GET /api/tasks/` without filters: it includes all accessible tasks,
including completed, undated, and archived-project tasks.

```text
Today:      /api/tasks/?due_date=2026-10-19
Upcoming:   /api/tasks/?due_date_after=2026-10-20&due_date_before=2026-10-26&ordering=due_date,due_time
Project:    /api/tasks/?project=<uuid>
Completed:  /api/tasks/?status=completed
Priority:   /api/tasks/?priority=high
Search:     /api/tasks/?search=homepage
```

The frontend sends the desired date or date range; both range boundaries are
inclusive. Upcoming has no hardcoded window. Combine filters as needed, such as
adding `status=todo` to a date range. Invalid dates, UUID filters, enum values,
and reversed ranges return validation errors.

Project lists support `is_archived`, search by name/description, and sorting.
Task lists support sorting by `due_date`, `due_time`, `position`, `created_at`,
`updated_at`, `completed_at`, or `title`. Prefix a field with `-` for descending
order. Subtask lists support `is_completed`, title search, and position/time
sorting. Default ordering is position, creation timestamp, then UUID.

Projects containing tasks cannot be deleted; archive them instead. Archived
projects cannot receive new or moved tasks, but existing tasks remain editable.
Deleting a task deletes its checklist. Account deletion is also blocked while
the account owns projects containing protected tasks.

### Drag-and-drop and project icons

The task-detail checklist and board support pointer/touch dragging using grip
handles, plus keyboard dragging (Space to pick up, arrow keys to move, Space to
drop, Escape to cancel). Changes persist to the backend; failed requests roll
back the optimistic ordering and show `DisplayError`. Board mode uses manual
position ordering rather than date/title sorting.

For checklist reordering, post `{"ids": ["<subtask-uuid>", "<subtask-uuid>"]}`
to the nested reorder endpoint. Include every current child exactly once. The
server checks parent ownership and assigns consecutive positions atomically.

For board changes, post `{"items": [{"id": "<task-uuid>", "status": "todo",
"position": 0}]}` to `/api/tasks/reorder/`. Only included, owned tasks are
updated; hidden tasks in a filtered board are not modified. Moving cards into
or out of Completed maintains `completed_at`. Duplicate IDs, negative positions,
duplicate positions within a status, and inaccessible tasks are rejected.

Projects have a validated `icon` key: `hash`, `folder`, `briefcase`, `code`,
`book`, `heart`, `star`, `target`, `palette`, `coffee`, `music`, or `rocket`.
Choose it when creating a project, or use the sidebar's edit-project button to
change it later. `PATCH /api/projects/<id>/` persists the icon and project color;
task responses include `project_icon`. Existing projects default to `hash`.

Theme colors remain primary `#8ECAE6` and secondary `#FB8500`; muted text uses
`#696969`. Shared action-button labels use the `button-foreground` token,
`#023047`, including hover states.

## Feature structure (DVocean pattern)

### Task landing page

After signing in, all users land on `/today`. The shared application shell
provides the project sidebar, search (`Ctrl/Cmd+K`), add-task action (`N`), task
reminders, account settings, and mobile navigation. Routes are `/inbox`,
`/today`, `/upcoming`, `/completed`, and `/projects/<uuid>`. Administrator-only
account management remains at `/settings/users`.

The `app/tasks/` and `app/projects/` features separate typed API calls, request
schemas, hooks, and reusable components. Task views send their date, project,
status, priority, search, and ordering parameters to the backend. Today uses
`due_date`; Upcoming requests tomorrow through seven days from today. Inbox
includes completed and undated tasks. Sidebar counts and weekly activity use
the signed-in user's paginated task data, cached by React Query.

The page supports list/board views, creating projects and tasks with subtasks,
editing tasks, completing/reopening tasks, updating checklists, and deleting
tasks. Schedule entries come from actual task due times, not calendar events.
The 25-minute focus timer is browser-local and resets when its page unmounts;
there is no focus-session persistence, Google Calendar integration, or push
notification service. No workspaces or fabricated comments/files are shown.

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
make seed-local                  # Optional: populate development sample data
make check
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

Verification: `make lint`, `make check`, and `make build-frontend`.
Unit tests and their tooling will be added later.

Docker:

```bash
make build # Build Docker images initially or after dependency/Dockerfile changes
make up    # Start PostgreSQL, migrate, and start built apps without rebuilding
make seed  # Optional: create demo data (does not rebuild images)
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

### Development seed data

Run `make seed` after `make build` to migrate and populate the database using the
Docker backend image. It starts PostgreSQL if needed and does not rebuild images
or automatically seed on every application startup. For a native setup, use
`make seed-local` or `.venv/bin/python backend/manage.py seed`.

Seeding requires `DEBUG=True`. By default it fills a sample dataset of **12
projects and 120 tasks**, with up to **5 subtasks per task**, under the `demo`
account. Data covers all task statuses/priorities, partial and complete
checklists, Today, near-future and distant deadlines, overdue and undated tasks,
different project icons/colors, long titles, and one archived project. There
are enough tasks to exercise backend pagination and frontend filtering/boards.
New sample tasks are dated relative to the run date; existing dates are preserved.

```bash
make seed                                        # Default dataset for demo
make seed SEED_USERNAME=alex                      # Use your existing login
make seed SEED_PROJECTS=20 SEED_TASKS=300 SEED_SUBTASKS=8
make seed SEED_USERNAME=alex SEED_ARGS="--append"  # Add a fresh, separate batch
make seed-local SEED_USERNAME=alex                # Same options without Docker
```

**Sign in as the selected seed account to see the data.** If you are logged in
as another user, that user's lists stay separate. Existing account passwords and
roles are never changed. The command prints the target account and actual totals.

The first run prints a generated demo password. To choose credentials instead,
set `SEED_USERNAME` and `SEED_PASSWORD` in your local `.env` before running the
command; passwords must have at least eight characters. For a local command,
`--username` can override the username. Seed accounts are not administrators;
use `make superuser` separately when needed.

Default reruns use stable UUIDs to avoid duplicates and preserve existing edits,
completion state, due dates, account details, and passwords. An existing account
with the selected username is never promoted or given a new password. Missing
sample records are recreated unless their project was archived; this is not a
reset or cleanup command. Lowering counts does not delete records. Increasing
counts expands the default dataset. `--append` creates a fresh batch with new
UUIDs, dated relative to today, and a batch suffix on project names; use it when
you want more data or a new set of current deadlines. Only newly created sample
projects may be automatically archived; existing archive settings are preserved.

Management-command options are `--username`, `--projects`, `--tasks`,
`--subtasks`, and `--append`. Limits are 1–100 projects, 0–10000 tasks, and 0–20
subtasks per new task. Only use seed credentials and data for local development.

## Git

Remote: `git@github.com:bardiajp/bjeyflow.git`
