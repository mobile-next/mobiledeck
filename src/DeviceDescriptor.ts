export interface DeviceDescriptor {
	id: string;
	name: string;
	platform: "ios" | "android";
	type: "real" | "emulator" | "simulator";
}
