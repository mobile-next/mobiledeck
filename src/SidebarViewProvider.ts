import * as vscode from 'vscode';
import { MobileCliServer } from './MobileCliServer';
import { HtmlUtils } from './utils/HtmlUtils';
import { OAuthCallbackServer } from './OAuthCallbackServer';

export class SidebarViewProvider implements vscode.WebviewViewProvider {
	private oauthServer: OAuthCallbackServer;
	private webviewView?: vscode.WebviewView;

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly cliServer: MobileCliServer
	) {
		this.oauthServer = new OAuthCallbackServer();
	}

	async resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		token: vscode.CancellationToken
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
					await this.handleOAuthLogin(message.provider, webviewView);
					break;
				case 'skipLogin':
					console.log('user skipped login, switching to sidebar');
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
				console.log('auth code received:', code);
				// send the code to the webview for further processing
				webviewView.webview.postMessage({
					command: 'authCodeReceived',
					code: code,
				});
			};

			// set up callback for when tokens are received
			this.oauthServer.onTokensReceived = async (tokens: any, email: string) => {
				console.log('tokens received, storing and switching view');
				await this.storeTokens(tokens, email);
				// update sign out button title with email
				if (email) {
					await this.updateSignOutButtonTitle(email);
				}
				await this.switchToDeviceList();
			};

			// build oauth url with the dynamic redirect uri
			const authUrl = this.buildOAuthUrl(provider, port);
			console.log('opening oauth url:', authUrl);

			// open in external browser
			vscode.env.openExternal(vscode.Uri.parse(authUrl));
		} catch (error) {
			console.error('failed to start oauth server:', error);
			vscode.window.showErrorMessage('Failed to start OAuth login process');
		}
	}

	private buildOAuthUrl(provider: string, port: number): string {
		// cognito hosted ui domain
		const cognitoDomain = "https://auth.mobilenexthq.com";
		const clientId = "5fuedu10rosgs7l68cup9g3pgv";
		// use the dynamic port for the redirect uri
		const redirectUri = "https://mobilenexthq.com/oauth/callback/";
		const responseType = "code";
		const scope = "email openid";
		const state = btoa(JSON.stringify({
			redirectUri: `http://localhost:${port}/oauth/callback`,
		}));

		// construct the oauth url with identity provider
		const params = new URLSearchParams({
			identity_provider: provider,
			redirect_uri: redirectUri,
			response_type: responseType,
			client_id: clientId,
			scope: scope,
			state: state,
			prompt: 'select_account',
		});

		return `${cognitoDomain}/oauth2/authorize?${params.toString()}`;
	}

	// store tokens in secure storage
	private async storeTokens(tokens: any, email: string): Promise<void> {
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

	// check if user is authenticated
	private async isUserAuthenticated(): Promise<boolean> {
		try {
			const accessToken = await this.context.secrets.get('mobiledeck.oauth.access_token');
			const expiresAt = await this.context.secrets.get('mobiledeck.oauth.expires_at');

			if (!accessToken || !expiresAt) {
				return false;
			}

			// check if token is expired
			const expiryTime = parseInt(expiresAt, 10);
			if (Date.now() >= expiryTime) {
				console.log('token expired');
				return false;
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

	// update sign out button title with email
	private async updateSignOutButtonTitle(email: string): Promise<void> {
		try {
			await vscode.commands.executeCommand('setContext', 'mobiledeck.userEmail', email);
		} catch (error) {
			console.error('failed to update sign out button title:', error);
		}
	}
}
