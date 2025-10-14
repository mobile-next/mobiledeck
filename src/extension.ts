import * as vscode from 'vscode';
import { DeviceDescriptor } from './DeviceDescriptor';
import { MobiledeckViewProvider } from './MobiledeckViewProvider';
import { MobileCliServer } from './MobileCliServer';
import { SidebarViewProvider } from './SidebarViewProvider';

class MobiledeckExtension {
	private cliServer: MobileCliServer | null = null;

	private onConnect(context: vscode.ExtensionContext, device: DeviceDescriptor) {
		console.log('mobiledeck.connect command executed for device:', device.id);
		if (device) {
			const viewProvider = new MobiledeckViewProvider(context, device, this.cliServer!);
			viewProvider.createWebviewPanel(device);
		}
	}

	private onOpenDevicePanel(context: vscode.ExtensionContext, device: DeviceDescriptor) {
		console.log('mobiledeck.openDevicePanel command executed for device:', device.id);
		if (device) {
			const viewProvider = new MobiledeckViewProvider(context, device, this.cliServer!);
			viewProvider.createWebviewPanel(device);
		}
	}

	public activate(context: vscode.ExtensionContext) {
		console.log('Mobiledeck extension is being activated');

		this.cliServer = new MobileCliServer(context);
		this.cliServer.launchMobilecliServer().then();

		// register the sidebar webview provider
		const sidebarProvider = new SidebarViewProvider(context, this.cliServer);
		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider('mobiledeckDevices', sidebarProvider)
		);

		const connectCommand = vscode.commands.registerCommand('mobiledeck.connect', (device) => this.onConnect(context, device));
		const openDevicePanelCommand = vscode.commands.registerCommand('mobiledeck.openDevicePanel', (device) => this.onOpenDevicePanel(context, device));
		context.subscriptions.push(connectCommand, openDevicePanelCommand);

		console.log('Mobiledeck extension activated successfully');
	}

	public deactivate() {
		console.log('Mobiledeck extension deactivated');

		if (this.cliServer) {
			this.cliServer.stopMobilecliServer();
			this.cliServer = null;
		}
	}
}

const extension = new MobiledeckExtension();

export function activate(context: vscode.ExtensionContext) {
	extension.activate(context);
}

export function deactivate() {
	extension.deactivate();
}
