import * as vscode from 'vscode';
import * as crypto from 'node:crypto';
import { DeviceDescriptor } from '@shared/models';
import { DeviceViewProvider } from './DeviceViewProvider';
import { MobileCliServer } from './MobileCliServer';
import { SidebarViewProvider } from './SidebarViewProvider';
import { Telemetry } from './utils/Telemetry';
import { Logger } from './utils/Logger';
import { AuthenticationManager } from './AuthenticationManager';

const SIDEBAR_VIEW_ID = 'mobiledeckDevices';

class DevicePanelManager {
	private devicePanels: Map<string, vscode.WebviewPanel> = new Map();

	public get(deviceId: string): vscode.WebviewPanel | undefined {
		return this.devicePanels.get(deviceId);
	}

	public set(deviceId: string, panel: vscode.WebviewPanel) {
		this.devicePanels.set(deviceId, panel);
	}

	public delete(deviceId: string) {
		this.devicePanels.delete(deviceId);
	}

	public ids(): Array<string> {
		return Array.from(this.devicePanels.keys());
	}
}

class MobiledeckExtension {
	private cliServer: MobileCliServer | null = null;
	private sidebarProvider: SidebarViewProvider | null = null;
	private telemetry: Telemetry = new Telemetry('');
	private logger: Logger = new Logger('Mobiledeck');
	private devicePanelManager = new DevicePanelManager();
	private authenticationManager = new AuthenticationManager();

	private onConnect(context: vscode.ExtensionContext, device: DeviceDescriptor) {
		this.logger.log('mobiledeck.connect command executed for device: ' + device.id);
		if (device) {
			this.telemetry.sendEvent('connect_to_local_device', {
				DeviceType: device.type,
				DevicePlatform: device.platform,
			});

			const viewProvider = new DeviceViewProvider(context, device, this.cliServer!, this.telemetry);
			viewProvider.createWebviewPanel(device);
		}
	}

	private onOpenDevicePanel(context: vscode.ExtensionContext, device: DeviceDescriptor) {
		this.logger.log('mobiledeck.openDevicePanel command executed for device: ' + device.id);
		if (device) {
			// check if a panel for this device already exists
			const existingPanel = this.devicePanelManager.get(device.id);
			if (existingPanel) {
				this.logger.log('panel already exists for device: ' + device.id + ', revealing it');
				existingPanel.reveal();
				return;
			}

			this.telemetry.sendEvent('connect_to_local_device', {
				DeviceType: device.type,
				DevicePlatform: device.platform,
			});

			const viewProvider = new DeviceViewProvider(context, device, this.cliServer!, this.telemetry);
			const panel = viewProvider.createWebviewPanel(device);

			// track the panel
			this.devicePanelManager.set(device.id, panel);

			// notify sidebar that device is now connected
			this.updateSidebarConnectedDevices();

			// listen for panel disposal (when user closes the tab)
			panel.onDidDispose(() => {
				this.logger.log('panel disposed for device: ' + device.id);
				this.devicePanelManager.delete(device.id);
				// notify sidebar that device is now available again
				this.updateSidebarConnectedDevices();
			});
		}
	}

	private onRefreshDevices(_context: vscode.ExtensionContext) {
		this.logger.log('mobiledeck.refreshDevices command executed');
		this.telemetry.sendEvent('refresh_devices_clicked');

		// send message to sidebar to refresh devices
		if (this.sidebarProvider) {
			this.sidebarProvider.refreshDevices();
		}
	}

	private onCloseDevicePanel(context: vscode.ExtensionContext, deviceId: string) {
		this.logger.log('mobiledeck.closeDevicePanel command executed for device: ' + deviceId);
		const panel = this.devicePanelManager.get(deviceId);
		if (panel) {
			panel.dispose();
		}
	}

	private updateSidebarConnectedDevices() {
		if (this.sidebarProvider) {
			const connectedDeviceIds = this.devicePanelManager.ids();
			this.logger.log('updating sidebar with connected devices: ' + JSON.stringify(connectedDeviceIds));
			this.sidebarProvider.updateConnectedDevices(connectedDeviceIds);
		}
	}

	private broadcastDevicesToPanels(devices: DeviceDescriptor[]) {
		this.devicePanelManager.ids().forEach(deviceId => {
			const panel = this.devicePanelManager.get(deviceId);
			if (panel) {
				panel.webview.postMessage({
					command: 'deviceListUpdated',
					devices: devices
				});
			}
		});
	}

	private onDocumentation() {
		this.logger.log('mobiledeck.documentation command executed');
		this.telemetry.sendEvent('documentation_opened');
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/mobile-next/mobiledeck/wiki'));
	}

	private onSendFeedback() {
		if (this.sidebarProvider) {
			this.sidebarProvider.onSendFeedback();
		}
	}

	private async onSignOut(context: vscode.ExtensionContext) {
		this.logger.log('mobiledeck.signOut command executed');

		this.telemetry.sendEvent('signed_out');

		await this.authenticationManager.clear(context);

		// update context to hide the sign out button
		await vscode.commands.executeCommand('setContext', 'mobiledeck.isAuthenticated', false);

		// notify sidebar to show login page
		if (this.sidebarProvider) {
			this.sidebarProvider.showLoginPage();
		}

		vscode.window.showInformationMessage('Successfully signed out');
	}

	public async activate(context: vscode.ExtensionContext) {
		this.logger.log('Mobiledeck extension is being activated');

		// get or create distinct_id from secrets
		let distinctId = await context.secrets.get('mobiledeck.telemetry.distinct_id');
		if (!distinctId) {
			distinctId = crypto.randomUUID();
			await context.secrets.store('mobiledeck.telemetry.distinct_id', distinctId);
		}

		this.telemetry = new Telemetry(distinctId);

		this.cliServer = new MobileCliServer(context, this.telemetry);
		await this.cliServer.launchMobilecliServer()
			.catch(error => {
				this.logger.log('failed to launch mobilecli server: ' + error.message);
				this.telemetry.sendEvent('mobilecli_server_start_failed', {
					Error: error.message || 'unknown error'
				});

				vscode.window.showErrorMessage('Failed to start mobilecli server');
			});

		// register the sidebar webview provider
		this.sidebarProvider = new SidebarViewProvider(
			context,
			this.cliServer,
			this.telemetry,
			(devices) => this.broadcastDevicesToPanels(devices)
		);
		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider(SIDEBAR_VIEW_ID, this.sidebarProvider)
		);

		// set initial authentication context
		await this.updateAuthenticationContext(context);

		// update sign out button title with email if authenticated
		const email = await context.secrets.get('mobiledeck.oauth.email');
		if (email) {
			await vscode.commands.executeCommand('setContext', 'mobiledeck.userEmail', email);
		}

		// menu commands
		this.registerCommand(context, 'mobiledeck.documentation', () => this.onDocumentation());
		this.registerCommand(context, 'mobiledeck.sendFeedback', () => this.onSendFeedback());
		this.registerCommand(context, 'mobiledeck.signOut', () => this.onSignOut(context));
		this.registerCommand(context, 'mobiledeck.refreshDevices', () => this.onRefreshDevices(context));
		this.registerCommand(context, 'mobiledeck.connect', (device) => this.onConnect(context, device));
		this.registerCommand(context, 'mobiledeck.openDevicePanel', (device) => this.onOpenDevicePanel(context, device));
		this.registerCommand(context, 'mobiledeck.closeDevicePanel', (deviceId) => this.onCloseDevicePanel(context, deviceId));

		this.telemetry.sendEvent('panel_activated', {
			IsLoggedIn: !!email
		});

		this.logger.log('Mobiledeck extension activated successfully');
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
		this.logger.log('Mobiledeck extension deactivated');

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
