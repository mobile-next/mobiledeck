import React, { useEffect } from "react";
import { Button } from "./components/ui/button";
import { IoLogoAndroid, IoLogoApple } from "react-icons/io";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
	DropdownMenuLabel,
	DropdownMenuGroup
} from "./components/ui/dropdown-menu";

import { ChevronDown, House, MoreVertical, RefreshCw, Wifi, Smartphone, LinkIcon, Camera, ArrowBigLeft, Circle, Square, Power } from "lucide-react";
import { DeviceDescriptor } from "./models";

export interface HeaderProps {
	selectedDevice: DeviceDescriptor | null;
	recentHosts: string[];
	onHome: () => void;
	onBack: () => void;
	onShowConnectDialog: () => void;
	onTakeScreenshot: () => void;
	onAppSwitch: () => void;
	onPower: () => void;
}

export const Header: React.FC<HeaderProps> = ({
	selectedDevice,
	recentHosts,
	onHome,
	onBack,
	onShowConnectDialog,
	onTakeScreenshot,
	onAppSwitch,
	onPower,
}) => {
	return (
		<div className="flex items-center justify-between px-2 py-2 border-b border-[#333333]">
			<div className="flex items-center">

				{/* Power button - Android only */}
				{selectedDevice?.platform === 'android' && (
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 hover:bg-[#2a2a2a]"
						onClick={onPower}
						disabled={!selectedDevice}
					>
						<Power className={`h-3.5 w-3.5`} />
					</Button>
				)}

				{/* Delimiter after Power button */}
				{selectedDevice?.platform === 'android' && (
					<div className="h-4 w-px bg-[#333333] mx-1" />
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
						<Square className={`h-3.5 w-3.5`} />
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
	);
};
