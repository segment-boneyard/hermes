
component = ../node_modules/.bin/component
myth = ../node_modules/.bin/myth
serve = ../node_modules/.bin/serve

build: node_modules components index.* $(shell find lib)
	@$(component) build --dev --prefix .
	@$(myth) build/build.css build/build.css

components: node_modules $(shell find . -name component.json)
	@$(component) install

clean:
	@rm -rf build components

node_modules: package.json
	@npm install

server: node_modules
	@$(serve) .

.PHONY: clean