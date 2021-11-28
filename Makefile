include Makefile.conf

.PHONY: help prerequisites

prerequisites:
	bash script/check_user.sh

help:  ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n"} /^#? ?[a-zA-Z_\-d$$\(\)]+:.*?##/ { gsub(/^(# )/,"",$$1); printf "  \033[36m%-25s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@printf "\n"
	@echo "Available services & [independent services]"
	@printf "\033[36m  $(SERVICES) [$(INDEPENDENT_SERVICES)] \033[0m\n\n"


.DEFAULT_GOAL := help


##@ Individual service targets
# provide access to service build targets located in ./dockerfiles/
# stop_$(SERVICE_NAME): ## start individual service $(SRVICE_NAME)
# build_$(SERVICE_NAME): ## build the image using "docker build"
# run_$(SERVICE_NAME): ## run the image using "docker run"
# up_$(SERVICE_NAME): ## build & then run the image
# push_$(SERVICE_NAME): ## push the image of the current build to the configured repository
# logs_$(SERVICE_NAME): ## show and follow the logs
# pull_$(SERVICE_NAME): ## pull latest baseimage version from docker repo
# sh_$(SERVICE_NAME): ## access a shell inside the container
# mapuid_$(SERVICE_NAME): ## Map UID & GID of Container User to UID & GID of host user

define create_service_targets
.PHONY: dist_$(1) stop_$(1) build_$(1) run_$(1) up_$(1) logs_$(1) sh_$(1)
stop_$(1): ## start individual service
	-$(MAKE) -C ./${DOCKERFILES_FOLDER}/$(1) stop
build_$(1):
	$(MAKE) -C ./${DOCKERFILES_FOLDER}/$(1) build
run_$(1):
	$(MAKE) -C ./${DOCKERFILES_FOLDER}/$(1) run
up_$(1): build_$(1) run_$(1)
push_$(1):
	$(MAKE) -C ./${DOCKERFILES_FOLDER}/$(1) push
logs_$(1):
	$(MAKE) -C ./${DOCKERFILES_FOLDER}/$(1) logs
pull_$(1):
	$(MAKE) -C ./images/$(1) pull
sh_$(1):
	$(MAKE) -C ./${DOCKERFILES_FOLDER}/$(1) sh
mapuid_$(1):
	$(MAKE) -C ./${DOCKERFILES_FOLDER}/$(1) mapuid
endef

$(foreach service,$(SERVICES),$(eval $(call create_service_targets,$(service))))
$(foreach service,$(INDEPENDENT_SERVICES),$(eval $(call create_service_targets,$(service))))

##@ Project targets

.PHONY: stop_all build_all run_all up_all
stop_all: prerequisites $(addprefix stop_, $(SERVICES)) ## stop all containers of $(ENV)
build_all: prerequisites $(addprefix build_, $(SERVICES)) $(addprefix build_, $(INDEPENDENT_SERVICES)) ## build all images
run_all: prerequisites create_network $(addprefix run_, $(SERVICES)) ## run all containers of $(ENV)
up_all: prerequisites $(addprefix up_, $(SERVICES)) ## stop, build and run all containers of $(ENV)
push_all: prerequisites $(addprefix push_, $(SERVICES)) $(addprefix push_, $(INDEPENDENT_SERVICES)) ## push all images of the current release to the configured container repository
pull_all: prerequisites $(addprefix pull_, $(SERVICES)) $(addprefix pull_, $(INDEPENDENT_SERVICES)) ## pull the latest base images for all services

.PHONY: create_network
create_networks: prerequisites ## create required docker networks, if they don't exist yet
	docker network inspect $(DOCKER_NETWORK) >/dev/null 2>&1 || \
    docker network create --driver bridge $(DOCKER_NETWORK) 
	docker network ls


.PHONY: add_service
add_service: 
	@echo "Enter a name for the new service within this project: "; \
		read NAME; \
		echo "Enter a base image for the new service: "; \
		read BASE_IMAGE; \
		DOCKERFILES_FOLDER=$(DOCKERFILES_FOLDER)	NAME=$$NAME BASE_IMAGE=$$BASE_IMAGE bash script/add_service.sh;
