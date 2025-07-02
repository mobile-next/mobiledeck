export interface JsonRpcResponse<T> {
	jsonrpc: string;
	id: number;
	result: T;
}

export class JsonRpcClient {

	private idCounter = 1;

	constructor(private readonly url: string) {}

	public sendJsonRpcRequest = async <T>(method: string, params: any): Promise<T> => {
		console.log('mobiledeck: sending json rpc request', method, params);

		const id = this.idCounter++;

		const body = {
			jsonrpc: '2.0',
			id,
			method,
			params,
		};

		const response = await fetch(this.url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});

		const jsonResponse: JsonRpcResponse<T> = await response.json();
		return jsonResponse.result;
	};
}