import * as vscode from 'vscode';

export class DevicePanelManager {
	private devicePanels: Map<string, vscode.WebviewPanel> = new Map();

	public get(deviceId: string): vscode.WebviewPanel | undefined {
		return this.devicePanels.get(deviceId);
	}

	public set(deviceId: string, panel: vscode.WebviewPanel) {
		this.devicePanels.set(deviceId, panel);
	}

	public delete(deviceId: string) {
		this.devicePanels.delete(deviceId);
	}

	public ids(): Array<string> {
		return Array.from(this.devicePanels.keys());
	}
}
