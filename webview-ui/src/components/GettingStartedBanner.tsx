import React from 'react';
import { X } from 'lucide-react';
import { Box, Flex, Text, Button, IconButton } from '@radix-ui/themes';
import vscode from '../vscode';

function GettingStartedBanner() {
	const handleGettingStartedClick = () => {
		vscode.postMessage({
			command: 'openGettingStarted'
		});
	};

	const handleClose = () => {
		vscode.postMessage({
			command: 'dismissGettingStarted'
		});
	};

	return (
		<Box px="3" py="4">
			<Box
				mt="4"
				p="3"
				style={{
					backgroundColor: 'var(--gray-2)',
					border: '1px solid var(--gray-6)',
					borderRadius: 'var(--radius-3)',
					position: 'relative'
				}}
			>
				<IconButton
					size="1"
					variant="ghost"
					color="gray"
					onClick={handleClose}
					aria-label="Close banner"
					style={{ position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)' }}
				>
					<X size={16} />
				</IconButton>
				<Flex direction="column" gap="2" pr="6">
					<Text size="2">
						Can't find the device you were looking for?
					</Text>
					<Text size="1" color="gray">
						No worries, here is our getting started guide. You can start with a simulator or emulator within minutes.
					</Text>
					<Button
						size="2"
						variant="soft"
						mt="1"
						onClick={handleGettingStartedClick}
						style={{
							width: 'fit-content',
							background: '#1a1a1a',
							border: '1px solid #2a2a2a',
							color: '#888',
						}}
						className="hover-accent-button"
					>
						Read our wiki 🚀
					</Button>
				</Flex>
			</Box>
		</Box>
	);
}

export default GettingStartedBanner;
