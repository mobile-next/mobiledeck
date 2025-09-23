import * as vscode from 'vscode';
import { IconPath } from 'vscode';
import { DeviceDescriptor } from './DeviceDescriptor';

export class DeviceNode extends vscode.TreeItem {
	constructor(
		public readonly device: DeviceDescriptor,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		private readonly context: vscode.ExtensionContext
	) {
		let displayName = device.name;
		if (device.type === 'emulator') {
			displayName += ' (Emulator)';
		} else if (device.type === 'simulator') {
			displayName += ' (Simulator)';
		}

		super(displayName, collapsibleState);

		this.tooltip = `${this.label} - ${device.platform}`;
		this.description = device.platform;
		this.contextValue = 'device';
		
		this.iconPath = this.getIconPath(device.platform.toLowerCase());

		this.command = {
			command: 'mobiledeck.connect',
			title: 'Connect',
			arguments: [device]
		};
	}

	private getIconPath(platform: string): string | IconPath {
		if (platform === 'ios') {
			return vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'ios-icon.svg');
		}
		
		if (platform === 'android') {
			return vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'android-icon.svg');
		} 

		return new vscode.ThemeIcon('device-desktop');
	}
}