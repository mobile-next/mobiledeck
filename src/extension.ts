import * as vscode from 'vscode';
import { DeviceTreeProvider } from './DeviceTreeProvider';
import { DeviceDescriptor } from './DeviceDescriptor';
import { DeviceNode } from './DeviceNode';
import { MobiledeckViewProvider } from './MobiledeckViewProvider';
import { MobileCliServer } from './MobileCliServer';

let cliServer: MobileCliServer | null;

export function activate(context: vscode.ExtensionContext) {
	console.log('Mobiledeck extension is being activated');

	// Create the device tree provider
	const deviceTreeProvider = new DeviceTreeProvider(context);

	cliServer = new MobileCliServer(context);
	cliServer.launchMobilecliServer().then();
	
	// Register the tree view
	const treeView = vscode.window.createTreeView('mobiledeckDevices', {
		treeDataProvider: deviceTreeProvider,
		showCollapseAll: false
	});

	// Initial refresh to load devices
	deviceTreeProvider.refresh();

	// Register refresh command
	const refreshCommand = vscode.commands.registerCommand('mobiledeck.refresh', () => {
		console.log('mobiledeck.refresh command executed');
		deviceTreeProvider.refresh();
		vscode.window.showInformationMessage('Device list refreshed');
	});

	// Register add device command
	const addDeviceCommand = vscode.commands.registerCommand('mobiledeck.addDevice', async () => {
		console.log('mobiledeck.addDevice command executed');
		vscode.window.showInformationMessage('Add Device functionality will be implemented in a future version');
	});

	// Register connect command
	const connectCommand = vscode.commands.registerCommand('mobiledeck.connect', (device: DeviceDescriptor) => {
		console.log('mobiledeck.connect command executed for device:', device.id);
		if (device) {
			const viewProvider = new MobiledeckViewProvider(context, device, cliServer!);
			viewProvider.createWebviewPanel(device);
		}
	});

	// Register open device panel command
	const openDevicePanelCommand = vscode.commands.registerCommand('mobiledeck.openDevicePanel', (device: DeviceDescriptor) => {
		console.log('mobiledeck.openDevicePanel command executed');
		if (device) {
			const viewProvider = new MobiledeckViewProvider(context, device, cliServer!);
			viewProvider.createWebviewPanel(device);
		}
	});

	context.subscriptions.push(
		treeView,
		refreshCommand,
		addDeviceCommand,
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
