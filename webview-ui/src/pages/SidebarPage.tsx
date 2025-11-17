import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight } from "lucide-react";
import vscode from '../vscode';
import { JsonRpcClient } from '../JsonRpcClient';
import { MobilecliClient } from '../MobilecliClient';
import { DeviceDescriptor, DevicePlatform } from '../models';
import DeviceCategory from '../components/DeviceCategory';
import GettingStartedBanner from '../components/GettingStartedBanner';
import DeviceRow from '../components/DeviceRow';

interface SidebarPageProps {
	onDeviceClicked?: (device: DeviceDescriptor) => void;
}

function SidebarPage({
	onDeviceClicked = (device) => alert(`Device clicked: ${device.name}`)
}: SidebarPageProps) {
	const [isLocalDevicesExpanded, setIsLocalDevicesExpanded] = useState(true);
	const [isOfflineExpanded, setIsOfflineExpanded] = useState(true);
	const [devices, setDevices] = useState<DeviceDescriptor[]>([]);
	const [isRefreshing, setIsRefreshing] = useState(true);
	const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
	const [serverPort, setServerPort] = useState<number>(0);
	const [userEmail, setUserEmail] = useState<string>('');
	const [connectedDeviceIds, setConnectedDeviceIds] = useState<string[]>([]);

	const jsonRpcClientRef = useRef<JsonRpcClient>(new JsonRpcClient(`http://localhost:${serverPort}/rpc`));
	const mobilecliClientRef = useRef<MobilecliClient>(new MobilecliClient(jsonRpcClientRef.current));

	useEffect(() => {
		jsonRpcClientRef.current = new JsonRpcClient(`http://localhost:${serverPort}/rpc`);
		mobilecliClientRef.current = new MobilecliClient(jsonRpcClientRef.current);

		// fetch devices when serverPort changes
		fetchDevices();

		// poll for devices every 2 seconds
		const intervalId = setInterval(() => {
			fetchDevices();
		}, 2000);

		return () => {
			clearInterval(intervalId);
		};
	}, [serverPort]);

	const getMobilecliClient = () => mobilecliClientRef.current;

	const fetchDevices = async () => {
		try {
			if (serverPort === 0) {
				// server port not yet set, probably still launching mobilecli server
				// return;
				console.log("gilm: server port not set yet");
				return;
			}

			setIsRefreshing(true);
			const result = await getMobilecliClient().listDevices(true);
			console.log('sidebar: devices list', result);

			// sort devices: ios first, then android, each group sorted by name
			const iosDevices = result.devices.
				filter(d => d.platform === DevicePlatform.IOS).
				sort((a, b) => a.name.localeCompare(b.name));
			const androidDevices = result.devices.
				filter(d => d.platform === DevicePlatform.ANDROID).
				sort((a, b) => a.name.localeCompare(b.name));

			const sortedDevices = [...iosDevices, ...androidDevices];
			setDevices(sortedDevices);
			setIsRefreshing(false);
			setHasInitiallyLoaded(true);
		} catch (error) {
			console.error('sidebar: error fetching devices:', error);
			setIsRefreshing(false);
			setHasInitiallyLoaded(true);
		}
	};

	const handleMessage = (event: MessageEvent) => {
		const message = event.data;
		console.log('sidebar: received message:', message);

		switch (message.command) {
			case 'configure':
				if (message.serverPort) {
					console.log('sidebar: configure message received, port:', message.serverPort);
					setServerPort(message.serverPort);
				}

				if (message.email) {
					console.log('sidebar: email received:', message.email);
					setUserEmail(message.email);
				}
				break;

			case 'refreshDevices':
				console.log('sidebar: refresh devices message received');
				fetchDevices();
				break;

			case 'updateConnectedDevices':
				console.log('sidebar: connected devices updated:', message.connectedDeviceIds);
				setConnectedDeviceIds(message.connectedDeviceIds || []);
				break;

			default:
				console.log('sidebar: unknown message', message);
				break;
		}
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
		};
	}, []);

	useEffect(() => {
		// only start fetching devices after serverPort is configured
		if (serverPort === 0) {
			return;
		}

		// fetch devices on mount
		fetchDevices();

		// poll for devices every 2 seconds
		const intervalId = setInterval(() => {
			fetchDevices();
		}, 2000);

		return () => {
			clearInterval(intervalId);
		};
	}, [serverPort]);

	const handleDeviceClick = (device: DeviceDescriptor) => {
		// send device click message to extension
		vscode.postMessage({
			command: 'deviceClicked',
			device: device
		});

		// also call the callback prop if provided
		onDeviceClicked(device);
	};

	const handleConnectDevice = (device: DeviceDescriptor) => {
		// connect to device - same as clicking on it
		handleDeviceClick(device);
	};

	const handleRebootDevice = async (device: DeviceDescriptor) => {
		try {
			// close the device tab first
			vscode.postMessage({
				command: 'closeDeviceTab',
				deviceId: device.id
			});

			console.log('sidebar: rebooting device', device.id);
			await getMobilecliClient().rebootDevice(device.id);
			console.log('sidebar: device reboot initiated');
		} catch (error) {
			console.error('sidebar: error rebooting device:', error);
		}
	};

	const handleShutdownDevice = async (device: DeviceDescriptor) => {
		try {
			// close the device tab first
			vscode.postMessage({
				command: 'closeDeviceTab',
				deviceId: device.id
			});

			console.log('sidebar: shutting down device', device.id);
			await getMobilecliClient().shutdownDevice(device.id);
			console.log('sidebar: device shutdown initiated');
		} catch (error) {
			console.error('sidebar: error shutting down device:', error);
		}
	};


	return (
		<div className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc]">
			{/* device list */}
			<div className="flex-1 overflow-y-auto">
				{/* local devices section */}
				<div className="px-4 py-2">
					<div
						className="flex items-center gap-2 text-sm text-[#cccccc] mb-2 cursor-pointer hover:bg-[#2d2d2d] rounded px-1 py-1 select-none"
						onClick={() => setIsLocalDevicesExpanded(!isLocalDevicesExpanded)}
					>
						{isLocalDevicesExpanded ? (
							<ChevronDown className="h-4 w-4 flex-shrink-0" />
						) : (
							<ChevronRight className="h-4 w-4 flex-shrink-0" />
						)}
						<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
							<path d="M11 2H5a1 1 0 00-1 1v10a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1zM8 12.5a.5.5 0 110-1 .5.5 0 010 1z" />
						</svg>
						<span className="font-medium">Local devices:</span>
						<span className="text-[#858585]">{devices.length} device{devices.length !== 1 ? 's' : ''}</span>
					</div>

					{/* device items */}
					{isLocalDevicesExpanded && (
						<div className="ml-6">
							{devices.length === 0 ? (
								<div className="text-xs text-[#858585] py-2">
									{(!hasInitiallyLoaded && isRefreshing) ? 'Loading devices...' : 'No devices found'}
								</div>
							) : (
								<>
									{/* connected devices section */}
									{devices.some(d => connectedDeviceIds.includes(d.id) && d.state !== 'offline') && (
										<>
											<DeviceCategory label="Connected" />
											{devices.filter(d => connectedDeviceIds.includes(d.id) && d.state !== 'offline').map((device) => (
												<DeviceRow
													key={device.id}
													device={device}
													onClick={handleDeviceClick}
													isConnected={true}
													onReboot={handleRebootDevice}
													onShutdown={handleShutdownDevice}
													onConnect={handleConnectDevice}
												/>
											))}
										</>
									)}

									{/* available devices section */}
									{devices.some(d => !connectedDeviceIds.includes(d.id) && d.state !== 'offline') && (
										<>
											<DeviceCategory label="Available" />
											{devices.filter(d => !connectedDeviceIds.includes(d.id) && d.state !== 'offline').map((device) => (
												<DeviceRow
													key={device.id}
													device={device}
													onClick={handleDeviceClick}
													isConnected={false}
													onReboot={handleRebootDevice}
													onShutdown={handleShutdownDevice}
													onConnect={handleConnectDevice}
												/>
											))}
										</>
									)}

									{/* offline devices section */}
									{devices.some(d => d.state === 'offline') && (
										<>
											<DeviceCategory
												label="Offline"
												isCollapsible={true}
												isExpanded={isOfflineExpanded}
												onToggle={() => setIsOfflineExpanded(!isOfflineExpanded)}
											/>
											{isOfflineExpanded && devices.filter(d => d.state === 'offline').map((device) => (
												<DeviceRow
													key={device.id}
													device={device}
													onClick={handleDeviceClick}
													isConnected={false}
													onConnect={handleConnectDevice}
												/>
											))}
										</>
									)}
								</>
							)}
						</div>
					)}
				</div>
			</div>

			{/* getting started banner - always visible after initial load */}
			{hasInitiallyLoaded && /*devices.length === 0 &&*/ <GettingStartedBanner />}
		</div>
	);
}

export default SidebarPage;
