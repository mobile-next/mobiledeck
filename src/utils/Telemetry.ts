import * as vscode from 'vscode';
import { PostHog } from 'posthog-node';

export class Telemetry {
	private client: PostHog;

	constructor(private distinctId: string) {
		this.client = new PostHog('phc_3IL723l6xo0k7ANkMYpi4G0OaGIrodLuZjbvn6iGXHx', {
			host: 'https://us.i.posthog.com',
			disableGeoip: false,
		});
	}

	public async sendEvent(event: string, properties?: Record<string, any>): Promise<void> {
		try {
			if (!vscode.env.isTelemetryEnabled) {
				return;
			}

			this.client.capture({
				distinctId: this.distinctId,
				event,
				properties
			});
		} catch (error) {
			// silently fail - telemetry should never break functionality
			console.debug('Telemetry error:', error);
		}
	}

	public async dispose(): Promise<void> {
		try {
			await this.client.shutdown();
		} catch (error) {
			console.debug('Error shutting down telemetry:', error);
		}
	}
}
