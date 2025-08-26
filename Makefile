.PHONY: build npm_install npm_update

build:
	make -C webview-ui
	cp node_modules/go-ios/dist/go-ios-darwin-arm64_darwin_arm64/ios assets/ios
	cp node_modules/@mobilenext/mobilecli/bin/mobilecli-darwin assets/mobilecli
	npx vsce package --target darwin-arm64

npm_install:
	npm install
	(cd webview-ui && npm install)

npm_update:
	npm update
	(cd webview-ui && npm update)
