.PHONY: help install install-backend install-frontend dev dev-backend dev-frontend build test test-backend test-frontend lint lint-backend lint-frontend format docker-up docker-down docker-build logs clean migrate superuser createsuperuser

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Setup ───────────────────────────────────────────────────────────

install: install-backend install-frontend ## Install all dependencies

install-backend: ## Install backend Python dependencies
	cd backend && pip install -r requirements/base.txt

install-frontend: ## Install frontend Node dependencies
	cd frontend && npm install

# ─── Development ─────────────────────────────────────────────────────

dev: ## Run both backend and frontend dev servers (requires terminals)
	@echo "Starting backend and frontend..."
	@echo "Run 'make dev-backend' and 'make dev-frontend' in separate terminals"
	@echo "Backend: http://localhost:$(BACKEND_PORT) | Frontend: http://localhost:$(FRONTEND_PORT)"

dev-backend: ## Run Django dev server
	cd backend && python manage.py runserver

dev-frontend: ## Run Vite/React dev server
	cd frontend && npm run dev

# ─── Build ────────────────────────────────────────────────────────────

build: build-frontend ## Build production assets
	@echo "Build complete"

build-frontend: ## Build frontend for production
	cd frontend && npm run build

# ─── Testing ─────────────────────────────────────────────────────────

test: test-backend test-frontend ## Run all tests

test-backend: ## Run backend tests with pytest
	cd backend && pytest

test-frontend: ## Run frontend tests with jest
	cd frontend && npm test

# ─── Linting & Formatting ────────────────────────────────────────────

lint: lint-backend lint-frontend ## Lint all code

lint-backend: ## Lint backend with flake8
	cd backend && flake8 .

lint-frontend: ## Lint frontend with eslint
	cd frontend && npm run lint

format: ## Format backend code with black
	cd backend && black .

# ─── Django ──────────────────────────────────────────────────────────

migrate: ## Run Django migrations
	cd backend && python manage.py migrate

makemigrations: ## Create new Django migrations
	cd backend && python manage.py makemigrations

superuser: ## Create Django superuser
	cd backend && python manage.py createsuperuser

shell: ## Open Django shell_plus
	cd backend && python manage.py shell_plus

# ─── Docker ──────────────────────────────────────────────────────────

docker-up: ## Start all Docker containers
	docker compose up -d --build

docker-down: ## Stop all Docker containers
	docker compose down

docker-build: ## Build Docker images
	docker compose build

logs: ## Follow Docker logs
	docker compose logs -f

# ─── Cleanup ─────────────────────────────────────────────────────────

clean: ## Remove build artifacts and cache files
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	rm -rf frontend/build frontend/.react-router backend/.pytest_cache 2>/dev/null || true
	@echo "Cleanup complete"
