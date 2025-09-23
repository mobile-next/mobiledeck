import * as vscode from 'vscode';
import { execFileSync } from 'child_process';
import { DeviceDescriptor } from './DeviceDescriptor';
import { DeviceNode } from './DeviceNode';

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
			// Root level - return just the header
			const headerItem = new vscode.TreeItem('Local devices:', vscode.TreeItemCollapsibleState.Expanded);
			headerItem.tooltip = 'Available local devices';
			headerItem.iconPath = new vscode.ThemeIcon('device-mobile');
			headerItem.contextValue = 'devices-header';
			headerItem.description = this.devices.length > 0 ? `${this.devices.length} device${this.devices.length === 1 ? '' : 's'}` : 'No devices';
			
			return Promise.resolve([headerItem]);
		}
		
		if (element.contextValue === 'devices-header') {
			// Return devices as children of the header
			const deviceNodes = this.devices.map(device => 
				new DeviceNode(device, vscode.TreeItemCollapsibleState.None, this.context)
			);
			return Promise.resolve(deviceNodes);
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