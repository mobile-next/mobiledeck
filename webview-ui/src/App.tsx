import React, { useState, useEffect, useRef } from 'react';
import { Header } from './Header';
import { ConnectDialog } from './ConnectDialog';
import { DeviceStream } from './DeviceStream';
import { DeviceDescriptor, DeviceInfo, DeviceInfoResponse, ListDevicesResponse, ScreenSize } from './models';
import { JsonRpcClient } from './JsonRpcClient';
import { MjpegStream } from './MjpegStream';

declare function acquireVsCodeApi(): any;

const vscode = acquireVsCodeApi();

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
	const [serverPort, setServerPort] = useState<number>(12000);

	const jsonRpcClientRef = useRef<JsonRpcClient>(new JsonRpcClient(`http://localhost:${serverPort}/rpc`));

	// Update jsonRpcClient when serverPort changes
	useEffect(() => {
		jsonRpcClientRef.current = new JsonRpcClient(`http://localhost:${serverPort}/rpc`);
	}, [serverPort]);

	const getJsonRpcClient = () => jsonRpcClientRef.current;

	const startMjpegStream = async (deviceId: string) => {
		try {
			setIsConnecting(true);
			const response = await fetch(`http://localhost:${serverPort}/rpc`, {
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
		const result = await getJsonRpcClient().sendJsonRpcRequest<ListDevicesResponse>('devices', {});
		setLocalDevices(result.devices);
	};

	const requestDeviceInfo = async (deviceId: string) => {
		const result = await getJsonRpcClient().sendJsonRpcRequest<DeviceInfoResponse>('device_info', { deviceId: deviceId });
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
		vscode.postMessage({
			command: 'onDeviceSelected',
			device: device
		});
	};

	const handleTap = async (x: number, y: number) => {
		await getJsonRpcClient().sendJsonRpcRequest('io_tap', { x, y, deviceId: selectedDevice?.id });
	};

	const handleGesture = async (points: Array<[number, number, number]>) => {
		// Convert points to new actions format
		const actions: Array<{ type: string, duration?: number, x?: number, y?: number, button?: number }> = [];

		if (points.length > 0) {
			// First point - move to start position
			actions.push({
				type: "pointerMove",
				duration: 0,
				x: points[0][0],
				y: points[0][1]
			});

			// Pointer down
			actions.push({
				type: "pointerDown",
				button: 0
			});

			// Add pause if needed
			if (points.length > 1) {
				actions.push({
					type: "pause",
					duration: 50
				});
			}

			// Move through all intermediate points
			for (let i = 1; i < points.length; i++) {
				const duration = i < points.length - 1 ? points[i][2] - points[i - 1][2] : 100;
				actions.push({
					type: "pointerMove",
					duration: Math.max(duration, 0),
					x: points[i][0],
					y: points[i][1]
				});
			}

			// Pointer up
			actions.push({
				type: "pointerUp",
				button: 0
			});
		}

		await getJsonRpcClient().sendJsonRpcRequest('io_gesture', {
			deviceId: selectedDevice?.id,
			actions
		});
	};

	const pendingKeys = useRef("");
	const isFlushingKeys = useRef(false);

	const flushPendingKeys = async () => {
		if (isFlushingKeys.current) {
			return;
		}

		isFlushingKeys.current = true;
		const keys = pendingKeys.current;
		if (keys === "") {
			// already flushed
			return;
		}

		pendingKeys.current = "";
		getJsonRpcClient().sendJsonRpcRequest('io_text', { text: keys, deviceId: selectedDevice?.id }).then(() => {
			isFlushingKeys.current = false;
		});
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

		// await jsonRpcClient.sendJsonRpcRequest('io_text', { text, deviceId: selectedDevice?.id }).then();
		pendingKeys.current += text;
		setTimeout(() => flushPendingKeys(), 500);
	};

	const handleMessage = (event: MessageEvent) => {
		const message = event.data;

		switch (message.command) {
			case 'selectDevice':
				if (message.device) {
					selectDevice(message.device);
				}
				break;
			case 'setServerPort':
				if (message.port) {
					setServerPort(message.port);
					refreshDeviceList();
				}
				break;
			default:
				console.log('mobiledeck: unknown message', message);
				break;
		}
	};

	const onHome = () => {
		getJsonRpcClient().sendJsonRpcRequest('io_button', { deviceId: selectedDevice?.id, button: 'HOME' }).then();
	};

	const getScreenshotFilename = (device: DeviceDescriptor) => {
		return `screenshot-${device.name}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
	};

	const onTakeScreenshot = async () => {
		if (!selectedDevice) {
			return;
		}

		try {
			const response = await getJsonRpcClient().sendJsonRpcRequest<ScreenshotResponse>('screenshot', { deviceId: selectedDevice.id });

			if (response.data && response.data.startsWith("data:image/png;base64,")) {
				// convert base64 to blob
				const base64Data = response.data.substring("data:image/png;base64,".length);
				const byteCharacters = atob(base64Data);
				const byteNumbers = Array.from(byteCharacters, char => char.charCodeAt(0));
				const byteArray = new Uint8Array(byteNumbers);
				const blob = new Blob([byteArray], { type: 'image/png' });

				// create download link
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = getScreenshotFilename(selectedDevice);
				a.click();
				URL.revokeObjectURL(url);
			} else {
				vscode.postMessage({
					command: 'alert',
					text: 'Failed to take screenshot: ' + response.data
				});
			}
		} catch (error) {
			console.error('Error taking screenshot:', error);
		}
	};

	useEffect(() => {
		const messageHandler = (event: MessageEvent) => handleMessage(event);
		window.addEventListener('message', messageHandler);

		// Send initialization message to extension
		vscode.postMessage({
			command: 'onInitialized'
		});

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
				onTakeScreenshot={onTakeScreenshot}
			/>

			{/* Device stream area */}
			<DeviceStream
				isConnecting={isConnecting}
				selectedDevice={selectedDevice}
				imageUrl={imageUrl}
				screenSize={screenSize}
				onTap={handleTap}
				onGesture={handleGesture}
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
