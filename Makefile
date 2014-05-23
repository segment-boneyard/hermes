
browserify = ./node_modules/.bin/browserify
component = ./node_modules/.bin/component
mocha = ./node_modules/.bin/mocha
serve = ./node_modules/.bin/serve

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
	@touch node_modules # hack: omg shut up npm

server: node_modules
	$(serve) .

test: node_modules
	@$(mocha) \
	test/index.js \
	test/memory.js \
	test/help.js \
	test/cli.js \
	--reporter spec

test-browser:
	open http://localhost:3000/test

.PHONY: clean server test test-browser