.PHONY: help up down venv install install-backend install-frontend dev dev-backend dev-frontend build build-frontend check lint lint-frontend format docker-up docker-down docker-build db-up logs clean migrate seed seed-local makemigrations superuser shell

PYTHON ?= $(CURDIR)/.venv/bin/python
PYTHON_BOOTSTRAP ?= python3
BACKEND_PORT ?= 8100
FRONTEND_PORT ?= 5174

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Setup ───────────────────────────────────────────────────────────

install: install-backend install-frontend ## Install all dependencies

venv: ## Create an isolated project interpreter if missing
	test -x "$(PYTHON)" || $(PYTHON_BOOTSTRAP) -m venv .venv

install-backend: venv ## Install backend development dependencies
	"$(PYTHON)" -m pip install -r backend/requirements/dev.txt

install-frontend: ## Install frontend Node dependencies
	cd frontend && npm ci

# ─── Development ─────────────────────────────────────────────────────

dev: ## Run both backend and frontend dev servers (requires terminals)
	@echo "Starting backend and frontend..."
	@echo "Run 'make dev-backend' and 'make dev-frontend' in separate terminals"
	@echo "Backend: http://localhost:$(BACKEND_PORT) | Frontend: http://localhost:$(FRONTEND_PORT)"

dev-backend: ## Run Django dev server
	"$(PYTHON)" backend/manage.py runserver 127.0.0.1:$(BACKEND_PORT)

dev-frontend: ## Run Vite/React dev server
	cd frontend && npm run dev -- --port $(FRONTEND_PORT)

# ─── Build ────────────────────────────────────────────────────────────

build: ## Build Docker images initially or after dependency/Dockerfile changes
	@test -f .env || cp .env.example .env
	docker compose build

build-frontend: ## Build frontend for production
	cd frontend && npm run build

# ─── Validation ──────────────────────────────────────────────────────

check: ## Check Django configuration, migration drift, and frontend types
	"$(PYTHON)" backend/manage.py check
	"$(PYTHON)" backend/manage.py makemigrations --check --dry-run
	cd frontend && npm run typecheck

# ─── Linting & Formatting ────────────────────────────────────────────

lint: lint-frontend ## Lint frontend code

lint-frontend: ## Lint frontend with eslint
	cd frontend && npm run lint

format: ## Format backend code with black
	cd backend && "$(PYTHON)" -m black .

# ─── Django ──────────────────────────────────────────────────────────

migrate: ## Run Django migrations
	"$(PYTHON)" backend/manage.py migrate

seed: ## Migrate and seed development data using the built backend image
	@test -f .env || cp .env.example .env
	docker compose create --no-build backend
	docker compose up -d --wait db
	docker compose run --rm --no-deps backend python manage.py migrate --noinput
	docker compose run --rm --no-deps backend python manage.py seed

seed-local: migrate ## Seed development data using the local project interpreter
	"$(PYTHON)" backend/manage.py seed

makemigrations: ## Create new Django migrations
	"$(PYTHON)" backend/manage.py makemigrations

superuser: ## Create Django superuser
	"$(PYTHON)" backend/manage.py createsuperuser

shell: ## Open Django shell
	"$(PYTHON)" backend/manage.py shell

# ─── Docker ──────────────────────────────────────────────────────────

up: ## Start built images and run database migrations (no build)
	@test -f .env || cp .env.example .env
	docker compose create --no-build backend frontend
	docker compose up -d --wait db
	docker compose run --rm --no-deps backend python manage.py migrate --noinput
	docker compose up -d --no-build --renew-anon-volumes
	docker compose ps

down: docker-down ## Stop the full stack (keeps database data)

docker-up: up ## Alias for make up

db-up: ## Start PostgreSQL for local development
	docker compose up -d --wait db

docker-down: ## Stop all Docker containers
	docker compose down

docker-build: build ## Alias for make build

logs: ## Follow Docker logs
	docker compose logs -f

# ─── Cleanup ─────────────────────────────────────────────────────────

clean: ## Remove build artifacts and cache files
	find backend -type d -name "__pycache__" -prune -exec rm -rf {} +
	rm -rf frontend/dist backend/.pytest_cache
	find frontend -maxdepth 1 -type f -name '*.tsbuildinfo' -delete
	@echo "Cleanup complete"
