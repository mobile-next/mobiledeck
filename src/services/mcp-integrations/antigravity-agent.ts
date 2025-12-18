import * as fs from 'node:fs';
import * as path from 'node:path';
import { Agent } from "./agent";

interface AntigravityMcpServerConfig {
	type: string;
	command: string;
	args: string[];
}

interface AntigravityConfig {
	servers?: Record<string, AntigravityMcpServerConfig>;
	// allow any extra properties without typing them
	[key: string]: unknown;
}

export class AntigravityAgent implements Agent {
	private readonly mcpConfigPath: string;
	private readonly mobileMcpKey = 'mobile-mcp';
	private readonly mobileMcpValue: AntigravityMcpServerConfig = {
		type: 'stdio',
		command: 'npx',
		args: ['-y', '@mobilenext/mobile-mcp@latest'],
	};

	constructor(homeDir: string) {
		// /Users/johndoe/Library/Application Support/Antigravity/User/mcp.json
		this.mcpConfigPath = path.join(
			homeDir,
			'Library',
			'Application Support',
			'Antigravity',
			'User',
			'mcp.json',
		);
	}

	isAgentInstalled(): boolean {
		return fs.existsSync(this.mcpConfigPath);
	}

	isMcpConfigured(): boolean {
		if (!this.isAgentInstalled()) {
			return false;
		}

		try {
			const fileContent = fs.readFileSync(this.mcpConfigPath, 'utf-8');
			const config = JSON.parse(fileContent) as AntigravityConfig;
			return !!config.servers && !!config.servers[this.mobileMcpKey];
		} catch {
			return false;
		}
	}

	configureMcp(): void {
		let config: AntigravityConfig = {};

		if (fs.existsSync(this.mcpConfigPath)) {
			try {
				const fileContent = fs.readFileSync(this.mcpConfigPath, 'utf-8');
				config = JSON.parse(fileContent) as AntigravityConfig;
			} catch {
				// if parsing fails, start from a clean config
				config = {};
			}
		}

		if (!config.servers) {
			config.servers = {};
		}

		if (!config.servers[this.mobileMcpKey]) {
			config.servers[this.mobileMcpKey] = this.mobileMcpValue;

			// ensure directory exists
			const dir = path.dirname(this.mcpConfigPath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}

			fs.writeFileSync(this.mcpConfigPath, JSON.stringify(config, null, 2));
		}
	}

	isRestartRequired(): boolean {
		return false;
	}
}
