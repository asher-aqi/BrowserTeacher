SHELL := /bin/bash

# Root Makefile to manage backend services
# Requires: uv (https://docs.astral.sh/uv/)

BACKEND_DIR := backend
ENV_FILE := $(BACKEND_DIR)/.env.local

.PHONY: help setup api worker dev health

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS=":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

setup: ## Install backend dependencies with uv
	cd $(BACKEND_DIR) && uv sync

api: ## Run FastAPI server (Hypercorn)
	cd $(BACKEND_DIR) && \
	if [ -f .env.local ]; then set -a; source .env.local; set +a; fi; \
	uv run hypercorn main:app --reload --bind 0.0.0.0:8000

worker: ## Run LiveKit voice worker
	cd $(BACKEND_DIR) && \
	if [ -f .env.local ]; then set -a; source .env.local; set +a; fi; \
	uv run python -m voice_bot.worker start

dev: ## Run api and worker concurrently
	$(MAKE) -j 2 api worker

health: ## Hit backend health endpoint
	@curl -sf http://localhost:8000/health | jq . || curl -sf http://localhost:8000/health || true


