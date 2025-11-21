import * as vscode from 'vscode';

export class ExtensionUtils {

	/**
	 * The application name of the editor, like 'VS Code'.
	 */
	public static getAppName(): string {
		return vscode.env.appName;
	}

	/**
	 * The version of Mobile Deck, as noted in package.json
	 */
	public static getExtensionVersion(): string {
		try {
			const extension = vscode.extensions.getExtension('mobilenext.mobiledeck');
			return extension?.packageJSON?.version || 'unknown';
		} catch (error: any) {
			console.debug('Error getting extension version:', error);
			return 'unknown';
		}
	}
}
