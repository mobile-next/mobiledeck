import React, { useEffect } from "react";
import { Button } from "./components/ui/button";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
	DropdownMenuLabel
} from "./components/ui/dropdown-menu";

import { ChevronDown, House, MoreVertical, RefreshCw, Wifi, Smartphone, LinkIcon, Camera, ArrowBigLeft, Circle, Power } from "lucide-react";
import { DeviceDescriptor } from "@shared/models";
import { AndroidIcon, AppSwitchIcon, IosIcon, MobileDeckIcon } from "./CustomIcons";

export interface HeaderProps {
	selectedDevice: DeviceDescriptor | null;
	availableDevices: DeviceDescriptor[];
	onHome: () => void;
	onBack: () => void;
	onTakeScreenshot: () => void;
	onAppSwitch: () => void;
	onPower: () => void;
	onSelectDevice: (device: DeviceDescriptor) => void;
}

const DeviceSelectorDropdown: React.FC<{
	selectedDevice: DeviceDescriptor | null;
	onSelectDevice: (device: DeviceDescriptor) => void;
	availableDevices: DeviceDescriptor[];
}> = ({ selectedDevice, availableDevices, onSelectDevice }) => {

	// filter to show only online devices
	const onlineDevices = availableDevices.filter(device => device.state === 'online');

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="h-8 px-2 hover:bg-[#2a2a2a] flex items-center gap-1"
				>
					{selectedDevice ? (
						<>
							{selectedDevice.platform === 'ios' ? (
								<IosIcon className="h-4 w-4" />
							) : (
								<AndroidIcon className="h-4 w-4" />
							)}
							<span className="text-xs">{selectedDevice.name}</span>
						</>
					) : (
						<>
							<Smartphone className="h-3.5 w-3.5" />
							<span className="text-xs">Select Device</span>
						</>
					)}
					<ChevronDown className="h-3 w-3" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="bg-[#252526] border-[#3c3c3c] text-[#cccccc] w-[250px]">
				<DropdownMenuLabel className="text-xs text-gray-400">
					Available Devices
				</DropdownMenuLabel>
				<DropdownMenuSeparator className="bg-[#3c3c3c]" />
				{onlineDevices.length === 0 ? (
					<DropdownMenuItem disabled className="text-xs">
						No devices available
					</DropdownMenuItem>
				) : (
					onlineDevices.map((device) => (
						<DropdownMenuItem
							key={device.id}
							onClick={() => onSelectDevice(device)}
							className="text-xs hover:bg-[#2a2a2a] cursor-pointer flex items-center gap-2"
						>
							{device.platform === 'ios' ? (
								<IosIcon className="h-4 w-4" />
							) : (
								<AndroidIcon className="h-4 w-4" />
							)}
							<div className="flex flex-col">
								<span>{device.name}</span>
								{device.version && (
									<span className="text-[10px] text-gray-500">
										{device.type} - v{device.version}
									</span>
								)}
							</div>
						</DropdownMenuItem>
					))
				)}
				{/* <DropdownMenuSeparator className="bg-[#3c3c3c]" />
						<DropdownMenuItem
							onClick={onRefreshDevices}
							className="text-xs hover:bg-[#2a2a2a] cursor-pointer flex items-center gap-2"
						>
							<RefreshCw className="h-3.5 w-3.5" />
							<span>Refresh Devices</span>
						</DropdownMenuItem> */}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export const Header: React.FC<HeaderProps> = ({
	selectedDevice,
	availableDevices,
	onHome,
	onBack,
	onTakeScreenshot,
	onAppSwitch,
	onPower,
	// onRefreshDevices,
	onSelectDevice,
}) => {
	return (
		<div className="flex items-center justify-between px-2 py-2 border-[#333333]">
			<div className="flex items-center gap-2">
				<DeviceSelectorDropdown
					selectedDevice={selectedDevice}
					availableDevices={availableDevices}
					onSelectDevice={onSelectDevice}
				/>

				{/* Delimiter after device selector */}
				<div className="h-4 w-px bg-[#333333]" />

				{/* Power button - Android only */}
				{selectedDevice?.platform === 'android' && (
					<>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 hover:bg-[#2a2a2a]"
							onClick={onPower}
							disabled={!selectedDevice}
						>
							<Power className={`h-3.5 w-3.5`} />
						</Button>
						{/* Delimiter after Power button */}
						<div className="h-4 w-px bg-[#333333] mx-1" />
					</>
				)}

				{/* Back button */}
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 hover:bg-[#2a2a2a]"
					onClick={onBack}
					disabled={!selectedDevice || selectedDevice?.platform === 'ios'}
				>
					<ArrowBigLeft className={`h-3.5 w-3.5`} />
				</Button>

				{/* Home button */}
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 hover:bg-[#2a2a2a]"
					onClick={onHome}
					disabled={!selectedDevice}
				>
					{selectedDevice?.platform === 'ios' ?
						<House className={`h-3.5 w-3.5`} /> :
						<Circle className={`h-3.5 w-3.5`} />
					}
				</Button>

				{/* App switch button - Android only */}
				{selectedDevice?.platform === 'android' && (
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 hover:bg-[#2a2a2a]"
						onClick={onAppSwitch}
						disabled={!selectedDevice}
					>
						<AppSwitchIcon className="h-3.5 w-3.5" />
					</Button>
				)}

				{/* Delimiter before Screenshot button */}
				<div className="h-4 w-px bg-[#333333] mx-1" />

				{/* Screenshot button */}
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 hover:bg-[#2a2a2a]"
					onClick={onTakeScreenshot}
					disabled={!selectedDevice}
				>
					<Camera className={`h-3.5 w-3.5`} />
				</Button>
			</div>
			<div className="flex items-center gap-2">
				{/* Mobile Deck branding */}
				<div className="flex items-center gap-2">
					<MobileDeckIcon className="h-6 w-6 text-[#cccccc]" />
					<span className="text-sm font-medium text-[#cccccc]">Mobile Deck</span>
				</div>

				{/* Kebab menu */}
				{/* <DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#2a2a2a]">
							<MoreVertical className="h-3.5 w-3.5" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="bg-[#252526] border-[#3c3c3c] text-[#cccccc] w-[200px]">
					</DropdownMenuContent>
				</DropdownMenu> */}
			</div>
		</div>
	);
};
