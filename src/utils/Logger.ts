import * as vscode from 'vscode';

export class Logger {
	private outputChannel: vscode.OutputChannel;

	constructor(channelName: string) {
		this.outputChannel = vscode.window.createOutputChannel(channelName);
	}

	public log(message: string): void {
		const formattedMessage = this.formatMessage(message);
		this.outputChannel.appendLine(formattedMessage);
	}

	private formatMessage(message: string): string {
		const timestamp = new Date().toISOString();
		return `[${timestamp}] ${message}`;
	}

	public dispose(): void {
		this.outputChannel.dispose();
	}
}