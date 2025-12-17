import * as vscode from 'vscode';
import { MobileCliServer } from '../services/mobilecli/MobileCliServer';
import { HtmlUtils } from '../utils/HtmlUtils';
import { OAuthCallbackServer, OAuthTokens, OAuthStateParams } from '../services/auth/OAuthCallbackServer';
import { OAUTH_CONFIG } from '../config/oauth';
import { Telemetry } from '../services/telemetry/Telemetry';
import { Logger } from '../services/logger/Logger';
import { ExtensionUtils } from '../utils/ExtensionUtils';
import { AuthenticationManager } from '../services/auth/AuthenticationManager';
import * as os from 'node:os';
import { AgentFactory } from '../services/mcp-integrations/AgentFactory';

export class SidebarViewProvider implements vscode.WebviewViewProvider {
	private oauthServer: OAuthCallbackServer;
	private webviewView?: vscode.WebviewView;
	private logger: Logger = new Logger('SidebarViewProvider');
	private onDevicesUpdatedCallback?: (devices: any[]) => void;

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly cliServer: MobileCliServer,
		private readonly telemetry: Telemetry,
		onDevicesUpdated?: (devices: any[]) => void
	) {
		this.oauthServer = new OAuthCallbackServer();
		this.onDevicesUpdatedCallback = onDevicesUpdated;
	}

	async resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	): Promise<void> {
		this.webviewView = webviewView;
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(this.context.extensionUri, 'dist')
			]
		};

		// check if user is already authenticated
		const isAuthenticated = await this.isUserAuthenticated();
		const page = isAuthenticated ? 'sidebar' : 'login';
		webviewView.webview.html = this.getHtml(webviewView.webview, page);

		// handle messages from the webview
		webviewView.webview.onDidReceiveMessage(async (message) => {
			// this.logger.log('sidebar received message: ' + message.command);

			switch (message.command) {
				case 'onInitialized':
					this.logger.log('sidebar webview initialized');
					// send server port and email to webview
					const email = await this.context.secrets.get('mobiledeck.oauth.email');
					const gettingStartedDismissed = this.context.globalState.get('mobiledeck.gettingStartedDismissed', false);
					webviewView.webview.postMessage({
						command: 'configure',
						serverPort: this.cliServer.getJsonRpcServerPort(),
						email: email || '',
						gettingStartedDismissed: gettingStartedDismissed,
						agentStatuses: this.getAgentStatuses(),
					});
					break;

				case 'deviceClicked':
					this.logger.log('device clicked: ' + message.device.id);
					// open a new tab with the device
					vscode.commands.executeCommand('mobiledeck.openDevicePanel', message.device);
					break;

				case 'closeDeviceTab':
					this.logger.log('close device tab requested: ' + message.deviceId);
					vscode.commands.executeCommand('mobiledeck.closeDevicePanel', message.deviceId);
					break;

				case 'openGettingStarted':
					this.logger.log('opening getting started guide');
					this.telemetry.sendEvent('getting_started_clicked', {});
					vscode.env.openExternal(vscode.Uri.parse('https://github.com/mobile-next/mobiledeck/wiki'));
					break;

				case 'dismissGettingStarted':
					this.logger.log('dismissing getting started banner');
					await this.context.globalState.update('mobiledeck.gettingStartedDismissed', true);
					this.telemetry.sendEvent('getting_started_dismissed', {});
					// notify webview to hide the banner
					webviewView.webview.postMessage({
						command: 'configure',
						gettingStartedDismissed: true,
					});
					break;

				case 'openEmailLogin':
					this.logger.log('email login requested from webview');
					await this.handleEmailLogin(webviewView);
					break;

				case 'openOAuthLogin':
					// start oauth server and open browser with dynamic redirect uri
					this.telemetry.sendEvent('login_clicked', {
						Provider: message.provider.toLowerCase()
					});

					await this.handleOAuthLogin(message.provider, webviewView);
					break;

				case 'skipLogin':
					this.logger.log('user skipped login, switching to sidebar');
					// set authentication context so logout button and menu appear
					await vscode.commands.executeCommand('setContext', 'mobiledeck.isAuthenticated', true);
					await this.switchToDeviceList();
					break;

				case 'signOut':
					this.logger.log('sign out requested from webview');
					await vscode.commands.executeCommand('mobiledeck.signOut');
					break;

				case 'devicesUpdated':
					if (this.onDevicesUpdatedCallback) {
						this.onDevicesUpdatedCallback(message.devices);
					}
					break;

				case 'configureAgentMcp':
					this.logger.log(`configure agent MCP requested for: ${message.agentName}`);
					await this.handleConfigureAgentMcp(message.agentName, webviewView);
					break;

				case 'alert':
					vscode.window.showInformationMessage(message.text);
					break;
			}
		});
	}

	private getAgentStatuses() {
		const homeDir = os.homedir();
		const currentPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();

		const agentKeys = AgentFactory.getAllKeys();

		return agentKeys.map((name) => {
			try {
				const instance = AgentFactory.createAgent(name, homeDir, currentPath);
				const isInstalled = instance.isAgentInstalled();
				const isConfigured = isInstalled ? instance.isMcpConfigured() : false;
				return { name, isInstalled, isConfigured };
			} catch (e) {
				this.logger.log(`error checking agent status for ${name}: ${e}`);
				return { name, isInstalled: false, isConfigured: false };
			}
		});
	}

	private getHtml(webview: vscode.Webview, page: string): string {
		return HtmlUtils.getHtml(this.context, webview, page);
	}

	private async storeTokens(tokens: OAuthTokens, email: string) {
		const manager = new AuthenticationManager();
		await manager.storeTokens(this.context, tokens, email);
	}

	private async handleEmailLogin(_webviewView: vscode.WebviewView): Promise<void> {
		this.logger.log('email login requested from webview');
		vscode.window.showErrorMessage('Email login is not implemented yet');
	}

	private async handleConfigureAgentMcp(agentName: string, webviewView: vscode.WebviewView): Promise<void> {
		try {
			const homeDir = os.homedir();
			const currentPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();

			// Get the agent instance using the factory
			const agent = AgentFactory.createAgent(agentName, homeDir, currentPath);

			// Configure the MCP for this agent
			this.logger.log(`configuring MCP for agent: ${agentName}`);
			agent.configureMcp();
			this.logger.log(`MCP configuration completed for agent: ${agentName}`);

			// Send updated agent statuses back to webview
			webviewView.webview.postMessage({
				command: 'configure',
				agentStatuses: this.getAgentStatuses()
			});

			// Show success message
			vscode.window.showInformationMessage(`Mobile MCP configured successfully for ${agentName}`);
		} catch (error) {
			this.logger.log(`error configuring agent MCP for ${agentName}: ${error instanceof Error ? error.message : String(error)}`);
			vscode.window.showErrorMessage(`Failed to configure Mobile MCP for ${agentName}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private async handleOAuthLogin(provider: string, webviewView: vscode.WebviewView): Promise<void> {
		try {
			// start the oauth callback server
			const port = await this.oauthServer.start();
			this.logger.log('oauth server started on port ' + port);

			// set up callback for when auth code is received
			this.oauthServer.onAuthCodeReceived = (code: string) => {
				// send the code to the webview for further processing
				webviewView.webview.postMessage({
					command: 'authCodeReceived',
					code: code,
				});
			};

			// set up callback for when tokens are received
			this.oauthServer.onTokensReceived = async (tokens: OAuthTokens, email: string) => {
				this.logger.log('tokens received, storing and switching view');
				await this.storeTokens(tokens, email);

				// update sign out button title with email
				if (email) {
					await this.updateSignOutButtonTitle(email);
				}

				this.telemetry.sendEvent('login_successful', {
					Provider: provider.toLowerCase()
				});

				await this.switchToDeviceList();
			};

			// build oauth url with the dynamic redirect uri
			const authUrl = this.buildOAuthUrl(provider, port);
			vscode.env.openExternal(vscode.Uri.parse(authUrl));
		} catch (error) {
			this.logger.log('failed to start oauth server: ' + (error instanceof Error ? error.message : String(error)));
			vscode.window.showErrorMessage('Failed to start OAuth login process');
		}
	}

	private buildOAuthUrl(provider: string, port: number): string {
		// generate random state for csrf protection
		const csrfState = OAuthCallbackServer.generateState();
		this.oauthServer.setStoredState(csrfState);

		// use the dynamic port for the redirect uri and include the csrf state
		const state: OAuthStateParams = {
			agent: "mobile-deck",
			agentVersion: ExtensionUtils.getExtensionVersion(),
			redirectUri: `http://localhost:${port}/oauth/callback`,
			csrf: csrfState,
		};

		// construct the oauth url with identity provider
		const params = new URLSearchParams({
			identity_provider: provider,
			redirect_uri: OAUTH_CONFIG.redirect_uri,
			response_type: OAUTH_CONFIG.response_type,
			client_id: OAUTH_CONFIG.client_id,
			scope: OAUTH_CONFIG.scope,
			state: btoa(JSON.stringify(state)),
			prompt: 'select_account',
		});

		return `${OAUTH_CONFIG.cognito_domain}/oauth2/authorize?${params.toString()}`;
	}

	// refresh access token using refresh token
	private async refreshAccessToken(): Promise<boolean> {
		try {
			const refreshToken = await this.context.secrets.get('mobiledeck.oauth.refresh_token');
			if (!refreshToken) {
				this.logger.log('no refresh token available');
				return false;
			}

			this.logger.log('attempting to refresh access token');

			const params = new URLSearchParams({
				grant_type: 'refresh_token',
				client_id: OAUTH_CONFIG.client_id,
				refresh_token: refreshToken,
			});

			const response = await fetch(OAUTH_CONFIG.token_endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: params.toString(),
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.logger.log('token refresh failed: ' + response.status + ' ' + errorText);
				return false;
			}

			const tokens = await response.json() as OAuthTokens;

			// get stored email to pass to storeTokens
			const email = await this.context.secrets.get('mobiledeck.oauth.email') || '';

			await this.storeTokens(tokens, email);
			this.logger.log('access token refreshed successfully');

			return true;
		} catch (error) {
			this.logger.log('error refreshing access token: ' + (error instanceof Error ? error.message : String(error)));
			return false;
		}
	}

	// check if user is authenticated
	private async isUserAuthenticated(): Promise<boolean> {
		try {
			const expiresAt = await this.context.secrets.get('mobiledeck.oauth.expires_at');
			const accessToken = await this.context.secrets.get('mobiledeck.oauth.access_token');
			if (!accessToken || !expiresAt) {
				return false;
			}

			// check if token is expired or expiring soon (within 5 minutes)
			const now = Date.now();
			const expiryTime = parseInt(expiresAt, 10);
			if (now >= expiryTime) {
				this.logger.log('token expired, attempting refresh');
				return await this.refreshAccessToken();
			}

			const bufferTime = 5 * 60 * 1000; // 5 minutes
			if (now >= (expiryTime - bufferTime)) {
				this.logger.log('token expiring soon, attempting refresh');
				// attempt refresh, without checking for errors. our token
				// is still valid for a bit.
				await this.refreshAccessToken();
			}

			return true;
		} catch (error) {
			this.logger.log('error checking auth state: ' + (error instanceof Error ? error.message : String(error)));
			return false;
		}
	}

	private setHtml(page: string) {
		if (!this.webviewView) {
			this.logger.log('webview not available');
			return;
		}

		this.webviewView.webview.html = this.getHtml(this.webviewView.webview, page);
	}

	// switch the webview to device list
	private switchToDeviceList() {
		this.setHtml('sidebar');
		this.logger.log('switching to device list view');
	}

	// public method to show login page (called from extension when signing out)
	public showLoginPage() {
		this.setHtml('login');
		this.logger.log('showing login page');
	}

	// public method to refresh devices (called from extension when refresh command is triggered)
	public refreshDevices(): void {
		if (!this.webviewView) {
			this.logger.log('webview not available');
			return;
		}

		this.logger.log('refreshing devices');
		this.webviewView.webview.postMessage({
			command: 'refreshDevices'
		});
	}

	// public method to update connected devices (called from extension when device tabs open/close)
	public updateConnectedDevices(connectedDeviceIds: string[]): void {
		if (!this.webviewView) {
			this.logger.log('webview not available');
			return;
		}

		this.logger.log('updating connected devices: ' + JSON.stringify(connectedDeviceIds));
		this.webviewView.webview.postMessage({
			command: 'updateConnectedDevices',
			connectedDeviceIds: connectedDeviceIds
		});
	}

	// public method to update server port (called from extension when server restarts)
	public updateServerPort(serverPort: number): void {
		if (!this.webviewView) {
			this.logger.log('webview not available');
			return;
		}

		this.logger.log('updating server port: ' + serverPort);
		this.webviewView.webview.postMessage({
			command: 'configure',
			serverPort: serverPort
		});
	}

	// update sign out button title with email
	private async updateSignOutButtonTitle(email: string): Promise<void> {
		try {
			await vscode.commands.executeCommand('setContext', 'mobiledeck.userEmail', email);
		} catch (error) {
			this.logger.log('failed to update sign out button title: ' + (error instanceof Error ? error.message : String(error)));
		}
	}

	// show server restart toast
	public showServerRestartToast(): void {
		if (this.webviewView) {
			this.webviewView.webview.postMessage({
				command: 'showToast',
				title: "Notice",
				variant: "destructive",
				message: 'Server stopped responding, attempting restart...'
			});
		}
	}
}
