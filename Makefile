
browserify = ./node_modules/.bin/browserify
mocha = ./node_modules/.bin/mocha

clean:
	@rm -rf node_modules

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