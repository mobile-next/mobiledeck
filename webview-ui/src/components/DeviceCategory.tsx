import React from 'react';
import { ChevronDown, ChevronRight } from "lucide-react";
import { Flex, Separator, Text, Box } from '@radix-ui/themes';

interface DeviceCategoryProps {
	label: string;
	isCollapsible?: boolean;
	isExpanded?: boolean;
	onToggle?: () => void;
}

function DeviceCategory({ label, isCollapsible = false, isExpanded = true, onToggle }: DeviceCategoryProps) {
	return (
		<Flex
			align="center"
			gap="2"
			my="3"
			onClick={isCollapsible ? onToggle : undefined}
			px={isCollapsible ? "1" : undefined}
			py={isCollapsible ? "1" : undefined}
			style={{
				cursor: isCollapsible ? 'pointer' : 'default',
				userSelect: 'none',
				borderRadius: isCollapsible ? 'var(--radius-2)' : undefined
			}}
			className={isCollapsible ? "hover-bg-gray-3 transition-colors" : undefined}
		>
			<Separator size="4" style={{ flex: 1, backgroundColor: 'var(--gray-6)' }} />
			<Box px="2">
				<Text size="1" color="gray">{label}</Text>
			</Box>
			{isCollapsible && (
				<Box ml="1">
					{isExpanded ? (
						<ChevronDown size={12} color="var(--gray-11)" />
					) : (
						<ChevronRight size={12} color="var(--gray-11)" />
					)}
				</Box>
			)}
			<Separator size="4" style={{ flex: 1, backgroundColor: 'var(--gray-6)' }} />
		</Flex>
	);
}

export default DeviceCategory;
