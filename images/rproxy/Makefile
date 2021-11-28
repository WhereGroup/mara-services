include ../_include/skeleton.mk

.PHONY: run 
run: stop
	docker run --restart unless-stopped $(if $(DEBUG),,-d) $(addprefix  --env-file ,$(ENV_FILES)) $(addprefix  -p ,$(PORTS)) --name $(CONTAINER_NAME) $(FQN)
	docker network connect --alias $(SERVICE_NAME) $(CURRENT_NETWORK) $(CONTAINER_NAME)
