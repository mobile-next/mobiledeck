import React, { useState } from 'react';
import vscode from './vscode';

type AgentEditor = 'claudecode' | 'cline' | 'copilot' | 'qodo';

interface AgentConfig {
  name: string;
  command: string;
  instruction: string;
  useTerminal: boolean;
}

export const Footer: React.FC = () => {
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentEditor>('claudecode');
  const [showInstructions, setShowInstructions] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const agentConfigs: Record<AgentEditor, AgentConfig> = {
    claudecode: {
      name: 'Claude Code',
      command: 'claude mcp add --transport stdio mobile-mcp -- npx -y @mobilenext/mobile-mcp@latest',
      instruction: 'Installing MCP server to Claude Code...',
      useTerminal: true
    },
    cline: {
      name: 'Cline',
      command: JSON.stringify({
        "mcpServers": {
          "mobile-mcp": {
            "command": "npx",
            "args": ["-y", "@mobilenext/mobile-mcp@latest"]
          }
        }
      }, null, 2),
      instruction: 'Configuration copied! Now go to Cline > Settings > MCP > settings.json and paste this configuration.',
      useTerminal: false
    },
    copilot: {
      name: 'VSCode Copilot',
      command: 'code --add-mcp "{\\"name\\":\\"mobile-mcp\\",\\"command\\":\\"npx\\",\\"args\\":[\\"-y\\",\\"@mobilenext/mobile-mcp@latest\\"]}"',
      instruction: 'Installing MCP server to VSCode...',
      useTerminal: true
    },
    qodo: {
      name: 'Qodo',
      command: JSON.stringify({
        "mcpServers": {
          "mobile-mcp": {
            "command": "npx",
            "args": ["-y", "@mobilenext/mobile-mcp@latest"]
          }
        }
      }, null, 2),
      instruction: 'Configuration copied! Now go to Qodo settings and paste this in the MCP configuration.',
      useTerminal: false
    }
  };

  const copyToClipboard = (text: string, commandType: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCommand(commandType);
      setTimeout(() => setCopiedCommand(null), 2000);
    });
  };

  const handleInstallClick = () => {
    const config = agentConfigs[selectedAgent];

    // Show instructions
    setShowInstructions(true);
    setTimeout(() => setShowInstructions(false), 5000);

    // If it's a terminal command, send to extension to open terminal and execute
    if (config.useTerminal) {
      vscode.postMessage({
        command: 'installMCP',
        agent: selectedAgent,
        commandText: config.command
      });
    } else {
      // For non-terminal commands (JSON configs), copy to clipboard
      copyToClipboard(config.command, selectedAgent);
    }
  };

  const handleCopyClick = () => {
    const config = agentConfigs[selectedAgent];
    copyToClipboard(config.command, selectedAgent);
  };

  return (
    <div style={{
      background: '#1a1a1a',
      borderTop: '1px solid #2a2a2a',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      flexWrap: 'wrap'
    }}>
      <style>{`
        .footer-text {
          font-size: 12px;
          color: #666;
          margin: 0;
        }

        .dropdown-container {
          position: relative;
          display: inline-block;
        }

        .dropdown-btn {
          background: #2a2a2a;
          border: 1px solid #333;
          border-radius: 6px;
          padding: 8px 16px;
          color: #cccccc;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 150px;
          justify-content: space-between;
        }

        .dropdown-btn:hover {
          background: #333;
          border-color: #444;
        }

        .dropdown-menu {
          position: absolute;
          bottom: 100%;
          left: 0;
          margin-bottom: 4px;
          background: #2a2a2a;
          border: 1px solid #333;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          min-width: 150px;
          z-index: 1000;
        }

        .dropdown-item {
          padding: 10px 16px;
          color: #cccccc;
          font-size: 13px;
          cursor: pointer;
          transition: background 0.15s;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          border: none;
          width: 100%;
          text-align: left;
          background: none;
        }

        .dropdown-item:hover {
          background: #333;
        }

        .dropdown-item:first-child {
          border-radius: 6px 6px 0 0;
        }

        .dropdown-item:last-child {
          border-radius: 0 0 6px 6px;
        }

        .dropdown-item.selected {
          background: #1a1a1a;
          color: #00ff88;
        }

        .install-btn {
          background: linear-gradient(135deg, #00ff88 0%, #00cc6f 100%);
          border: none;
          border-radius: 8px;
          padding: 10px 24px;
          color: #0a0a0a;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .install-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
        }

        .install-btn:active {
          transform: translateY(0);
        }

        .instructions-box {
          background: #2a2a2a;
          border: 1px solid #00ff88;
          border-radius: 6px;
          padding: 12px 16px;
          color: #00ff88;
          font-size: 12px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 500px;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .code-block {
          background: #0a0a0a;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 12px 16px;
          font-family: 'Courier New', monospace;
          font-size: 11px;
          color: #00ff88;
          max-width: 600px;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .copy-btn {
          position: absolute;
          right: 8px;
          background: #2a2a2a;
          border: none;
          border-radius: 4px;
          padding: 4px 10px;
          color: #888;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .copy-btn:hover {
          background: #333;
          color: #00ff88;
        }

        .copy-btn.copied {
          background: #00ff88;
          color: #0a0a0a;
        }
      `}</style>

      <p className="footer-text">
        Add Mobile MCP to:
      </p>

      <div className="dropdown-container">
        <button
          className="dropdown-btn"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span>{agentConfigs[selectedAgent].name}</span>
          <span>{isDropdownOpen ? '▲' : '▼'}</span>
        </button>

        {isDropdownOpen && (
          <div className="dropdown-menu">
            {(Object.keys(agentConfigs) as AgentEditor[]).map((key) => (
              <button
                key={key}
                className={`dropdown-item ${selectedAgent === key ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedAgent(key);
                  setIsDropdownOpen(false);
                }}
              >
                {agentConfigs[key].name}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        className="install-btn"
        onClick={handleInstallClick}
      >
        <span>Install MCP Server</span>
      </button>

      {showInstructions && (
        <div className="instructions-box">
          {agentConfigs[selectedAgent].instruction}
        </div>
      )}

      <div style={{ width: '100%', marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
        <div className="code-block" style={{ position: 'relative', paddingRight: '70px' }}>
          {agentConfigs[selectedAgent].command}
          <button
            className={`copy-btn ${copiedCommand === selectedAgent ? 'copied' : ''}`}
            onClick={handleCopyClick}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: '#2a2a2a',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 10px',
              color: '#888',
              fontSize: '11px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            {copiedCommand === selectedAgent ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};
