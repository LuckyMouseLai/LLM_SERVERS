
__init__:
	CONTAINER=llm_servers-agent-1

run:
	docker-compose up -d
run_once:
	docker-compose up
exec:
	docker exec -it ${CONTAINER} /bin/bash

stop:
	docker-compose down
