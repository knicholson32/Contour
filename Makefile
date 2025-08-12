.PHONY: all test clean

# create:
# 	docker build --file ./docker/Dockerfile --build-arg GIT_COMMIT=$(shell git rev-parse HEAD) --target prod -t keenanrnicholson/contour:latest .
#	docker push keenanrnicholson/contour
create-local:
	docker build --file ./docker/Dockerfile --build-arg GIT_COMMIT=$(shell git rev-parse HEAD) --build-arg BUILD_TIMESTAMP=$(shell date +%s) --target prod -t keenanrnicholson/contour:local .
create-all:
	docker buildx build --builder mybuilder --file ./docker/Dockerfile --push --build-arg GIT_COMMIT=$(shell git rev-parse HEAD) --target prod --platform linux/arm64,linux/amd64 --tag keenanrnicholson/contour:latest .
dev:
	rm -rf ./node_modules
	docker build --build-arg GIT_COMMIT=$(shell git rev-parse HEAD) --file ./docker/Dockerfile --target dev -t contour-dev .
	docker compose -f ./docker/docker-compose.dev.yml -p contour up --remove-orphans
preview:
	rm -rf ./node_modules
	docker build --build-arg GIT_COMMIT=$(shell git rev-parse HEAD) --file ./docker/Dockerfile --target dev -t contour-dev .
	docker compose -f ./docker/docker-compose.preview.yml -p contour up --remove-orphans
# docker build --build-arg GIT_COMMIT=$(shell git rev-parse HEAD) --file ./docker/Dockerfile --target dev -t contour-dev .
local:
	docker compose -f ./docker/docker-compose.local.yml up --remove-orphans