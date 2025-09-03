import * as vscode from 'vscode';
import * as fs from 'fs';
import { ChildProcess, execFileSync } from 'child_process';
import { spawn } from 'child_process';
import { Logger } from './utils/Logger';
import { PortManager } from './managers/PortManager';

interface AlertWebviewMessage {
    command: 'alert';
    text: string;
}

interface LogWebviewMessage {
    command: 'log';
    text: string;
}

interface OnDeviceSelectedMessage {
    command: 'onDeviceSelected';
    device: string;
}		

interface OnInitializedMessage {
    command: 'onInitialized';
}

type WebviewMessage = AlertWebviewMessage | LogWebviewMessage | OnDeviceSelectedMessage | OnInitializedMessage;

export class MobiledeckViewProvider {

	private mobilecliPath: string;
	private goIosPath: string;
	private logger: Logger;
	private portManager: PortManager;
	private lastSelectedDevice: string | null = null;
	private mobilecliServerProcess: ChildProcess | null = null;
	private serverPort: number | null = null;

	constructor(private readonly context: vscode.ExtensionContext) {
		this.logger = new Logger('Mobiledeck');
		this.portManager = new PortManager(this.logger);
		this.logger.log("MobiledeckViewProvider constructor called");

		this.goIosPath = this.findGoIosPath();
		this.mobilecliPath = this.findMobilecliPath();
	}

	private verbose(message: string) {
		this.logger.log(message);
	}

	private findMobilecliPath(): string {
		const basePath = vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'mobilecli').fsPath;
		const mobilecliPath = process.platform === 'win32' ? `${basePath}.exe` : basePath;

		this.verbose("mobilecli path: " + mobilecliPath);

		const text = execFileSync(mobilecliPath, ['--version']).toString().trim();
		this.verbose("mobilecli version: " + text);

		return mobilecliPath;
	}

	private findGoIosPath(): string {
		const basePath = vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'ios').fsPath;
		const goIosPath = process.platform === 'win32' ? `${basePath}.exe` : basePath;

		this.verbose("go-ios path: " + goIosPath);

		return goIosPath;
	}

	private async checkMobilecliServerRunning(): Promise<boolean> {
		if (this.serverPort) {
			return await this.portManager.checkServerHealth(this.serverPort);
		}

		return false;
	}

	private async launchMobilecliServer(webviewPanel?: vscode.WebviewPanel): Promise<void> {
		const isRunning = await this.checkMobilecliServerRunning();

		if (isRunning) {
			this.verbose(`mobilecli server is already running on port ${this.serverPort}`);
			return;
		}

		if (this.mobilecliServerProcess) {
			this.verbose('mobilecli server process already exists');
			return;
		}

		if (!this.serverPort) {
			this.serverPort = await this.portManager.findAvailablePort(12001, 12099);

			// Send the server port to the webview if available
			if (webviewPanel) {
				this.sendServerPortToWebview(webviewPanel);
			}
		}

		this.verbose(`Launching mobilecli server on port ${this.serverPort}...`);

		this.mobilecliServerProcess = spawn(this.mobilecliPath, ['-v', 'server', 'start', '--cors', '--listen', `localhost:${this.serverPort}`], {
			detached: false,
			stdio: 'pipe',
			env: {
				...process.env,
				GO_IOS_PATH: this.goIosPath,
			}
		});

		this.mobilecliServerProcess.stdout?.on('data', (data: Buffer) => {
			this.verbose(`mobilecli server stdout: ${data.toString().trimEnd()}`);
		});

		this.mobilecliServerProcess.stderr?.on('data', (data: Buffer) => {
			this.verbose(`mobilecli server stderr: ${data.toString().trimEnd()}`);
		});

		this.mobilecliServerProcess.on('close', (code: number) => {
			this.verbose(`mobilecli server process exited with code ${code}`);
			this.mobilecliServerProcess = null;
		});

		this.mobilecliServerProcess.on('error', (error: Error) => {
			this.verbose(`mobilecli server error: ${error.message}`);
			this.mobilecliServerProcess = null;
		});
	}

	handleMessage(webviewPanel: vscode.WebviewPanel, message: WebviewMessage) {
		this.verbose('Received message: ' + JSON.stringify(message));
		switch (message.command) {
			case 'alert':
				vscode.window.showErrorMessage(message.text);
				break;

			case 'log':
				this.verbose(message.text);
				break;

			case 'onDeviceSelected':
				this.lastSelectedDevice = message.device;
				this.verbose('Device selected: ' + JSON.stringify(message.device));
				break;

			case 'onInitialized':
				this.verbose('Webview initialized');

				// Send the server port to the webview
				this.sendServerPortToWebview(webviewPanel);

				// the moment the webview is all set, we set it to view the device last selected
				if (this.lastSelectedDevice) {
					this.sendMessageToWebview(webviewPanel, {
						command: 'selectDevice',
						device: this.lastSelectedDevice
					});
				}
				break;

			default:
				vscode.window.showErrorMessage('Unknown message: ' + JSON.stringify(message));
				break;
		}
	}

	createWebviewPanel(): vscode.WebviewPanel {
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

		panel.webview.html = this.getHtml(panel);

		this.launchMobilecliServer(panel);

		return panel;
	}

	private sendMessageToWebview(webviewPanel: vscode.WebviewPanel, message: any) {
		webviewPanel.webview.postMessage(message);
	}

	private sendServerPortToWebview(webviewPanel: vscode.WebviewPanel) {
		if (this.serverPort) {
			this.sendMessageToWebview(webviewPanel, {
				command: 'setServerPort',
				port: this.serverPort
			});
		}
	}

	private getHtml(webviewPanel: vscode.WebviewPanel): string {
		const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'index.html');
		let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');

		const assets = ["styles.css", "bundle.js"];
		for (const asset of assets) {
			const uri = webviewPanel.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'assets', asset));
			htmlContent = htmlContent.replace(asset, uri.toString());
		}

		return htmlContent;
	}
}
