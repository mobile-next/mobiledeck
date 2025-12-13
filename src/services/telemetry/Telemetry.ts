import * as vscode from 'vscode';
import * as os from 'node:os';
import { PostHog } from 'posthog-node';
import { ExtensionUtils } from '../../utils/ExtensionUtils';

export class Telemetry {
	private static client: PostHog;

	constructor(private distinctId: string) {
		if (!Telemetry.client) {
			Telemetry.client = new PostHog('phc_3IL723l6xo0k7ANkMYpi4G0OaGIrodLuZjbvn6iGXHx', {
				host: 'https://us.i.posthog.com',
				disableGeoip: false,
			});

			process.on("uncaughtException", (error: Error) => {
				if (this.shouldCaptureException(error)) {
					Telemetry.client.captureException(error, distinctId);
				}
			});
		}
	}

	private shouldCaptureException(error: Error): boolean {
		// only capture exceptions if the stack trace contains "mobilenext" in any file path
		if (!error.stack) {
			return false;
		}

		return error.stack.includes('mobilenext');
	}

	private client(): PostHog {
		return Telemetry.client;
	}

	public async sendEvent(event: string, properties?: Record<string, any>): Promise<void> {
		try {
			if (!vscode.env.isTelemetryEnabled) {
				return;
			}

			const systemProps: Record<string, string> = {
				Platform: os.platform(),
				NodeVersion: process.version,
				EditorName: ExtensionUtils.getAppName(),
				Version: ExtensionUtils.getExtensionVersion(),
			};

			this.client().capture({
				distinctId: this.distinctId,
				event,
				properties: {
					...systemProps,
					...properties,
				}
			});
		} catch (error) {
			// silently fail - telemetry should never break functionality
			console.debug('Telemetry error:', error);
		}
	}

	public async flush() {
		try {
			await this.client().shutdown();
		} catch (error) {
			console.debug('Error shutting down telemetry:', error);
		}
	}
}
