import * as vscode from 'vscode';
import * as crypto from 'node:crypto';
import { DeviceDescriptor } from '@shared/models';
import { DeviceViewProvider } from './providers/DeviceViewProvider';
import { MobileCliServer } from './services/mobilecli/MobileCliServer';
import { SidebarViewProvider } from './providers/SidebarViewProvider';
import { Telemetry } from './services/telemetry/Telemetry';
import { Logger } from './services/logger/Logger';
import { AuthenticationManager } from './services/auth/AuthenticationManager';
import { DevicePanelManager } from './managers/DevicePanelManager';

const SIDEBAR_VIEW_ID = 'mobiledeckDevices';
const FEEDBACK_FORM_URL = "https://forms.gle/eFb9opGjCCxCyX4s9";

class MobiledeckExtension {
	private cliServer: MobileCliServer | null = null;
	private sidebarProvider: SidebarViewProvider | null = null;
	private telemetry: Telemetry = new Telemetry('');
	private logger: Logger = new Logger('Mobiledeck');
	private devicePanelManager = new DevicePanelManager();
	private authenticationManager = new AuthenticationManager();
	private context: vscode.ExtensionContext | null = null;

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

	private async startCliServer(context: vscode.ExtensionContext) {
		this.cliServer = new MobileCliServer(
			context,
			this.telemetry,
			(exitCode) => this.onCliServerExit(exitCode)
		);

		await this.cliServer.launchMobilecliServer()
			.catch(error => {
				this.logger.log('failed to launch mobilecli server: ' + error.message);
				this.telemetry.sendEvent('mobilecli_server_start_failed', {
					Error: error.message || 'unknown error'
				});

				vscode.window.showErrorMessage('Failed to start mobilecli server');
			});
	}

	private async onCliServerExit(exitCode: number) {
		this.logger.log(`mobilecli server exited with code ${exitCode}, restarting...`);

		// show toast notification
		if (this.sidebarProvider) {
			this.sidebarProvider.showServerRestartToast();
		}

		// restart the server
		if (this.context) {
			await this.startCliServer(this.context);

			// update all open panels with new server port
			this.updateAllPanelsWithNewServer();

			// update sidebar with new server
			if (this.sidebarProvider && this.cliServer) {
				this.sidebarProvider.updateServerPort(this.cliServer.getJsonRpcServerPort());
			}
		}
	}

	private updateAllPanelsWithNewServer() {
		if (!this.cliServer) {
			return;
		}

		const newServerPort = this.cliServer.getJsonRpcServerPort();
		this.logger.log(`updating all panels with new server port: ${newServerPort}`);

		this.devicePanelManager.ids().forEach(deviceId => {
			const panel = this.devicePanelManager.get(deviceId);
			if (panel) {
				panel.webview.postMessage({
					command: 'serverPortUpdated',
					serverPort: newServerPort
				});
			}
		});
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
		this.telemetry.sendEvent('documentation_opened');
		vscode.env.openExternal(vscode.Uri.parse('https://github.com/mobile-next/mobiledeck/wiki'));
	}

	private onSendFeedback() {
		this.telemetry.sendEvent('send_feedback_clicked');
		vscode.env.openExternal(vscode.Uri.parse(FEEDBACK_FORM_URL));
	}

	private async onSignOut(context: vscode.ExtensionContext) {
		this.telemetry.sendEvent('signed_out');

		await this.authenticationManager.clear(context);

		// update context to hide the sign out button
		await vscode.commands.executeCommand('setContext', 'mobiledeck.isAuthenticated', false);

		// notify sidebar to show login page
		if (this.sidebarProvider) {
			this.sidebarProvider.showLoginPage();
		}
	}

	public async activate(context: vscode.ExtensionContext) {
		this.logger.log('Mobiledeck extension is being activated');

		// store context for later use
		this.context = context;

		// get or create distinct_id from secrets
		let distinctId = await context.secrets.get('mobiledeck.telemetry.distinct_id');
		if (!distinctId) {
			distinctId = crypto.randomUUID();
			await context.secrets.store('mobiledeck.telemetry.distinct_id', distinctId);
		}

		this.telemetry = new Telemetry(distinctId);

		await this.startCliServer(context);

		if (!this.cliServer) {
			throw new Error('failed to initialize cli server');
		}

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

		// dispose all webview panels before stopping the server
		const deviceIds = this.devicePanelManager.ids();
		deviceIds.forEach(deviceId => {
			const panel = this.devicePanelManager.get(deviceId);
			if (panel) {
				panel.dispose();
			}
		});
		
		// clear the manager state after disposal
		deviceIds.forEach(deviceId => {
			this.devicePanelManager.delete(deviceId);
		});

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
