import * as fs from 'node:fs';
import * as path from 'node:path';
import { Agent } from "./agent";

export class QodoAgent implements Agent {
	private readonly agentDirectory: string;

	constructor(homeDir: string) {
		this.agentDirectory = path.join(homeDir, '.qodo');
	}

	isAgentInstalled(): boolean {
		return fs.existsSync(this.agentDirectory);
	}

	isMcpConfigured(): boolean {
		return false;
	}

	configureMcp(): void {
		// Not implemented yet
	}
}