test:
	./node_modules/.bin/mocha -R spec -r chai test/*.js

.PHONY: test
