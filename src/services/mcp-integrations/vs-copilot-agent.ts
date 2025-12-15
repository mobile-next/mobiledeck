import * as fs from 'node:fs';
import * as path from 'node:path';
import { Agent } from "./agent";

export class VSCodeCopilotAgent implements Agent {
	private readonly agentDirectory: string;

	constructor(homeDir: string) {
		this.agentDirectory = path.join(homeDir, '.vscode-copilot');
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