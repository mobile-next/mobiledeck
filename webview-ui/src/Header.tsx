import React, { useEffect } from "react";
import { Button } from "./components/ui/button";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator
} from "./components/ui/dropdown-menu";

import { ChevronDown, House, MoreVertical, RefreshCw, Wifi, Smartphone, LinkIcon } from "lucide-react";
import { DeviceDescriptor } from "./models";

export interface HeaderProps {
	selectedDevice: DeviceDescriptor | undefined;
	isRefreshing: boolean;
	isRemoteConnection: boolean;
	localDevices: DeviceDescriptor[];
	recentHosts: string[];
	onSelectDevice: (device: DeviceDescriptor) => void;
	onHome: () => void;
	onRefresh: () => void;
	onShowConnectDialog: () => void;
}

export const Header: React.FC<HeaderProps> = ({
	selectedDevice,
	isRemoteConnection,
	localDevices,
	recentHosts,
	onSelectDevice,
	onRefresh,
	onHome,
	isRefreshing,
	onShowConnectDialog,
}) => {
	return (
		<div className="flex items-center justify-between px-2 py-2 border-b border-[#333333]">
			<div className="flex items-center">
				{/* Device selector */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="h-8 px-2 text-xs hover:bg-[#2a2a2a] focus:outline-none flex items-center"
						>
							{isRemoteConnection ? <Wifi className="h-3 w-3 mr-1.5 text-blue-400" /> : <Smartphone className="h-3 w-3 mr-1.5" />}
							<span className="mr-1 truncate max-w-[100px]">{selectedDevice?.deviceName}</span>
							<ChevronDown className="h-3 w-3" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent className="bg-[#252526] border-[#3c3c3c] text-[#cccccc] w-[220px]">
						{/*
		  <DropdownMenuItem
		    className="text-xs py-1.5 cursor-pointer hover:bg-[#2a2a2a] focus:bg-[#37373d] flex items-center"
		    onClick={onShowConnectDialog}
		  >
		    <LinkIcon className="h-3.5 w-3.5 mr-2 text-blue-400" /> Connect to Remote Host...
		  </DropdownMenuItem>
		  <DropdownMenuSeparator className="bg-[#3c3c3c]" />
		  */}
						{localDevices.map((device) => (
							<DropdownMenuItem
								key={device.deviceName}
								onClick={() => onSelectDevice(device)}
								className="text-xs py-1.5 cursor-pointer hover:bg-[#2a2a2a] focus:bg-[#37373d] flex items-center"
							>
								<Smartphone className="h-3.5 w-3.5 mr-2" /> {device.deviceName}
							</DropdownMenuItem>
						))}
						{/*
		  {recentHosts.length > 0 && <DropdownMenuSeparator className="bg-[#3c3c3c]" />}
		  {recentHosts.map((host) => (
		    <DropdownMenuItem
		      key={host}
		      onClick={() => onSelectDevice(`Remote: ${host}`)}
		      className="text-xs py-1.5 cursor-pointer hover:bg-[#2a2a2a] focus:bg-[#37373d] flex items-center"
		    >
		      <Wifi className="h-3.5 w-3.5 mr-2 text-blue-400" /> {host}
		    </DropdownMenuItem>
		  ))}
		  */}
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Refresh button */}
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 hover:bg-[#2a2a2a]"
					onClick={onRefresh}
					disabled={isRefreshing}
				>
					<RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
				</Button>

				{/* Refresh button */}
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 hover:bg-[#2a2a2a]"
					onClick={onHome}
				>
					<House className={`h-3.5 w-3.5`} />
				</Button>
			</div>

			{/* Kebab menu */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#2a2a2a]">
						<MoreVertical className="h-3.5 w-3.5" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="bg-[#252526] border-[#3c3c3c] text-[#cccccc] w-[200px]">
					{/*
					<DropdownMenuItem
						className="text-xs py-1.5 cursor-pointer hover:bg-[#2a2a2a] focus:bg-[#37373d] flex items-center"
						onClick={onShowConnectDialog}
					>
						<LinkIcon className="h-3.5 w-3.5 mr-2 text-blue-400" /> Connect to Remote Host...
					</DropdownMenuItem>
					<DropdownMenuSeparator className="bg-[#3c3c3c]" />
					<DropdownMenuItem className="text-xs py-1.5 cursor-pointer hover:bg-[#2a2a2a] focus:bg-[#37373d]">
						Take Screenshot
					</DropdownMenuItem>
					<DropdownMenuItem className="text-xs py-1.5 cursor-pointer hover:bg-[#2a2a2a] focus:bg-[#37373d]">
						Record Screen
					</DropdownMenuItem>
					*/}
					<DropdownMenuItem className="text-xs py-1.5 cursor-pointer hover:bg-[#2a2a2a] focus:bg-[#37373d]">
						Rotate Device
					</DropdownMenuItem>
					{/*
					<DropdownMenuSeparator className="bg-[#3c3c3c]" />
					<DropdownMenuItem className="text-xs py-1.5 cursor-pointer hover:bg-[#2a2a2a] focus:bg-[#37373d]">
						Device Settings
					</DropdownMenuItem>
					*/}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};