export type MessageHandler<T = unknown> = (message: T) => void;

export class MessageRouter {
	private handlers = new Map<string, MessageHandler>();
	private messageHandler: (event: MessageEvent) => void;

	constructor(private window: Window) {
		this.messageHandler = (event: MessageEvent) => {
			const message = event.data;
			console.log('received message:', message);
			this.handle(message);
		};

		this.window.addEventListener('message', this.messageHandler);
	}

	register<T>(command: string, handler: MessageHandler<T>): void {
		this.handlers.set(command, handler as MessageHandler);
	}

	handle(message: { command: string }): void {
		const handler = this.handlers.get(message.command);

		if (handler) {
			handler(message);
		} else {
			console.log('unknown message', message);
		}
	}

	destroy(): void {
		this.window.removeEventListener('message', this.messageHandler);
		this.handlers.clear();
	}
}
