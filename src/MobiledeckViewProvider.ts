import * as vscode from 'vscode';
import { ChildProcess, execFileSync } from 'child_process';
import { spawn } from 'child_process';
import { Logger } from './utils/Logger';
import { PortManager } from './managers/PortManager';
import { MobileCliServer } from './MobileCliServer';
import { HtmlUtils } from './utils/HtmlUtils';

interface AlertWebviewMessage {
    command: 'alert';
    text: string;
}

interface LogWebviewMessage {
    command: 'log';
    text: string;
}

interface DeviceDescriptor {
    id: string;
    name: string;
    platform: string;
    type: string;
}

interface OnDeviceSelectedMessage {
    command: 'onDeviceSelected';
    device: DeviceDescriptor;
}

interface OnInitializedMessage {
    command: 'onInitialized';
}

type WebviewMessage = AlertWebviewMessage | LogWebviewMessage | OnDeviceSelectedMessage | OnInitializedMessage;

export class MobiledeckViewProvider {

	private logger: Logger = new Logger('Mobiledeck');

	constructor(
		private readonly context: vscode.ExtensionContext, 
		private readonly selectedDevice: DeviceDescriptor,
		private readonly cliServer: MobileCliServer,
	) {
		this.logger.log("MobiledeckViewProvider constructor called");
	}

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

				// Send configure message with both device and server port
				this.sendMessageToWebview(webviewPanel, {
					command: 'configure',
					device: this.selectedDevice,
					serverPort: this.cliServer.getJsonRpcServerPort(),
				});

				this.updateWebviewTitle(webviewPanel, this.selectedDevice.name);
				break;

			default:
				vscode.window.showErrorMessage('Unknown message: ' + JSON.stringify(message));
				break;
		}
	}

	createWebviewPanel(preselectedDevice?: DeviceDescriptor, page: string = 'device'): vscode.WebviewPanel {
		console.log('createWebviewPanel called');

		const panel = vscode.window.createWebviewPanel(
			'mobiledeck',
			'Mobiledeck Device View',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [
					// allow css and js files to be loaded
					vscode.Uri.joinPath(this.context.extensionUri, 'assets')
				]
			}
		);

		panel.webview.onDidReceiveMessage(message => this.handleMessage(panel, message), undefined, this.context.subscriptions);

		panel.webview.html = this.getHtml(panel, page);

		return panel;
	}

	private sendMessageToWebview(webviewPanel: vscode.WebviewPanel, message: any) {
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
