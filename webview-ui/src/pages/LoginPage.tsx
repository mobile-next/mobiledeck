import React from 'react';
import vscode from '../vscode';
import { GoogleIcon, GitHubIcon } from '../CustomIcons';

// styles for the login page
const styles = {
	wrapper: {
		fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
		background: '#0a0a0a',
		color: '#e0e0e0',
		minHeight: '100vh',
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
		marginTop: '1em',
		marginLeft: 'auto',
		marginRight: 'auto',
	} as React.CSSProperties,
	headerContainer: {
		display: 'flex',
		flexDirection: 'column' as const,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: '12px',
		gap: '16px',
	} as React.CSSProperties,
	logo: {
		width: '48px',
		height: '48px',
		borderRadius: '8px',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
		flexShrink: 0,
	} as React.CSSProperties,
	logoImg: {
		width: '100%',
		height: '100%',
		objectFit: 'cover' as const,
	} as React.CSSProperties,
	h1: {
		fontSize: '48px',
		margin: 0,
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
		width: '100%',
		marginBottom: '48px',
		lineHeight: '1.6',
	} as React.CSSProperties,
	card: {
		background: '#1a1a1a',
		border: '1px solid #2a2a2a',
		borderRadius: '12px',
		padding: '24px',
	} as React.CSSProperties,
	divider: {
		display: 'flex',
		alignItems: 'center',
		margin: '32px 0',
		color: '#555',
		fontSize: '13px',
	} as React.CSSProperties,
	smallDivider: {
		display: 'flex',
		alignItems: 'center',
		margin: '16px 0',
		color: '#555',
		fontSize: '12px',
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

function LoginPage() {
	const handleSkipLogin = () => {
		// send message to extension to skip login and show sidebar
		vscode.postMessage({
			command: 'skipLogin'
		});
	};	

	const onGoogleLogin = () => {
		vscode.postMessage({
			command: 'openOAuthLogin',
			provider: 'Google'
		});
	};

	const onGitHubLogin = () => {
		vscode.postMessage({
			command: 'openOAuthLogin',
			provider: 'GitHub'
		});
	};

	const onEmailLogin = () => {
		vscode.postMessage({
			command: 'openEmailLogin',
		});
	};

	return (
		<div style={styles.wrapper}>
			<div id="welcome-screen" style={styles.container}>
				<div style={styles.headerContainer}>
					<div style={styles.logo}>
						<img
							src="https://avatars.githubusercontent.com/u/205340688?s=400&u=b8da2bfdcf8330248aeaaa2a3ecc1e2bdd27de6f&v=4"
							alt="Mobile Deck Logo"
							style={styles.logoImg}
						/>
					</div>
					<h1 style={styles.h1}>Mobile Deck</h1>
				</div>

				<p style={styles.subtitle}>
					See your iOS & Android simulators and real devices, <br />
					then connect with a click — without leaving the editor.
				</p>

				<div style={styles.card}>

					<div style={{ color: "white" }}>
						Step 1 · Sign in to get your devices
					</div>

					<ul style={{ color: "gray", marginTop: "8px", marginBottom: "24px", lineHeight: "1.6em" }}>
						<li>
							<span style={{ color: "green" }}>✓</span> View all connected devices & simulators
						</li>
						<li>
							<span style={{ color: "green" }}>✓</span> Connect instantly to run and test apps
						</li>
						<li>
							<span style={{ color: "green" }}>✓</span> Capture screenshots & interact with the screen
						</li>
					</ul>

					<div style={styles.oauthButtons}>
						<button style={styles.oauthBtn} onClick={onGoogleLogin}>
							<GoogleIcon />
							Continue with Google
						</button>

						<button style={styles.oauthBtn} onClick={onGitHubLogin}>
							<GitHubIcon />
							Continue with GitHub
						</button>
					</div>

					<div style={styles.smallDivider}>
						<div style={styles.dividerLine}></div>
						<span style={styles.dividerSpan}>or</span>
						<div style={styles.dividerLine}></div>
					</div>

					<button style={styles.oauthBtn} onClick={onEmailLogin}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={styles.oauthBtnSvg}>
							<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
							<polyline points="22,6 12,13 2,6"></polyline>
						</svg>
						Continue with Email
					</button>				

					{/*
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
					*/}
				</div>
			</div>
		</div>
	);
}

export default LoginPage;
