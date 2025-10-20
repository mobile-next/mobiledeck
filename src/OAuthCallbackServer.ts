import * as http from 'node:http';
import * as crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
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
	private static readonly OAUTH_SERVER_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

	private server: http.Server | null = null;
	private port: number = 0;
	private timeoutId: NodeJS.Timeout | null = null;

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

					// start timeout to auto-stop server if user abandons auth flow
					this.timeoutId = setTimeout(() => {
						const minutes = OAuthCallbackServer.OAUTH_SERVER_TIMEOUT_MS / (60 * 1000);
						console.log(`oauth callback server timeout - stopping after ${minutes} minutes`);
						this.stop().catch((error) => {
							console.error('failed to stop oauth server after timeout:', error);
						});
					}, OAuthCallbackServer.OAUTH_SERVER_TIMEOUT_MS);

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

	// close the http server and clean up resources
	private async closeHttpServer(): Promise<void> {
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

	// stop the server
	async stop(): Promise<void> {
		// clear timeout if it exists
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}

		await this.closeHttpServer();
	}

	// jwks client for fetching and caching cognito public keys
	private jwksClient = jwksClient({
		jwksUri: `${OAUTH_CONFIG.authority}/.well-known/jwks.json`,
		cache: true,
		cacheMaxAge: 600000, // 10 minutes
	});

	// get signing key for jwt verification
	private getSigningKey(kid: string): Promise<string> {
		return new Promise((resolve, reject) => {
			this.jwksClient.getSigningKey(kid, (err, key) => {
				if (err) {
					reject(err);
				} else {
					const signingKey = key?.getPublicKey();
					if (signingKey) {
						resolve(signingKey);
					} else {
						reject(new Error('no public key found'));
					}
				}
			});
		});
	}

	// verify and decode jwt payload (id_token) to extract claims with signature validation
	private async verifyAndDecodeJwt(token: string): Promise<JWTPayload | null> {
		try {
			// decode header to get kid (key id)
			const decoded = jwt.decode(token, { complete: true });
			if (!decoded || !decoded.header.kid) {
				console.error('invalid jwt: missing kid in header');
				return null;
			}

			// get the signing key from jwks
			const signingKey = await this.getSigningKey(decoded.header.kid);

			// verify and decode the token
			const payload = jwt.verify(
				token,
				signingKey, {
				issuer: OAUTH_CONFIG.authority,
				audience: OAUTH_CONFIG.client_id,
				algorithms: ['RS256'],
			}) as JWTPayload;

			console.log("jwt signature was successfully verified");

			// extract and return the relevant claims
			return {
				email: payload.email as string | undefined,
				sub: payload.sub as string,
				iat: payload.iat as number,
				exp: payload.exp as number,
			};
		} catch (error) {
			// provide specific error logging based on error type
			if (error instanceof Error) {
				if (error.name === 'TokenExpiredError') {
					console.error('jwt verification failed: token has expired', error.message);
				} else if (error.name === 'JsonWebTokenError') {
					if (error.message.includes('invalid signature')) {
						console.error('jwt verification failed: invalid signature - token may be forged');
					} else if (error.message.includes('jwt audience invalid')) {
						console.error('jwt verification failed: invalid audience - token not intended for this client');
					} else if (error.message.includes('jwt issuer invalid')) {
						console.error('jwt verification failed: invalid issuer - token from unexpected source');
					} else {
						console.error('jwt verification failed: invalid token -', error.message);
					}
				} else if (error.name === 'NotBeforeError') {
					console.error('jwt verification failed: token not yet valid', error.message);
				} else {
					console.error('jwt verification failed: unexpected error -', error.name, error.message);
				}
			} else {
				console.error('jwt verification failed: unknown error', error);
			}

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

		const tokens = await response.json() as any;

		// validate token response structure
		if (!tokens || typeof tokens !== 'object') {
			throw new Error('invalid token response: expected object');
		}

		if (!tokens.access_token || typeof tokens.access_token !== 'string') {
			throw new Error('invalid token response: missing or invalid access_token');
		}

		if (!tokens.id_token || typeof tokens.id_token !== 'string') {
			throw new Error('invalid token response: missing or invalid id_token');
		}

		if (!tokens.expires_in || typeof tokens.expires_in !== 'number') {
			throw new Error('invalid token response: missing or invalid expires_in');
		}

		if (!tokens.token_type || typeof tokens.token_type !== 'string') {
			throw new Error('invalid token response: missing or invalid token_type');
		}

		// refresh_token is optional
		if (tokens.refresh_token && typeof tokens.refresh_token !== 'string') {
			throw new Error('invalid token response: invalid refresh_token type');
		}

		return tokens as OAuthTokens;
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
			.then(async tokens => {
				console.log('token exchange successful');

				// verify and decode id_token to extract email with signature validation
				let email = '';
				if (tokens.id_token) {
					const payload = await this.verifyAndDecodeJwt(tokens.id_token);
					if (payload && payload.email) {
						email = payload.email;
					} else if (!payload) {
						// jwt verification failed
						console.error('jwt verification failed - token may be invalid or forged');
						this.writeSimpleResponse(res, 401, 'Invalid ID token');
						res.on('finish', () => {
							this.stop().catch(console.error);
						});
						return;
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
