import React from 'react';
import { MoreVertical, Play } from "lucide-react";
import { AndroidIcon, IosIcon } from '../CustomIcons';
import { DeviceDescriptor, DevicePlatform, DeviceType } from '../models';
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
}

function DeviceRow({ device, onClick, isConnected, onReboot, onShutdown, onConnect }: DeviceRowProps) {
	const isEmulatorOrSimulator = device.type === DeviceType.EMULATOR || device.type === DeviceType.SIMULATOR;
	const isAvailable = device.state !== 'offline';

	const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
		e.stopPropagation();
		action();
	};

	return (
		<div
			className="flex items-center gap-2 py-1.5 px-2 hover:bg-[#2d2d2d] rounded cursor-pointer group"
			onClick={() => onClick(device)}
		>
			{/* device icon */}
			<div className="flex-shrink-0">
				{device.platform === DevicePlatform.ANDROID ? <AndroidIcon /> : <IosIcon />}
			</div>

			{/* device name and type */}
			<div className="flex-1 min-w-0 flex flex-col">
				<span className="text-sm text-white">
					{device.name}
				</span>
				<span className="text-xs text-[#858585]">
					{device.platform === DevicePlatform.IOS ? 'iOS' : 'Android'}
					{device.version && ` ${device.version}`}
					{' • '}
					{device.type === DeviceType.EMULATOR && 'Emulator'}
					{device.type === DeviceType.SIMULATOR && 'Simulator'}
					{device.type === DeviceType.REAL && 'Real Device'}
				</span>
			</div>

			{/* action buttons */}
			<div className="flex items-center gap-1">
				{/* connect button - shown for all available and offline devices */}
				{onConnect && (
					<button
						onClick={(e) => handleButtonClick(e, () => onConnect(device))}
						className="p-1 hover:bg-[#3e3e3e] rounded transition-colors"
						title="Connect"
					>
						<Play className="h-4 w-4 text-[#858585] hover:text-[#cccccc]" />
					</button>
				)}

				{/* kebab menu for reboot/shutdown - shown for connected/available devices */}
				{isAvailable && (onReboot || onShutdown) && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								onClick={(e) => e.stopPropagation()}
								className="p-1 hover:bg-[#3e3e3e] rounded transition-colors"
								title="More actions"
							>
								<MoreVertical className="h-4 w-4 text-[#858585] hover:text-[#cccccc]" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="bg-[#252526] border-[#3e3e3e]">
							{onReboot && (
								<DropdownMenuItem onClick={(e) => { e.stopPropagation(); onReboot(device); }}>
									Reboot device
								</DropdownMenuItem>
							)}
							{isEmulatorOrSimulator && onShutdown && (
								<DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShutdown(device); }}>
									Shutdown device
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
		</div>
	);
}

export default DeviceRow;
