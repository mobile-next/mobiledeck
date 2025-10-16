import * as http from 'http';

export class OAuthCallbackServer {
	private server: http.Server | null = null;
	private port: number = 0;
	private cognitoAuthConfig = {
		authority: "https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_yxInzo34K",
		client_id: "5fuedu10rosgs7l68cup9g3pgv",
		redirect_uri: "http://localhost/oauth/callback",
		response_type: "code",
		scope: "email openid",
		token_endpoint: "https://auth.mobilenexthq.com/oauth2/token"
	};

	// callback for when auth code is received
	onAuthCodeReceived: (code: string) => void = () => {};

	// callback for when tokens are received
	onTokensReceived: (tokens: any) => void = () => {};

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

	// get the current port
	getPort(): number {
		return this.port;
	}

	// check if server is running
	isRunning(): boolean {
		return this.server !== null && this.port > 0;
	}

	// exchange authorization code for tokens
	async exchangeCodeForToken(authCode: string): Promise<any> {
		const params = new URLSearchParams({
			grant_type: 'authorization_code',
			client_id: this.cognitoAuthConfig.client_id,
			code: authCode,
			redirect_uri: this.cognitoAuthConfig.redirect_uri,
		});

		const response = await fetch(this.cognitoAuthConfig.token_endpoint, {
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

		return await response.json();
	}

	// handle incoming requests
	private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
		console.log(`received request: ${req.method} ${req.url}`);

		// parse the url to get query parameters
		const url = new URL(req.url || '', `http://${req.headers.host}`);
		const code = url.searchParams.get('code');
		const error = url.searchParams.get('error');
		const errorDescription = url.searchParams.get('error_description');

		if (error) {
			// oauth error
			console.error('oauth error:', error, errorDescription);
			res.writeHead(400, { 'Content-Type': 'text/html' });
			res.end(`
				<html>
					<body>
						<h1>Authentication Failed</h1>
						<p>Error: ${error}</p>
						<p>${errorDescription || ''}</p>
						<p>You can close this window.</p>
					</body>
				</html>
			`);
		} else if (code) {
			// successful oauth callback
			console.log('received oauth code:', code);

			// exchange code for tokens
			this.exchangeCodeForToken(code)
				.then(tokens => {
					console.log('token exchange successful:');
					console.log(JSON.stringify(tokens, null, 2));
					console.log('access_token:', tokens.access_token);
					console.log('id_token:', tokens.id_token);
					console.log('refresh_token:', tokens.refresh_token);
					console.log('expires_in:', tokens.expires_in);

					// emit the code for handling
					this.onAuthCodeReceived(code);

					// emit the tokens for handling
					this.onTokensReceived(tokens);
				})
				.catch(error => {
					console.error('error exchanging code for token:', error);
				});

			res.writeHead(200, { 'Content-Type': 'text/html' });
			res.end(`
				<html>
					<body>
						<h1>Authentication Successful</h1>
						<p>You can close this window and return to VS Code.</p>
					</body>
				</html>
			`);

			// stop the server after handling the callback
			setTimeout(() => {
				this.stop().catch(console.error);
			}, 1000);
		} else {
			// unknown request
			res.writeHead(404, { 'Content-Type': 'text/plain' });
			res.end('Not Found');
		}
	}
}
