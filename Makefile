.PHONY: all build npm_install npm_update install

all: build

build-darwin-arm64:
	make -C webview-ui
	cp -R media/* assets
	cp node_modules/@mobilenext/mobilecli/bin/mobilecli-darwin-arm64 assets/mobilecli
	npx vsce package --target darwin-arm64

build-darwin-x64:
	make -C webview-ui
	cp -R media/* assets
	cp node_modules/@mobilenext/mobilecli/bin/mobilecli-darwin-amd64 assets/mobilecli
	npx vsce package --target darwin-x64

build-linux-x64:
	make -C webview-ui
	cp -R media/* assets
	cp node_modules/@mobilenext/mobilecli/bin/mobilecli-linux-amd64 assets/mobilecli
	npx vsce package --target linux-x64

build-linux-arm64:
	make -C webview-ui
	cp -R media/* assets
	cp node_modules/@mobilenext/mobilecli/bin/mobilecli-linux-arm64 assets/mobilecli
	npx vsce package --target linux-arm64

build-win32-x64:
	make -C webview-ui
	cp -R media/* assets
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

install:
	@OS=$$(uname -s); \
	ARCH=$$(uname -m); \
	if [ "$$OS" = "Darwin" ]; then \
		if [ "$$ARCH" = "arm64" ]; then \
			VSIX="mobiledeck-darwin-arm64-0.0.1.vsix"; \
		else \
			VSIX="mobiledeck-darwin-x64-0.0.1.vsix"; \
		fi; \
	elif [ "$$OS" = "Linux" ]; then \
		if [ "$$ARCH" = "aarch64" ] || [ "$$ARCH" = "arm64" ]; then \
			VSIX="mobiledeck-linux-arm64-0.0.1.vsix"; \
		else \
			VSIX="mobiledeck-linux-x64-0.0.1.vsix"; \
		fi; \
	else \
		echo "Unsupported OS: $$OS"; \
		exit 1; \
	fi; \
	echo "Installing $$VSIX..."; \
	code --install-extension $$VSIX

