import * as vscode from 'vscode';
import { DeviceDescriptor } from './DeviceDescriptor';
import { MobiledeckViewProvider } from './MobiledeckViewProvider';
import { MobileCliServer } from './MobileCliServer';
import { SidebarViewProvider } from './SidebarViewProvider';

class MobiledeckExtension {
	private cliServer: MobileCliServer | null = null;
	private sidebarProvider: SidebarViewProvider | null = null;

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

	private onRefreshDevices() {
		console.log('mobiledeck.refreshDevices command executed');
		// send message to sidebar to refresh devices
		if (this.sidebarProvider) {
			this.sidebarProvider.refreshDevices();
		}
	}

	private onAddDevice() {
		console.log('mobiledeck.addDevice command executed');
		// TODO: implement add device functionality
		vscode.window.showInformationMessage('Add device functionality coming soon');
	}

	private async onSignOut(context: vscode.ExtensionContext) {
		console.log('mobiledeck.signOut command executed');

		// clear all stored tokens
		await context.secrets.delete('mobiledeck.oauth.access_token');
		await context.secrets.delete('mobiledeck.oauth.id_token');
		await context.secrets.delete('mobiledeck.oauth.refresh_token');
		await context.secrets.delete('mobiledeck.oauth.expires_at');
		await context.secrets.delete('mobiledeck.oauth.email');

		// update context to hide the sign out button
		await vscode.commands.executeCommand('setContext', 'mobiledeck.isAuthenticated', false);

		// notify sidebar to show login page
		if (this.sidebarProvider) {
			this.sidebarProvider.showLoginPage();
		}

		vscode.window.showInformationMessage('Successfully signed out');
	}


	public async activate(context: vscode.ExtensionContext) {
		console.log('Mobiledeck extension is being activated');

		this.cliServer = new MobileCliServer(context);
		this.cliServer.launchMobilecliServer().then();

		// register the sidebar webview provider
		this.sidebarProvider = new SidebarViewProvider(context, this.cliServer);
		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider('mobiledeckDevices', this.sidebarProvider)
		);

		// set initial authentication context
		await this.updateAuthenticationContext(context);

		// update sign out button title with email if authenticated
		const email = await context.secrets.get('mobiledeck.oauth.email');
		if (email) {
			await vscode.commands.executeCommand('setContext', 'mobiledeck.userEmail', email);
		}

		const connectCommand = vscode.commands.registerCommand('mobiledeck.connect', (device) => this.onConnect(context, device));
		const openDevicePanelCommand = vscode.commands.registerCommand('mobiledeck.openDevicePanel', (device) => this.onOpenDevicePanel(context, device));
		const refreshDevicesCommand = vscode.commands.registerCommand('mobiledeck.refreshDevices', () => this.onRefreshDevices());
		const addDeviceCommand = vscode.commands.registerCommand('mobiledeck.addDevice', () => this.onAddDevice());
		const signOutCommand = vscode.commands.registerCommand('mobiledeck.signOut', () => this.onSignOut(context));
		context.subscriptions.push(connectCommand, openDevicePanelCommand, refreshDevicesCommand, addDeviceCommand, signOutCommand);

		console.log('Mobiledeck extension activated successfully');
	}

	private async updateAuthenticationContext(context: vscode.ExtensionContext) {
		// check if user is authenticated by checking for access token
		const accessToken = await context.secrets.get('mobiledeck.oauth.access_token');
		const expiresAt = await context.secrets.get('mobiledeck.oauth.expires_at');

		const isAuthenticated = !!(accessToken && expiresAt && Date.now() < parseInt(expiresAt, 10));
		await vscode.commands.executeCommand('setContext', 'mobiledeck.isAuthenticated', isAuthenticated);
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
