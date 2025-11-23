import React from "react";
import { DeviceDescriptor, DevicePlatform } from "@shared/models";
import { AndroidBootSequence } from "./AndroidBootSequence";
import { IosBootSequence } from "./IosBootSequence";

interface BootSequenceProps {
	device: DeviceDescriptor;
	skinOverlayUri: string;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ device, skinOverlayUri }) => {
	if (device.platform === DevicePlatform.ANDROID) {
		return <AndroidBootSequence skinOverlayUri={skinOverlayUri} />;
	}

	return <IosBootSequence />;
};
