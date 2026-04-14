.PHONY: dev server generate migrate migrate-dev predict-build build start lint typecheck test coverage check install clean

# Development server. Stops whatever is bound to 8066 (usually a stray `next dev`)
# and clears a stale Turbopack lock so a fresh server can start.
dev:
	@for pid in $$(lsof -ti:8066 2>/dev/null); do kill $$pid 2>/dev/null || true; done
	@sleep 0.4
	@rm -f .next/dev/lock
	npm run dev

# Prisma
generate:
	npx prisma generate

# Generate predict runtime JSON from source strings.
predict-build:
	npm run predict:build

# Apply pending migrations (production / CI). Requires DIRECT_URL or DATABASE_URL in .env.
migrate:
	npx prisma migrate deploy

# Create/apply migrations in development (interactive). Requires DIRECT_URL or DATABASE_URL.
migrate-dev:
	npx prisma migrate dev

# Build and run
build:
	npx prisma generate
	npm run build

server:build
	npm run start

# Lint and typecheck
lint:
	npm run lint

typecheck:
	npm run typecheck

# Tests
test:
	npm run test:run

coverage:
	npm run test:coverage

# Full check: lint + typecheck + test (e.g. CI)
check: lint typecheck test

# Dependencies and cleanup
install:
	npm install

clean:
	rm -rf .next node_modules coverage
