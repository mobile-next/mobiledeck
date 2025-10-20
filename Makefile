.PHONY: all build npm_install npm_update

all: build

build-darwin-arm64:
	make -C webview-ui
	cp media/* assets
	lipo node_modules/@mobilenext/mobilecli/bin/mobilecli-darwin -remove x86_64 -output assets/mobilecli
	npx vsce package --target darwin-arm64

build-darwin-x64:
	make -C webview-ui
	cp media/* assets
	lipo node_modules/@mobilenext/mobilecli/bin/mobilecli-darwin -remove arm64 -output assets/mobilecli
	npx vsce package --target darwin-x64

build-linux-x64:
	make -C webview-ui
	cp media/* assets
	cp node_modules/@mobilenext/mobilecli/bin/mobilecli-linux-amd64 assets/mobilecli
	npx vsce package --target linux-x64

build-linux-arm64:
	make -C webview-ui
	cp media/* assets
	cp node_modules/@mobilenext/mobilecli/bin/mobilecli-linux-arm64 assets/mobilecli
	npx vsce package --target linux-arm64

build-win32-x64:
	make -C webview-ui
	cp media/* assets
	cp node_modules/@mobilenext/mobilecli/bin/mobilecli-windows-amd64.exe assets/mobilecli.exe
	npx vsce package --target win32-x64

clean:
	rm -rf assets

build:
	make clean build-darwin-x64
	make clean build-darwin-arm64
	make clean build-linux-x64
	make clean build-linux-arm64
	make clean build-win32-x64

npm_install:
	npm install
	(cd webview-ui && npm install)

npm_update:
	npm update
	(cd webview-ui && npm update)

