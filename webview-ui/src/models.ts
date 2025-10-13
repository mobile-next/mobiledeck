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
	version?: string;
}

export interface ListDevicesResponse {
	devices: DeviceDescriptor[];
}

export interface DeviceInfoResponse {
	device: DeviceInfo;
}

export interface ScreenSize {
	width: number;
	height: number;
	scale: number;
}

export interface DeviceInfo {
	id: string;
	name: string;
	platform: string;
	type: string;
	screenSize: ScreenSize;
}
