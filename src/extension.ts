import * as vscode from 'vscode';
import { MobiledeckViewProvider } from './MobiledeckViewProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('Mobiledeck extension is being activated');

	// Register a command to open the iOS Preview view
	const openViewCommand = vscode.commands.registerCommand('mobiledeck.openPreview', () => {
		console.log('mobiledeck.openPreview command executed');
		const provider = new MobiledeckViewProvider(context);
		provider.createWebviewPanel();
	});

	context.subscriptions.push(openViewCommand);
	console.log('Mobiledeck extension activated successfully');
}

export function deactivate() {
	console.log('Mobiledeck extension deactivated');
}
