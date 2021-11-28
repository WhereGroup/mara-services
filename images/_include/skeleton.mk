include ../../Makefile.conf
include Makefile.conf
include ../../env/host/current/domain.env

WORK_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

ENV ?= dev

CURRENT_NETWORK := $(DOCKER_NETWORK)
IMAGE_NAME := $(CONTAINER_REGISTRY)$(SERVICE_NAME)
CONTAINER_NAME := $(PROJECT_NAME)_$(ENV)_$(SERVICE_NAME)

FQN := $(IMAGE_NAME):$(VERSION_TAG)
DIST_PATH := ../../dist/$(DIST_NAME)

TAG_LIST := $(FQN) $(IMAGE_NAME):latest
SAVE_TAG_LIST := $(TAG_LIST)

.PHONY: prerequisites stop build run up sh logs image instance pull

BUILD_TAG_OPTS = $(patsubst %,-t %, $(TAG_LIST))

BUILD_ARGS := $(BUILD_ARGS) $(if $(BASEIMAGE_NAME),BASEIMAGE_NAME=$(BASEIMAGE_NAME),) $(if $(BASEIMAGE_TAG),BASEIMAGE_TAG=$(BASEIMAGE_TAG),)
BUILD_ARGS_LIST = $(foreach ver, $(BUILD_ARGS), --build-arg $(ver) )

prerequisites:
	bash ../../script/check_user.sh

run: prerequisites stop #Makefile.local.conf
		docker run --restart unless-stopped $(if $(UID),-u $(UID):$(GID),) $(if $(DEBUG),,-d) $(addprefix  -p ,$(PORTS)) $(addprefix  --env-file ,$(ENV_FILES)) $(addprefix  --volume ,$(VOLUMES)) \
		--network $(CURRENT_NETWORK) \
		--network-alias $(SERVICE_NAME) \
		--name $(CONTAINER_NAME) \
		${FQN}

build: prerequisites # Dockerfile Makefile.conf
	docker build $(if $(NOCACHE),--no-cache,) $(BUILD_TAG_OPTS) $(BUILD_ARGS_LIST) $(BUILD_ARGS_EXTRA) .

sh: prerequisites
	@-docker exec -ti $(if $(RUNUSER),--user $(RUNUSER),) $(CONTAINER_NAME) bash && [ $$? -eq 0 ] || docker exec -ti $(if $(RUNUSER),--user $(RUNUSER),) $(CONTAINER_NAME) sh

stop: prerequisites
	-docker stop $(CONTAINER_NAME)
	-docker rm $(CONTAINER_NAME)

logs: prerequisites
	docker logs -f $(CONTAINER_NAME)

push: prerequisites
	docker push $(FQN)
	
pull: prerequisites
	docker pull $(BASEIMAGE_NAME):$(BASEIMAGE_TAG)

mapuid:
	docker exec -u root $(CONTAINER_NAME) bash -c "usermod -u $(UID) $(RUNUSER) & groupmod -g $(GID) $(RUNUSER)"

up: build run

image: build

instance: run

#parent-image:
#	test -n "${PARENT_IMAGE_NAME}" && make -C ../${PARENT_IMAGE_NAME} image || true
