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

	private async handleOAuthCallback(uri: vscode.Uri, context: vscode.ExtensionContext) {
		console.log('oauth callback received:', uri.toString());

		// https://auth.mobilenexthq.com/oauth2/authorize?identity_provider=Google&redirect_uri=vscode://mobilenext.mobiledeck/oauth-callback&response_type=code&client_id=5fuedu10rosgs7l68cup9g3pgv&scope=email+openid

		// parse the callback uri to extract the authorization code
		const query = new URLSearchParams(uri.query);
		const code = query.get('code');
		const error = query.get('error');

		if (error) {
			vscode.window.showErrorMessage(`OAuth login failed: ${error}`);
			return;
		}

		if (code) {
			// store the authorization code in extension context
			await context.secrets.store('mobiledeck.oauth.code', code);
			vscode.window.showInformationMessage('Successfully logged in!');

			const cognitoAuthConfig = {
				authority: "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_yxInzo34K",
				client_id: "5fuedu10rosgs7l68cup9g3pgv",
				redirect_uri: "https://eu-central-1yxinzo34k.auth.eu-central-1.amazoncognito.com/oauth2/authorize",
				response_type: "code",
				scope: "email openid"
			};

			// const userManager = new UserManager({
			// 	...cognitoAuthConfig,
			// });

			// userManager.signinCallback().then(user => {
			// 	console.dir(user);
			// 	vscode.window.showInformationMessage('Successfully logged in callback!' + user?.profile.email);
			// });

			// notify the sidebar to update ui
			if (this.sidebarProvider) {
				// you'll need to add a method to notify the webview
				// this.sidebarProvider.notifyLoginSuccess();
			}
		}
	}

	public activate(context: vscode.ExtensionContext) {
		console.log('Mobiledeck extension is being activated');

		this.cliServer = new MobileCliServer(context);
		this.cliServer.launchMobilecliServer().then();

		// register the sidebar webview provider
		this.sidebarProvider = new SidebarViewProvider(context, this.cliServer);
		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider('mobiledeckDevices', this.sidebarProvider)
		);

		// register uri handler for oauth callback
		context.subscriptions.push(
			vscode.window.registerUriHandler({
				handleUri: async (uri: vscode.Uri) => {
					if (uri.path === '/oauth-callback') {
						await this.handleOAuthCallback(uri, context);
					}
				}
			})
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
