import * as vscode from 'vscode';
import * as crypto from 'node:crypto';
import { DeviceDescriptor } from './DeviceDescriptor';
import { DeviceViewProvider } from './DeviceViewProvider';
import { MobileCliServer } from './MobileCliServer';
import { SidebarViewProvider } from './SidebarViewProvider';
import { Telemetry } from './utils/Telemetry';

class MobiledeckExtension {
	private cliServer: MobileCliServer | null = null;
	private sidebarProvider: SidebarViewProvider | null = null;
	private telemetry: Telemetry = new Telemetry('');

	private onConnect(context: vscode.ExtensionContext, device: DeviceDescriptor) {
		console.log('mobiledeck.connect command executed for device:', device.id);
		if (device) {
			this.telemetry.sendEvent('connect_to_local_device', {
				DeviceType: device.type,
				DevicePlatform: device.platform,
			});

			const viewProvider = new DeviceViewProvider(context, device, this.cliServer!);
			viewProvider.createWebviewPanel(device);
		}
	}

	private onOpenDevicePanel(context: vscode.ExtensionContext, device: DeviceDescriptor) {
		console.log('mobiledeck.openDevicePanel command executed for device:', device.id);
		if (device) {
			this.telemetry.sendEvent('connect_to_local_device', {
				DeviceType: device.type,
				DevicePlatform: device.platform,
			});

			const viewProvider = new DeviceViewProvider(context, device, this.cliServer!);
			viewProvider.createWebviewPanel(device);
		}
	}

	private onRefreshDevices() {
		console.log('mobiledeck.refreshDevices command executed');
		this.telemetry.sendEvent('refresh_devices_clicked');
		// send message to sidebar to refresh devices
		if (this.sidebarProvider) {
			this.sidebarProvider.refreshDevices();
		}
	}

	private onAddDevice() {
		console.log('mobiledeck.addDevice command executed');
		this.telemetry.sendEvent('add_device_clicked');

		// TODO: implement add device functionality
		vscode.window.showInformationMessage('Add device functionality coming soon');
	}

	private async onSignOut(context: vscode.ExtensionContext) {
		console.log('mobiledeck.signOut command executed');

		this.telemetry.sendEvent('signed_out');

		// clear all stored tokens
		const keys = [
			'mobiledeck.oauth.access_token',
			'mobiledeck.oauth.id_token',
			'mobiledeck.oauth.refresh_token',
			'mobiledeck.oauth.expires_at',
			'mobiledeck.oauth.email'
		];

		for (const key of keys) {
			await context.secrets.delete(key);
		}

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

		// get or create distinct_id from secrets
		let distinctId = await context.secrets.get('mobiledeck.telemetry.distinct_id');
		if (!distinctId) {
			distinctId = crypto.randomUUID();
			await context.secrets.store('mobiledeck.telemetry.distinct_id', distinctId);
		}

		this.telemetry = new Telemetry(distinctId);

		this.cliServer = new MobileCliServer(context);
		this.cliServer.launchMobilecliServer()
			.catch(error => {
				console.error('failed to launch mobilecli server:', error);
				this.telemetry.sendEvent('mobilecli_server_start_failed', {
					Error: error.message || 'unknown error'
				});

				vscode.window.showErrorMessage('Failed to start Mobiledeck server');
			});

		// register the sidebar webview provider
		this.sidebarProvider = new SidebarViewProvider(context, this.cliServer, this.telemetry);
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

		// menu commands
		this.registerCommand(context, 'mobiledeck.signOut', () => this.onSignOut(context));
		this.registerCommand(context, 'mobiledeck.addDevice', () => this.onAddDevice());
		this.registerCommand(context, 'mobiledeck.refreshDevices', () => this.onRefreshDevices());

		this.registerCommand(context, 'mobiledeck.connect', (device) => this.onConnect(context, device));
		this.registerCommand(context, 'mobiledeck.openDevicePanel', (device) => this.onOpenDevicePanel(context, device));

		this.telemetry.sendEvent('panel_activated', {
			IsLoggedIn: !!email
		});

		console.log('Mobiledeck extension activated successfully');
	}

	private async updateAuthenticationContext(context: vscode.ExtensionContext) {
		// check if user is authenticated by checking for access token
		const accessToken = await context.secrets.get('mobiledeck.oauth.access_token');
		const expiresAt = await context.secrets.get('mobiledeck.oauth.expires_at');

		const isAuthenticated = !!(accessToken && expiresAt && Date.now() < parseInt(expiresAt, 10));
		await vscode.commands.executeCommand('setContext', 'mobiledeck.isAuthenticated', isAuthenticated);
	}

	private registerCommand(context: vscode.ExtensionContext, command: string, callback: (...args: any[]) => void) {
		const disposable = vscode.commands.registerCommand(command, callback);
		context.subscriptions.push(disposable);
	}

	public async deactivate() {
		console.log('Mobiledeck extension deactivated');

		await this.telemetry.sendEvent('panel_deactivated');
		await this.telemetry.flush();

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
	return extension.deactivate();
}
