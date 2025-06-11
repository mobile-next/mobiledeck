import * as vscode from 'vscode';
import * as fs from 'fs';
import { ChildProcess, exec, execFile, execSync } from 'child_process';

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
	constructor(private readonly context: vscode.ExtensionContext) {
		console.log('MobiledeckViewProvider constructor called');
	}

	resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		console.log('resolveWebviewView called');
		const mobilectlPath = '/Users/gilm/git/mobilectl/mobilectl';

		const outputChannel = vscode.window.createOutputChannel('Mobiledeck');
		outputChannel.appendLine("Verifying mobilectl installation");

		let devices = [];
		try {
			const text = execSync(`${mobilectlPath} devices --json`).toString();
			outputChannel.appendLine("mobilectl returned devices " + text);
			devices = JSON.parse(text);
			outputChannel.appendLine('Successfully got devices: ' + devices.map((d: any) => d.name).join(', '));
		} catch (error) {
			outputChannel.appendLine('Failed to get devices: ' + error);
			vscode.window.showErrorMessage(`Failed to connect to mobilectl: ${error}`);
		}

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				// allow css and js files to be loaded
				vscode.Uri.joinPath(this.context.extensionUri, 'assets')
			]
		};

		webviewView.webview.onDidReceiveMessage(message => {
			outputChannel.appendLine('Received message: ' + JSON.stringify(message));
			switch (message.command) {
				case 'alert':
					vscode.window.showErrorMessage(message.text);
					break;

				case 'pressButton':
					execSync(`${mobilectlPath} io button --device ${message.deviceId} ${message.key}`);
					break;

				case 'tap':
					vscode.window.showInformationMessage('clicking ' + JSON.stringify(message));
					execSync(`${mobilectlPath} io tap --device ${message.deviceId} ${message.x},${message.y}`);
					vscode.window.showInformationMessage('clicked on ' + JSON.stringify(message));
					break;

				case 'keyDown':
					execSync(`${mobilectlPath} io text --device ${message.deviceId} \"${message.key}\"`);
					vscode.window.showInformationMessage('pressed key on ' + JSON.stringify(message));
					break;

				case 'requestDevices':
					this.sendMessageToWebview(webviewView, {
						command: 'onNewDevices',
						payload: {
							devices: devices.map((d: any) => {
								return {
									deviceId: d.id,
									deviceName: d.name,
								};
							})
						}
					});
					break;

				case 'requestScreenshot':
					execFile(mobilectlPath, ['screenshot', '--device', message.deviceId, '--output', '-', '--format', 'jpeg', '--quality', '80'], {
						maxBuffer: 1024 * 1024 * 10,
						encoding: 'buffer'
					}, (error: Error | null, stdout: Buffer, stderr: Buffer) => {
						if (error) {
							vscode.window.showErrorMessage(`Failed to take screenshot: ${error.message}`);
							return;
						}

						outputChannel.appendLine('Received screenshot from mobilectl of size ' + stdout.length);
						this.sendMessageToWebview(webviewView, {
							command: 'onNewScreenshot',
							payload: {
								deviceId: message.deviceId,
								screenshot: stdout.toString('base64'),
							}
						});
					});
					break;

				default:
					vscode.window.showErrorMessage('Unknown message: ' + JSON.stringify(message));
					break;
			}
		},
			undefined,
			this.context.subscriptions
		);

		webviewView.webview.html = this.getHtml(webviewView);
	}

	private sendMessageToWebview(webviewView: vscode.WebviewView, message: any) {
		webviewView.webview.postMessage(message);
	}

	private getHtml(webviewView: vscode.WebviewView): string {
		const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'index.html');
		let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');

		const styleUri = webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'styles.css'));
		const scriptUri = webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'bundle.js'));

		htmlContent = htmlContent.replace('bundle.js', scriptUri.toString());
		htmlContent = htmlContent.replace('styles.css', styleUri.toString());

		return htmlContent;
	}
}
