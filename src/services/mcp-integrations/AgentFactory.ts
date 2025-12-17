import { Agent } from './agent';
import { CursorAgent } from './cursor-agent';
import { ClaudeAgent } from './claude-code-agent';
import { ClaudeDesktopAgent } from './claude-desktop-agent';
import { CodexAgent } from './codex-agent';
import { AntigravityAgent } from './antigravity-agent';
import { GeminiAgent } from './gemini-agent';

export class AgentFactory {
	private static readonly AGENT_KEYS = [
		'Cursor',
		'Claude Code',
		'Claude Desktop',
		'Codex',
		'Antigravity',
		'Gemini'
	];

	static getAllKeys(): string[] {
		return [...this.AGENT_KEYS];
	}

	static createAgent(agentName: string, homeDir: string, currentPath: string): Agent {
		switch (agentName) {
			case 'Cursor':
				return new CursorAgent(homeDir);
			case 'Claude Code':
				return new ClaudeAgent(homeDir, currentPath);
			case 'Claude Desktop':
				return new ClaudeDesktopAgent(homeDir);
			case 'Codex':
				return new CodexAgent(homeDir);
			case 'Antigravity':
				return new AntigravityAgent(homeDir);
			case 'Gemini':
				return new GeminiAgent(homeDir, currentPath);
			default:
				throw new Error(`Unknown agent: ${agentName}`);
		}
	}
}
