import React, { useState, useEffect, useRef } from 'react';
import { Header } from './Header';
import { ConnectDialog } from './ConnectDialog';
import { DeviceStream } from './DeviceStream';
import { DeviceDescriptor, DeviceInfo, DeviceInfoResponse, ListDevicesResponse } from './models';
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
	const [screenshotScale, setScreenshotScale] = useState(1.0);
	const [streamActive, setStreamActive] = useState(false);
	const [streamReader, setStreamReader] = useState<ReadableStreamDefaultReader<Uint8Array> | null>(null);
	const [streamController, setStreamController] = useState<AbortController | null>(null);

	const jsonRpcClient = new JsonRpcClient('http://localhost:12000/rpc');

	const startMjpegStream = async (deviceId: string) => {
		if (streamActive) {
			return;
		}

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
			setStreamActive(true);
			setIsConnecting(false);

			processMjpegStream(reader);

		} catch (error) {
			console.error('Error starting MJPEG stream:', error);
			setIsConnecting(false);
		}
	};

	const stopMjpegStream = () => {
		if (streamController) {
			streamController.abort();
			setStreamController(null);
		}
		if (streamReader) {
			streamReader.cancel();
			setStreamReader(null);
		}
		setStreamActive(false);
		setImageUrl("");
	};

	const processMjpegStream = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
		const boundary = '--BoundaryString';
		let buffer = new Uint8Array();
		let inImage = false;
		let imageData = new Uint8Array();
		let contentLength = 0;
		let bytesRead = 0;

		console.log("mobiledeck: starting mjpeg stream");
		try {
			while (true) {
				console.log("mobiledeck: reading mjpeg stream");
				const { done, value } = await reader.read();

				if (done) {
					console.log('MJPEG stream ended');
					break;
				}

				console.log("mobiledeck: read mjpeg stream of length", value.length);

				const newBuffer = new Uint8Array(buffer.length + value.length);
				newBuffer.set(buffer);
				newBuffer.set(value, buffer.length);
				buffer = newBuffer;

				let processedData = false;
				while (true) {
					if (!inImage) {
						const bufferString = new TextDecoder().decode(buffer);
						const boundaryIndex = bufferString.indexOf(boundary);
						if (boundaryIndex === -1) {
							break;
						}

						const headerEndIndex = bufferString.indexOf('\r\n\r\n', boundaryIndex);
						if (headerEndIndex === -1) {
							break;
						}

						const headers = bufferString.substring(boundaryIndex + boundary.length, headerEndIndex);
						const contentLengthMatch = headers.match(/Content-Length:\s*(\d+)/i);
						if (contentLengthMatch) {
							contentLength = parseInt(contentLengthMatch[1]);
						}

						const headerEndBytes = headerEndIndex + 4;
						buffer = buffer.slice(headerEndBytes);
						inImage = true;
						imageData = new Uint8Array();
						bytesRead = 0;
						processedData = true;
					}

					if (inImage) {
						const remainingBytes = contentLength - bytesRead;
						const bytesToRead = Math.min(remainingBytes, buffer.length);

						if (bytesToRead === 0) {
							break;
						}

						const newImageData = new Uint8Array(imageData.length + bytesToRead);
						newImageData.set(imageData);
						newImageData.set(buffer.slice(0, bytesToRead), imageData.length);
						imageData = newImageData;

						bytesRead += bytesToRead;
						buffer = buffer.slice(bytesToRead);
						processedData = true;

						if (bytesRead >= contentLength) {
							displayMjpegImage(imageData);
							inImage = false;
							imageData = new Uint8Array();
							bytesRead = 0;
						}
					}
				}

				if (processedData) {
					await new Promise(resolve => setTimeout(resolve, 0));
				}
			}
		} catch (error) {
			if (error.name === 'AbortError') {
				console.log('MJPEG stream aborted');
			} else {
				console.error('Error processing MJPEG stream:', error);
			}
		} finally {
			stopMjpegStream();
		}
	};

	const displayMjpegImage = (imageData: Uint8Array) => {
		try {
			const blob = new Blob([imageData], { type: 'image/jpeg' });
			const newImageUrl = URL.createObjectURL(blob);

			// Clean up previous URL
			if (imageUrl) {
				URL.revokeObjectURL(imageUrl);
			}

			setImageUrl(newImageUrl);
		} catch (error) {
			console.error('Error displaying MJPEG image:', error);
		}
	};

	const requestDevices = async () => {
		const result = await jsonRpcClient.sendJsonRpcRequest<ListDevicesResponse>('devices', {});
		setLocalDevices(result.devices);
	};

	const requestDeviceInfo = async (deviceId: string) => {
		const result = await jsonRpcClient.sendJsonRpcRequest<DeviceInfoResponse>('info', { deviceId: deviceId });
		console.log('mobiledeck: device info', result);
		setScreenshotScale(result.device.screenSize.scale);
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
		startMjpegStream(device.id);
		requestDeviceInfo(device.id).then();
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
				screenshotScale={screenshotScale}
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
