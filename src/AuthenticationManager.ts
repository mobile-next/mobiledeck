import * as vscode from 'vscode';

export class AuthenticationManager {
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
};
