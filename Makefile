.PHONY: dev server generate build start lint typecheck test coverage check install clean

# Development server (alias: dev)
dev server:
	npm run dev

# Prisma
generate:
	npx prisma generate

# Build and run
build:
	npx prisma generate
	npm run build

start:
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
