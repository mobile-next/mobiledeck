import * as vscode from 'vscode';
import * as fs from 'node:fs';

export class HtmlUtils {
	/**
	 * Generates HTML content for a webview by reading index.html and replacing asset paths
	 *
	 * @param context extension context
	 * @param webview webview instance (panel or view)
	 * @param page page identifier to inject as window.__VSCODE_PAGE__
	 * @returns HTML content with replaced asset URIs and injected page identifier
	 */
	static getHtml(
		context: vscode.ExtensionContext,
		webview: vscode.Webview,
		page: string = 'device'
	): string {
		const htmlPath = vscode.Uri.joinPath(context.extensionUri, 'assets', 'index.html');
		let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf8');

		const assets = ["styles.css", "bundle.js"];
		for (const asset of assets) {
			const uri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'assets', asset));
			htmlContent = htmlContent.replace(asset, uri.toString());
		}

		// inject page query parameter into the HTML
		const pageScript = `<script>window.__VSCODE_PAGE__ = '${page}';</script>`;
		htmlContent = htmlContent.replace('</head>', `${pageScript}</head>`);

		return htmlContent;
	}
}
