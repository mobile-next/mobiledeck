import * as fs from 'node:fs';
import * as path from 'node:path';
import { Agent } from './agent';

interface McpServerConfig {
	command: string;
	args: string[];
	env: Record<string, string>;
}

export class CursorAgent implements Agent {
	private readonly agentDirectory: string;
	private readonly mcpConfigPath: string;
	private readonly mobileMcpKey = 'Mobile MCP';
	private readonly mobileMcpValue: McpServerConfig = {
		command: 'npx',
		args: [
			'-y',
			'@mobilenext/mobile-mcp@latest'
		],
		env: {}
	};

	constructor(homeDir: string) {
		this.agentDirectory = path.join(homeDir, '.cursor');
		this.mcpConfigPath = path.join(this.agentDirectory, 'mcp.json');
	}

	isAgentInstalled(): boolean {
		return fs.existsSync(this.agentDirectory);
	}

	isMcpConfigured(): boolean {
		if (!fs.existsSync(this.mcpConfigPath)) {
			return false;
		}

		try {
			const fileContent = fs.readFileSync(this.mcpConfigPath, 'utf-8');
			const config = JSON.parse(fileContent);
			return config.mcpServers && config.mcpServers[this.mobileMcpKey] !== undefined;
		} catch (e) {
			return false;
		}
	}

	configureMcp(): void {
		let config: any = {};

		if (fs.existsSync(this.mcpConfigPath)) {
			try {
				const fileContent = fs.readFileSync(this.mcpConfigPath, 'utf-8');
				config = JSON.parse(fileContent);
			} catch (e) {
				config = {};
			}
		}

		if (!config.mcpServers) {
			config.mcpServers = {};
		}

		if (!config.mcpServers[this.mobileMcpKey]) {
			config.mcpServers[this.mobileMcpKey] = this.mobileMcpValue;
			
			// Ensure the directory exists before writing
			const configDir = path.dirname(this.mcpConfigPath);
			if (!fs.existsSync(configDir)) {
				fs.mkdirSync(configDir, { recursive: true });
			}
			
			fs.writeFileSync(this.mcpConfigPath, JSON.stringify(config, null, 2));
		}
	}
}