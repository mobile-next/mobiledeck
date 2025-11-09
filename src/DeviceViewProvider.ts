import * as vscode from 'vscode';
import { Logger } from './utils/Logger';
import { MobileCliServer } from './MobileCliServer';
import { HtmlUtils } from './utils/HtmlUtils';
import { DeviceDescriptor } from './DeviceDescriptor';

interface Message {
	command: string;
}

interface AlertWebviewMessage extends Message {
	command: 'alert';
	text: string;
}

interface LogWebviewMessage extends Message {
	command: 'log';
	text: string;
}

interface ConfigureMessage extends Message{
	command: 'configure';
	device: DeviceDescriptor;
	serverPort: number;
	mediaSkinsUri: string;
}

interface OnDeviceSelectedMessage extends Message {
	command: 'onDeviceSelected';
	device: DeviceDescriptor;
}

interface OnInitializedMessage extends Message {
	command: 'onInitialized';
}

type WebviewMessage = AlertWebviewMessage | LogWebviewMessage | OnDeviceSelectedMessage | OnInitializedMessage | ConfigureMessage;

export class DeviceViewProvider {

	private logger: Logger = new Logger('Mobiledeck');

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly selectedDevice: DeviceDescriptor,
		private readonly cliServer: MobileCliServer,
	) { }

	private verbose(message: string) {
		this.logger.log(message);
	}

	async handleMessage(webviewPanel: vscode.WebviewPanel, message: WebviewMessage) {
		this.verbose('Received message: ' + JSON.stringify(message));
		switch (message.command) {
			case 'alert':
				vscode.window.showErrorMessage(message.text);
				break;

			case 'log':
				this.verbose(message.text);
				break;

			case 'onInitialized':
				this.verbose('Webview initialized');

				// convert media skins directory path to webview URI
				const mediaSkinsUri = webviewPanel.webview.asWebviewUri(
					vscode.Uri.joinPath(this.context.extensionUri, 'media', 'skins')
				);

				// Send configure message with both device and server port
				this.sendMessageToWebview(webviewPanel, {
					command: 'configure',
					device: this.selectedDevice,
					serverPort: this.cliServer.getJsonRpcServerPort(),
					mediaSkinsUri: mediaSkinsUri.toString(),
				} as ConfigureMessage);

				this.updateWebviewTitle(webviewPanel, this.selectedDevice.name);
				break;

			case 'onDeviceSelected':
				this.verbose('Device selected: ' + message.device.name);
				this.updateWebviewTitle(webviewPanel, message.device.name);
				break;

			default:
				vscode.window.showErrorMessage('Unknown message: ' + JSON.stringify(message));
				break;
		}
	}

	createWebviewPanel(_preselectedDevice?: DeviceDescriptor, page: string = 'device'): vscode.WebviewPanel {
		console.log('createWebviewPanel called');

		const panel = vscode.window.createWebviewPanel(
			'mobiledeck',
			'Mobiledeck Device View',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [
					// allow css and js files to be loaded
					vscode.Uri.joinPath(this.context.extensionUri, 'assets'),
					// allow media files (skins) to be loaded
					vscode.Uri.joinPath(this.context.extensionUri, 'media')
				]
			}
		);

		panel.webview.onDidReceiveMessage(message => this.handleMessage(panel, message), undefined, this.context.subscriptions);

		panel.webview.html = this.getHtml(panel, page);

		return panel;
	}

	private sendMessageToWebview(webviewPanel: vscode.WebviewPanel, message: WebviewMessage) {
		webviewPanel.webview.postMessage(message);
	}

	private updateWebviewTitle(webviewPanel: vscode.WebviewPanel, device: string) {
		webviewPanel.title = device;

		// add device icon
		webviewPanel.iconPath = vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'mobiledeck-icon.svg');
	}

	private getHtml(webviewPanel: vscode.WebviewPanel, page: string = 'device'): string {
		return HtmlUtils.getHtml(this.context, webviewPanel.webview, page);
	}
}
