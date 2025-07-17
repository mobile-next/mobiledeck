export interface JsonRpcResponse<T> {
	jsonrpc: string;
	id: number;
	result: T;
}

export class JsonRpcClient {

	private idCounter = 1;

	constructor(private readonly url: string) {}

	public sendJsonRpcRequest = async <T>(method: string, params: any, timeoutMs?: number): Promise<T> => {
		console.log('mobiledeck: sending json rpc request', method, params);

		const id = this.idCounter++;

		const body = {
			jsonrpc: '2.0',
			id,
			method,
			params,
		};

		let controller: AbortController | undefined;
		let timeoutId: NodeJS.Timeout | undefined;

		if (timeoutMs !== undefined) {
			controller = new AbortController();
			timeoutId = setTimeout(() => controller!.abort(), timeoutMs);
		}

		try {
			const response = await fetch(this.url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
				signal: controller?.signal
			});

			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			const jsonResponse: JsonRpcResponse<T> = await response.json();
			return jsonResponse.result;
		} catch (error: any) {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			if (error.name === 'AbortError') {
				throw new Error(`Request timeout after ${timeoutMs}ms`);
			}

			throw error;
		}
	};
}