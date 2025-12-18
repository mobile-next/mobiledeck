import React from 'react';
import { MoreVertical, Play, Loader2, RotateCw, Power } from "lucide-react";
import { Flex, Text, Box } from '@radix-ui/themes';
import { AndroidIcon, IosIcon } from '../CustomIcons';
import { DeviceDescriptor, DevicePlatform, DeviceType } from '@shared/models';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

interface DeviceRowProps {
	device: DeviceDescriptor;
	onClick: (device: DeviceDescriptor) => void;
	isConnected: boolean;
	onReboot?: (device: DeviceDescriptor) => void;
	onShutdown?: (device: DeviceDescriptor) => void;
	onConnect?: (device: DeviceDescriptor) => void;
	isOperating?: boolean;
}

function DeviceRow({ device, onClick, isConnected, onReboot, onShutdown, onConnect, isOperating }: DeviceRowProps) {
	const isEmulatorOrSimulator = device.type === DeviceType.EMULATOR || device.type === DeviceType.SIMULATOR;
	const isAvailable = device.state !== 'offline';

	const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
		e.stopPropagation();
		action();
	};

	const handleRowClick = () => {
		if (!isOperating) {
			onClick(device);
		}
	};

	return (
		<Flex
			align="center"
			gap="2"
			py="1"
			px="2"
			onClick={handleRowClick}
			style={{
				cursor: isOperating ? 'default' : 'pointer',
				borderRadius: 'var(--radius-2)'
			}}
			className="hover-bg-gray-3 transition-colors"
		>
			{/* device icon */}
			<Box flexShrink="0">
				{device.platform === DevicePlatform.ANDROID ? <AndroidIcon /> : <IosIcon />}
			</Box>

			{/* device name and type */}
			<Flex direction="column" flexGrow="1" style={{minWidth: 0, textOverflow: "ellipsis", whiteSpace: "nowrap", overflow: "clip"}}>
				<Text size="2" style={{color: 'white'}}>
					{device.name}
				</Text>
				<Text size="1" color="gray">
					{device.platform === DevicePlatform.IOS ? 'iOS' : 'Android'}
					{device.version && ` ${device.version}`}
					{' • '}
					{device.type === DeviceType.EMULATOR && 'Emulator'}
					{device.type === DeviceType.SIMULATOR && 'Simulator'}
					{device.type === DeviceType.REAL && 'Real Device'}
				</Text>
			</Flex>

			{/* action buttons */}
			<Flex align="center" gap="1">
				{isOperating ? (
					<Box p="1">
						<Loader2 size={16} color="var(--gray-11)" className="animate-spin" />
					</Box>
				) : (
					<>
						{/* connect button - shown for all available and offline devices */}
						{onConnect && (
							<Box
								onClick={(e) => handleButtonClick(e, () => onConnect(device))}
								p="1"
								style={{
									cursor: 'pointer',
									borderRadius: 'var(--radius-2)'
								}}
								className="hover-bg-gray-6 transition-colors"
								title="Connect"
							>
								<Play size={16} color="var(--gray-11)" />
							</Box>
						)}

						{/* kebab menu for reboot/shutdown - shown for connected/available devices */}
						{isAvailable && (onReboot || onShutdown) && (
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Box
										onClick={(e) => e.stopPropagation()}
										p="1"
										style={{
											cursor: 'pointer',
											borderRadius: 'var(--radius-2)'
										}}
										className="hover-bg-gray-6 transition-colors"
										title="More actions"
									>
										<MoreVertical size={16} color="var(--gray-11)" />
									</Box>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" style={{ backgroundColor: 'var(--gray-2)', borderColor: 'var(--gray-6)' }}>
									{onReboot && (
										<DropdownMenuItem onClick={(e) => { e.stopPropagation(); onReboot(device); }} className="cursor-pointer">
											<RotateCw size={16} style={{marginRight: '0.5rem'}} />
											Reboot device
										</DropdownMenuItem>
									)}
									{isEmulatorOrSimulator && onShutdown && (
										<DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShutdown(device); }} className="cursor-pointer">
											<Power size={16} style={{marginRight: '0.5rem'}} />
											Shutdown device
										</DropdownMenuItem>
									)}
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</>
				)}
			</Flex>
		</Flex>
	);
}

export default DeviceRow;
