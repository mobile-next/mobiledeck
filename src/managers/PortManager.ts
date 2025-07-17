import { Logger } from '../utils/Logger';

interface ServerHealthResponse {
	status: string;
}

export class PortManager {
	constructor(private logger: Logger) {}

	public async findAvailablePort(startPort: number, endPort: number): Promise<number> {
		for (let port = startPort; port <= endPort; port++) {
			const inUse = await this.isPortInUse(port);
			if (!inUse) {
				this.logger.log(`Found available port: ${port}`);
				return port;
			}
		}

		throw new Error(`No available ports found in range ${startPort}-${endPort}`);
	}

	public async isPortInUse(port: number): Promise<boolean> {
		try {
			const response = await fetch(`http://localhost:${port}/`, {
				method: 'GET',
				signal: AbortSignal.timeout(2000)
			});

			const data = await response.json() as ServerHealthResponse;
			return data.status === 'ok';
		} catch (error: any) {
			return false;
		}
	}

	public async checkServerHealth(port: number): Promise<boolean> {
		return await this.isPortInUse(port);
	}
}
