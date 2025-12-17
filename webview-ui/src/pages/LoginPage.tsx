import React from 'react';
import { Box, Flex, Heading, Text, Button, Separator } from '@radix-ui/themes';
import vscode from '../vscode';
import { GoogleIcon, GitHubIcon } from '../CustomIcons';

// Custom styles for elements that don't have Radix UI equivalents
const customStyles = {
	gradientHeading: {
		background: 'linear-gradient(135deg, #00ff88 0%, #00cc6f 100%)',
		WebkitBackgroundClip: 'text',
		WebkitTextFillColor: 'transparent',
		backgroundClip: 'text',
	} as React.CSSProperties,
	logoImg: {
		width: '100%',
		height: '100%',
		objectFit: 'cover' as const,
	} as React.CSSProperties,
	iconSize: {
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
		<Box
			style={{
				fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
				background: '#0a0a0a',
				color: '#e0e0e0',
				minHeight: '100vh',
				width: '100%',
				height: '100vh',
				position: 'fixed',
				top: 0,
				left: 0,
			}}
		>
			<Box
				id="welcome-screen"
				style={{
					width: '100%',
					maxWidth: '500px',
					padding: '20px',
					marginTop: '1em',
					marginLeft: 'auto',
					marginRight: 'auto',
				}}
			>
				<Flex direction="column" align="center" justify="center" mb="3" gap="4">
					<Box
						style={{
							width: '48px',
							height: '48px',
							borderRadius: '8px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							overflow: 'hidden',
							flexShrink: 0,
						}}
					>
						<img
							src="https://avatars.githubusercontent.com/u/205340688?s=400&u=b8da2bfdcf8330248aeaaa2a3ecc1e2bdd27de6f&v=4"
							alt="Mobile Deck Logo"
							style={customStyles.logoImg}
						/>
					</Box>
					<Heading
						size="9"
						align="center"
						style={{
							...customStyles.gradientHeading,
							margin: 0,
						}}
					>
						Mobile Deck
					</Heading>
				</Flex>

				<Text
					align="center"
					size="3"
					mb="6"
					style={{
						color: '#888',
						width: '100%',
						lineHeight: '1.6',
						display: 'block',
					}}
				>
					See your iOS & Android simulators and real devices, <br />
					then connect with a click — without leaving the editor.
				</Text>

				<Box
					style={{
						background: '#1a1a1a',
						border: '1px solid #2a2a2a',
						borderRadius: '12px',
						padding: '24px',
					}}
				>

					<Text style={{ color: "white" }}>
						Step 1 · Sign in to get your devices
					</Text>

					<ul
						style={{
							color: "gray",
							marginTop: "8px",
							marginBottom: "24px",
							lineHeight: "1.6em",
						}}
					>
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

					<Flex direction="column" gap="3">
						<Button
							size="3"
							variant="soft"
							style={{
								background: '#2a2a2a',
								border: '1px solid #3a3a3a',
								color: '#e0e0e0',
								cursor: 'pointer',
							}}
							onClick={onGoogleLogin}
						>
							<GoogleIcon />
							Continue with Google
						</Button>

						<Button
							size="3"
							variant="soft"
							style={{
								background: '#2a2a2a',
								border: '1px solid #3a3a3a',
								color: '#e0e0e0',
								cursor: 'pointer',
							}}
							onClick={onGitHubLogin}
						>
							<GitHubIcon />
							Continue with GitHub
						</Button>
					</Flex>

					<Flex align="center" my="4" gap="3">
						<Separator size="4" style={{ flex: 1 }} />
						<Text size="1" style={{ color: '#555' }}>or</Text>
						<Separator size="4" style={{ flex: 1 }} />
					</Flex>

					<Button
						size="3"
						variant="soft"
						style={{
							width: '100%',
							background: '#2a2a2a',
							border: '1px solid #3a3a3a',
							color: '#e0e0e0',
							cursor: 'pointer',
						}}
						onClick={onEmailLogin}
					>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={customStyles.iconSize}>
							<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
							<polyline points="22,6 12,13 2,6"></polyline>
						</svg>
						Continue with Email
					</Button>

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
				</Box>
			</Box>
		</Box>
	);
}

export default LoginPage;
