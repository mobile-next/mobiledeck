import * as http from 'node:http';
import * as crypto from 'node:crypto';
import { OAUTH_CONFIG } from './config/oauth';

export interface OAuthTokens {
	access_token: string;
	id_token: string;
	refresh_token?: string;
	expires_in: number;
	token_type: string;
}

interface JWTPayload {
	email?: string;
	sub: string;
	iat: number;
	exp: number;
}

export class OAuthCallbackServer {
	private server: http.Server | null = null;
	private port: number = 0;

	// callback for when auth code is received
	onAuthCodeReceived: (code: string) => void = () => { };

	// callback for when tokens are received
	onTokensReceived: (tokens: OAuthTokens, email: string) => void = () => { };

	// stored state for csrf validation
	private storedState: string | null = null;

	// generate a random state string for csrf protection
	static generateState(): string {
		return crypto.randomBytes(16).toString('hex');
	}

	// store the state for later validation
	setStoredState(state: string): void {
		this.storedState = state;
	}

	// start the server on a random available port
	async start(): Promise<number> {
		return new Promise((resolve, reject) => {
			this.server = http.createServer((req, res) => {
				this.handleRequest(req, res);
			});

			// listen on 127.0.0.1 with port 0 to get a random available port
			this.server.listen(0, '127.0.0.1', () => {
				const address = this.server?.address();
				if (address && typeof address === 'object') {
					this.port = address.port;
					console.log(`oauth callback server listening on http://127.0.0.1:${this.port}`);
					resolve(this.port);
				} else {
					reject(new Error('failed to start oauth callback server'));
				}
			});

			this.server.on('error', (error) => {
				console.error('oauth callback server error:', error);
				reject(error);
			});
		});
	}

	// stop the server
	async stop(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.server) {
				this.server.close((error) => {
					if (error) {
						console.error('error stopping oauth callback server:', error);
						reject(error);
					} else {
						console.log('oauth callback server stopped');
						this.server = null;
						this.port = 0;
						resolve();
					}
				});
			} else {
				resolve();
			}
		});
	}

	// decode jwt payload (id_token) to extract claims
	private decodeJwtPayload(token: string): JWTPayload | null {
		try {
			const parts = token.split('.');
			if (parts.length !== 3) {
				throw new Error('invalid jwt format');
			}

			const payload = parts[1];
			const decoded = Buffer.from(payload, 'base64').toString('utf-8');
			return JSON.parse(decoded);
		} catch (error) {
			console.error('error decoding jwt:', error);
			return null;
		}
	}

	// exchange authorization code for tokens
	async exchangeCodeForToken(authCode: string): Promise<OAuthTokens> {
		if (!authCode || authCode.trim().length === 0) {
			throw new Error('authorization code is required');
		}

		const params = new URLSearchParams({
			grant_type: 'authorization_code',
			client_id: OAUTH_CONFIG.client_id,
			code: authCode,
			redirect_uri: OAUTH_CONFIG.redirect_uri,
		});

		const response = await fetch(OAUTH_CONFIG.token_endpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: params.toString(),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`token exchange failed: ${response.status} ${errorText}`);
		}

		return await response.json() as OAuthTokens;
	}

	private writeSimpleResponse(res: http.ServerResponse, statusCode: number, message: string): void {
		res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
		res.end(message);
	}

	// handle incoming requests
	private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
		console.log(`received request: ${req.method} ${req.url}`);

		// parse the url to get query parameters
		const url = new URL(req.url || '', `http://${req.headers.host}`);
		const code = url.searchParams.get('code');
		const receivedState = url.searchParams.get('state');

		if (!code) {
			// unknown request
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.end('Not Found');
			return;
		}

		// validate state parameter for csrf protection
		if (!receivedState) {
			console.error('missing state parameter');
			this.writeSimpleResponse(res, 400, 'Missing state parameter');
			return;
		}

		// decode the state parameter to extract csrf token
		let csrfState: string;
		try {
			const decodedState = JSON.parse(Buffer.from(receivedState, 'base64').toString('utf-8'));
			csrfState = decodedState.csrf;
		} catch (error) {
			console.error('error decoding state parameter:', error);
			this.writeSimpleResponse(res, 400, 'Invalid state parameter format');
			return;
		}

		// validate csrf state
		if (csrfState !== this.storedState) {
			console.error('invalid csrf state - possible csrf attack');
			this.writeSimpleResponse(res, 400, 'Invalid csrf state - possible csrf attack');
			return;
		}

		// successful oauth callback
		console.log('received oauth code:', code);

		// exchange code for tokens
		this.exchangeCodeForToken(code)
			.then(tokens => {
				console.log('token exchange successful');

				// decode id_token to extract email
				let email = '';
				if (tokens.id_token) {
					const payload = this.decodeJwtPayload(tokens.id_token);
					if (payload && payload.email) {
						email = payload.email;
					}
				}

				// emit the code for handling
				this.onAuthCodeReceived(code);

				// emit the tokens for handling
				this.onTokensReceived(tokens, email);

				// send success response to user
				this.writeSimpleResponse(res, 200, 'Authentication Successful');

				// stop the server after response is fully sent
				res.on('finish', () => {
					this.stop().catch(console.error);
				});
			})
			.catch(error => {
				console.error('error exchanging code for token:', error);

				// send error response to user
				this.writeSimpleResponse(res, 500, 'Token Exchange Failed');

				// stop the server after response is fully sent
				res.on('finish', () => {
					this.stop().catch(console.error);
				});
			});
	}
}
