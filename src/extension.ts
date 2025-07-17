import * as vscode from 'vscode';
import * as fs from 'fs';
import { ChildProcess, execFileSync } from 'child_process';
import path from 'path';
import { spawn } from 'child_process';
import { Logger } from './utils/Logger';
import { PortManager } from './managers/PortManager';

export function activate(context: vscode.ExtensionContext) {
	console.log('Mobiledeck extension is being activated');

	// Register a command to open the iOS Preview view
	const openViewCommand = vscode.commands.registerCommand('mobiledeck.openPreview', () => {
		console.log('mobiledeck.openPreview command executed');
		vscode.commands.executeCommand('mobiledeckSidebar.focus');
	});

	context.subscriptions.push(openViewCommand);

	// Register the webview view provider for the right pane
	console.log('Registering webview view provider...');
	const provider = new MobiledeckViewProvider(context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'mobiledeckSidebar',
			provider
		)
	);
	console.log('Mobiledeck extension activated successfully');
}

export function deactivate() {
	console.log('Mobiledeck extension deactivated');
}

class MobiledeckViewProvider implements vscode.WebviewViewProvider {

	private mobilecliPath: string;
	private logger: Logger;
	private portManager: PortManager;
	private lastSelectedDevice: string | null = null;
	private mobilecliServerProcess: ChildProcess | null = null;
	private serverPort: number | null = null;

	constructor(private readonly context: vscode.ExtensionContext) {
		this.logger = new Logger('Mobiledeck');
		this.portManager = new PortManager(this.logger);
		this.logger.log("MobiledeckViewProvider constructor called");

		this.mobilecliPath = this.findMobilecliPath();
	}

	private verbose(message: string) {
		this.logger.log(message);
	}

	private findMobilecliPath(): string {
		const root = vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'mobilecli', 'bin').fsPath;

		let mobilecliPath: string;

		switch (process.platform) {
			case 'darwin':
				mobilecliPath = path.join(root, 'mobilecli-darwin');
				break;

			case 'win32':
				mobilecliPath = path.join(root, 'mobilecli-windows-amd64.exe');
				break;

			case 'win32':
				mobilecliPath = path.join(root, 'mobilecli-windows-amd64.exe');
				break;

			case 'linux':
				switch (process.arch) {
					case 'x64':
						mobilecliPath = path.join(root, 'mobilecli-linux-x64');
						break;
					case 'arm64':
						mobilecliPath = path.join(root, 'mobilecli-linux-arm64');
						break;

					default:
						throw new Error('Unsupported architecture: ' + process.arch);
				}
				break;

			default:
				throw new Error('Unsupported platform: ' + process.platform);
		}

		this.verbose("mobilecli path: " + mobilecliPath);
		this.verbose("mobilecli path: " + mobilecliPath);

		const text = execFileSync(mobilecliPath, ['--version']).toString().trim();
		this.verbose("mobilecli version: " + text);

		return mobilecliPath;
	}

	private async checkMobilecliServerRunning(): Promise<boolean> {
		if (this.serverPort) {
			return await this.portManager.checkServerHealth(this.serverPort);
		}
		return false;
	}

	private async launchMobilecliServer(webviewView?: vscode.WebviewView): Promise<void> {
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
			if (webviewView) {
				this.sendServerPortToWebview(webviewView);
			}
		}

		this.verbose(`Launching mobilecli server on port ${this.serverPort}...`);

		this.mobilecliServerProcess = spawn(this.mobilecliPath, ['server', 'start', '--cors', '--listen', `localhost:${this.serverPort}`], {
			detached: false,
			stdio: 'pipe'
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

	handleMessage(webviewView: vscode.WebviewView, message: any) {
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
				this.sendServerPortToWebview(webviewView);

				// the moment the webview is all set, we set it to view the device last selected
				if (this.lastSelectedDevice) {
					this.sendMessageToWebview(webviewView, {
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

	resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		console.log('resolveWebviewView called');

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				// allow css and js files to be loaded
				vscode.Uri.joinPath(this.context.extensionUri, 'assets')
			]
		};

		webviewView.webview.onDidReceiveMessage(message => this.handleMessage(webviewView, message), undefined, this.context.subscriptions);

		webviewView.webview.html = this.getHtml(webviewView);

		this.launchMobilecliServer(webviewView);
	}

	private sendMessageToWebview(webviewView: vscode.WebviewView, message: any) {
		webviewView.webview.postMessage(message);
	}

	private sendServerPortToWebview(webviewView: vscode.WebviewView) {
		if (this.serverPort) {
			this.sendMessageToWebview(webviewView, {
				command: 'setServerPort',
				port: this.serverPort
			});
		}
	}

	private getHtml(webviewView: vscode.WebviewView): string {
		const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'index.html');
		let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');

		const assets = ["styles.css", "bundle.js"];
		for (const asset of assets) {
			const uri = webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'assets', asset));
			htmlContent = htmlContent.replace(asset, uri.toString());
		}

		return htmlContent;
	}
}
