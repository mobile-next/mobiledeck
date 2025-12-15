export interface Agent {
	/**
	 * Checks if the agent is installed by verifying the agent directory exists
	 * @returns true if the agent directory exists
	 */
	isAgentInstalled(): boolean;

	/**
	 * Checks if the Mobile MCP server is already configured in the agent's mcp.json
	 * @returns true if Mobile MCP is configured
	 */
	isMcpConfigured(): boolean;

	/**
	 * Configures the Mobile MCP server in the agent's mcp.json file
	 * Creates the file and directory structure if needed
	 */
	configureMcp(): void;
}
