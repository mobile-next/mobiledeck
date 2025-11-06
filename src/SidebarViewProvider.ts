import * as vscode from 'vscode';
import { MobileCliServer } from './MobileCliServer';
import { HtmlUtils } from './utils/HtmlUtils';
import { OAuthCallbackServer, OAuthTokens } from './OAuthCallbackServer';
import { OAUTH_CONFIG } from './config/oauth';
import { Telemetry } from './utils/Telemetry';

export class SidebarViewProvider implements vscode.WebviewViewProvider {
	private oauthServer: OAuthCallbackServer;
	private webviewView?: vscode.WebviewView;

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly cliServer: MobileCliServer,
		private readonly telemetry: Telemetry
	) {
		this.oauthServer = new OAuthCallbackServer();
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
				vscode.Uri.joinPath(this.context.extensionUri, 'assets')
			]
		};

		// check if user is already authenticated
		const isAuthenticated = await this.isUserAuthenticated();
		const page = isAuthenticated ? 'sidebar' : 'login';
		webviewView.webview.html = this.getHtml(webviewView.webview, page);

		// handle messages from the webview
		webviewView.webview.onDidReceiveMessage(async (message) => {
			console.log('sidebar received message:', message);

			switch (message.command) {
				case 'onInitialized':
					console.log('sidebar webview initialized');
					// send server port and email to webview
					const email = await this.context.secrets.get('mobiledeck.oauth.email');
					webviewView.webview.postMessage({
						command: 'configure',
						serverPort: this.cliServer.getJsonRpcServerPort(),
						email: email || '',
					});
					break;

				case 'deviceClicked':
					console.log('device clicked:', message.device);
					// open a new tab with the device
					vscode.commands.executeCommand('mobiledeck.openDevicePanel', message.device);
					break;

				case 'openOAuthLogin':
					// start oauth server and open browser with dynamic redirect uri
					this.telemetry.sendEvent('login_clicked', {
						Provider: message.provider.toLowerCase()
					});

					await this.handleOAuthLogin(message.provider, webviewView);
					break;

				case 'skipLogin':
					console.log('user skipped login, switching to sidebar');
					// set authentication context so logout button and menu appear
					await vscode.commands.executeCommand('setContext', 'mobiledeck.isAuthenticated', true);
					await this.switchToDeviceList();
					break;

				case 'signOut':
					console.log('sign out requested from webview');
					await vscode.commands.executeCommand('mobiledeck.signOut');
					break;

				case 'alert':
					vscode.window.showInformationMessage(message.text);
					break;
			}
		});
	}

	private getHtml(webview: vscode.Webview, page: string): string {
		return HtmlUtils.getHtml(this.context, webview, page);
	}

	private async handleOAuthLogin(provider: string, webviewView: vscode.WebviewView): Promise<void> {
		try {
			// start the oauth callback server
			const port = await this.oauthServer.start();
			console.log(`oauth server started on port ${port}`);

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
				console.log('tokens received, storing and switching view');
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
			console.error('failed to start oauth server:', error);
			vscode.window.showErrorMessage('Failed to start OAuth login process');
		}
	}

	private buildOAuthUrl(provider: string, port: number): string {
		// generate random state for csrf protection
		const csrfState = OAuthCallbackServer.generateState();
		this.oauthServer.setStoredState(csrfState);

		// use the dynamic port for the redirect uri and include the csrf state
		const state = btoa(JSON.stringify({
			redirectUri: `http://localhost:${port}/oauth/callback`,
			csrf: csrfState,
		}));

		// construct the oauth url with identity provider
		const params = new URLSearchParams({
			identity_provider: provider,
			redirect_uri: OAUTH_CONFIG.redirect_uri,
			response_type: OAUTH_CONFIG.response_type,
			client_id: OAUTH_CONFIG.client_id,
			scope: OAUTH_CONFIG.scope,
			state: state,
			prompt: 'select_account',
		});

		return `${OAUTH_CONFIG.cognito_domain}/oauth2/authorize?${params.toString()}`;
	}

	// store tokens in secure storage
	private async storeTokens(tokens: OAuthTokens, email: string): Promise<void> {
		try {
			await this.context.secrets.store('mobiledeck.oauth.access_token', tokens.access_token);
			await this.context.secrets.store('mobiledeck.oauth.id_token', tokens.id_token);
			if (tokens.refresh_token) {
				await this.context.secrets.store('mobiledeck.oauth.refresh_token', tokens.refresh_token);
			}

			// store token expiry time
			const expiresAt = Date.now() + (tokens.expires_in * 1000);
			await this.context.secrets.store('mobiledeck.oauth.expires_at', expiresAt.toString());
			// store email address
			if (email) {
				await this.context.secrets.store('mobiledeck.oauth.email', email);
			}

			console.log('tokens stored successfully');

			// update authentication context to show sign out button
			await vscode.commands.executeCommand('setContext', 'mobiledeck.isAuthenticated', true);
		} catch (error) {
			console.error('failed to store tokens:', error);
			throw error;
		}
	}

	// refresh access token using refresh token
	private async refreshAccessToken(): Promise<boolean> {
		try {
			const refreshToken = await this.context.secrets.get('mobiledeck.oauth.refresh_token');
			if (!refreshToken) {
				console.log('no refresh token available');
				return false;
			}

			console.log('attempting to refresh access token');

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
				console.error('token refresh failed:', response.status, errorText);
				return false;
			}

			const tokens = await response.json() as OAuthTokens;

			// get stored email to pass to storeTokens
			const email = await this.context.secrets.get('mobiledeck.oauth.email') || '';

			await this.storeTokens(tokens, email);
			console.log('access token refreshed successfully');

			return true;
		} catch (error) {
			console.error('error refreshing access token:', error);
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
				console.log('token expired, attempting refresh');
				return await this.refreshAccessToken();
			}

			const bufferTime = 5 * 60 * 1000; // 5 minutes
			if (now >= (expiryTime - bufferTime)) {
				console.log('token expiring soon, attempting refresh');
				// attempt refresh, without checking for errors. our token
				// is still valid for a bit.
				await this.refreshAccessToken();
			}

			return true;
		} catch (error) {
			console.error('error checking auth state:', error);
			return false;
		}
	}

	// switch the webview to device list
	private async switchToDeviceList(): Promise<void> {
		if (!this.webviewView) {
			console.error('webview not available');
			return;
		}

		console.log('switching to device list view');
		this.webviewView.webview.html = this.getHtml(this.webviewView.webview, 'sidebar');
	}

	// public method to show login page (called from extension when signing out)
	public showLoginPage(): void {
		if (!this.webviewView) {
			console.error('webview not available');
			return;
		}

		console.log('showing login page');
		this.webviewView.webview.html = this.getHtml(this.webviewView.webview, 'login');
	}

	// public method to refresh devices (called from extension when refresh command is triggered)
	public refreshDevices(): void {
		if (!this.webviewView) {
			console.error('webview not available');
			return;
		}

		console.log('refreshing devices');
		this.webviewView.webview.postMessage({
			command: 'refreshDevices'
		});
	}

	// update sign out button title with email
	private async updateSignOutButtonTitle(email: string): Promise<void> {
		try {
			await vscode.commands.executeCommand('setContext', 'mobiledeck.userEmail', email);
		} catch (error) {
			console.error('failed to update sign out button title:', error);
		}
	}
}
