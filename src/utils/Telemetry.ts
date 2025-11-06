import * as vscode from 'vscode';
import * as os from 'node:os';
import { PostHog } from 'posthog-node';

export class Telemetry {
	private client: PostHog;

	constructor(private distinctId: string) {
		this.client = new PostHog('phc_3IL723l6xo0k7ANkMYpi4G0OaGIrodLuZjbvn6iGXHx', {
			host: 'https://us.i.posthog.com',
			disableGeoip: false,
		});
	}

	private getExtensionVersion(): string {
		try {
			const extension = vscode.extensions.getExtension('mobilenext.mobiledeck');
			return extension?.packageJSON?.version || 'unknown';
		} catch (error: any) {
			console.debug('Error getting extension version:', error);
			return 'unknown';
		}
	}

	public async sendEvent(event: string, properties?: Record<string, any>): Promise<void> {
		try {
			if (!vscode.env.isTelemetryEnabled) {
				return;
			}

			const systemProps: Record<string, string | number> = {
				Platform: os.platform(),
				Version: this.getExtensionVersion(),
				NodeVersion: process.version,
				EditorName: vscode.env.appName,
			};

			this.client.capture({
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
			await this.client.shutdown();
		} catch (error) {
			console.debug('Error shutting down telemetry:', error);
		}
	}
}
