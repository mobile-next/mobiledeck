import * as vscode from 'vscode';
import { Logger } from './utils/Logger';
import { MobileCliServer } from './MobileCliServer';
import { HtmlUtils } from './utils/HtmlUtils';
import { DeviceDescriptor } from '@shared/models';
import { Telemetry } from './utils/Telemetry';

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

interface TelemetryMessage extends Message {
	command: 'telemetry';
	event: string;
	properties?: Record<string, any>;
}

type WebviewMessage = AlertWebviewMessage | LogWebviewMessage | OnDeviceSelectedMessage | OnInitializedMessage | ConfigureMessage | TelemetryMessage;

export class DeviceViewProvider {

	private logger: Logger = new Logger('DeviceViewProvider');

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly selectedDevice: DeviceDescriptor,
		private readonly cliServer: MobileCliServer,
		private readonly telemetry: Telemetry,
	) {}

	async handleMessage(webviewPanel: vscode.WebviewPanel, message: WebviewMessage) {
		this.logger.log('Received message: ' + JSON.stringify(message));
		switch (message.command) {
			case 'alert':
				vscode.window.showErrorMessage(message.text);
				break;

			case 'log':
				this.logger.log(message.text);
				break;

			case 'onInitialized':
				this.logger.log('Webview initialized');

				// convert media skins directory path to webview URI
				const mediaSkinsUri = webviewPanel.webview.asWebviewUri(
					vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'skins')
				);

				// Send configure message with both device and server port
				const configureMessage: ConfigureMessage = {
					command: 'configure',
					device: this.selectedDevice,
					serverPort: this.cliServer.getJsonRpcServerPort(),
					mediaSkinsUri: mediaSkinsUri.toString(),
				};

				this.sendMessageToWebview(webviewPanel, configureMessage);
				this.updateWebviewTitle(webviewPanel, this.selectedDevice.name);
				break;

			case 'onDeviceSelected':
				this.logger.log('Device selected: ' + message.device.name);
				this.updateWebviewTitle(webviewPanel, message.device.name);
				break;

			case 'telemetry':
				this.telemetry.sendEvent(message.event, message.properties);
				break;

			default:
				vscode.window.showErrorMessage('Unknown message: ' + JSON.stringify(message));
				break;
		}
	}

	createWebviewPanel(_preselectedDevice?: DeviceDescriptor): vscode.WebviewPanel {
		this.logger.log('createWebviewPanel called');

		const panel = vscode.window.createWebviewPanel(
			'mobiledeck',
			'',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [
					// allow css and js files to be loaded
					vscode.Uri.joinPath(this.context.extensionUri, 'dist'),
					// allow media files (skins) to be loaded
					// vscode.Uri.joinPath(this.context.extensionUri, 'media'),
				],
			},
		);

		panel.webview.onDidReceiveMessage(message => this.handleMessage(panel, message), undefined, this.context.subscriptions);
		panel.webview.html = this.getHtml(panel);

		// set title and icon
		this.updateWebviewTitle(panel, "Mobiledeck Device View");

		return panel;
	}

	private sendMessageToWebview(webviewPanel: vscode.WebviewPanel, message: WebviewMessage) {
		webviewPanel.webview.postMessage(message);
	}

	private updateWebviewTitle(webviewPanel: vscode.WebviewPanel, device: string) {
		webviewPanel.title = device;

		// add mobile next icon (theme-aware)
		webviewPanel.iconPath = {
			dark: vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'mobiledeck-dark.svg'),
			light: vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'mobiledeck-light.svg'),
		};
	}

	private getHtml(webviewPanel: vscode.WebviewPanel): string {
		return HtmlUtils.getHtml(this.context, webviewPanel.webview, "device");
	}
}
