import React from 'react';
import vscode from './vscode';

// styles for the login page
const styles = {
	wrapper: {
		fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
		background: '#0a0a0a',
		color: '#e0e0e0',
		minHeight: '100vh',
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
		height: '100vh',
		position: 'fixed' as const,
		top: 0,
		left: 0,
	} as React.CSSProperties,
	container: {
		width: '100%',
		maxWidth: '500px',
		padding: '20px',
	} as React.CSSProperties,
	logo: {
		width: '48px',
		height: '48px',
		borderRadius: '8px',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		margin: '0 auto 32px',
		overflow: 'hidden',
	} as React.CSSProperties,
	logoImg: {
		width: '100%',
		height: '100%',
		objectFit: 'cover' as const,
	} as React.CSSProperties,
	h1: {
		fontSize: '32px',
		textAlign: 'center' as const,
		marginBottom: '12px',
		fontWeight: 700,
		background: 'linear-gradient(135deg, #00ff88 0%, #00cc6f 100%)',
		WebkitBackgroundClip: 'text',
		WebkitTextFillColor: 'transparent',
		backgroundClip: 'text',
	} as React.CSSProperties,
	subtitle: {
		textAlign: 'center' as const,
		color: '#888',
		fontSize: '15px',
		marginBottom: '48px',
		lineHeight: '1.6',
	} as React.CSSProperties,
	card: {
		background: '#1a1a1a',
		border: '1px solid #2a2a2a',
		borderRadius: '12px',
		padding: '32px',
	} as React.CSSProperties,
	divider: {
		display: 'flex',
		alignItems: 'center',
		margin: '32px 0',
		color: '#555',
		fontSize: '13px',
	} as React.CSSProperties,
	dividerLine: {
		flex: 1,
		height: '1px',
		background: '#2a2a2a',
	} as React.CSSProperties,
	dividerSpan: {
		padding: '0 16px',
	} as React.CSSProperties,
	oauthButtons: {
		display: 'flex',
		flexDirection: 'column' as const,
		gap: '12px',
	} as React.CSSProperties,
	oauthBtn: {
		width: '100%',
		padding: '12px 20px',
		background: '#2a2a2a',
		border: '1px solid #3a3a3a',
		borderRadius: '8px',
		color: '#e0e0e0',
		fontSize: '14px',
		fontWeight: 500,
		cursor: 'pointer',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '12px',
		transition: 'all 0.2s',
	} as React.CSSProperties,
	oauthBtnSvg: {
		width: '20px',
		height: '20px',
	} as React.CSSProperties,
};

function GoogleIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" style={styles.oauthBtnSvg}>
			<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
			<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
			<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
			<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
		</svg>
	);
}

function AzureIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" style={styles.oauthBtnSvg}>
			<path d="M13.05 4.24L6.28 18.96l-3.38.62 7.82-14.45zm7.26 5.42l-7.31 8.68-7.31-2.47 7.69-9.14z" />
		</svg>
	);
}

function GitHubIcon() {
	return (
		<svg viewBox="0 0 24 24" fill="currentColor" style={styles.oauthBtnSvg}>
			<path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
		</svg>
	);
}

function EmailIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<rect x="2" y="4" width="20" height="16" rx="2" />
			<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
		</svg>
	);
}

function LoginPage() {
	const handleSkipLogin = () => {
		// send message to extension to skip login and show sidebar
		vscode.postMessage({
			command: 'skipLogin'
		});
	};

	const onGoogleLogin = () => {
		// post message to extension to open external browser
		vscode.postMessage({
			command: 'openOAuthLogin',
			provider: 'Google'
		});
	};

	const onAzureLogin = () => {
		vscode.postMessage({
			command: 'openOAuthLogin',
			provider: 'AzureAD'
		});
	};

	const onGitHubLogin = () => {
		vscode.postMessage({
			command: 'openOAuthLogin',
			provider: 'GitHub'
		});
	};

	return (
		<div style={styles.wrapper}>
			<div id="welcome-screen" style={styles.container}>
				<div style={styles.logo}>
					<img
						src="https://avatars.githubusercontent.com/u/205340688?s=400&u=b8da2bfdcf8330248aeaaa2a3ecc1e2bdd27de6f&v=4"
						alt="Mobiledeck Logo"
						style={styles.logoImg}
					/>
				</div>

				<h1 style={styles.h1}>Welcome to Mobiledeck</h1>
				<p style={styles.subtitle}>
					Making mobile development accessible to everyone.
					<br />
					Build cross-platform applications across any device.
				</p>

				<div style={styles.card}>
					<div style={styles.oauthButtons}>
						<button style={styles.oauthBtn} onClick={onGoogleLogin}>
							<GoogleIcon />
							Continue with Google
						</button>

						<button style={styles.oauthBtn} onClick={onAzureLogin}>
							<AzureIcon />
							Continue with Azure
						</button>

						<button style={styles.oauthBtn} onClick={onGitHubLogin}>
							<GitHubIcon />
							Continue with GitHub
						</button>
					</div>

					<div style={styles.divider}>
						<div style={styles.dividerLine}></div>
						<span style={styles.dividerSpan}>or</span>
						<div style={styles.dividerLine}></div>
					</div>

					<button
						style={{ ...styles.oauthBtn, borderStyle: 'dashed', borderColor: '#3a3a3a' }}
						onClick={handleSkipLogin}
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.oauthBtnSvg}>
							<line x1="5" y1="12" x2="19" y2="12"></line>
							<polyline points="12 5 19 12 12 19"></polyline>
						</svg>
						Skip &amp; Continue as Guest
					</button>
				</div>
			</div>
		</div>
	);
}

export default LoginPage;
