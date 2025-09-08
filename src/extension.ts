import * as vscode from 'vscode';
import { DeviceTreeProvider, DeviceDescriptor, DeviceNode } from './DeviceTreeProvider';
import { MobiledeckViewProvider } from './MobiledeckViewProvider';
import { MobileCliServer } from './MobileCliServer';

export function activate(context: vscode.ExtensionContext) {
	console.log('Mobiledeck extension is being activated');

	// Create the device tree provider
	const deviceTreeProvider = new DeviceTreeProvider(context);

	const cliServer = new MobileCliServer(context);
	cliServer.launchMobilecliServer().then();
	
	// Register the tree view
	const treeView = vscode.window.createTreeView('mobiledeckDevices', {
		treeDataProvider: deviceTreeProvider,
		showCollapseAll: false
	});

	// Handle tree view item selection (double-click)
	treeView.onDidChangeSelection(e => {
		if (e.selection.length > 0) {
			const selectedItem = e.selection[0];
			if (selectedItem instanceof DeviceNode) {
				vscode.commands.executeCommand('mobiledeck.connect', selectedItem.device);
			}
		}
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
			const viewProvider = new MobiledeckViewProvider(context, device, cliServer);
			viewProvider.createWebviewPanel(device);
		}
	});

	// Register open device panel command
	const openDevicePanelCommand = vscode.commands.registerCommand('mobiledeck.openDevicePanel', (device: DeviceDescriptor) => {
		console.log('mobiledeck.openDevicePanel command executed');
		if (device) {
			const viewProvider = new MobiledeckViewProvider(context, device, cliServer);
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
}
