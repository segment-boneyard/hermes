
clean:
	@rm -rf node_modules

node_modules: package.json
	@npm install

test: node_modules
	@node_modules/.bin/mocha \
	test/index.js \
	test/memory.js \
	test/console.js \
	test/help \
	--reporter spec

.PHONY: clean test