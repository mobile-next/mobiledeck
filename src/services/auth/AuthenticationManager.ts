import * as vscode from 'vscode';
import { OAuthTokens } from './OAuthCallbackServer';
import { Logger } from '../../services/logger/Logger';

export class AuthenticationManager {

	private logger = new Logger("AuthenticationManager");

	public async clear(context: vscode.ExtensionContext) {
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
	}

	// store tokens in secure storage
	public async storeTokens(context: vscode.ExtensionContext, tokens: OAuthTokens, email: string): Promise<void> {
		try {
			await context.secrets.store('mobiledeck.oauth.access_token', tokens.access_token);
			await context.secrets.store('mobiledeck.oauth.id_token', tokens.id_token);

			if (tokens.refresh_token) {
				await context.secrets.store('mobiledeck.oauth.refresh_token', tokens.refresh_token);
			}

			// store token expiry time
			const expiresAt = Date.now() + (tokens.expires_in * 1000);
			await context.secrets.store('mobiledeck.oauth.expires_at', expiresAt.toString());

			// store email address
			if (email) {
				await context.secrets.store('mobiledeck.oauth.email', email);
			}

			this.logger.log('tokens stored successfully');

			// update authentication context to show sign out button
			await vscode.commands.executeCommand('setContext', 'mobiledeck.isAuthenticated', true);
		} catch (error) {
			this.logger.log('failed to store tokens: ' + (error instanceof Error ? error.message : String(error)));
			throw error;
		}
	}

};
