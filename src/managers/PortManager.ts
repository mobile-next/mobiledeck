import { Logger } from '../services/logger/Logger';
import * as net from 'node:net';

export class PortManager {
	private logger: Logger = new Logger('PortManager');

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
		return new Promise((resolve) => {
			const socket = new net.Socket();

			socket.setTimeout(1000);

			socket.on('connect', () => {
				socket.destroy();
				resolve(true);
			});

			socket.on('timeout', () => {
				socket.destroy();
				resolve(false);
			});

			socket.on('error', () => {
				socket.destroy();
				resolve(false);
			});

			socket.connect(port, 'localhost');
		});
	}
}
