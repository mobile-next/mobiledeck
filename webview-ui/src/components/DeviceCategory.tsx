import React from 'react';

interface DeviceCategoryProps {
	label: string;
}

function DeviceCategory({ label }: DeviceCategoryProps) {
	return (
		<div className="flex items-center gap-2 my-3">
			<hr className="flex-1 border-[#3e3e3e]" />
			<span className="text-xs text-[#858585] px-2">{label}</span>
			<hr className="flex-1 border-[#3e3e3e]" />
		</div>
	);
}

export default DeviceCategory;
