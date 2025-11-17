import React from "react";
import { DeviceDescriptor } from "../models";

interface ConnectingSequenceProps {
	device: DeviceDescriptor;
}

export const ConnectingSequence: React.FC<ConnectingSequenceProps> = ({ device }) => {
	return (
		<div className="w-full h-full flex items-center justify-center text-center" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
			Connecting to <br /> {device.name}...
		</div>
	);
};
