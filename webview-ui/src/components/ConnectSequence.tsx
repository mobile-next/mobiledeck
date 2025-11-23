import React from "react";
import { DeviceDescriptor, DevicePlatform } from "@shared/models";
import { AndroidConnectSequence } from "./AndroidConnectSequence";
import { IosConnectSequence } from "./IosConnectSequence";

interface ConnectSequenceProps {
	device: DeviceDescriptor;
	skinOverlayUri: string;
	message: string;
}

export const ConnectSequence: React.FC<ConnectSequenceProps> = ({ device, skinOverlayUri, message }) => {
	if (device.platform === DevicePlatform.ANDROID) {
		return <AndroidConnectSequence skinOverlayUri={skinOverlayUri} message={message} />;
	}

	return <IosConnectSequence message={message} />;
};
