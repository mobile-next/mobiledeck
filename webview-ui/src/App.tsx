import React, { useState, useEffect, useRef } from 'react';
import { Header } from './Header';
import { ConnectDialog } from './ConnectDialog';
import { DeviceStream } from './DeviceStream';
import { DeviceDescriptor, DeviceInfo, DeviceInfoResponse, ListDevicesResponse, ScreenSize } from './models';
import { JsonRpcClient } from './JsonRpcClient';
import { MjpegStream } from './MjpegStream';

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

interface ScreenshotResponse {
	data: string;
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

	const [localDevices, setLocalDevices] = useState<DeviceDescriptor[]>([]);
	const [imageUrl, setImageUrl] = useState<string>("");
	const [screenSize, setScreenSize] = useState<ScreenSize>({ width: 0, height: 0, scale: 1.0 });
	const [streamReader, setStreamReader] = useState<ReadableStreamDefaultReader<Uint8Array> | null>(null);
	const [streamController, setStreamController] = useState<AbortController | null>(null);
	const [mjpegStream, setMjpegStream] = useState<MjpegStream | null>(null);

	const jsonRpcClient = new JsonRpcClient('http://localhost:12000/rpc');

	const startMjpegStream = async (deviceId: string) => {
		try {
			setIsConnecting(true);
			const response = await fetch('http://localhost:12000/rpc', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					method: 'screencapture',
					id: '1',
					jsonrpc: '2.0',
					params: {
						format: 'mjpeg',
						deviceId: deviceId
					}
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			if (!response.body) {
				throw new Error('ReadableStream not supported');
			}

			const controller = new AbortController();
			const reader = response.body.getReader();
			setStreamController(controller);
			setStreamReader(reader);
			setIsConnecting(false);

			const stream = new MjpegStream(reader, (newImageUrl) => {
				// Clean up previous URL
				if (imageUrl) {
					URL.revokeObjectURL(imageUrl);
				}
				setImageUrl(newImageUrl);
			});
			setMjpegStream(stream);
			stream.start();

		} catch (error) {
			console.error('Error starting MJPEG stream:', error);
			setIsConnecting(false);
		}
	};

	const stopMjpegStream = () => {
		if (mjpegStream) {
			mjpegStream.stop();
			setMjpegStream(null);
		}

		if (streamController) {
			streamController.abort();
			setStreamController(null);
		}

		if (streamReader) {
			streamReader.cancel();
			setStreamReader(null);
		}

		setImageUrl("");
	};

	const requestDevices = async () => {
		const result = await jsonRpcClient.sendJsonRpcRequest<ListDevicesResponse>('devices', {});
		setLocalDevices(result.devices);
	};

	const requestDeviceInfo = async (deviceId: string) => {
		const result = await jsonRpcClient.sendJsonRpcRequest<DeviceInfoResponse>('device_info', { deviceId: deviceId });
		console.log('mobiledeck: device info', result);
		setScreenSize(result.device.screenSize);
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
		stopMjpegStream();

		setSelectedDevice(device);
		startMjpegStream(device.id);
		requestDeviceInfo(device.id).then();

		// send message to extension to remember selected device
		if (vscode) {
			vscode.postMessage({
				command: 'onDeviceSelected',
				device: device
			});
		}
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
		} else if (text === 'Shift' || text === 'Meta') {
			// do nothing
			return;
		}

		await jsonRpcClient.sendJsonRpcRequest('io_text', { text, deviceId: selectedDevice?.id }).then();
	};

	const handleMessage = (event: MessageEvent) => {
		const message = event.data;

		switch (message.command) {
			case 'selectDevice':
				if (message.device) {
					selectDevice(message.device);
				}
				break;
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

		// Send initialization message to extension
		if (vscode) {
			vscode.postMessage({
				command: 'onInitialized'
			});
		}

		return () => {
			window.removeEventListener('message', messageHandler);
			stopMjpegStream();
			if (imageUrl) {
				URL.revokeObjectURL(imageUrl);
			}
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
				imageUrl={imageUrl}
				screenSize={screenSize}
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
