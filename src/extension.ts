import * as vscode from 'vscode';
import * as fs from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import { spawn } from 'child_process';

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
	private outputChannel: vscode.OutputChannel;

	constructor(private readonly context: vscode.ExtensionContext) {
		console.log('MobiledeckViewProvider constructor called');

		this.outputChannel = vscode.window.createOutputChannel('Mobiledeck');
		this.mobilecliPath = this.findMobilecliPath();
	}

	findMobilecliPath(): string {
		const root = vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'mobilecli', 'bin').fsPath;

		let mobilecliPath: string;

		switch (process.platform) {
			case 'darwin':
				mobilecliPath = path.join(root, 'mobilecli-darwin');
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

		this.outputChannel.appendLine("mobilecli path: " + mobilecliPath);

		const text = execFileSync(mobilecliPath, ['--version']).toString();
		this.outputChannel.appendLine("mobilecli version: " + text);

		return mobilecliPath;
	}

	handleMessage(webviewView: vscode.WebviewView, message: any) {
		this.outputChannel.appendLine('Received message: ' + JSON.stringify(message));
		switch (message.command) {
			case 'alert':
				vscode.window.showErrorMessage(message.text);
				break;

			case 'log':
				this.outputChannel.appendLine(message.text);
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
	}

	private sendMessageToWebview(webviewView: vscode.WebviewView, message: any) {
		webviewView.webview.postMessage(message);
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
