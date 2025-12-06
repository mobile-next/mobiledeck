import vscode from './vscode';

export const telemetry = (event: string, properties?: Record<string, any>) => {
	vscode.postMessage({
		command: 'telemetry',
		event,
		properties,
	});
};

