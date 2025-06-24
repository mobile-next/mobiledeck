export interface DeviceDescriptor {
	id: string;
	name: string;
	platform: string;
	type: string;
}

export interface ListDevicesResponse {
	devices: DeviceDescriptor[];
}