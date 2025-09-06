import * as vscode from 'vscode';
import { execFileSync } from 'child_process';
import { IconPath } from 'vscode';

export interface DeviceDescriptor {
	id: string;
	name: string;
	platform: string;
	type: string;
}

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
		if (platform.includes('ios')) {
			return vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'ios-icon.svg');
		}
		
		if (platform.includes('android')) {
			this.iconPath = vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'android-icon.svg');
		} 

		return new vscode.ThemeIcon('device-desktop');
	}
}

export class DeviceTreeProvider implements vscode.TreeDataProvider<DeviceNode | vscode.TreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<DeviceNode | undefined | null | void> = new vscode.EventEmitter<DeviceNode | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<DeviceNode | undefined | null | void> = this._onDidChangeTreeData.event;

	private devices: DeviceDescriptor[] = [];

	constructor(private context: vscode.ExtensionContext) {}

	refresh(): void {
		this.devices = this.listDevices();
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: DeviceNode | vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: DeviceNode | vscode.TreeItem): Thenable<(DeviceNode | vscode.TreeItem)[]> {
		if (!element) {
			const items: (DeviceNode | vscode.TreeItem)[] = [];
			
			// Add header
			const headerItem = new vscode.TreeItem('Local devices:', vscode.TreeItemCollapsibleState.Expanded);
			headerItem.tooltip = 'Available local devices';
			headerItem.iconPath = new vscode.ThemeIcon('device-mobile');
			headerItem.contextValue = 'devices-header';
			headerItem.description = this.devices.length > 0 ? `${this.devices.length} device${this.devices.length === 1 ? '' : 's'}` : 'No devices';
			items.push(headerItem);
			
			const deviceNodes = this.devices.map(device => 
				new DeviceNode(device, vscode.TreeItemCollapsibleState.None, this.context)
			);

			items.push(...deviceNodes);
			
			return Promise.resolve(items);
		}
		
		return Promise.resolve([]);
	}

	private getMobilecliPath(): string {
		const basePath = vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'mobilecli').fsPath;
		return process.platform === 'win32' ? `${basePath}.exe` : basePath;
	}

	private listDevices(): DeviceDescriptor[] {
		try {
			const mobilecliPath = this.getMobilecliPath();
			const output = execFileSync(mobilecliPath, ['devices'], { encoding: 'utf8' });
			const result = JSON.parse(output);
			return result.data?.devices || [];
		} catch (error) {
			console.error('Error getting device list:', error);
			return [];
		}
	}
}