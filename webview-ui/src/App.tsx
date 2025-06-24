import React, { useState, useEffect, useRef } from 'react';
import { Header } from './Header';
import { ConnectDialog } from './ConnectDialog';
import { DeviceStream } from './DeviceStream';
import { DeviceDescriptor, ListDevicesResponse } from './models';
import { JsonRpcClient } from './JsonRpcClient';

declare function acquireVsCodeApi(): any;

let vscode: any = null;
try {
	vscode = acquireVsCodeApi();
} catch (error) {
	console.error("Failed to acquire VS Code API:", error);
}

interface StatusBarProps {
	isRefreshing: boolean;
	selectedDevice: DeviceDescriptor | null;
	fpsCount: number;
}

const StatusBar: React.FC<StatusBarProps> = ({
	isRefreshing,
	selectedDevice,
	fpsCount,
}) => {
	return (
		<div className="px-2 py-1 text-[10px] text-gray-500 border-t border-[#333333] flex justify-between">
			{/* left */}
			{/* <span>USB: Connected</span> */}
			{/* right */}
			{/* <span>FPS: {isRefreshing ? "..." : fpsCount}</span> */}
		</div>
	);
};

function App() {
	const [selectedDevice, setSelectedDevice] = useState<DeviceDescriptor | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);
	const [fpsCount, setFpsCount] = useState(30);
	const [showConnectDialog, setShowConnectDialog] = useState(false);
	const [remoteHostIp, setRemoteHostIp] = useState("");
	const [recentHosts, setRecentHosts] = useState<string[]>([
		"127.0.0.1",
	]);

	const [localDevices, setLocalDevices] = useState<Array<DeviceDescriptor>>([]);
	const [screenshot, setScreenshot] = useState<string>("");

	interface ScreenshotResponse {
		data: string;
	}

	const jsonRpcClient = new JsonRpcClient('http://localhost:12000/rpc');

	const requestScreenshot = async (deviceId: string) => {
		const screenshot: ScreenshotResponse = await jsonRpcClient.sendJsonRpcRequest('screenshot', { deviceId: deviceId });
		setScreenshot(screenshot.data);

		setTimeout(() => {
			requestScreenshot(deviceId).then();
		}, 1000 / 30);
	};

	const requestDevices = async () => {
		const result = await jsonRpcClient.sendJsonRpcRequest<ListDevicesResponse>('devices', {});
		setLocalDevices(result.devices);
	};

	const refreshDeviceList = async () => {
		try {
			setIsRefreshing(true);
			await requestDevices();
		} catch (error) {
			console.error('mobiledeck: error refreshing device list', error);
		} finally {
			setIsRefreshing(false);
		}
	};

	const selectDevice = (device: DeviceDescriptor) => {
		setSelectedDevice(device);
		requestScreenshot(device.id);
	};

	const handleTap = async (x: number, y: number) => {
		await jsonRpcClient.sendJsonRpcRequest('io_tap', { x, y, deviceId: selectedDevice?.id });
	};

	const handleKeyDown = async (text: string) => {
		if (text === 'Enter') {
			text = "\n";
		} else if (text === 'Backspace') {
			text = "\b";
		} else if (text === 'Delete') {
			text = "\d";
		} else if (text === ' ') {
			text = " ";
		} else if (text === 'Shift') {
			// do nothing
			return;
		}

		await jsonRpcClient.sendJsonRpcRequest('io_text', { text, deviceId: selectedDevice?.id }).then();
	};

	const handleMessage = (event: MessageEvent) => {
		const message = event.data;

		switch (message.command) {
			default:
				console.log('mobiledeck: unknown message', message);
				break;
		}
	};

	const onHome = () => {
		jsonRpcClient.sendJsonRpcRequest('io_button', { deviceId: selectedDevice?.id, button: 'HOME' }).then();
	};

	useEffect(() => {
		const messageHandler = (event: MessageEvent) => handleMessage(event);
		window.addEventListener('message', messageHandler);
		refreshDeviceList();

		return () => {
			window.removeEventListener('message', messageHandler);
		};
	}, []);

	return (
		<div className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] overflow-hidden">
			{/* Header with controls */}
			<Header
				selectedDevice={selectedDevice}
				isRefreshing={isRefreshing}
				localDevices={localDevices}
				recentHosts={recentHosts}
				onSelectDevice={selectDevice}
				onHome={() => onHome()}
				onRefresh={() => refreshDeviceList()}
				onShowConnectDialog={() => setShowConnectDialog(true)}
			/>

			{/* Device stream area */}
			<DeviceStream
				isConnecting={isConnecting}
				selectedDevice={selectedDevice}
				screenshot={screenshot}
				onTap={handleTap}
				onKeyDown={handleKeyDown}
			/>

			{/* Status bar */}
			<StatusBar
				isRefreshing={isRefreshing}
				selectedDevice={selectedDevice}
				fpsCount={fpsCount}
			/>

			{/* Connect to Host Dialog */}
			<ConnectDialog
				isOpen={showConnectDialog}
				onOpenChange={setShowConnectDialog}
				remoteHostIp={remoteHostIp}
				onRemoteHostIpChange={setRemoteHostIp}
				recentHosts={recentHosts}
				onConnectToHost={() => {}}
				onSelectRecentHost={(host) => { // New handler to set IP and connect for recent host
					setRemoteHostIp(host);
					// Potentially auto-connect or just fill input:
					// For now, let's just fill the input, user still needs to click "Connect"
					// If auto-connect is desired, call handleConnectToHost after setRemoteHostIp(host)
				}}
			/>
		</div>);
}

export default App;
