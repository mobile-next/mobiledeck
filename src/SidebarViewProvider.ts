import * as vscode from 'vscode';
import { MobileCliServer } from './MobileCliServer';
import { HtmlUtils } from './utils/HtmlUtils';

export class SidebarViewProvider implements vscode.WebviewViewProvider {
	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly cliServer: MobileCliServer
	) {}

	resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		token: vscode.CancellationToken
	): void | Thenable<void> {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(this.context.extensionUri, 'assets')
			]
		};

		webviewView.webview.html = this.getHtml(webviewView.webview, 'sidebar');

		// handle messages from the webview
		webviewView.webview.onDidReceiveMessage(async (message) => {
			console.log('sidebar received message:', message);

			switch (message.command) {
				case 'onInitialized':
					console.log('sidebar webview initialized');
					// send server port to webview
					webviewView.webview.postMessage({
						command: 'configure',
						serverPort: this.cliServer.getJsonRpcServerPort(),
					});
					break;
				case 'deviceClicked':
					console.log('device clicked:', message.device);
					// open a new tab with the device
					vscode.commands.executeCommand('mobiledeck.openDevicePanel', message.device);
					break;
				case 'alert':
					vscode.window.showInformationMessage(message.text);
					break;
			}
		});
	}

	private getHtml(webview: vscode.Webview, page: string = 'sidebar'): string {
		return HtmlUtils.getHtml(this.context, webview, page);
	}
}
