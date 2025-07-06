export enum DevicePlatform {
	IOS = "ios",
	ANDROID = "android",
}

export enum DeviceType {
	REAL = "real",
	EMULATOR = "emulator",
	SIMULATOR = "simulator",
}

export interface DeviceDescriptor {
	id: string;
	name: string;
	platform: DevicePlatform;
	type: DeviceType;
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
