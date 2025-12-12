import * as vscode from 'vscode';
import { ChildProcess, execFileSync, spawn } from 'node:child_process';
import { Logger } from '../../utils/Logger';
import { PortManager } from '../../managers/PortManager';
import { Telemetry } from '../telemetry/Telemetry';
import { sleep } from '../../utils/TimerUtils';

const DEFAULT_SERVER_PORT = 12000;
const SERVER_STARTUP_TIMEOUT_MS = 10000; // 10 seconds
const SERVER_HEALTH_CHECK_INTERVAL_MS = 200; // 200ms between checks

interface ServerHealthResponse {
	status: string;
}

export class MobileCliServer {

	private logger: Logger = new Logger('MobileCliServer');
	private portManager: PortManager = new PortManager();

	private mobilecliPath: string;
	private serverPort: number = DEFAULT_SERVER_PORT;
	private mobilecliServerProcess: ChildProcess | null = null;

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly telemetry: Telemetry,
		private readonly onProcessExit?: (exitCode: number) => void
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

	private async checkServerHealth(port: number): Promise<boolean> {
		try {
			const response = await fetch(`http://localhost:${port}/`, {
				method: 'GET',
				signal: AbortSignal.timeout(2000)
			});

			const data = await response.json() as ServerHealthResponse;
			return data.status === 'ok';
		} catch {
			return false;
		}
	}


	private async checkMobilecliServerRunning(): Promise<boolean> {
		return await this.checkServerHealth(DEFAULT_SERVER_PORT);
	}

	public async stopMobilecliServer(): Promise<void> {
		if (this.mobilecliServerProcess) {
			this.mobilecliServerProcess.kill();
			this.mobilecliServerProcess = null;
		}
	}

	private async waitForServerReady(port: number, timeoutMs: number): Promise<void> {
		const startTime = Date.now();
		const expirationTime = startTime + timeoutMs;

		while (Date.now() < expirationTime) {
			const isHealthy = await this.checkServerHealth(port);
			if (isHealthy) {
				this.logger.log(`mobilecli server is ready on port ${port}`);
				return;
			}

			// wait before next check
			await sleep(SERVER_HEALTH_CHECK_INTERVAL_MS);
		}

		throw new Error(`mobilecli server failed to become ready within ${timeoutMs}ms`);
	}

	private async findAvailablePort() {
		const minPort = DEFAULT_SERVER_PORT + 1;
		const maxPort = DEFAULT_SERVER_PORT + 100;
		return await this.portManager.findAvailablePort(minPort, maxPort);
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
		this.serverPort = await this.findAvailablePort();
		this.logger.log(`Launching mobilecli server on port ${this.serverPort}...`);

		this.mobilecliServerProcess = spawn(
			this.mobilecliPath,
			['-v', 'server', 'start', '--cors', '--listen', `localhost:${this.serverPort}`],
			{
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

			// call the exit callback if provided
			if (this.onProcessExit) {
				this.onProcessExit(code);
			}
		});

		this.mobilecliServerProcess.on('error', (error: Error) => {
			this.logger.log(`mobilecli server error: ${error.message}`);
			this.mobilecliServerProcess = null;
		});

		// wait for server to be ready before returning
		await this.waitForServerReady(this.serverPort, SERVER_STARTUP_TIMEOUT_MS);
	}

	public getJsonRpcServerPort(): number {
		return this.serverPort;
	}
}
