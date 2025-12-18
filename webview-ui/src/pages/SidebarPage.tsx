import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { Box, Flex, Text, Heading, Table, Separator, Link, IconButton } from '@radix-ui/themes';
import vscode from '../vscode';
import { JsonRpcClient } from '@shared/JsonRpcClient';
import { MobilecliClient } from '@shared/MobilecliClient';
import { DeviceDescriptor, DevicePlatform } from '@shared/models';
import DeviceCategory from '../components/DeviceCategory';
import GettingStartedBanner from '../components/GettingStartedBanner';
import DeviceRow from '../components/DeviceRow';
import { MessageRouter } from '../MessageRouter';
import { Toaster } from '../components/ui/toaster';
import { useToast } from '../components/ui/use-toast';

// message type definitions
interface ConfigureMessage {
	command: 'configure';
	serverPort?: number;
	email?: string;
	gettingStartedDismissed?: boolean;
	agentStatuses?: AgentStatus[];
}

interface RefreshDevicesMessage {
	command: 'refreshDevices';
}

interface UpdateConnectedDevicesMessage {
	command: 'updateConnectedDevices';
	connectedDeviceIds?: string[];
}

interface ShowToastMessage {
	command: 'showToast';
	variant: 'default' | 'destructive';
	title: string;
	message: string;
}

interface ConfigureAgentMcpMessage {
	command: 'configureAgentMcp';
	agentName: string;
}

interface AgentStatus {
	name: string;
	isInstalled: boolean;
	isConfigured: boolean;
}

type SidebarMessage = ConfigureMessage | RefreshDevicesMessage | UpdateConnectedDevicesMessage | ShowToastMessage | ConfigureAgentMcpMessage;

interface SidebarPageProps {
	onDeviceClicked?: (device: DeviceDescriptor) => void;
}

function SidebarPage({
	onDeviceClicked = (device) => alert(`Device clicked: ${device.name}`)
}: SidebarPageProps) {
	const { toast } = useToast();
	const [isLocalDevicesExpanded, setIsLocalDevicesExpanded] = useState(true);
	const [isOfflineExpanded, setIsOfflineExpanded] = useState(true);
	const [devices, setDevices] = useState<DeviceDescriptor[]>([]);
	const [isRefreshing, setIsRefreshing] = useState(true);
	const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
	const [serverPort, setServerPort] = useState<number>(0);
	const [userEmail, setUserEmail] = useState<string>('');
	const [connectedDeviceIds, setConnectedDeviceIds] = useState<string[]>([]);
	const [operatingDeviceIds, setOperatingDeviceIds] = useState<Set<string>>(new Set());
	const [gettingStartedDismissed, setGettingStartedDismissed] = useState<boolean>(false);
	const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
	const [isAgentStatusVisible, setIsAgentStatusVisible] = useState<boolean>(true);

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
				console.log("mobiledeck: notice: server port not set yet");
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

			// notify extension of updated device list
			vscode.postMessage({
				command: 'devicesUpdated',
				devices: sortedDevices
			});
		} catch (error) {
			console.error('sidebar: error fetching devices:', error);
			setIsRefreshing(false);
			setHasInitiallyLoaded(true);
		}
	};

	const handleConfigure = (message: ConfigureMessage) => {
		if (message.serverPort) {
			console.log('sidebar: configure message received, port:', message.serverPort);
			setServerPort(message.serverPort);
		}

		if (message.email) {
			console.log('sidebar: email received:', message.email);
			setUserEmail(message.email);
		}

		if (message.gettingStartedDismissed !== undefined) {
			console.log('sidebar: gettingStartedDismissed:', message.gettingStartedDismissed);
			setGettingStartedDismissed(message.gettingStartedDismissed);
		}

		if (message.agentStatuses) {
			// note: we used to be sorting by installed first, but it moves
			// items around when you click on "Configure..." and is just messy
			const sortedAgents = message.agentStatuses
				.filter(a => a.isInstalled)
				.sort((a, b) => a.name.localeCompare(b.name)
			);

			setAgentStatuses(sortedAgents);
		}
	};

	const handleRefreshDevices = (message: RefreshDevicesMessage) => {
		console.log('sidebar: refresh devices message received');
		fetchDevices();
	};

	const handleUpdateConnectedDevices = (message: UpdateConnectedDevicesMessage) => {
		console.log('sidebar: connected devices updated:', message.connectedDeviceIds);
		setConnectedDeviceIds(message.connectedDeviceIds || []);

		// clear operating state for any devices that are now connected
		setOperatingDeviceIds(prev => {
			const newSet = new Set(prev);
			(message.connectedDeviceIds || []).forEach((deviceId: string) => {
				newSet.delete(deviceId);
			});
			return newSet;
		});
	};

	const handleShowToast = (message: ShowToastMessage) => {
		toast({
			variant: message.variant,
			title: message.title,
			description: message.message,
		});
	};

	useEffect(() => {
		const router = new MessageRouter(window);

		// register message handlers
		router.register('configure', handleConfigure);
		router.register('refreshDevices', handleRefreshDevices);
		router.register('updateConnectedDevices', handleUpdateConnectedDevices);
		router.register('showToast', handleShowToast);

		// send initialization message to extension (parent)
		vscode.postMessage({
			command: 'onInitialized'
		});

		// if running outside vscode (local dev of webview-ui), then automatically set port
		if (vscode.isMockApi) {
			setServerPort(12000);
			setAgentStatuses([
				{ name: 'Codex', isInstalled: true, isConfigured: true },
				{ name: 'Cursor', isInstalled: true, isConfigured: true },
				{ name: 'Gemini', isInstalled: true, isConfigured: false },
				{ name: 'VSCode Copilot', isInstalled: true, isConfigured: false },
			]);
		}
		/*
		toast({
			variant: "destructive",
			title: "Error",
			description: "Something went wrong!",
		});
		*/

		return () => {
			router.destroy();
		};
	}, [toast]);

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
		// set operating state
		setOperatingDeviceIds(prev => new Set(prev).add(device.id));

		// connect to device - same as clicking on it
		handleDeviceClick(device);
	};

	const handleRebootDevice = async (device: DeviceDescriptor) => {
		try {
			// set operating state
			setOperatingDeviceIds(prev => new Set(prev).add(device.id));

			// close the device tab first
			vscode.postMessage({
				command: 'closeDeviceTab',
				deviceId: device.id
			});

			console.log('sidebar: rebooting device', device.id);
			await getMobilecliClient().it(device.id).reboot();
			console.log('sidebar: device reboot initiated');
		} catch (error) {
			console.error('sidebar: error rebooting device:', error);
		}
	};

	const handleShutdownDevice = async (device: DeviceDescriptor) => {
		try {
			// set operating state
			setOperatingDeviceIds(prev => new Set(prev).add(device.id));

			// optimistically update device state to offline
			setDevices(prevDevices =>
				prevDevices.map(d =>
					d.id === device.id ? { ...d, state: 'offline' } : d
				)
			);

			// close the device tab first
			vscode.postMessage({
				command: 'closeDeviceTab',
				deviceId: device.id
			});

			console.log('sidebar: shutting down device', device.id);
			await getMobilecliClient().it(device.id).shutdown();
			console.log('sidebar: device shutdown initiated');

			// clear operating state after shutdown completes
			setOperatingDeviceIds(prev => {
				const newSet = new Set(prev);
				newSet.delete(device.id);
				return newSet;
			});
		} catch (error) {
			console.error('sidebar: error shutting down device:', error);

			// clear operating state on error as well
			setOperatingDeviceIds(prev => {
				const newSet = new Set(prev);
				newSet.delete(device.id);
				return newSet;
			});
		}
	};

	const RenderAgentStatus = () => {
		if (agentStatuses.length === 0 || !isAgentStatusVisible) {
			return null;
		}

		const handleClose = () => {
			setIsAgentStatusVisible(false);
		};

		const onConfigureAgent = (agentName: string) => {
			vscode.postMessage({
				command: 'configureAgentMcp',
				agentName: agentName
			});
		};

		return (
			<Box px="3" py="4">
			<Box
				mt="4"
				p="3"
				style={{
					backgroundColor: 'var(--gray-2)',
					border: '1px solid var(--gray-6)',
					borderRadius: 'var(--radius-3)',
					position: 'relative'
				}}
			>
				<IconButton
					size="1"
					variant="ghost"
					color="gray"
					onClick={handleClose}
					aria-label="Close banner"
					style={{ position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)', cursor: 'pointer' }}
				>
					<X size={16} />
				</IconButton>
				<Flex direction="column" gap="2" pr="6">
					<Heading size="4" weight="medium" mb="2">
						Connected AI Agents
					</Heading>
					<Text size="1" color="gray" mb="2" style={{ lineHeight: 1.5, textAlign: 'justify' }}>
						These agents are installed on your computer. Click <strong>Configure</strong> to automatically set up the <em>Mobile Deck MCP</em> server and allow the agent to control connected devices.
					</Text>
					<Table.Root size="2">
						<Table.Body>
							{agentStatuses.map((agent) => {
								return (
									<Table.Row key={agent.name}>
										<Table.RowHeaderCell>
											<Flex align="center" gap="2" pr="8">
												<Box
													style={{
														width: '12px',
														height: '12px',
														borderRadius: '50%',
														backgroundColor: agent.isConfigured ? 'var(--green-9)' : 'var(--gray-9)'
													}}
												/>
												<Text size="2" weight="medium" wrap="nowrap">
													{agent.name}
												</Text>
											</Flex>
										</Table.RowHeaderCell>
										<Table.Cell justify="end">
											{!agent.isConfigured ? (
												<Link
													size="1"
													color="gray"
													href="#"
													onClick={(e) => { e.preventDefault(); onConfigureAgent(agent.name); }}
												>
													Configure &rarr;
												</Link>
											) : (
												<Text size="1" color="gray">Ready</Text>
											)}
										</Table.Cell>
									</Table.Row>
								);
							})}
							</Table.Body>
						</Table.Root>
					</Flex>
				</Box>
			</Box>
		);
	};


	return (
		<Flex direction="column" height="100vh" style={{ backgroundColor: 'var(--gray-1)', color: 'var(--gray-12)' }}>
			<Toaster />
			{/* device list */}
			<Box flexGrow="1" style={{ overflowY: 'auto' }}>
				{/* local devices section */}
				<Box px="4" py="2">
					<Flex
						align="center"
						gap="2"
						mb="2"
						px="1"
						py="1"
						onClick={() => setIsLocalDevicesExpanded(!isLocalDevicesExpanded)}
						style={{
							cursor: 'pointer',
							borderRadius: 'var(--radius-2)',
							userSelect: 'none',
						}}
						className="hover-bg-gray-3 transition-colors"
					>
						{isLocalDevicesExpanded ? (
							<ChevronDown className="h-4 w-4 flex-shrink-0" />
						) : (
							<ChevronRight className="h-4 w-4 flex-shrink-0" />
						)}
						<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
							<path d="M11 2H5a1 1 0 00-1 1v10a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1zM8 12.5a.5.5 0 110-1 .5.5 0 010 1z" />
						</svg>
						<Text size="2" weight="medium">Local devices:</Text>
						<Text size="2" color="gray">{devices.length} device{devices.length !== 1 ? 's' : ''}</Text>
					</Flex>

					{/* device items */}
					{isLocalDevicesExpanded && (
						<Box ml="6">
							{devices.length === 0 ? (
								<Box py="2">
									<Text size="1" color="gray">
										{(!hasInitiallyLoaded && isRefreshing) ? 'Loading devices...' : 'No devices found'}
									</Text>
								</Box>
							) : (
								<>
									{/* available devices section (includes both connected and non-connected) */}
									{devices.some(d => d.state !== 'offline') && (
										<>
											<DeviceCategory label="Available" />
											{devices.filter(d => d.state !== 'offline').map((device) => {
												const isConnected = connectedDeviceIds.includes(device.id);
												return (
													<DeviceRow
														key={device.id}
														device={device}
														onClick={handleDeviceClick}
														isConnected={isConnected}
														onReboot={handleRebootDevice}
														onShutdown={handleShutdownDevice}
														onConnect={isConnected ? undefined : handleConnectDevice}
														isOperating={operatingDeviceIds.has(device.id)}
													/>
												);
											})}
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
													isOperating={operatingDeviceIds.has(device.id)}
												/>
											))}
										</>
									)}
								</>
							)}
						</Box>
					)}
				</Box>
			</Box>

			{/* getting started banner - always visible after initial load */}
			{/* {hasInitiallyLoaded && !gettingStartedDismissed && <GettingStartedBanner />} */}

			<RenderAgentStatus />
		</Flex>
	);
}

export default SidebarPage;
