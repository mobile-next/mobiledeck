
all:
	make -C webview-ui
	npx vsce package
