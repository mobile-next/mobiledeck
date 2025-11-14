import React, { useEffect, useRef } from 'react';

interface ContextMenuItem {
	label: string;
	onClick: () => void;
	disabled?: boolean;
}

interface ContextMenuProps {
	x: number;
	y: number;
	items: ContextMenuItem[];
	onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('keydown', handleEscape);

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleEscape);
		};
	}, [onClose]);

	return (
		<div
			ref={menuRef}
			className="fixed bg-[#252526] border border-[#454545] rounded shadow-lg py-1 z-50"
			style={{ left: `${x}px`, top: `${y}px` }}
		>
			{items.map((item, index) => (
				<button
					key={index}
					onClick={() => {
						if (!item.disabled) {
							item.onClick();
							onClose();
						}
					}}
					disabled={item.disabled}
					className={`w-full text-left px-4 py-1.5 text-sm ${
						item.disabled
							? 'text-[#656565] cursor-not-allowed'
							: 'text-[#cccccc] hover:bg-[#2d2d2d] cursor-pointer'
					}`}
				>
					{item.label}
				</button>
			))}
		</div>
	);
}
