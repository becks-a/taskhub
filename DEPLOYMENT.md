# Deployment

## Build and Start
docker compose up --build

## Stop
docker compose down

## Rebuild
docker compose up --build --force-recreate

## Docker Hub Images
- Backend: https://hub.docker.com/r/theabecks/taskhub-backend
- Frontend: https://hub.docker.com/r/theabecks/taskhub-frontend

## Ports
Frontend: 3000
Backend: 3001
MongoDB: 27017 (internal, persisted via Docker volume)
