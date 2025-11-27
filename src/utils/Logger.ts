import * as vscode from 'vscode';

export class Logger {

	private static outputChannel: vscode.OutputChannel;

	constructor(private category: string) {
		if (!Logger.outputChannel) {
			Logger.outputChannel = vscode.window.createOutputChannel("Mobile Deck");
		}
	}

	public log(message: string): void {
		const formattedMessage = this.formatMessage(message);
		Logger.outputChannel.appendLine(formattedMessage);
	}

	private formatMessage(message: string): string {
		const timestamp = new Date().toISOString();
		return `[${timestamp}] [${this.category}] ${message}`;
	}
}
