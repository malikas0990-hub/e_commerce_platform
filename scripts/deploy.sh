#!/usr/bin/env sh
set -eu

COMPOSE_FILE="docker-compose.prod.yml"

if [ ! -f .env ]; then
  echo "Missing .env in $(pwd). Create it from .env.production.example."
  exit 1
fi

docker compose -f "$COMPOSE_FILE" config --quiet
docker compose -f "$COMPOSE_FILE" build --pull
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans --wait
docker image prune -f

echo "Production deployment completed successfully."
