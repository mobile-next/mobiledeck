import React from 'react';
import { ChevronDown, ChevronRight } from "lucide-react";

interface DeviceCategoryProps {
	label: string;
	isCollapsible?: boolean;
	isExpanded?: boolean;
	onToggle?: () => void;
}

function DeviceCategory({ label, isCollapsible = false, isExpanded = true, onToggle }: DeviceCategoryProps) {
	const containerClasses = isCollapsible
		? "flex items-center gap-2 my-3 cursor-pointer hover:bg-[#2d2d2d] rounded px-1 py-1 select-none"
		: "flex items-center gap-2 my-3";

	return (
		<div className={containerClasses} onClick={isCollapsible ? onToggle : undefined}>
			<hr className="flex-1 border-[#3e3e3e]" />
			<span className="text-xs text-[#858585] px-2">{label}</span>
			{isCollapsible && (
				<div className="flex-shrink-0 ml-1">
					{isExpanded ? (
						<ChevronDown className="h-3 w-3 text-[#858585]" />
					) : (
						<ChevronRight className="h-3 w-3 text-[#858585]" />
					)}
				</div>
			)}
			<hr className="flex-1 border-[#3e3e3e]" />
		</div>
	);
}

export default DeviceCategory;
