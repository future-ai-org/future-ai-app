.PHONY: dev build start lint install clean

server:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

install:
	npm install

clean:
	rm -rf .next node_modules
