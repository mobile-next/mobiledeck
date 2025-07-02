export interface DeviceDescriptor {
	id: string;
	name: string;
	platform: string;
	type: string;
}

export interface ListDevicesResponse {
	devices: DeviceDescriptor[];
}

export interface DeviceInfoResponse {
	device: DeviceInfo;
}

export interface DeviceInfo {
	id: string;
	name: string;
	platform: string;
	type: string;
	screenSize: {
		width: number;
		height: number;
		scale: number;
	};
}
