import * as vscode from 'vscode';
import { MobiledeckViewProvider } from './MobiledeckViewProvider';

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
