import React from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogTrigger,
} from "./components/ui/dialog";

import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

import { ChevronDown, MoreVertical, Play, Pause, RefreshCw, Wifi, X, Server, Smartphone, LinkIcon } from "lucide-react";

export interface ConnectDialogProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	remoteHostIp: string;
	onRemoteHostIpChange: (ip: string) => void;
	recentHosts: string[];
	onConnectToHost: () => void;
	onSelectRecentHost: (host: string) => void;
}

export const ConnectDialog: React.FC<ConnectDialogProps> = ({
	isOpen,
	onOpenChange,
	remoteHostIp,
	onRemoteHostIpChange,
	recentHosts,
	onConnectToHost,
	onSelectRecentHost,
}) => {
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="bg-[#252526] border-[#3c3c3c] text-[#cccccc] sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle className="flex items-center">
						<LinkIcon className="h-5 w-5 mr-2 text-blue-400" /> Connect to Remote Host
					</DialogTitle>
					<DialogDescription className="text-[#888888] pt-1">
						Enter the IP address of the remote device to stream.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="ip-address" className="text-right text-xs">
							IP Address
						</Label>
						<Input
							id="ip-address"
							value={remoteHostIp}
							onChange={(e) => onRemoteHostIpChange(e.target.value)}
							placeholder="e.g., 192.168.1.100"
							className="col-span-3 bg-[#1e1e1e] border-[#3c3c3c] focus:border-blue-500 h-9 text-xs"
						/>
					</div>
					{recentHosts.length > 0 && (
						<div className="mt-2">
							<Label className="text-xs text-[#888888] mb-2 block">Recent Hosts:</Label>
							<div className="space-y-1.5">
								{recentHosts.map((host) => (
									<Button
										key={host}
										variant="outline"
										size="sm"
										className="w-full justify-start h-8 text-xs bg-[#1e1e1e] border-[#3c3c3c] hover:bg-[#2a2a2a] hover:border-blue-500"
										onClick={() => onSelectRecentHost(host)}
									>
										<Wifi className="h-3.5 w-3.5 mr-2 text-blue-400" /> {host}
									</Button>
								))}
							</div>
						</div>
					)}
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="h-9 text-xs bg-[#1e1e1e] border-[#3c3c3c] hover:bg-[#2a2a2a]"
					>
						Cancel
					</Button>
					<Button
						type="submit"
						onClick={onConnectToHost}
						className="h-9 text-xs bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
					>
						Connect
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
