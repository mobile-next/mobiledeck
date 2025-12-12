import { JsonRpcClient } from './JsonRpcClient';
import {
	DeviceInfoResponse,
	ListDevicesResponse,
	ScreenshotResponse,
	ButtonType,
} from './models';

class DeviceClient {
	constructor(
		private readonly jsonRpcClient: JsonRpcClient,
		private readonly deviceId: string
	) {}

	private request<T = void>(
		method: string,
		params?: Record<string, any>,
		timeoutMs?: number
	): Promise<T> {
		const combinedParams = { deviceId: this.deviceId, ...(params || {}) };
		return this.jsonRpcClient.sendJsonRpcRequest<T>(method, combinedParams, timeoutMs);
	}

	async getDeviceInfo(): Promise<DeviceInfoResponse> {
		return this.request<DeviceInfoResponse>('device_info');
	}

	async boot(): Promise<void> {
		return this.request('device_boot');
	}

	async reboot(): Promise<void> {
		return this.request('device_reboot');
	}

	async shutdown(): Promise<void> {
		return this.request('device_shutdown');
	}

	async tap(x: number, y: number): Promise<void> {
		return this.request('io_tap', { x, y });
	}

	async gesture(actions: Array<{ type: string; duration?: number; x?: number; y?: number; button?: number }>): Promise<void> {
		return this.request('io_gesture', { actions });
	}

	async inputText(text: string, timeoutMs?: number): Promise<void> {
		return this.request('io_text', { text }, timeoutMs);
	}

	async pressButton(button: ButtonType): Promise<void> {
		return this.request('io_button', { button });
	}

	async takeScreenshot(): Promise<ScreenshotResponse> {
		return this.request<ScreenshotResponse>('screenshot');
	}
}

export class MobilecliClient {

	constructor(private readonly jsonRpcClient: JsonRpcClient) { }

	it(deviceId: string): DeviceClient {
		return new DeviceClient(this.jsonRpcClient, deviceId);
	}

	// device management for listing devices (not device-specific)
	async listDevices(includeOffline: boolean = false): Promise<ListDevicesResponse> {
		return this.jsonRpcClient.sendJsonRpcRequest<ListDevicesResponse>('devices', { includeOffline });
	}
}
