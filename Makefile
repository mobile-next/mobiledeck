
all:
	make -C webview-ui
	cp -R node_modules/\@mobilenext/mobilectl assets
	npx vsce package
