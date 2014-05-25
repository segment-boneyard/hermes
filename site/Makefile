
component = ../node_modules/.bin/component
myth = ../node_modules/.bin/myth

build: node_modules components
	@$(component) build --dev --prefix .
	@$(myth) build/build.css build/build.css

components: node_modules component.json
	@$(component) install

clean:
	@rm -rf build components

node_modules: package.json
	@npm install

.PHONY: clean