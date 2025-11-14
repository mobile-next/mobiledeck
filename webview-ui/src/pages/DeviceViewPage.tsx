import React, { useState, useEffect, useRef } from 'react';
import { Header } from '../Header';
import { DeviceStream, GesturePoint } from '../DeviceStream';
import { JsonRpcClient } from '../JsonRpcClient';
import { MjpegStream } from '../MjpegStream';
import vscode from '../vscode';
import { DeviceSkin, getDeviceSkinForDevice, NoDeviceSkin } from '../DeviceSkins';
import { DeviceDescriptor, DeviceInfo, DeviceInfoResponse, ListDevicesResponse, ScreenSize } from '../models';

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

function DeviceViewPage() {
	const [selectedDevice, setSelectedDevice] = useState<DeviceDescriptor | null>(null);
	const [availableDevices, setAvailableDevices] = useState<DeviceDescriptor[]>([]);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);
	const [fpsCount, setFpsCount] = useState(30);
	const [imageUrl, setImageUrl] = useState<string>("");
	const [screenSize, setScreenSize] = useState<ScreenSize>({ width: 0, height: 0, scale: 1.0 });
	const [streamReader, setStreamReader] = useState<ReadableStreamDefaultReader<Uint8Array> | null>(null);
	const [streamController, setStreamController] = useState<AbortController | null>(null);
	const [mjpegStream, setMjpegStream] = useState<MjpegStream | null>(null);
	const [serverPort, setServerPort] = useState<number>(12000);
	const [mediaSkinsUri, setMediaSkinsUri] = useState<string>("skins");
	const [deviceSkin, setDeviceSkin] = useState<DeviceSkin>(NoDeviceSkin);
	const [isBooting, setIsBooting] = useState(false);
	const bootPollIntervalRef = useRef<NodeJS.Timeout | null>(null);

	/// keys waiting to be sent, to prevent out-of-order and cancellation of synthetic events
	const pendingKeys = useRef("");
	const isFlushingKeys = useRef(false);

	const jsonRpcClientRef = useRef<JsonRpcClient>(new JsonRpcClient(`http://localhost:${serverPort}/rpc`));

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

	const requestDeviceInfo = async (deviceId: string) => {
		const result = await getJsonRpcClient().sendJsonRpcRequest<DeviceInfoResponse>('device_info', { deviceId: deviceId });
		console.log('mobiledeck: device info', result);
		if (result && result.device) {
			// TODO: get device info should not call a setter
			setScreenSize(result.device.screenSize);
		}
	};

	const fetchDevices = async () => {
		try {
			setIsRefreshing(true);
			const result = await getJsonRpcClient().sendJsonRpcRequest<ListDevicesResponse>('devices', {});
			console.log('mobiledeck: devices list', result);
			setAvailableDevices(result.devices);
		} catch (error) {
			console.error('mobiledeck: error fetching devices:', error);
		} finally {
			setIsRefreshing(false);
		}
	};

	const bootDevice = async (deviceId: string) => {
		try {
			console.log('mobiledeck: booting device', deviceId);
			setIsBooting(true);
			await getJsonRpcClient().sendJsonRpcRequest('device_boot', { deviceId: deviceId });
			console.log('mobiledeck: device_boot called successfully');
		} catch (error) {
			console.error('mobiledeck: error booting device:', error);
			setIsBooting(false);
			throw error;
		}
	};

	const pollDeviceUntilAvailable = (deviceId: string) => {
		// clear any existing poll interval
		if (bootPollIntervalRef.current) {
			clearInterval(bootPollIntervalRef.current);
			bootPollIntervalRef.current = null;
		}

		// poll every 1 second to check if device is available
		bootPollIntervalRef.current = setInterval(async () => {
			try {
				const result = await getJsonRpcClient().sendJsonRpcRequest<ListDevicesResponse>('devices', { includeOffline: true });
				const device = result.devices.find(d => d.id === deviceId);

				if (device && device.state !== 'offline') {
					console.log('mobiledeck: device is now available:', device);
					setIsBooting(false);

					// clear the interval
					if (bootPollIntervalRef.current) {
						clearInterval(bootPollIntervalRef.current);
						bootPollIntervalRef.current = null;
					}

					// update the selected device with the new state
					setSelectedDevice(device);

					// start the mjpeg stream
					await startMjpegStream(device.id);
					await requestDeviceInfo(device.id);

					// set device skin based on device platform/model
					setDeviceSkin(getDeviceSkinForDevice(device));
				}
			} catch (error) {
				console.error('mobiledeck: error polling device status:', error);
			}
		}, 1000);
	};

	useEffect(() => {
		console.log('mobiledeck: selectDevice called with device:', selectedDevice);
		stopMjpegStream();

		// clear any existing boot polling
		if (bootPollIntervalRef.current) {
			clearInterval(bootPollIntervalRef.current);
			bootPollIntervalRef.current = null;
		}

		if (selectedDevice !== null) {
			// check if device is offline
			if (selectedDevice.state === 'offline') {
				console.log('mobiledeck: device is offline, booting first');
				bootDevice(selectedDevice.id).then(() => {
					// start polling to check when device becomes available
					pollDeviceUntilAvailable(selectedDevice.id);
				}).catch(error => {
					console.error('mobiledeck: failed to boot device:', error);
					setIsBooting(false);
				});
			} else {
				console.log('mobiledeck: device is available, starting mjpeg stream with port', serverPort);
				startMjpegStream(selectedDevice.id);
				requestDeviceInfo(selectedDevice.id).then();

				// set device skin based on device platform/model
				setDeviceSkin(getDeviceSkinForDevice(selectedDevice));
			}
		}
	}, [selectedDevice]);

	const handleTap = async (x: number, y: number) => {
		await getJsonRpcClient().sendJsonRpcRequest('io_tap', { x, y, deviceId: selectedDevice?.id });
	};

	const handleGesture = async (points: Array<GesturePoint>) => {
		// convert points to new actions format
		const actions: Array<{ type: string, duration?: number, x?: number, y?: number, button?: number }> = [];

		if (points.length > 0) {
			// first point - move to start position
			actions.push({
				type: "pointerMove",
				duration: 0,
				x: points[0].x,
				y: points[0].y
			});

			// pointer down
			actions.push({
				type: "pointerDown",
				button: 0
			});

			// move through all intermediate points
			for (let i = 1; i < points.length; i++) {
				const duration = i < points.length - 1 ? points[i].duration - points[i - 1].duration : 100;
				actions.push({
					type: "pointerMove",
					duration: Math.max(duration, 0),
					x: points[i].x,
					y: points[i].y
				});
			}

			// pointer up
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

	const flushPendingKeys = async () => {
		console.log('mobiledeck: flushPendingKeys', pendingKeys.current, isFlushingKeys.current);
		if (isFlushingKeys.current) {
			return;
		}

		isFlushingKeys.current = true;
		const keys = pendingKeys.current;
		if (keys === "") {
			isFlushingKeys.current = false;
			return;
		}

		pendingKeys.current = "";
		try {
			await getJsonRpcClient().sendJsonRpcRequest('io_text', { text: keys, deviceId: selectedDevice?.id }, 3000);
		} catch (error) {
			console.error('mobiledeck: error flushing keys:', error);
		} finally {
			isFlushingKeys.current = false;
		}
	};

	const handleKeyDown = async (text: string) => {
		console.log('mobiledeck: handleKeyDown', text);
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
		console.log('mobiledeck: received message:', message);

		switch (message.command) {
			case 'configure':
				if (message.device && message.serverPort) {
					console.log('mobiledeck: configure message received, device:', message.device, 'port:', message.serverPort);
					setServerPort(message.serverPort);
					setSelectedDevice(message.device);
					console.log("mobiledeck: got media skins uri: " + message.mediaSkinsUri);
					setMediaSkinsUri(message.mediaSkinsUri);
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

	const onBack = () => {
		getJsonRpcClient().sendJsonRpcRequest('io_button', { deviceId: selectedDevice?.id, button: 'BACK' }).then();
	};

	const onAppSwitch = () => {
		getJsonRpcClient().sendJsonRpcRequest('io_button', { deviceId: selectedDevice?.id, button: 'APP_SWITCH' }).then();
	};

	const onPower = () => {
		getJsonRpcClient().sendJsonRpcRequest('io_button', { deviceId: selectedDevice?.id, button: 'POWER' }).then();
	};

	const onRotateDevice = () => {
		console.log('Rotate device requested');
		// TODO: Implement device rotation
	};


	const onIncreaseVolume = () => {
		getJsonRpcClient().sendJsonRpcRequest('io_button', { deviceId: selectedDevice?.id, button: 'VOLUME_UP' }).then();
	};

	const onDecreaseVolume = () => {
		getJsonRpcClient().sendJsonRpcRequest('io_button', { deviceId: selectedDevice?.id, button: 'VOLUME_DOWN' }).then();
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
			const DATA_IMAGE_PNG = "data:image/png;base64,";

			if (response.data && response.data.startsWith(DATA_IMAGE_PNG)) {
				// convert base64 to blob
				const base64Data = response.data.substring(DATA_IMAGE_PNG.length);
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

	const onDeviceSelected = (device: DeviceDescriptor) => {
		setSelectedDevice(device);

		// notify extension to update webview title
		vscode.postMessage({
			command: 'onDeviceSelected',
			device,
		});
	};

	useEffect(() => {
		const messageHandler = (event: MessageEvent) => handleMessage(event);
		window.addEventListener('message', messageHandler);

		// send initialization message to extension (parent)
		vscode.postMessage({
			command: 'onInitialized'
		});

		return () => {
			window.removeEventListener('message', messageHandler);
			stopMjpegStream();
			if (imageUrl) {
				URL.revokeObjectURL(imageUrl);
			}

			// clear boot polling interval if exists
			if (bootPollIntervalRef.current) {
				clearInterval(bootPollIntervalRef.current);
				bootPollIntervalRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		// only start fetching devices after serverPort is configured
		if (serverPort === 12000) {
			return;
		}

		// fetch available devices on mount
		fetchDevices();

		// poll for devices every 2 seconds
		const intervalId = setInterval(() => {
			fetchDevices();
		}, 2000);

		return () => {
			clearInterval(intervalId);
		};
	}, [serverPort]);

	return (
		<div className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] overflow-x-visible overflow-y-auto">
			{/* Header with controls */}
			<Header
				selectedDevice={selectedDevice}
				availableDevices={availableDevices}
				onHome={() => onHome()}
				onBack={() => onBack()}
				onTakeScreenshot={onTakeScreenshot}
				onAppSwitch={() => onAppSwitch()}
				onPower={() => onPower()}
				onRefreshDevices={fetchDevices}
				onSelectDevice={onDeviceSelected}
			/>

			{/* Device stream area */}
			<DeviceStream
				isConnecting={isConnecting}
				isBooting={isBooting}
				selectedDevice={selectedDevice}
				imageUrl={imageUrl}
				screenSize={screenSize}
				skinOverlayUri={mediaSkinsUri + "/" + deviceSkin.imageFilename}
				deviceSkin={deviceSkin}
				onTap={handleTap}
				onGesture={handleGesture}
				onKeyDown={handleKeyDown}
				onRotateDevice={onRotateDevice}
				onTakeScreenshot={onTakeScreenshot}
				onDeviceHome={onHome}
				onDeviceBack={onBack}
				onAppSwitch={onAppSwitch}
				onIncreaseVolume={onIncreaseVolume}
				onDecreaseVolume={onDecreaseVolume}
				onTogglePower={onPower}
			/>

			{/* Status bar */}
			<StatusBar
				isRefreshing={isRefreshing}
				selectedDevice={selectedDevice}
				fpsCount={fpsCount}
			/>
		</div>);
}

export default DeviceViewPage;
