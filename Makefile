.PHONY: build npm_install npm_update

build: npm_install
	make -C webview-ui
	cp -R node_modules/\@mobilenext/mobilecli assets
	npx vsce package

npm_install:
	npm install
	(cd webview-ui && npm install)

npm_update:
	npm update
	(cd webview-ui && npm update)
