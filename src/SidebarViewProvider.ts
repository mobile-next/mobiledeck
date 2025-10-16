import * as vscode from 'vscode';
import { MobileCliServer } from './MobileCliServer';
import { HtmlUtils } from './utils/HtmlUtils';
import { OAuthCallbackServer } from './OAuthCallbackServer';

export class SidebarViewProvider implements vscode.WebviewViewProvider {
	private oauthServer: OAuthCallbackServer;

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly cliServer: MobileCliServer
	) {
		this.oauthServer = new OAuthCallbackServer();
	}

	resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		token: vscode.CancellationToken
	): void | Thenable<void> {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(this.context.extensionUri, 'assets')
			]
		};

		webviewView.webview.html = this.getHtml(webviewView.webview, 'login');

		// handle messages from the webview
		webviewView.webview.onDidReceiveMessage(async (message) => {
			console.log('sidebar received message:', message);

			switch (message.command) {
				case 'onInitialized':
					console.log('sidebar webview initialized');
					// send server port to webview
					webviewView.webview.postMessage({
						command: 'configure',
						serverPort: this.cliServer.getJsonRpcServerPort(),
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
		const redirectUri = "http://localhost/oauth/callback";
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
		});

		return `${cognitoDomain}/oauth2/authorize?${params.toString()}`;
	}
}
