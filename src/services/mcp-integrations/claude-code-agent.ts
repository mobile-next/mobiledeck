import * as fs from 'node:fs';
import * as path from 'node:path';
import { Agent } from "./agent";

interface ClaudeMcpServerConfig {
	type: string;
	command: string;
	args: string[];
	env: Record<string, string>;
}

export class ClaudeAgent implements Agent {
	private readonly claudeConfigPath: string;
	private readonly currentPath: string;
	private readonly mobileMcpKey = 'mobile-mcp';
	private readonly mobileMcpValue: ClaudeMcpServerConfig = {
		type: 'stdio',
		command: 'npx',
		args: [
			'-y',
			'@mobilenext/mobile-mcp@latest'
		],
		env: {}
	};

	constructor(homeDir: string, currentPath: string) {
		this.claudeConfigPath = path.join(homeDir, '.claude.json');
		this.currentPath = currentPath;
	}

	isAgentInstalled(): boolean {
		return fs.existsSync(this.claudeConfigPath);
	}

	isMcpConfigured(): boolean {
		if (!this.isAgentInstalled()) {
			return false;
		}

		try {
			const fileContent = fs.readFileSync(this.claudeConfigPath, 'utf-8');
			const config = JSON.parse(fileContent);
			
			if (!config.projects || !config.projects[this.currentPath]) {
				return false;
			}

			const project = config.projects[this.currentPath];
			return project.mcpServers && project.mcpServers[this.mobileMcpKey] !== undefined;
		} catch (e) {
			return false;
		}
	}

	configureMcp(): void {
		if (!this.isAgentInstalled()) {
			throw new Error('Claude is not installed. ~/.claude.json does not exist.');
		}

		let config: any = {};

		try {
			const fileContent = fs.readFileSync(this.claudeConfigPath, 'utf-8');
			config = JSON.parse(fileContent);
		} catch (e) {
			throw new Error(`Failed to parse ~/.claude.json: ${e}`);
		}

		if (!config.projects) {
			config.projects = {};
		}

		if (!config.projects[this.currentPath]) {
			config.projects[this.currentPath] = {
				allowedTools: [],
				mcpContextUris: [],
				mcpServers: {},
				enabledMcpjsonServers: []
			};
		}

		const project = config.projects[this.currentPath];
		
		if (!project.mcpServers) {
			project.mcpServers = {};
		}

		if (!project.mcpServers[this.mobileMcpKey]) {
			project.mcpServers[this.mobileMcpKey] = this.mobileMcpValue;
			fs.writeFileSync(this.claudeConfigPath, JSON.stringify(config, null, 2));
		}
	}
}
