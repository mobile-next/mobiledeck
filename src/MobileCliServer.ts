import * as vscode from 'vscode';
import { ChildProcess, execFileSync, spawn } from 'node:child_process';
import { Logger } from './utils/Logger';
import { PortManager } from './managers/PortManager';
import { Telemetry } from './utils/Telemetry';

export class MobileCliServer {

	private static DEFAULT_SERVER_PORT = 12000;
	private static SERVER_STARTUP_TIMEOUT_MS = 10000; // 10 seconds
	private static SERVER_HEALTH_CHECK_INTERVAL_MS = 200; // 200ms between checks

	private logger: Logger = new Logger('MobileCliServer');
	private portManager: PortManager = new PortManager();

	private mobilecliPath: string;
	private serverPort: number = MobileCliServer.DEFAULT_SERVER_PORT;
	private mobilecliServerProcess: ChildProcess | null = null;

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly telemetry: Telemetry
	) {
		this.mobilecliPath = this.findMobilecliPath();
	}

	private findMobilecliPath(): string {
		const basePath = vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'mobilecli').fsPath;
		const mobilecliPath = process.platform === 'win32' ? `${basePath}.exe` : basePath;

		this.logger.log("mobilecli path: " + mobilecliPath);

		const text = execFileSync(mobilecliPath, ['--version']).toString().trim();
		this.logger.log("mobilecli version: " + text);

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

	private async waitForServerReady(port: number, timeoutMs: number): Promise<void> {
		const startTime = Date.now();

		while (Date.now() - startTime < timeoutMs) {
			const isHealthy = await this.portManager.checkServerHealth(port);
			if (isHealthy) {
				this.logger.log(`mobilecli server is ready on port ${port}`);
				return;
			}

			// wait before next check
			await new Promise(resolve => setTimeout(resolve, MobileCliServer.SERVER_HEALTH_CHECK_INTERVAL_MS));
		}

		throw new Error(`mobilecli server failed to become ready within ${timeoutMs}ms`);
	}

	public async launchMobilecliServer(): Promise<void> {
		const isRunning = await this.checkMobilecliServerRunning();
		if (isRunning) {
			this.logger.log(`mobilecli server is already running on default port`);
			return;
		}

		if (this.mobilecliServerProcess) {
			this.logger.log('mobilecli server process already exists');
			return;
		}

		// look up an available port that is not DEFAULT_SERVER_PORT
		const minPort = MobileCliServer.DEFAULT_SERVER_PORT + 1;
		const maxPort = MobileCliServer.DEFAULT_SERVER_PORT + 100;
		this.serverPort = await this.portManager.findAvailablePort(minPort, maxPort);
		this.logger.log(`Launching mobilecli server on port ${this.serverPort}...`);

		this.mobilecliServerProcess = spawn(this.mobilecliPath, ['-v', 'server', 'start', '--cors', '--listen', `localhost:${this.serverPort}`], {
			detached: false,
			stdio: 'pipe',
			env: {
				...process.env,
				MOBILECLI_WDA_PATH: vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'agents').fsPath,
			},
		});

		this.mobilecliServerProcess.stdout?.on('data', (data: Buffer) => {
			this.logger.log(`mobilecli server stdout: ${data.toString().trimEnd()}`);
		});

		this.mobilecliServerProcess.stderr?.on('data', (data: Buffer) => {
			this.logger.log(`mobilecli server stderr: ${data.toString().trimEnd()}`);
		});

		this.mobilecliServerProcess.on('close', (code: number) => {
			this.logger.log(`mobilecli server process exited with code ${code}`);
			this.mobilecliServerProcess = null;

			if (code !== 0) {
				this.telemetry.sendEvent('mobilecli_server_exit_error', {
					exitCode: code,
					port: this.serverPort,
				});
			}
		});

		this.mobilecliServerProcess.on('error', (error: Error) => {
			this.logger.log(`mobilecli server error: ${error.message}`);
			this.mobilecliServerProcess = null;
		});

		// wait for server to be ready before returning
		await this.waitForServerReady(this.serverPort, MobileCliServer.SERVER_STARTUP_TIMEOUT_MS);
	}

	public getJsonRpcServerPort(): number {
		return this.serverPort;
	}
}
