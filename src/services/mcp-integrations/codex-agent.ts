import * as fs from 'node:fs';
import * as path from 'node:path';
import { Agent } from "./agent";

export class CodexAgent implements Agent {
	private readonly configPath: string;

	constructor(homeDir: string) {
		// ~/.codex/config.toml
		this.configPath = path.join(homeDir, '.codex', 'config.toml');
	}

	isAgentInstalled(): boolean {
		return fs.existsSync(this.configPath);
	}

	isMcpConfigured(): boolean {
		if (!fs.existsSync(this.configPath)) {
			return false;
		}

		try {
			const content = fs.readFileSync(this.configPath, 'utf-8');
			// Simple check: does the TOML contain the [mcp_servers.mobile_mcp] section?
			return content.includes('[mcp_servers.mobile_mcp]');
		} catch {
			return false;
		}
	}

	configureMcp(): void {
		const dir = path.dirname(this.configPath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		let content = '';
		if (fs.existsSync(this.configPath)) {
			try {
				content = fs.readFileSync(this.configPath, 'utf-8');
			} catch {
				// fallback to empty file
			}
		}

		if (content.includes('[mcp_servers.mobile_mcp]')) {
			// already configured
			return;
		}

		const section = [
			'',
			'[mcp_servers.mobile_mcp]',
			'command = "npx"',
			'args = ["-y", "@mobilenext/mobile-mcp"]',
			'',
		].join('\n');

		if (content.length > 0 && !content.endsWith('\n')) {
			content += '\n';
		}

		const updated = content + section;
		fs.writeFileSync(this.configPath, updated);
	}
}
