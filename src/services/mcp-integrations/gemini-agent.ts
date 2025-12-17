import * as fs from 'node:fs';
import * as path from 'node:path';
import { Agent } from "./agent";

interface GeminiMcpServerConfig {
	command: string;
	args: string[];
}

export class GeminiAgent implements Agent {
	private readonly agentDirectory: string;
	private readonly settingsPath: string;
	private readonly mobileMcpKey = 'mobile-mcp';
	private readonly mobileMcpValue: GeminiMcpServerConfig = {
		command: 'npx',
		args: [
			'-y',
			'@mobilenext/mobile-mcp'
		]
	};

	constructor(homeDir: string, currentPath: string) {
		this.agentDirectory = path.join(homeDir, '.gemini');
		this.settingsPath = path.join(currentPath, '.gemini', 'settings.json');
	}

	isAgentInstalled(): boolean {
		return fs.existsSync(this.agentDirectory);
	}

	isMcpConfigured(): boolean {
		if (!this.isAgentInstalled()) {
			return false;
		}

		if (!fs.existsSync(this.settingsPath)) {
			return false;
		}

		try {
			const fileContent = fs.readFileSync(this.settingsPath, 'utf-8');
			const config = JSON.parse(fileContent);
			return config.mcpServers && config.mcpServers[this.mobileMcpKey] !== undefined;
		} catch {
			return false;
		}
	}

	configureMcp(): void {
		if (!this.isAgentInstalled()) {
			throw new Error('Gemini is not installed. ~/.gemini directory does not exist.');
		}

		let config: any = {};

		if (fs.existsSync(this.settingsPath)) {
			try {
				const fileContent = fs.readFileSync(this.settingsPath, 'utf-8');
				config = JSON.parse(fileContent);
			} catch (e) {
				throw new Error(`Failed to parse .gemini/settings.json: ${e}`);
			}
		}

		if (!config.mcpServers) {
			config.mcpServers = {};
		}

		if (config.mcpServers[this.mobileMcpKey]) {
			// nothing to do
			return;
		}

		config.mcpServers[this.mobileMcpKey] = this.mobileMcpValue;

		const configDir = path.dirname(this.settingsPath);
		if (!fs.existsSync(configDir)) {
			fs.mkdirSync(configDir, { recursive: true });
		}

		fs.writeFileSync(this.settingsPath, JSON.stringify(config, null, 2));
	}

	isRestartRequired(): boolean {
		return false;
	}
}
