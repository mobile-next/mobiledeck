import { JsonRpcClient } from './JsonRpcClient';
import {
	DeviceInfoResponse,
	ListDevicesResponse,
	ScreenshotResponse,
	ButtonType,
} from './models';

export class MobilecliClient {

	constructor(private readonly jsonRpcClient: JsonRpcClient) { }

	// device management
	async getDeviceInfo(deviceId: string): Promise<DeviceInfoResponse> {
		return this.jsonRpcClient.sendJsonRpcRequest<DeviceInfoResponse>('device_info', { deviceId });
	}

	async listDevices(includeOffline: boolean = false): Promise<ListDevicesResponse> {
		return this.jsonRpcClient.sendJsonRpcRequest<ListDevicesResponse>('devices', { includeOffline });
	}

	async bootDevice(deviceId: string): Promise<void> {
		return this.jsonRpcClient.sendJsonRpcRequest('device_boot', { deviceId });
	}

	async rebootDevice(deviceId: string): Promise<void> {
		return this.jsonRpcClient.sendJsonRpcRequest('device_reboot', { deviceId });
	}

	async shutdownDevice(deviceId: string): Promise<void> {
		return this.jsonRpcClient.sendJsonRpcRequest('device_shutdown', { deviceId });
	}

	// input/output operations
	async tap(deviceId: string, x: number, y: number): Promise<void> {
		return this.jsonRpcClient.sendJsonRpcRequest('io_tap', { x, y, deviceId });
	}

	async gesture(deviceId: string, actions: Array<{ type: string; duration?: number; x?: number; y?: number; button?: number }>): Promise<void> {
		return this.jsonRpcClient.sendJsonRpcRequest('io_gesture', { deviceId, actions });
	}

	async inputText(deviceId: string, text: string, timeoutMs?: number): Promise<void> {
		return this.jsonRpcClient.sendJsonRpcRequest('io_text', { text, deviceId }, timeoutMs);
	}

	async pressButton(deviceId: string, button: ButtonType): Promise<void> {
		return this.jsonRpcClient.sendJsonRpcRequest('io_button', { deviceId, button });
	}

	// screenshot
	async takeScreenshot(deviceId: string): Promise<ScreenshotResponse> {
		return this.jsonRpcClient.sendJsonRpcRequest<ScreenshotResponse>('screenshot', { deviceId });
	}
}
