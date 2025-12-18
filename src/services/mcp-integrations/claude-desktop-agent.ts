import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import { Agent } from "./agent";

interface ClaudeMcpServerConfig {
	type: string;
	command: string;
	args: string[];
	env: Record<string, string>;
}

export class ClaudeDesktopAgent implements Agent {
	private readonly claudeConfigPath: string;
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

	constructor(homeDir: string) {
		this.claudeConfigPath = path.join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
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

			return config.mcpServers && config.mcpServers[this.mobileMcpKey] !== undefined;
		} catch {
			return false;
		}
	}

	configureMcp(): void {
		if (!this.isAgentInstalled()) {
			throw new Error('Claude Desktop is not installed. Config file does not exist at ~/Library/Application Support/Claude/claude_desktop_config.json');
		}

		let config: any = {};

		try {
			const fileContent = fs.readFileSync(this.claudeConfigPath, 'utf-8');
			config = JSON.parse(fileContent);
		} catch (e) {
			throw new Error(`Failed to parse Claude Desktop config: ${e}`);
		}

		if (!config.mcpServers) {
			config.mcpServers = {};
		}

		if (!config.mcpServers[this.mobileMcpKey]) {
			config.mcpServers[this.mobileMcpKey] = this.mobileMcpValue;
			fs.writeFileSync(this.claudeConfigPath, JSON.stringify(config, null, 2));
		}
	}

	isRestartRequired(): boolean {
		if (process.platform !== 'darwin') {
			// TODO: implement for windows/linux
			return true;
		}

		try {
			return execSync('/bin/ps -o command')
				.toString()
				.split('\n')
				.includes('/Applications/Claude.app/Contents/MacOS/Claude');
		} catch (e) {
			console.error('Failed to check running processes:', e);
			return true;
		}
	}
}
