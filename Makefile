
all:
	make -C webview-ui
	cp -R node_modules/\@mobilenext/mobilecli assets
	npx vsce package
