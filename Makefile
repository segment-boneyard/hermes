
browserify = ./node_modules/.bin/browserify
component = ./node_modules/.bin/component
mocha = ./node_modules/.bin/mocha

build: node_modules components
	@$(component) build --dev

clean:
	@rm -rf node_modules

components: component.json
	@$(component) install --dev

hermes.js: lib/*.js node_modules
	@$(browserify) lib/index.js --standalone Hermes --outfile hermes.js

node_modules: package.json
	@npm install

test: node_modules
	@$(mocha) \
	test/index.js \
	test/memory.js \
	test/console.js \
	test/help \
	--reporter spec

.PHONY: clean test