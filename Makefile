.PHONY: deploy rollback logs db-logs restart status shell db-shell

deploy:
	bash scripts/deploy.sh $(TAG)

rollback:
	bash scripts/rollback.sh $(TAG)

logs:
	docker compose logs -f --tail=100 app

db-logs:
	docker compose logs -f --tail=50 db

restart:
	docker compose restart app

status:
	docker compose ps

shell:
	docker compose exec app sh

db-shell:
	docker compose exec db psql -U expenso expensodb
