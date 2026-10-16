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
  users/     User model, JWT auth views (login / logout / me)
  utils/     Shared utilities
  requirements/  base.txt, dev.txt

frontend/
  src/
    app.tsx        React router entry
    routes/        Route definitions (login page)
    components/    Reusable UI components
    components/ui/ shadcn primitives (button, input, card, label)
    lib/           axios instance, cn() helper
    layouts/
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

## Getting started

1. Copy `.env.example` to `.env` and fill in the values.
2. Install backend dependencies: `pip install -r backend/requirements/base.txt`
3. Install frontend dependencies: `cd frontend && npm install`
4. Run migrations: `python backend/manage.py migrate`
5. Create a superuser: `python backend/manage.py createsuperuser`
6. Start the backend: `python backend/manage.py runserver 0.0.0.0:8000`
7. Start the frontend: `cd frontend && npm run dev`

Docker:

```bash
docker compose up --build
```

## Git

Remote: `git@github.com:bardiajp/bjeyflow.git`
