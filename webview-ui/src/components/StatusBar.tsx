import React from 'react';
import { DeviceDescriptor } from '@shared/models';

interface StatusBarProps {
	isRefreshing: boolean;
	selectedDevice: DeviceDescriptor | null;
	fpsCount: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
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
