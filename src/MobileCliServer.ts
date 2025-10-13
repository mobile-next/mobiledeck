import * as vscode from 'vscode';
import * as fs from 'fs';
import { ChildProcess, execFileSync } from 'child_process';
import { spawn } from 'child_process';
import { Logger } from './utils/Logger';
import { PortManager } from './managers/PortManager';
import { DEFAULT_CIPHERS } from 'tls';

export class MobileCliServer {

	private static DEFAULT_SERVER_PORT = 12000;

	private logger: Logger = new Logger('Mobiledeck');
	private portManager: PortManager = new PortManager(this.logger);

	private mobilecliPath: string;
	private serverPort: number = MobileCliServer.DEFAULT_SERVER_PORT;
	private mobilecliServerProcess: ChildProcess | null = null;

	constructor(private readonly context: vscode.ExtensionContext) {
		this.mobilecliPath = this.findMobilecliPath();
	}

	private verbose(message: string) {
		this.logger.log(message);
	}

	private findMobilecliPath(): string {
		const basePath = vscode.Uri.joinPath(this.context.extensionUri, 'assets', 'mobilecli').fsPath;
		const mobilecliPath = process.platform === 'win32' ? `${basePath}.exe` : basePath;

		this.verbose("mobilecli path: " + mobilecliPath);

		const text = execFileSync(mobilecliPath, ['--version']).toString().trim();
		this.verbose("mobilecli version: " + text);

		return mobilecliPath;
	}

	private async checkMobilecliServerRunning(): Promise<boolean> {
		return await this.portManager.checkServerHealth(MobileCliServer.DEFAULT_SERVER_PORT);
	}

	public async stopMobilecliServer(): Promise<void> {
		if (this.mobilecliServerProcess) {
			this.mobilecliServerProcess.kill();
			this.mobilecliServerProcess = null;
		}
	}

	public async launchMobilecliServer(): Promise<void> {
		const isRunning = await this.checkMobilecliServerRunning();
		if (isRunning) {
			this.verbose(`mobilecli server is already running on default port`);
			return;
		}

		if (this.mobilecliServerProcess) {
			this.verbose('mobilecli server process already exists');
			return;
		}

		// look up an available port that is not DEFAULT_SERVER_PORT
		this.serverPort = await this.portManager.findAvailablePort(MobileCliServer.DEFAULT_SERVER_PORT + 1, MobileCliServer.DEFAULT_SERVER_PORT + 100);
		this.verbose(`Launching mobilecli server on port ${this.serverPort}...`);

		this.mobilecliServerProcess = spawn(this.mobilecliPath, ['-v', 'server', 'start', '--cors', '--listen', `localhost:${this.serverPort}`], {
			detached: false,
			stdio: 'pipe',
		});

		this.mobilecliServerProcess.stdout?.on('data', (data: Buffer) => {
			this.verbose(`mobilecli server stdout: ${data.toString().trimEnd()}`);
		});

		this.mobilecliServerProcess.stderr?.on('data', (data: Buffer) => {
			this.verbose(`mobilecli server stderr: ${data.toString().trimEnd()}`);
		});

		this.mobilecliServerProcess.on('close', (code: number) => {
			this.verbose(`mobilecli server process exited with code ${code}`);
			this.mobilecliServerProcess = null;
		});

		this.mobilecliServerProcess.on('error', (error: Error) => {
			this.verbose(`mobilecli server error: ${error.message}`);
			this.mobilecliServerProcess = null;
		});
	}

	public getJsonRpcServerPort(): number {
		return this.serverPort;
	}
}
