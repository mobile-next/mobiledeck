import * as vscode from 'vscode';
import { DeviceDescriptor } from './DeviceDescriptor';
import { MobiledeckViewProvider } from './MobiledeckViewProvider';
import { MobileCliServer } from './MobileCliServer';
import { SidebarViewProvider } from './SidebarViewProvider';

let cliServer: MobileCliServer | null;

export function activate(context: vscode.ExtensionContext) {
	console.log('Mobiledeck extension is being activated');

	cliServer = new MobileCliServer(context);
	cliServer.launchMobilecliServer().then();

	// register the sidebar webview provider
	const sidebarProvider = new SidebarViewProvider(context, cliServer);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('mobiledeckDevices', sidebarProvider)
	);

	// register connect command
	const connectCommand = vscode.commands.registerCommand('mobiledeck.connect', (device: DeviceDescriptor) => {
		console.log('mobiledeck.connect command executed for device:', device.id);
		if (device) {
			const viewProvider = new MobiledeckViewProvider(context, device, cliServer!);
			viewProvider.createWebviewPanel(device);
		}
	});

	// register open device panel command
	const openDevicePanelCommand = vscode.commands.registerCommand('mobiledeck.openDevicePanel', (device: DeviceDescriptor) => {
		console.log('mobiledeck.openDevicePanel command executed');
		if (device) {
			const viewProvider = new MobiledeckViewProvider(context, device, cliServer!);
			viewProvider.createWebviewPanel(device);
		}
	});

	context.subscriptions.push(
		connectCommand,
		openDevicePanelCommand
	);

	console.log('Mobiledeck extension activated successfully');
}

export function deactivate() {
	console.log('Mobiledeck extension deactivated');

	if (cliServer) {
		cliServer.stopMobilecliServer();
		cliServer = null;
	}
}
