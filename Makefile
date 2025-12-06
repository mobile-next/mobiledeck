.PHONY: default all build build-current npm_install npm_update install download-agents

WEBDRIVER_VERSION = 10.2.5
WEBDRIVER_RELEASE_URL = https://github.com/appium/WebDriverAgent/releases/download/v$(WEBDRIVER_VERSION)/

default: build-current

all: build

build-current:
	@OS=$$(uname -s); \
	ARCH=$$(uname -m); \
	if [ "$$OS" = "Darwin" ]; then \
		if [ "$$ARCH" = "arm64" ]; then \
			$(MAKE) build-darwin-arm64; \
		else \
			$(MAKE) build-darwin-x64; \
		fi; \
	elif [ "$$OS" = "Linux" ]; then \
		if [ "$$ARCH" = "aarch64" ] || [ "$$ARCH" = "arm64" ]; then \
			$(MAKE) build-linux-arm64; \
		else \
			$(MAKE) build-linux-x64; \
		fi; \
	else \
		echo "Unsupported OS: $$OS"; \
		exit 1; \
	fi

build-darwin-arm64: download-agents
	make -C webview-ui
	mkdir -p dist
	cp -R media/* dist
	cp node_modules/@mobilenext/mobilecli/bin/mobilecli-darwin-arm64 dist/mobilecli
	npx vsce package --target darwin-arm64

build-darwin-x64: download-agents
	make -C webview-ui
	mkdir -p dist
	cp -R media/* dist
	cp node_modules/@mobilenext/mobilecli/bin/mobilecli-darwin-amd64 dist/mobilecli
	npx vsce package --target darwin-x64

build-linux-x64: download-agents
	make -C webview-ui
	mkdir -p dist
	cp -R media/* dist
	cp node_modules/@mobilenext/mobilecli/bin/mobilecli-linux-amd64 dist/mobilecli
	npx vsce package --target linux-x64

build-linux-arm64: download-agents
	make -C webview-ui
	mkdir -p dist
	cp -R media/* dist
	cp node_modules/@mobilenext/mobilecli/bin/mobilecli-linux-arm64 dist/mobilecli
	npx vsce package --target linux-arm64

build-win32-x64: download-agents
	make -C webview-ui
	mkdir -p dist
	cp -R media/* dist
	cp node_modules/@mobilenext/mobilecli/bin/mobilecli-windows-amd64.exe dist/mobilecli.exe
	npx vsce package --target win32-x64

clean:
	rm -rf dist

download-agents: media/agents/WebDriverAgentRunner-Build-Sim-arm64.zip media/agents/WebDriverAgentRunner-Build-Sim-x86_64.zip
	#

media/agents/WebDriverAgentRunner-Build-Sim-arm64.zip:
	mkdir -p $(dir $@)
	curl -o $@ -L "$(WEBDRIVER_RELEASE_URL)/WebDriverAgentRunner-Build-Sim-arm64.zip"

media/agents/WebDriverAgentRunner-Build-Sim-x86_64.zip:
	mkdir -p $(dir $@)
	curl -o $@ -L "$(WEBDRIVER_RELEASE_URL)/WebDriverAgentRunner-Build-Sim-x86_64.zip"

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

