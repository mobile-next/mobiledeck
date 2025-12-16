import React from "react";
import { Flex, Heading, Text } from '@radix-ui/themes';

function ErrorPage() {
	return (
		<Flex
			direction="column"
			height="100vh"
			p="4"
			style={{ backgroundColor: 'var(--gray-1)', color: 'var(--gray-12)' }}
		>
			<Heading size="6" mb="4" style={{ color: 'var(--red-9)' }}>
				Error
			</Heading>
			<Text size="2">Unknown page requested.</Text>
		</Flex>
	);
}

export default ErrorPage;
